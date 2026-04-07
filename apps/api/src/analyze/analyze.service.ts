import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { AnalyzeResponseDto, PlatformPrice } from './dto/analyze-response.dto';

@Injectable()
export class AnalyzeService {
  constructor(private readonly openai: OpenAIService) {}

  async analyze(file: Express.Multer.File): Promise<AnalyzeResponseDto> {
    // Se OPENAI_API_KEY não estiver configurada, retorna mock para dev
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-key-here') {
      return this.mockResponse();
    }

    try {
      const result = await this.openai.analyzeImage(file.buffer, file.mimetype);
      return result;
    } catch {
      throw new ServiceUnavailableException(
        'Falha ao processar imagem com IA. Tente novamente.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Mock — usado em desenvolvimento sem chave OpenAI
  // ---------------------------------------------------------------------------
  private mockResponse(): AnalyzeResponseDto {
    const items = [
      {
        name: 'iPhone 13 Pro 128GB',
        category: 'Smartphones',
        condition: 'Bom estado',
        estimatedPrice: 2800,
        priceRange: { min: 2400, max: 3200 },
        confidence: 92,
        platforms: [
          { name: 'Mercado Livre', price: 2950, url: 'https://www.mercadolivre.com.br' },
          { name: 'OLX', price: 2700, url: 'https://www.olx.com.br' },
          { name: 'Facebook', price: 2600, url: 'https://www.facebook.com/marketplace' },
          { name: 'eBay', price: 3100, url: 'https://www.ebay.com' },
        ],
        tips: [
          'Destaque o estado de conservação nas fotos',
          'Informe se possui nota fiscal e acessórios originais',
          'Publique na parte da manhã para maior visibilidade',
        ],
      },
      {
        name: 'Tênis Nike Air Max 90',
        category: 'Calçados',
        condition: 'Usado',
        estimatedPrice: 380,
        priceRange: { min: 280, max: 480 },
        confidence: 85,
        platforms: [
          { name: 'Mercado Livre', price: 420, url: 'https://www.mercadolivre.com.br' },
          { name: 'OLX', price: 360, url: 'https://www.olx.com.br' },
          { name: 'Facebook', price: 340, url: 'https://www.facebook.com/marketplace' },
          { name: 'eBay', price: 390, url: 'https://www.ebay.com' },
        ],
        tips: [
          'Fotografe a sola para mostrar o desgaste real',
          'Informe o tamanho e o modelo exato',
          'Inclua fotos do interior do tênis',
        ],
      },
    ];

    return items[Math.floor(Math.random() * items.length)];
  }
}
