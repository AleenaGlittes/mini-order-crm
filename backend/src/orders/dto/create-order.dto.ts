export class OrderItemDto {
  productName!: string;
  quantity!: number;
  price!: number;
  shopifyId?: string;
}

export class CreateOrderDto {
  orderNumber?: string;
  customerName?: string;
  customerEmail!: string;
  customerPhone?: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  currency?: string;
  items!: OrderItemDto[];
}
