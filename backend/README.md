# Shopify Order CRM - NestJS Backend

A production-ready NestJS backend service with Prisma 7, PostgreSQL, and Shopify Admin API integration.

## Architecture

- **Framework**: NestJS 11 (ESM)
- **Database**: PostgreSQL with Prisma 7.10.1 (`@prisma/adapter-pg`)
- **Port**: `3001` (configured with CORS enabled for `http://localhost:3000`)
- **Modules**:
  - `AuthModule`: User login, password hashing (`scryptSync`), and token validation (`AuthGuard`).
  - `OrdersModule`: Server-side pagination, search, status filtering, date range filtering, and sorting.
  - `ShopifyModule`: Authenticated Shopify Admin REST API client and store synchronizer.
  - `WebhooksModule`: HMAC signature verification, idempotent event logging, and status handling.
  - `CustomersModule`: Customer management and order history aggregation.
  - `UsersModule`: System user records.
  - `PrismaModule`: Global Prisma client connection management.

---

## Environment Variables (`.env`)

```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/shopify_crm"
PORT=3001

# JWT Secret
JWT_SECRET="your_jwt_secret_key"

# Shopify Custom App Integration (Admin API)
# Required Scopes: read_orders, write_orders, read_customers, write_customers, read_products
SHOPIFY_SHOP_DOMAIN="your-store-name.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_your_admin_api_access_token"
SHOPIFY_API_VERSION="2026-10"

# Shopify Webhook HMAC Verification Secret
SHOPIFY_WEBHOOK_SECRET="your_shopify_webhook_signing_secret"
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | User login and token generation |
| `GET` | `/orders` | Paginated orders with search, filtering, and sorting |
| `GET` | `/orders/:id` | Fetch specific order details by ID |
| `POST` | `/orders` | Create an order in Shopify and persist locally |
| `POST` | `/shopify/import` | Sync historical orders from Shopify into PostgreSQL |
| `POST` | `/webhooks/orders/create` | Receive & idempotently process new Shopify orders |
| `POST` | `/webhooks/orders/updated` | Receive & update existing Shopify orders |
| `GET` | `/webhooks/logs` | Diagnostic logs of received webhook events |

---

## Webhook Verification & Idempotency

1. **HMAC Signature Verification**:
   Incoming payloads are verified using SHA-256 HMAC:
   ```ts
   const hmac = crypto.createHmac('sha256', secret).update(rawPayload).digest('base64');
   crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(receivedSignature));
   ```
2. **Idempotent Delivery**:
   Events are logged in `WebhookLog` with their unique `X-Shopify-Webhook-Id`. Duplicate deliveries are caught and return `200 OK` with status `DUPLICATE_IGNORED` to prevent double-processing.

---

## Testing & Quality

```bash
# Run unit tests (vitest)
npm run test

# Run build
npm run build

# Run linter
npm run lint
```
