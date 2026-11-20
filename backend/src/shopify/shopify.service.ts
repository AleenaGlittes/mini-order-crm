import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

export interface ShopifyLineItemInput {
  title: string;
  price: number;
  quantity: number;
  shopifyId?: string;
}

export interface CreateShopifyOrderInput {
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  financialStatus?: string;
  currency?: string;
  lineItems: ShopifyLineItemInput[];
}

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  private reloadEnv() {
    if (typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile();
      } catch {
        // .env file already loaded or not present
      }
    }
  }

  get shopDomain(): string {
    this.reloadEnv();
    return process.env.SHOPIFY_SHOP_DOMAIN || 'aura-bu8xtypb.myshopify.com';
  }

  get accessToken(): string {
    this.reloadEnv();
    return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
  }

  set accessToken(token: string) {
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = token;
  }

  get apiVersion(): string {
    this.reloadEnv();
    return process.env.SHOPIFY_API_VERSION || '2026-10';
  }

  get clientId(): string {
    this.reloadEnv();
    return process.env.SHOPIFY_CLIENT_ID || '';
  }

  get clientSecret(): string {
    this.reloadEnv();
    return (
      process.env.SHOPIFY_CLIENT_SECRET ||
      process.env.SHOPIFY_WEBHOOK_SECRET ||
      ''
    );
  }

  constructor(private readonly prisma: PrismaService) {}

  getOAuthAuthorizeUrl(redirectUri?: string) {
    const callback = redirectUri || 'http://localhost:3001/shopify/callback';
    const scopes = 'read_orders,write_orders,read_customers,write_customers,read_products';
    return `https://${this.shopDomain}/admin/oauth/authorize?client_id=${this.clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(callback)}`;
  }

  async exchangeOAuthCode(code: string, shopDomain?: string) {
    const shop = shopDomain || this.shopDomain;
    const url = `https://${shop}/admin/oauth/access_token`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.access_token) {
        throw new Error(data?.error_description || data?.error || 'OAuth token exchange failed');
      }

      this.accessToken = data.access_token;
      this.logger.log(`Successfully obtained Shopify access token via OAuth: ${data.access_token.slice(0, 10)}...`);

      // Update .env file
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let content = fs.readFileSync(envPath, 'utf8');
          content = content.replace(/SHOPIFY_ADMIN_ACCESS_TOKEN=.*/, `SHOPIFY_ADMIN_ACCESS_TOKEN="${data.access_token}"`);
          fs.writeFileSync(envPath, content, 'utf8');
        }
      } catch (err) {
        this.logger.warn(`Could not persist access token to .env: ${(err as Error).message}`);
      }

      // Automatically import orders with the new access token
      await this.importOrders();

      return {
        success: true,
        access_token: data.access_token,
        scope: data.scope,
      };
    } catch (err) {
      this.logger.error(`OAuth code exchange error: ${(err as Error).message}`);
      throw new HttpException(
        `Failed to exchange OAuth authorization code: ${(err as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private cachedScopes: string = '';

  /**
   * Request or reuse a cached 24-hour access token via Client Credentials Grant
   */
  async getOrFetchAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    // Return cached token if valid for at least another 60 seconds
    if (!forceRefresh && this.cachedToken && now < this.tokenExpiresAt - 60000) {
      return this.cachedToken!;
    }

    // If static token was provided and starts with shpat_, use it
    const staticToken = this.accessToken?.trim();
    if (staticToken && staticToken.startsWith('shpat_') && staticToken.length > 30) {
      return staticToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new HttpException(
        'Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET in .env',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.log(`Requesting new access token via client_credentials for ${this.shopDomain}...`);

    const url = `https://${this.shopDomain}/admin/oauth/access_token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (!response.ok || !data?.access_token) {
        let errorMsg = data?.error_description || data?.error;
        if (!errorMsg && responseText.includes('Oauth error')) {
          const match = responseText.match(/Oauth error[^<]+/i);
          if (match) {
            errorMsg = match[0].trim().replace(/\s+/g, ' ');
          }
        }
        if (!errorMsg && responseText.includes('class="content--desc"')) {
          const matches = [...responseText.matchAll(/class="content--desc"[^>]*>([\s\S]*?)<\/div>/gi)];
          if (matches.length > 1 && matches[1][1]) {
            errorMsg = matches[1][1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
          }
        }
        if (!errorMsg) {
          errorMsg = `HTTP ${response.status}: ${responseText.slice(0, 200)}`;
        }
        this.logger.error(`Client credentials exchange failed: ${errorMsg}`);
        throw new HttpException(
          `Shopify token exchange failed: ${errorMsg}`,
          response.status || HttpStatus.UNAUTHORIZED,
        );
      }

      this.cachedToken = data.access_token;
      // Expires in seconds (Shopify default 86400 = 24h)
      const expiresInSec = data.expires_in || 86400;
      this.tokenExpiresAt = Date.now() + expiresInSec * 1000;
      this.cachedScopes = data.scope || '';

      this.logger.log(
        `Obtained Shopify access token (scopes: "${this.cachedScopes}", expires in ${expiresInSec}s)`,
      );

      return this.cachedToken!;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to connect to Shopify OAuth endpoint: ${(err as Error).message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private isLiveCredentialsConfigured(): boolean {
    const domain = this.shopDomain?.trim() || '';
    const hasClientId = Boolean(this.clientId && this.clientId.length > 20);
    const hasClientSecret = Boolean(this.clientSecret && this.clientSecret.length > 20);
    const hasStaticToken = Boolean(
      this.accessToken &&
        this.accessToken.startsWith('shpat_') &&
        this.accessToken.length > 30,
    );

    return Boolean(domain && !domain.includes('placeholder') && ((hasClientId && hasClientSecret) || hasStaticToken));
  }

  /**
   * Make an authenticated HTTP request to Shopify Admin API with automatic 401 retry
   */
  private async requestShopify<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const token = await this.getOrFetchAccessToken(isRetry);
    const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If 401 Unauthorized, invalidate token cache and retry once
      if (response.status === 401 && !isRetry) {
        this.logger.warn(`Shopify returned 401 Unauthorized. Refreshing token cache and retrying...`);
        this.cachedToken = null;
        this.tokenExpiresAt = 0;
        return this.requestShopify<T>(endpoint, options, true);
      }

      // If 403 Forbidden, check if it's missing scope
      if (response.status === 403) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.errors || 'Access denied (403 Forbidden)';
        this.logger.error(`Shopify 403 Forbidden: ${JSON.stringify(errMsg)}. Active scopes: "${this.cachedScopes}"`);
        throw new HttpException(
          {
            message: 'Shopify Admin API returned 403 Forbidden',
            shopifyError: errMsg,
            scopesActive: this.cachedScopes,
            hint: !this.cachedScopes.includes('read_orders')
              ? "The 'read_orders' scope is missing from your app version. In Shopify Partner Dashboard -> Order CRM -> Configuration, add 'read_orders', click Release, and approve it on your store."
              : undefined,
            status: 403,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.errors || data?.message || `Shopify HTTP error ${response.status}`;
        this.logger.error(`Shopify API error [${response.status}]: ${JSON.stringify(errorMsg)}`);
        throw new HttpException(
          {
            message: 'Shopify Admin API returned an error',
            shopifyError: errorMsg,
            status: response.status,
          },
          response.status,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Network or fetch failure for Shopify: ${(error as Error).message}`);
      throw new HttpException(
        `Failed to communicate with Shopify Admin API: ${(error as Error).message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Fetch orders from Shopify Admin API and persist in PostgreSQL via Prisma
   */
  async importOrders(options?: { limit?: number; since?: string }) {
    this.logger.log(`Starting Shopify orders import from ${this.shopDomain}...`);

    let shopifyOrders: any[] = [];
    const isLive = this.isLiveCredentialsConfigured();

    if (isLive) {
      const limit = options?.limit || 50;
      const queryParams = new URLSearchParams({
        status: 'any',
        limit: String(limit),
      });
      if (options?.since) {
        queryParams.set('created_at_min', options.since);
      }

      const response = await this.requestShopify<{ orders: any[] }>(
        `orders.json?${queryParams.toString()}`,
      );
      shopifyOrders = response?.orders || [];
      this.logger.log(`Retrieved ${shopifyOrders.length} live orders from Shopify API.`);

      // Automatically purge previous mock sample orders when live Shopify sync succeeds
      await this.purgeMockOrders();
    } else {
      this.logger.warn(
        `Live Shopify credentials not configured in .env. Running import with realistic Shopify mock dataset.`,
      );
      shopifyOrders = this.getMockShopifyOrders();
    }

    let persistedCount = 0;

    for (const item of shopifyOrders) {
      try {
        const shopifyId = String(item.id);
        const orderNumber = item.name || `#${item.order_number || item.id}`;
        const financialStatus = this.normalizeStatus(item.financial_status || 'paid');
        const fulfillmentStatus = this.normalizeFulfillmentStatus(
          item.fulfillment_status || 'unfulfilled',
        );
        const totalAmount = parseFloat(item.total_price || item.current_total_price || '0');
        const currency = item.currency || item.currencyCode || 'INR';
        const orderDate = item.created_at ? new Date(item.created_at) : new Date();

        // 1. Upsert Customer in Prisma
        let customerId: string | undefined;
        if (item.customer?.email) {
          const customer = await this.prisma.customer.upsert({
            where: { email: item.customer.email },
            update: {
              firstName: item.customer.first_name || item.customer.firstName,
              lastName: item.customer.last_name || item.customer.lastName,
              phone: item.customer.phone,
              shopifyId: item.customer.id ? String(item.customer.id) : undefined,
            },
            create: {
              firstName: item.customer.first_name || item.customer.firstName || 'Customer',
              lastName: item.customer.last_name || item.customer.lastName || '',
              email: item.customer.email,
              phone: item.customer.phone,
              shopifyId: item.customer.id ? String(item.customer.id) : undefined,
            },
          });
          customerId = customer.id;
        }

        // 2. Upsert Order in Prisma
        await this.prisma.order.upsert({
          where: { shopifyId },
          update: {
            orderNumber,
            financialStatus,
            fulfillmentStatus,
            totalAmount: new Prisma.Decimal(totalAmount),
            currency,
            orderDate,
            customerId,
          },
          create: {
            shopifyId,
            orderNumber,
            financialStatus,
            fulfillmentStatus,
            totalAmount: new Prisma.Decimal(totalAmount),
            currency,
            orderDate,
            customerId,
            items: {
              create: (item.line_items || item.lineItems || []).map((li: any) => ({
                productName: li.title || li.name || 'Product',
                quantity: li.quantity || 1,
                price: new Prisma.Decimal(parseFloat(li.price || '0')),
                shopifyId: li.id ? String(li.id) : undefined,
              })),
            },
          },
        });

        persistedCount++;
      } catch (err) {
        this.logger.warn(`Failed persisting order ${item.id}: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      mode: isLive ? 'live_shopify_api' : 'simulated_mock',
      store: this.shopDomain,
      importedCount: persistedCount,
      totalReceived: shopifyOrders.length,
      syncedAt: new Date(),
      message: `Successfully synchronized ${persistedCount} Shopify orders into PostgreSQL.`,
    };
  }

  /**
   * Create an order via Shopify Admin API (POST /admin/api/{version}/orders.json)
   * and synchronize to PostgreSQL via Prisma upon success
   */
  async createOrderOnShopify(input: CreateShopifyOrderInput) {
    this.logger.log(`Creating order on Shopify for ${input.customerEmail}...`);

    const isLive = this.isLiveCredentialsConfigured();
    let shopifyResponseOrder: any = null;

    const nameParts = (input.customerName || 'Guest Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    // Ensure last_name is never blank (Shopify 422: customer.last_name can't be blank)
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

    // Sanitize and validate E.164 phone format (+[country][number]) to prevent Shopify 422 invalid phone
    let validPhone: string | undefined = undefined;
    if (input.customerPhone && input.customerPhone.trim()) {
      let cleaned = input.customerPhone.trim().replace(/[\s\-()]/g, '');
      if (!cleaned.startsWith('+')) {
        if (/^\d{10}$/.test(cleaned)) {
          cleaned = `+91${cleaned}`;
        }
      }
      if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
        validPhone = cleaned;
      } else {
        this.logger.warn(`Omitting phone "${input.customerPhone}" from Shopify payload (must be E.164 like +919876543210).`);
      }
    }

    const customerPayload: any = {
      first_name: firstName,
      last_name: lastName,
      email: input.customerEmail,
    };
    if (validPhone) {
      customerPayload.phone = validPhone;
    }

    const payload = {
      order: {
        financial_status: (input.financialStatus || 'paid').toLowerCase(),
        currency: input.currency || 'INR',
        email: input.customerEmail,
        customer: customerPayload,
        line_items: input.lineItems.map((item) => ({
          title: item.title,
          price: item.price.toFixed(2),
          quantity: item.quantity,
        })),
        tags: 'CRM, Manual',
      },
    };

    if (isLive) {
      const response = await this.requestShopify<{ order: any }>('orders.json', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      shopifyResponseOrder = response.order;
      this.logger.log(`Shopify order created successfully: ${shopifyResponseOrder.id}`);
    } else {
      this.logger.log(`Live Shopify credentials placeholder detected. Generating simulated Shopify order response.`);
      const mockId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const mockOrderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
      const total = input.lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

      shopifyResponseOrder = {
        id: mockId,
        name: mockOrderNumber,
        financial_status: input.financialStatus || 'paid',
        fulfillment_status: 'unfulfilled',
        total_price: total.toString(),
        currency: input.currency || 'INR',
        created_at: new Date().toISOString(),
        customer: {
          id: `cust_${mockId}`,
          first_name: firstName,
          last_name: lastName,
          email: input.customerEmail,
          phone: input.customerPhone,
        },
        line_items: input.lineItems.map((li, idx) => ({
          id: `li_${mockId}_${idx}`,
          title: li.title,
          quantity: li.quantity,
          price: li.price.toString(),
        })),
      };
    }

    // Persist to PostgreSQL via Prisma
    const shopifyId = String(shopifyResponseOrder.id);
    const orderNumber = shopifyResponseOrder.name || `#${shopifyResponseOrder.id}`;
    const totalAmount = parseFloat(shopifyResponseOrder.total_price || '0');

    let customerId: string | undefined;
    if (input.customerEmail) {
      const customer = await this.prisma.customer.upsert({
        where: { email: input.customerEmail },
        update: {
          firstName,
          lastName,
          phone: validPhone || input.customerPhone,
          shopifyId: shopifyResponseOrder.customer?.id ? String(shopifyResponseOrder.customer.id) : undefined,
        },
        create: {
          firstName,
          lastName,
          email: input.customerEmail,
          phone: validPhone || input.customerPhone,
          shopifyId: shopifyResponseOrder.customer?.id ? String(shopifyResponseOrder.customer.id) : undefined,
        },
      });
      customerId = customer.id;
    }

    const localOrder = await this.prisma.order.create({
      data: {
        shopifyId,
        orderNumber,
        financialStatus: this.normalizeStatus(shopifyResponseOrder.financial_status || 'paid'),
        fulfillmentStatus: this.normalizeFulfillmentStatus(
          shopifyResponseOrder.fulfillment_status || 'unfulfilled',
        ),
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: input.currency || 'INR',
        orderDate: new Date(),
        customerId,
        items: {
          create: input.lineItems.map((item, idx) => ({
            productName: item.title,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
            shopifyId: shopifyResponseOrder.line_items?.[idx]?.id ? String(shopifyResponseOrder.line_items[idx].id) : undefined,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return {
      success: true,
      message: 'Order created in Shopify and persisted to database.',
      shopifyId,
      orderNumber,
      order: localOrder,
    };
  }

  async purgeMockOrders() {
    try {
      const mockIds = ['5982148191', '5982148192', '5982148193', '5982148194', '5982148195'];
      await this.prisma.orderItem.deleteMany({
        where: {
          order: {
            shopifyId: { in: mockIds },
          },
        },
      });
      const deleted = await this.prisma.order.deleteMany({
        where: {
          shopifyId: { in: mockIds },
        },
      });
      this.logger.log(`Purged ${deleted.count} dummy mock orders from database.`);
      return { success: true, deletedCount: deleted.count };
    } catch (err) {
      this.logger.warn(`Failed to purge mock orders: ${(err as Error).message}`);
      return { success: false, deletedCount: 0 };
    }
  }

  getShopConfig() {
    const isLive = this.isLiveCredentialsConfigured();
    return {
      shopDomain: this.shopDomain,
      apiVersion: this.apiVersion,
      isLive,
      tokenConfigured: isLive,
      tokenType: 'client_credentials',
      activeScopes: this.cachedScopes || '',
      hasReadOrdersScope: this.cachedScopes.includes('read_orders'),
      tokenExpiresAt: this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : null,
    };
  }

  async getDashboardStats() {
    try {
      const [totalOrders, pendingOrders, fulfilledOrders, allOrders] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({
          where: {
            OR: [
              { financialStatus: { in: ['Pending', 'pending'] } },
              { fulfillmentStatus: { in: ['Unfulfilled', 'unfulfilled'] } },
            ],
          },
        }),
        this.prisma.order.count({
          where: {
            fulfillmentStatus: { in: ['Fulfilled', 'fulfilled'] },
          },
        }),
        this.prisma.order.findMany({
          select: {
            totalAmount: true,
            orderDate: true,
          },
          orderBy: { orderDate: 'asc' },
        }),
      ]);

      const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // Monthly revenue aggregation
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap = new Map<string, number>();

      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(monthNames[d.getMonth()], 0);
      }

      allOrders.forEach((o) => {
        const d = new Date(o.orderDate);
        const m = monthNames[d.getMonth()];
        if (monthlyMap.has(m)) {
          monthlyMap.set(m, (monthlyMap.get(m) || 0) + Number(o.totalAmount));
        }
      });

      const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        fulfilledOrders,
        monthlyRevenue,
      };
    } catch (err) {
      this.logger.warn(`Could not compute live dashboard stats: ${(err as Error).message}`);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        fulfilledOrders: 0,
        monthlyRevenue: [],
      };
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

  private getMockShopifyOrders() {
    return [
      {
        id: '5982148191',
        name: '#1001',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: '2499.00',
        currency: 'INR',
        created_at: '2026-11-19T08:30:00Z',
        customer: {
          id: '918237191',
          first_name: 'Olivia',
          last_name: 'Martin',
          email: 'olivia@example.com',
          phone: '+91 9876543210',
        },
        line_items: [
          { id: '1029380', title: 'Classic Cotton Tee', quantity: 2, price: '1249.50' },
        ],
      },
      {
        id: '5982148192',
        name: '#1002',
        financial_status: 'pending',
        fulfillment_status: 'unfulfilled',
        total_price: '1599.00',
        currency: 'INR',
        created_at: '2026-11-18T10:15:00Z',
        customer: {
          id: '918237192',
          first_name: 'Jackson',
          last_name: 'Lee',
          email: 'jackson@example.com',
          phone: null,
        },
        line_items: [
          { id: '1029381', title: 'Canvas Tote Bag', quantity: 1, price: '1599.00' },
        ],
      },
      {
        id: '5982148193',
        name: '#1003',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: '4299.00',
        currency: 'INR',
        created_at: '2026-11-18T14:45:00Z',
        customer: {
          id: '918237193',
          first_name: 'Isabella',
          last_name: 'Nguyen',
          email: 'isabella@example.com',
          phone: '+91 9123456789',
        },
        line_items: [
          { id: '1029382', title: 'Premium Denim Jacket', quantity: 1, price: '4299.00' },
        ],
      },
      {
        id: '5982148194',
        name: '#1004',
        financial_status: 'refunded',
        fulfillment_status: 'unfulfilled',
        total_price: '899.00',
        currency: 'INR',
        created_at: '2026-11-17T11:20:00Z',
        customer: {
          id: '918237194',
          first_name: 'William',
          last_name: 'Kim',
          email: 'william@example.com',
          phone: null,
        },
        line_items: [
          { id: '1029383', title: 'Embroidered Cap', quantity: 1, price: '899.00' },
        ],
      },
      {
        id: '5982148195',
        name: '#1005',
        financial_status: 'paid',
        fulfillment_status: 'partially_fulfilled',
        total_price: '3299.00',
        currency: 'INR',
        created_at: '2026-11-16T16:00:00Z',
        customer: {
          id: '918237195',
          first_name: 'Sofia',
          last_name: 'Davis',
          email: 'sofia@example.com',
          phone: null,
        },
        line_items: [
          { id: '1029384', title: 'Merino Wool Beanie', quantity: 2, price: '1649.50' },
        ],
      },
    ];
  }

  /**
   * Fetch products from Shopify Admin API (or return curated catalog fallback)
   */
  async getProducts() {
    try {
      const data = await this.requestShopify<{ products: any[] }>(
        'products.json?limit=50&fields=id,title,variants,vendor,product_type',
      );
      if (data?.products && data.products.length > 0) {
        return data.products.map((p) => {
          const firstVariant = p.variants?.[0];
          return {
            id: String(p.id),
            title: p.title,
            price: firstVariant?.price ? parseFloat(firstVariant.price) : 999,
            variantId: firstVariant?.id ? String(firstVariant.id) : undefined,
            category: p.product_type || p.vendor || 'General',
          };
        });
      }
    } catch (err) {
      this.logger.warn(`Could not fetch products from Shopify: ${(err as Error).message}`);
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
}
