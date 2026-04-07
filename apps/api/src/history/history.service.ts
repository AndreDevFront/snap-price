import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.analysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.analysis.count({ where: { userId } }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.analysis.findFirst({ where: { id, userId } });
  }

  async remove(id: string, userId: string) {
    return this.prisma.analysis.deleteMany({ where: { id, userId } });
  }

  async stats(userId: string) {
    const analyses = await this.prisma.analysis.findMany({
      where: { userId },
      select: { avgPrice: true, confidence: true, itemName: true, createdAt: true },
    });

    const total = analyses.length;
    const avgConfidence = total > 0
      ? analyses.reduce((s, a) => s + a.confidence, 0) / total
      : 0;
    const totalValue = analyses.reduce((s, a) => s + a.avgPrice, 0);

    return { total, avgConfidence, totalValue };
  }
}
