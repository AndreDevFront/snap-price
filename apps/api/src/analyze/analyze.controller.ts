import {
  Controller, Post, UseInterceptors, UploadedFile,
  BadRequestException, Request, UseGuards, Optional,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

// Guard opcional — não bloqueia, só injeta userId se houver token válido
class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || null;
  }
}

@Controller('api/v1/analyze')
export class AnalyzeController {
  constructor(private analyzeService: AnalyzeService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens são permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async analyze(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Imagem obrigatória');
    return this.analyzeService.analyze(file.buffer, file.mimetype, req.user?.userId);
  }
}
