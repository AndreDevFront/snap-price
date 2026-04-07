import { create } from 'zustand';
import { AnalyzeResponseDto } from '../types/analyze';

interface HistoryItem extends AnalyzeResponseDto {
  id: string;
  photoUri: string;
  analyzedAt: string; // ISO date string
}

interface AnalyzeState {
  // Estado da análise em andamento
  isAnalyzing: boolean;
  currentPhoto: string | null;
  currentResult: AnalyzeResponseDto | null;
  error: string | null;

  // Histórico local (Sprint 3: migrar para banco)
  history: HistoryItem[];

  // Actions
  setCurrentPhoto: (uri: string) => void;
  setAnalyzing: (value: boolean) => void;
  setResult: (result: AnalyzeResponseDto, photoUri: string) => void;
  setError: (msg: string | null) => void;
  clearCurrent: () => void;
  removeFromHistory: (id: string) => void;
}

export const useAnalyzeStore = create<AnalyzeState>((set) => ({
  isAnalyzing: false,
  currentPhoto: null,
  currentResult: null,
  error: null,
  history: [],

  setCurrentPhoto: (uri) =>
    set({ currentPhoto: uri, error: null }),

  setAnalyzing: (value) =>
    set({ isAnalyzing: value }),

  setResult: (result, photoUri) =>
    set((state) => ({
      currentResult: result,
      isAnalyzing: false,
      error: null,
      history: [
        {
          ...result,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          photoUri,
          analyzedAt: new Date().toISOString(),
        },
        ...state.history,
      ],
    })),

  setError: (msg) =>
    set({ error: msg, isAnalyzing: false }),

  clearCurrent: () =>
    set({ currentPhoto: null, currentResult: null, error: null }),

  removeFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),
}));
