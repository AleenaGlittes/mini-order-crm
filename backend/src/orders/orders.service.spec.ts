import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShopifyService } from '../shopify/shopify.service.js';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrismaService = {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll - Pagination & Search & Filtering', () => {
    it('should support server-side pagination with skip and take', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        { id: '1', orderNumber: '#1001', totalAmount: '799', orderDate: new Date() },
      ]);
      mockPrismaService.order.count.mockResolvedValueOnce(25);

      const result = await service.findAll({ page: '2', limit: '10' });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should search by orderNumber and customer name', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        { id: '1', orderNumber: '#1004', customer: { firstName: 'Aleena' } },
      ]);
      mockPrismaService.order.count.mockResolvedValueOnce(1);

      await service.findAll({ search: 'Aleena' });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { orderNumber: { contains: 'Aleena', mode: 'insensitive' } },
              { customer: { firstName: { contains: 'Aleena', mode: 'insensitive' } } },
            ]),
          }),
        }),
      );
    });

    it('should filter by financial status and date range', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([]);
      mockPrismaService.order.count.mockResolvedValueOnce(0);

      await service.findAll({
        status: 'paid',
        startDate: '2026-11-01',
        endDate: '2026-11-19',
      });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            financialStatus: 'paid',
            orderDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should sort by totalAmount ascending or descending', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([]);
      mockPrismaService.order.count.mockResolvedValueOnce(0);

      await service.findAll({ sortBy: 'totalAmount', sortOrder: 'asc' });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalAmount: 'asc' },
        }),
      );
    });
  });

  describe('create - Order Creation', () => {
    it('should create order on Shopify and persist in Prisma', async () => {
      mockPrismaService.order.create.mockResolvedValueOnce({
        id: 'order_new_1',
        orderNumber: '#1005',
        totalAmount: 1200,
        financialStatus: 'paid',
        items: [],
      });

      const dto = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+919876543210',
        currency: 'INR',
        financialStatus: 'paid',
        items: [{ productName: 'Shoes', quantity: 1, price: 1200 }],
      };

      const result = await service.create(dto as any);

      expect(mockShopifyService.createOrderOnShopify).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          currency: 'INR',
          financialStatus: 'paid',
        }),
      );
      expect(result).toBeDefined();
    });
  });
});
