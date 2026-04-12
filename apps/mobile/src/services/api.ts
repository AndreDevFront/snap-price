import Constants from 'expo-constants';

// Detecta automaticamente o IP do servidor de desenvolvimento
// Para builds de produção, usa EXPO_PUBLIC_API_URL do .env
function resolveBaseUrl(): string {
  // 1. Variável de ambiente explicitamente definida (produção ou override manual)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl !== 'http://localhost:3000') {
    return envUrl.startsWith('http') ? envUrl : `http://${envUrl}`;
  }

  // 2. Em desenvolvimento: pega o IP do servidor Expo e troca a porta para 3000
  // Funciona automaticamente no emulador E no celular físico sem mudar o .env
  try {
    const debuggerHost =
      Constants.expoConfig?.hostUri ||
      (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
      (Constants as any)?.manifest?.debuggerHost;

    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:3000`;
    }
  } catch (_) {}

  // 3. Fallback para emulador Android
  return 'http://10.0.2.2:3000';
}

const BASE_URL = resolveBaseUrl();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message =
      typeof err.detail === 'string'
        ? err.detail
        : Array.isArray(err.detail)
        ? err.detail.map((e: any) => e.msg).join(', ')
        : err.message ?? 'Erro desconhecido';
    throw new Error(message);
  }
  return res.json();
}

export async function analyzeImage(photoUri: string, token?: string) {
  const form = new FormData();
  form.append('file', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  const res = await fetch(`${BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Falha na análise');
  return res.json();
}

// Tipo espelhando exatamente o UserResponse do backend
export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
}

export const authApi = {
  register: (body: { email: string; password: string; name?: string }) =>
    request<{ access_token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: (token: string) =>
    request<UserProfile>('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export interface AnalysisItem {
  id: string;
  item_name: string;
  estimated_min: number;
  estimated_max: number;
  avg_price: number;
  confidence: number;
  platforms: { name: string; price: number; url: string }[];
  tips: string[];
  image_url?: string | null;
  created_at: string;
}

export interface HistoryStats {
  total: number;
  avg_confidence: number;
  total_value: number;
}

export interface HistoryResponse {
  items: AnalysisItem[];
  stats: HistoryStats;
}

export const historyApi = {
  list: (token: string) =>
    request<HistoryResponse>('/api/v1/history', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getById: (token: string, id: string) =>
    request<AnalysisItem>(`/api/v1/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  remove: (token: string, id: string) =>
    request(`/api/v1/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
