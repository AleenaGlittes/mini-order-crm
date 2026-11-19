import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/shopify_crm';

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database via Prisma.');
    } catch (error) {
      this.logger.warn(
        `Database connection failed during init (PostgreSQL may not be running): ${(error as Error).message}. Operating in resilient mode.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

