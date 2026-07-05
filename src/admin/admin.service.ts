import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  findLogs(query: { action?: string; page?: string; limit?: string }) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, parseInt(query.limit ?? '20', 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.action) where.action = query.action;

    return this.prisma.adminLog
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
      .then(async (logs) => {
        const total = await this.prisma.adminLog.count({ where });
        return {
          data: logs,
          meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      });
  }
}
