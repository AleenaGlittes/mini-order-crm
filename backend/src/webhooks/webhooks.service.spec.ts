import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as crypto from 'crypto';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockPrismaService = {
    webhookLog: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    customer: {
      upsert: vi.fn().mockResolvedValue({ id: 'cust_test_1' }),
    },
    order: {
      upsert: vi.fn().mockResolvedValue({ id: 'order_test_1', orderNumber: '#9999' }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return Promise.all(callback);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyHmacSignature', () => {
    it('should correctly verify a valid HMAC signature', () => {
      const secret = 'test_webhook_secret_key_123';
      (service as any).webhookSecret = secret;

      const payload = JSON.stringify({ id: 12345, test: true });
      const validHmac = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');

      const isValid = service.verifyHmacSignature(payload, validHmac);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid HMAC signature', () => {
      const secret = 'test_webhook_secret_key_123';
      (service as any).webhookSecret = secret;

      const payload = JSON.stringify({ id: 12345, test: true });
      const invalidHmac = 'invalid_tampered_signature_abc123';

      const isValid = service.verifyHmacSignature(payload, invalidHmac);
      expect(isValid).toBe(false);
    });

    it('should reject missing HMAC header', () => {
      (service as any).webhookSecret = 'test_webhook_secret_key_123';
      const isValid = service.verifyHmacSignature('{}', undefined);
      expect(isValid).toBe(false);
    });
  });

  describe('handleOrderCreate idempotency', () => {
    it('should detect duplicate webhooks and ignore without throwing error', async () => {
      // Mock that webhookId already exists in database
      mockPrismaService.webhookLog.findUnique.mockResolvedValueOnce({
        id: 'log_1',
        webhookId: 'webhook_dup_123',
        status: 'SUCCESS',
      });

      const body = { id: 7777, name: '#7777', total_price: '100.00' };
      const headers = { 'x-shopify-webhook-id': 'webhook_dup_123' };

      const result = await service.handleOrderCreate(body, headers);
      expect(result.idempotent).toBe(true);
      expect(result.received).toBe(true);
    });

    it('should successfully process a new order creation webhook', async () => {
      // Not a duplicate
      mockPrismaService.webhookLog.findUnique.mockResolvedValueOnce(null);

      const body = {
        id: 8888,
        order_number: 8888,
        name: '#8888',
        total_price: '500.00',
        currency: 'INR',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        line_items: [{ id: 1, title: 'Item 1', quantity: 1, price: '500.00' }],
      };
      const headers = { 'x-shopify-webhook-id': 'webhook_new_8888' };

      const result = await service.handleOrderCreate(body, headers);
      expect(result.status).toBe('processed');
      expect(result.received).toBe(true);
    });
  });
});
