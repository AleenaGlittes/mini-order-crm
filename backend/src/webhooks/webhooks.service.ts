import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;

  constructor(private readonly prisma: PrismaService) {
    this.webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
  }

  /**
   * Verify Shopify webhook HMAC-SHA256 signature
   * Header: X-Shopify-Hmac-Sha256
   */
  verifyHmacSignature(rawBody: string | object, hmacHeader?: string): boolean {
    // If webhook secret is not set or placeholder in dev, log warning but allow dev testing
    if (
      !this.webhookSecret ||
      this.webhookSecret.includes('placeholder') ||
      this.webhookSecret.includes('signing_secret')
    ) {
      this.logger.debug(
        'SHOPIFY_WEBHOOK_SECRET is set to placeholder/empty. Skipping HMAC check in dev mode.',
      );
      return true;
    }

    if (!hmacHeader) {
      this.logger.warn('Missing X-Shopify-Hmac-Sha256 header on incoming webhook');
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

    try {
      const generatedHash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(bodyString, 'utf8')
        .digest('base64');

      const hmacBuffer = Buffer.from(hmacHeader, 'utf8');
      const generatedBuffer = Buffer.from(generatedHash, 'utf8');

      if (hmacBuffer.length !== generatedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(hmacBuffer, generatedBuffer);
    } catch (err) {
      this.logger.error(`Error during HMAC computation: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Check for duplicate webhook deliveries using X-Shopify-Webhook-Id for idempotency
   */
  private async checkIdempotency(webhookId?: string): Promise<boolean> {
    if (!webhookId) return false;

    try {
      const existing = await this.prisma.webhookLog.findUnique({
        where: { webhookId },
      });

      return Boolean(existing && existing.status === 'SUCCESS');
    } catch {
      return false;
    }
  }

  /**
   * Record webhook outcome for diagnostics and auditing
   */
  private async logWebhookOutcome(data: {
    webhookId?: string;
    topic: string;
    shopifyId?: string;
    status: 'SUCCESS' | 'FAILED' | 'DUPLICATE';
    errorMessage?: string;
    payload?: any;
  }) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          webhookId: data.webhookId || `hook_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          topic: data.topic,
          shopifyId: data.shopifyId,
          status: data.status,
          errorMessage: data.errorMessage,
          payload: data.payload ? JSON.stringify(data.payload).slice(0, 2000) : null,
        },
      });
    } catch (err) {
      this.logger.debug(`Could not write WebhookLog (offline db): ${(err as Error).message}`);
    }
  }

  /**
   * Process 'orders/create' webhook event with HMAC verification and idempotency
   */
  async handleOrderCreate(payload: any, headers?: Record<string, string>) {
    const hmacHeader = headers?.['x-shopify-hmac-sha256'];
    const webhookId = headers?.['x-shopify-webhook-id'];
    const topic = 'orders/create';

    // 1. Verify HMAC Signature
    if (!this.verifyHmacSignature(payload, hmacHeader)) {
      this.logger.warn(`Rejected unauthorized webhook: invalid HMAC signature`);
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    // 2. Idempotent delivery check
    const isDuplicate = await this.checkIdempotency(webhookId);
    if (isDuplicate) {
      this.logger.log(`Duplicate webhook delivery detected [${webhookId}]. Skipping re-processing.`);
      await this.logWebhookOutcome({
        webhookId,
        topic,
        shopifyId: String(payload?.id || ''),
        status: 'DUPLICATE',
      });
      return {
        received: true,
        idempotent: true,
        message: 'Duplicate event already processed',
      };
    }

    const shopifyId = String(payload?.id || `sh_${Date.now()}`);
    const orderNumber = payload?.name || (payload?.order_number ? `#${payload.order_number}` : `#${Date.now().toString().slice(-4)}`);
    const financialStatus = this.normalizeStatus(payload?.financial_status || 'paid');
    const fulfillmentStatus = this.normalizeFulfillmentStatus(payload?.fulfillment_status || 'unfulfilled');
    const totalAmount = parseFloat(payload?.total_price || payload?.current_total_price || '0');
    const currency = payload?.currency || 'INR';

    try {
      let customerId: string | undefined;

      if (payload?.customer?.email) {
        const customer = await this.prisma.customer.upsert({
          where: { email: payload.customer.email },
          update: {
            firstName: payload.customer.first_name || 'Customer',
            lastName: payload.customer.last_name || '',
            phone: payload.customer.phone,
            shopifyId: payload.customer.id ? String(payload.customer.id) : undefined,
          },
          create: {
            firstName: payload.customer.first_name || 'Customer',
            lastName: payload.customer.last_name || '',
            email: payload.customer.email,
            phone: payload.customer.phone,
            shopifyId: payload.customer.id ? String(payload.customer.id) : undefined,
          },
        });
        customerId = customer.id;
      }

      const order = await this.prisma.order.upsert({
        where: { shopifyId },
        update: {
          financialStatus,
          fulfillmentStatus,
          totalAmount: new Prisma.Decimal(totalAmount),
        },
        create: {
          shopifyId,
          orderNumber,
          financialStatus,
          fulfillmentStatus,
          totalAmount: new Prisma.Decimal(totalAmount),
          currency,
          orderDate: payload?.created_at ? new Date(payload.created_at) : new Date(),
          customerId,
          items: {
            create: (payload?.line_items || []).map((li: any) => ({
              productName: li.title || li.name || 'Product',
              quantity: li.quantity || 1,
              price: new Prisma.Decimal(parseFloat(li.price || '0')),
              shopifyId: li.id ? String(li.id) : undefined,
            })),
          },
        },
      });

      await this.logWebhookOutcome({
        webhookId,
        topic,
        shopifyId,
        status: 'SUCCESS',
        payload,
      });

      this.logger.log(`Successfully processed webhook orders/create for order ${order.orderNumber}`);

      return {
        received: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'processed',
      };
    } catch (error) {
      this.logger.error(`Failed processing webhook orders/create: ${(error as Error).message}`);
      await this.logWebhookOutcome({
        webhookId,
        topic,
        shopifyId,
        status: 'FAILED',
        errorMessage: (error as Error).message,
        payload,
      });

      // Acknowledge gracefully to prevent infinite retry storms while logging failure
      return {
        received: true,
        status: 'logged_error',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process 'orders/updated' webhook event with HMAC verification and idempotency
   */
  async handleOrderUpdated(payload: any, headers?: Record<string, string>) {
    const hmacHeader = headers?.['x-shopify-hmac-sha256'];
    const webhookId = headers?.['x-shopify-webhook-id'];
    const topic = 'orders/updated';

    // 1. Verify HMAC Signature
    if (!this.verifyHmacSignature(payload, hmacHeader)) {
      this.logger.warn(`Rejected unauthorized webhook: invalid HMAC signature`);
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    // 2. Idempotency Check
    const isDuplicate = await this.checkIdempotency(webhookId);
    if (isDuplicate) {
      this.logger.log(`Duplicate webhook delivery detected [${webhookId}]. Skipping re-processing.`);
      return {
        received: true,
        idempotent: true,
        message: 'Duplicate event already processed',
      };
    }

    const shopifyId = String(payload?.id || '');
    if (!shopifyId) {
      throw new BadRequestException('Missing Shopify order identifier in payload');
    }

    const financialStatus = this.normalizeStatus(payload?.financial_status || 'paid');
    const fulfillmentStatus = this.normalizeFulfillmentStatus(payload?.fulfillment_status || 'fulfilled');
    const totalAmount = parseFloat(payload?.total_price || payload?.current_total_price || '0');

    try {
      const updateResult = await this.prisma.order.updateMany({
        where: { shopifyId },
        data: {
          financialStatus,
          fulfillmentStatus,
          totalAmount: totalAmount > 0 ? new Prisma.Decimal(totalAmount) : undefined,
        },
      });

      await this.logWebhookOutcome({
        webhookId,
        topic,
        shopifyId,
        status: 'SUCCESS',
        payload,
      });

      this.logger.log(`Successfully updated ${updateResult.count} order record(s) from orders/updated webhook`);

      return {
        received: true,
        updated: updateResult.count,
        shopifyId,
        status: 'processed',
      };
    } catch (error) {
      this.logger.error(`Failed processing webhook orders/updated: ${(error as Error).message}`);
      await this.logWebhookOutcome({
        webhookId,
        topic,
        shopifyId,
        status: 'FAILED',
        errorMessage: (error as Error).message,
        payload,
      });

      return {
        received: true,
        status: 'logged_error',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get diagnostic webhook logs
   */
  async getWebhookLogs(limit = 20) {
    try {
      return await this.prisma.webhookLog.findMany({
        take: limit,
        orderBy: { processedAt: 'desc' },
      });
    } catch {
      return [];
    }
  }

  private normalizeStatus(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'authorized') return 'Paid';
    if (s === 'pending' || s === 'partially_paid') return 'Pending';
    if (s === 'refunded' || s === 'voided') return 'Refunded';
    return 'Paid';
  }

  private normalizeFulfillmentStatus(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'fulfilled' || s === 'shipped') return 'Fulfilled';
    if (s === 'partial' || s === 'partially_fulfilled') return 'Partially Fulfilled';
    return 'Unfulfilled';
  }
}
