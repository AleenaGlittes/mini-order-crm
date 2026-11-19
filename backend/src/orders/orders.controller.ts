import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /orders
   * Purpose: Get orders list with pagination, search, and status filters
   */
  @Get()
  async findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query);
  }

  /**
   * GET /orders/:id
   * Purpose: Get order details by ID or orderNumber
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * POST /orders
   * Purpose: Create Shopify order
   */
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
