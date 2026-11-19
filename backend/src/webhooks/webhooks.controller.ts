import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/orders/create
   * Purpose: Receive new order event with HMAC signature verification and idempotency
   */
  @Post('orders/create')
  @HttpCode(HttpStatus.OK)
  async handleOrderCreated(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.webhooksService.handleOrderCreate(body, headers);
  }

  /**
   * POST /webhooks/orders/updated
   * Purpose: Receive updated order event with HMAC signature verification and idempotency
   */
  @Post('orders/updated')
  @HttpCode(HttpStatus.OK)
  async handleOrderUpdated(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.webhooksService.handleOrderUpdated(body, headers);
  }

  /**
   * GET /webhooks/logs
   * Purpose: Diagnose webhook processing outcomes, deduplication, and failures
   */
  @Get('logs')
  async getWebhookLogs(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 20;
    return this.webhooksService.getWebhookLogs(l);
  }
}
