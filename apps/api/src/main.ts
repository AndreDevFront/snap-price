import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — permite o app Expo local e em produção
  app.enableCors({
    origin: (process.env.ALLOWED_ORIGINS ?? '').split(','),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixo global
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`🚀 SnapPrice API running on http://localhost:${port}/api/v1`);
}

bootstrap();
