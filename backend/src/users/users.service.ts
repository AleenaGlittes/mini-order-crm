import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    } catch {
      return [
        {
          id: 'admin_demo_id',
          name: 'Store Admin',
          email: 'admin@mystore.com',
          createdAt: new Date(),
        },
      ];
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    } catch {
      return {
        id,
        name: 'Store Admin',
        email: 'admin@mystore.com',
        createdAt: new Date(),
      };
    }
  }
}

