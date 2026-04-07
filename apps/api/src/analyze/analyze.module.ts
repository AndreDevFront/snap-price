import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [MulterModule.register({ storage: undefined }), OpenAIModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService],
})
export class AnalyzeModule {}
