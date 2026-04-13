import { useMutation } from '@tanstack/react-query';
import { analyzeImage } from '../services/api';
import { useAnalyzeStore } from '../store/useAnalyzeStore';
import { useAuthStore } from '../store/useAuthStore';
import { router } from 'expo-router';

/**
 * Hook que orquestra:
 * 1. Chama a API /analyze com a foto
 * 2. Atualiza o Zustand store com o resultado
 * 3. Navega para a tela de resultado
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
      setResult(data, photoUri);
      // setTimeout garante que o Zustand propagou o estado antes da navegação
      setTimeout(() => router.replace('/result'), 0);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    analyze: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
