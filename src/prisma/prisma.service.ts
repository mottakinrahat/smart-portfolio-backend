import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force override local .env values over any system environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    // Create the pg pool with pooling configuration
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: connectionString?.includes('sslmode=')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Create the Prisma adapter
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
