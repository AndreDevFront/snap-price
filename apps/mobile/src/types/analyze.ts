export interface PlatformPrice {
  name: string;
  price: number;
  url: string;
}

export interface AnalyzeResponseDto {
  name: string;
  category: string;
  condition: string;
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  platforms: PlatformPrice[];
  tips: string[];
}
