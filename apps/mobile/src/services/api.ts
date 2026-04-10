// Garante que a URL sempre tem protocolo http://
function buildBaseUrl(url: string): string {
  if (!url) return 'http://localhost:3000';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://${url}`;
}

const BASE_URL = buildBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? '');

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
  platforms: any[];
  tips: string[];
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
  remove: (token: string, id: string) =>
    request(`/api/v1/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
