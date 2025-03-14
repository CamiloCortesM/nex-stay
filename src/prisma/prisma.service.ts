import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  logger = new Logger('PrismaService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established successfully.');
  }
}
