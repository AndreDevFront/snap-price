import { AnalyzeResponseDto } from '../types/analyze';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

/**
 * Envia uma foto para o endpoint /analyze e retorna a avaliação de preço.
 */
export async function analyzeImage(photoUri: string): Promise<AnalyzeResponseDto> {
  const formData = new FormData();

  // React Native aceita objetos no formato { uri, name, type } no FormData
  formData.append('image', {
    uri: photoUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
    // Não definir Content-Type manualmente — o fetch coloca o boundary correto
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any)?.message ?? `Erro ${response.status}`);
  }

  return response.json() as Promise<AnalyzeResponseDto>;
}
