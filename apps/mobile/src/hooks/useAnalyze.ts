import { useMutation } from '@tanstack/react-query';
import { analyzeImage } from '../services/api';
import { useAnalyzeStore } from '../store/useAnalyzeStore';
import { router } from 'expo-router';

/**
 * Hook que orquestra:
 * 1. Chama a API /analyze com a foto
 * 2. Atualiza o Zustand store com o resultado
 * 3. Navega para a tela de resultado
 */
export function useAnalyze() {
  const { setAnalyzing, setResult, setError } = useAnalyzeStore();

  const mutation = useMutation({
    mutationFn: analyzeImage,
    onMutate: () => {
      setAnalyzing(true);
    },
    onSuccess: (data, photoUri) => {
      setResult(data, photoUri);
      router.push('/result');
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
