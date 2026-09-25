const API_URL = import.meta.env.VITE_API_URL || '';

export interface ApiError {
  error: string;
  details?: string[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nova_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const rawText = await res.text();
    let data: any = {};
    
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { error: rawText || `Server returned status ${res.status}` };
    }

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        localStorage.removeItem('nova_jwt');
        localStorage.removeItem('nova_user');
      }
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request<any>('/api/auth/me'),
    demoLogin: () => request<any>('/api/auth/demo', { method: 'POST' }),
  },
  profile: {
    get: () => request<any>('/api/profile'),
    update: (body: any) => request<any>('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
    onboarding: (body: any) => request<any>('/api/profile/onboarding', { method: 'POST', body: JSON.stringify(body) }),
    reset: (confirmText: string) => request<any>('/api/profile/reset', { method: 'POST', body: JSON.stringify({ confirmText }) }),
  },
  plan: {
    get: () => request<any>('/api/plan'),
    generate: () => request<any>('/api/plan/generate', { method: 'POST' }),
  },
  tasks: {
    start: (id: string) => request<any>(`/api/tasks/${id}/start`, { method: 'POST' }),
    complete: (id: string) => request<any>(`/api/tasks/${id}/complete`, { method: 'POST' }),
    skip: (id: string) => request<any>(`/api/tasks/${id}/skip`, { method: 'POST' }),
    feedback: (
      id: string,
      body: {
        difficultyFeedback: 'Too Difficult' | 'Just Right' | 'Too Easy';
        helpfulness: 'Yes' | 'Somewhat' | 'No';
        requestedChange: 'Easier' | 'Harder' | 'Shorter' | 'More examples' | 'More explanation';
        comment?: string;
      }
    ) => request<any>(`/api/tasks/${id}/feedback`, { method: 'POST', body: JSON.stringify(body) }),
  },
  learn: {
    get: () => request<any>('/api/learned-preferences'),
  },
  ai: {
    coach: (message: string, taskId?: string) =>
      request<any>('/api/ai/coach', { method: 'POST', body: JSON.stringify({ message, taskId }) }),
    explain: (taskId: string) =>
      request<any>('/api/ai/explain', { method: 'POST', body: JSON.stringify({ taskId }) }),
    applyCoachAction: (actionType: string, changes?: any) =>
      request<any>('/api/ai/coach/apply', { method: 'POST', body: JSON.stringify({ actionType, changes }) }),
  },
};
