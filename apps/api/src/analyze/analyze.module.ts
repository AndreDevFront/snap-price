import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [AnalyzeController],
  providers: [AnalyzeService, OpenAIService],
})
export class AnalyzeModule {}
