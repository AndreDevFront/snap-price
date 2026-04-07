import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  /**
   * POST /api/v1/analyze
   * Recebe uma imagem (multipart/form-data, campo "image") e retorna
   * a avaliação de preço gerada pela OpenAI Vision.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Apenas imagens são aceitas.'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async analyze(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnalyzeResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'Campo "image" obrigatório (multipart/form-data).',
      );
    }
    return this.analyzeService.analyze(file);
  }
}
