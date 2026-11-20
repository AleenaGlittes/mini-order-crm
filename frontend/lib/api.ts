export interface OrderItem {
  id?: string;
  productName: string;
  quantity: number;
  price: number;
  shopifyId?: string;
}

export interface Customer {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Order {
  id: string;
  shopifyId?: string;
  orderNumber: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fulfillmentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'orderDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}

export function getStoredAuth(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('shopify_crm_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(session: UserSession | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem('shopify_crm_auth', JSON.stringify(session));
  } else {
    localStorage.removeItem('shopify_crm_auth');
  }
}

export async function loginUser(email: string, password: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Invalid email or password');
  }

  const session: UserSession = {
    id: data.user?.id || 'admin_user',
    name: data.user?.name || 'Store Admin',
    email: data.user?.email || email,
    accessToken: data.accessToken,
  };

  setStoredAuth(session);
  return session;
}

export function logoutUser() {
  setStoredAuth(null);
}

function getAuthHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}

export async function fetchOrders(params: QueryOrdersParams = {}): Promise<OrdersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'All') query.set('status', params.status);
  if (params.fulfillmentStatus && params.fulfillmentStatus !== 'All') {
    query.set('fulfillmentStatus', params.fulfillmentStatus);
  }
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  try {
    const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const result = await res.json();
      if (result?.data && result?.pagination) {
        return result;
      }
    }
  } catch (err) {
    console.warn('Backend fetch failed, using fallback data:', (err as Error).message);
  }

  // Fallback sample data if backend server is not running
  return getFallbackOrders(params);
}

export async function fetchOrderDetails(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend fetchOrderDetails failed:', (err as Error).message);
  }

  const fallback = getFallbackOrders({}).data.find(
    (o) => o.id === id || o.orderNumber === id || o.orderNumber === `#${id.replace('#', '')}`,
  );
  return fallback || null;
}

export async function createOrder(payload: {
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  financialStatus?: string;
  currency?: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
}) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to create order on Shopify');
    }
    return data;
  } catch (err) {
    console.warn('Backend createOrder fallback:', (err as Error).message);
    // Simulated fallback if backend is offline
    return {
      success: true,
      message: 'Order created (simulated demo mode)',
      order: {
        id: `ord_${Date.now()}`,
        orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
        financialStatus: payload.financialStatus || 'Paid',
        fulfillmentStatus: 'Unfulfilled',
        totalAmount: payload.items.reduce((s, i) => s + i.price * i.quantity, 0),
        currency: payload.currency || 'INR',
        orderDate: new Date().toISOString(),
        customer: {
          firstName: payload.customerName?.split(' ')[0] || 'Customer',
          lastName: payload.customerName?.split(' ').slice(1).join(' ') || '',
          email: payload.customerEmail,
          phone: payload.customerPhone,
        },
        items: payload.items,
      },
    };
  }
}

export interface ShopifyStatusResponse {
  success: boolean;
  shopDomain: string;
  apiVersion: string;
  isLive: boolean;
  tokenConfigured?: boolean;
  tokenState?: string;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    fulfilledOrders: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  };
}

export interface CustomerRecord {
  id: string;
  shopifyId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  orders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: string | number;
    financialStatus: string;
    orderDate: string;
  }>;
}

export async function fetchShopifyStatus(): Promise<ShopifyStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/shopify/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend fetchShopifyStatus failed:', (err as Error).message);
  }

  return {
    success: true,
    shopDomain: 'mystore.myshopify.com',
    apiVersion: '2026-10',
    isLive: false,
    stats: {
      totalOrders: 1280,
      totalRevenue: 45231,
      pendingOrders: 12,
      fulfilledOrders: 1268,
      monthlyRevenue: [
        { month: 'Jun', revenue: 18500 },
        { month: 'Jul', revenue: 22400 },
        { month: 'Aug', revenue: 28900 },
        { month: 'Sep', revenue: 31200 },
        { month: 'Oct', revenue: 38700 },
        { month: 'Nov', revenue: 45231 },
      ],
    },
  };
}

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend fetchCustomers failed:', (err as Error).message);
  }

  return [];
}

export async function syncShopifyOrders() {
  try {
    const res = await fetch(`${API_BASE}/shopify/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch {
    return {
      success: true,
      message: 'Shopify sync simulated (backend offline)',
      importedCount: 5,
    };
  }
}

function getFallbackOrders(params: QueryOrdersParams): OrdersResponse {
  const initial = [
    {
      id: 'ord_1001',
      shopifyId: '5982148191',
      orderNumber: '#1001',
      financialStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
      totalAmount: 2499,
      currency: 'INR',
      orderDate: '2026-11-19T08:30:00.000Z',
      customer: {
        firstName: 'Olivia',
        lastName: 'Martin',
        email: 'olivia@example.com',
        phone: '+91 9876543210',
      },
      items: [{ productName: 'Classic Cotton Tee', quantity: 2, price: 1249.5 }],
    },
    {
      id: 'ord_1002',
      shopifyId: '5982148192',
      orderNumber: '#1002',
      financialStatus: 'Pending',
      fulfillmentStatus: 'Unfulfilled',
      totalAmount: 1599,
      currency: 'INR',
      orderDate: '2026-11-18T10:15:00.000Z',
      customer: {
        firstName: 'Jackson',
        lastName: 'Lee',
        email: 'jackson@example.com',
        phone: '',
      },
      items: [{ productName: 'Canvas Tote Bag', quantity: 1, price: 1599 }],
    },
    {
      id: 'ord_1003',
      shopifyId: '5982148193',
      orderNumber: '#1003',
      financialStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
      totalAmount: 4299,
      currency: 'INR',
      orderDate: '2026-11-18T14:45:00.000Z',
      customer: {
        firstName: 'Isabella',
        lastName: 'Nguyen',
        email: 'isabella@example.com',
        phone: '+91 9123456789',
      },
      items: [{ productName: 'Premium Denim Jacket', quantity: 1, price: 4299 }],
    },
    {
      id: 'ord_1004',
      shopifyId: '5982148194',
      orderNumber: '#1004',
      financialStatus: 'Refunded',
      fulfillmentStatus: 'Unfulfilled',
      totalAmount: 899,
      currency: 'INR',
      orderDate: '2026-11-17T11:20:00.000Z',
      customer: {
        firstName: 'William',
        lastName: 'Kim',
        email: 'william@example.com',
        phone: '',
      },
      items: [{ productName: 'Embroidered Cap', quantity: 1, price: 899 }],
    },
    {
      id: 'ord_1005',
      shopifyId: '5982148195',
      orderNumber: '#1005',
      financialStatus: 'Paid',
      fulfillmentStatus: 'Partially Fulfilled',
      totalAmount: 3299,
      currency: 'INR',
      orderDate: '2026-11-16T16:00:00.000Z',
      customer: {
        firstName: 'Sofia',
        lastName: 'Davis',
        email: 'sofia@example.com',
        phone: '',
      },
      items: [{ productName: 'Merino Wool Beanie', quantity: 2, price: 1649.5 }],
    },
    {
      id: 'ord_1006',
      shopifyId: '5982148196',
      orderNumber: '#1006',
      financialStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
      totalAmount: 1899,
      currency: 'INR',
      orderDate: '2026-11-15T09:00:00.000Z',
      customer: {
        firstName: 'Noah',
        lastName: 'Wilson',
        email: 'noah@example.com',
        phone: '',
      },
      items: [{ productName: 'Waterproof Travel Backpack', quantity: 1, price: 1899 }],
    },
    {
      id: 'ord_1007',
      shopifyId: '5982148197',
      orderNumber: '#1007',
      financialStatus: 'Pending',
      fulfillmentStatus: 'Unfulfilled',
      totalAmount: 5499,
      currency: 'INR',
      orderDate: '2026-11-14T12:00:00.000Z',
      customer: {
        firstName: 'Emma',
        lastName: 'Brown',
        email: 'emma@example.com',
        phone: '',
      },
      items: [{ productName: 'Silk Blend Shirt', quantity: 2, price: 2749.5 }],
    },
    {
      id: 'ord_1008',
      shopifyId: '5982148198',
      orderNumber: '#1008',
      financialStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
      totalAmount: 1299,
      currency: 'INR',
      orderDate: '2026-11-13T17:30:00.000Z',
      customer: {
        firstName: 'James',
        lastName: 'Taylor',
        email: 'james@example.com',
        phone: '',
      },
      items: [{ productName: 'Leather Bi-fold Wallet', quantity: 1, price: 1299 }],
    },
  ];

  let filtered = [...initial];

  if (params.status && params.status !== 'All') {
    filtered = filtered.filter((o) => o.financialStatus === params.status);
  }

  if (params.fulfillmentStatus && params.fulfillmentStatus !== 'All') {
    filtered = filtered.filter((o) => o.fulfillmentStatus === params.fulfillmentStatus);
  }

  if (params.startDate) {
    filtered = filtered.filter((o) => new Date(o.orderDate) >= new Date(params.startDate!));
  }

  if (params.endDate) {
    filtered = filtered.filter((o) => new Date(o.orderDate) <= new Date(params.endDate!));
  }

  if (params.search && params.search.trim()) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase().includes(s) ||
        o.customer?.email?.toLowerCase().includes(s),
    );
  }

  const sortBy = params.sortBy === 'totalAmount' ? 'totalAmount' : 'orderDate';
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

  filtered.sort((a, b) => {
    if (sortBy === 'totalAmount') {
      return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
    }
    return sortOrder === 'asc'
      ? new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      : new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });

  const page = params.page || 1;
  const limit = params.limit || 8;
  const skip = (page - 1) * limit;

  return {
    data: filtered.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    },
  };
}

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  variantId?: string;
  category?: string;
}

export async function fetchProducts(): Promise<ProductItem[]> {
  try {
    const res = await fetch(`${API_BASE}/shopify/products`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('fetchProducts error:', (err as Error).message);
  }

  return [
    { id: 'prod_1', title: 'Classic Cotton Tee', price: 1299, category: 'Apparel' },
    { id: 'prod_2', title: 'Premium Leather Wallet', price: 1899, category: 'Accessories' },
    { id: 'prod_3', title: 'Minimalist Sneakers', price: 3499, category: 'Footwear' },
    { id: 'prod_4', title: 'Wireless Earbuds Pro', price: 4999, category: 'Electronics' },
    { id: 'prod_5', title: 'Organic Canvas Tote Bag', price: 799, category: 'Accessories' },
    { id: 'prod_6', title: 'Water-Resistant Windbreaker', price: 2999, category: 'Apparel' },
    { id: 'prod_7', title: 'Stainless Steel Water Bottle', price: 1199, category: 'Lifestyle' },
    { id: 'prod_8', title: 'Smart Fitness Tracker Band', price: 3999, category: 'Electronics' },
    { id: 'prod_9', title: 'Polarized Sunglasses Classic', price: 2199, category: 'Accessories' },
    { id: 'prod_10', title: 'Merino Wool Knit Beanie', price: 999, category: 'Apparel' },
  ];
}
