export class QueryOrdersDto {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  fulfillmentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'orderDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}
