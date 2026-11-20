import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShopifyService } from './shopify.service.js';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * GET /shopify/auth
   * Purpose: Initiate OAuth authorization for Partner App
   */
  @Get('auth')
  initiateOAuth(@Res() res: any) {
    const url = this.shopifyService.getOAuthAuthorizeUrl();
    return res.redirect(url);
  }

  /**
   * GET /shopify/callback
   * Purpose: Handle Shopify OAuth callback, exchange code for access token, and redirect to CRM
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('shop') shop: string,
    @Res() res: any,
  ) {
    if (!code) {
      return res.status(400).send('Missing authorization code from Shopify');
    }
    await this.shopifyService.exchangeOAuthCode(code, shop);
    return res.redirect('http://localhost:3000?sync=success');
  }

  /**
   * GET /shopify/status
   * Purpose: Retrieve Shopify store configuration, sync state, and live analytics
   */
  @Get('status')
  async getStatus() {
    const config = this.shopifyService.getShopConfig();
    const stats = await this.shopifyService.getDashboardStats();
    return {
      success: true,
      ...config,
      stats,
    };
  }

  /**
   * POST /shopify/import
   * Purpose: Import Shopify orders
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  async importOrders(@Body() body: { limit?: number; since?: string }) {
    return this.shopifyService.importOrders(body);
  }

  /**
   * GET /shopify/products
   * Purpose: Retrieve product catalog for order creation
   */
  @Get('products')
  async getProducts() {
    const products = await this.shopifyService.getProducts();
    return { success: true, data: products };
  }

  /**
   * DELETE /shopify/mock-orders
   * Purpose: Purge initial dummy/mock sample orders from the database
   */
  @Delete('mock-orders')
  async purgeMockOrders() {
    return this.shopifyService.purgeMockOrders();
  }
}

