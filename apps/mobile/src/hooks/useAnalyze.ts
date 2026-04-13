import { useMutation } from '@tanstack/react-query';
import { analyzeImage } from '../services/api';
import { useAnalyzeStore } from '../store/useAnalyzeStore';
import { useAuthStore } from '../store/useAuthStore';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

/**
 * Hook que orquestra:
 * 1. Chama a API /analyze com a foto
 * 2. Atualiza o Zustand store com o resultado
 * 3. Navega para a tela de resultado
 *
 * Campos da resposta da API (/analyze):
 *   name, estimatedPrice, priceRange, confidence, platforms, tips
 * (diferentes dos campos do histórico: item_name, avg_price, etc.)
 */
export function useAnalyze() {
  const { setAnalyzing, setResult, setError } = useAnalyzeStore();
  const token = useAuthStore((state) => state.token);

  const mutation = useMutation({
    mutationFn: (photoUri: string) => analyzeImage(photoUri, token ?? undefined),
    onMutate: () => {
      setAnalyzing(true);
    },
    onSuccess: (data, photoUri) => {
      setAnalyzing(false);
      setResult(data, photoUri);

      const price = data.estimatedPrice ?? data.priceRange?.min ?? 0;
      Toast.show({
        type: 'success',
        text1: 'Item analisado com sucesso!',
        text2: `${data.name} — R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        visibilityTime: 3000,
      });

      // setTimeout garante que o Zustand propagou o estado antes da navegação
      setTimeout(() => router.replace('/result'), 0);
    },
    onError: (error: Error) => {
      setAnalyzing(false);
      setError(error.message);
      Toast.show({
        type: 'error',
        text1: 'Não foi possível analisar',
        text2: 'Tente novamente com melhor iluminação ou enquadramento',
        visibilityTime: 4000,
      });
    },
  });

  return {
    analyze: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
