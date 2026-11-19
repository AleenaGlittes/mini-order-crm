import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShopifyService } from '../shopify/shopify.service.js';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrismaService = {
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: '1' }),
    },
    customer: {
      upsert: vi.fn().mockResolvedValue({ id: 'cust_1' }),
    },
  };

  const mockShopifyService = {
    createOrderOnShopify: vi.fn().mockResolvedValue({
      success: true,
      shopifyId: '123',
      orderNumber: '#1001',
    }),
    importOrders: vi.fn().mockResolvedValue({ success: true, count: 5 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ShopifyService,
          useValue: mockShopifyService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
