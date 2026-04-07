import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyzeService {
  constructor(
    private openai: OpenAIService,
    private prisma: PrismaService,
  ) {}

  async analyze(imageBuffer: Buffer, mimeType: string, userId?: string) {
    const result = await this.openai.analyzeImage(imageBuffer, mimeType);

    if (userId) {
      await this.prisma.analysis.create({
        data: {
          userId,
          itemName: result.name,
          estimatedMin: result.price.min,
          estimatedMax: result.price.max,
          avgPrice: result.price.avg,
          confidence: result.confidence,
          platforms: result.platforms,
          tips: result.tips,
        },
      });
    }

    return result;
  }
}
