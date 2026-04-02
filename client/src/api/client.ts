const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ ok: boolean; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ username: string }>('/auth/me'),
  },

  exercises: {
    list: () => request<any[]>('/exercises'),
    get: (id: number) => request<any>(`/exercises/${id}`),
    scrape: (url: string) =>
      request<any>('/exercises/scrape', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/exercises/${id}`, { method: 'DELETE' }),
    history: (id: number) => request<any[]>(`/exercises/${id}/history`),
  },

  workouts: {
    list: () => request<any[]>('/workouts'),
    get: (id: number) => request<any>(`/workouts/${id}`),
    create: (data: { name: string }) =>
      request<any>('/workouts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { name?: string }) =>
      request<any>(`/workouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/workouts/${id}`, { method: 'DELETE' }),
    addExercise: (workoutId: number, data: { exerciseId: number; sets?: number; reps?: string }) =>
      request<any>(`/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateExercise: (workoutId: number, weId: number, data: { sets?: number; reps?: string; notes?: string }) =>
      request<any>(`/workouts/${workoutId}/exercises/${weId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    removeExercise: (workoutId: number, weId: number) =>
      request<{ ok: boolean }>(`/workouts/${workoutId}/exercises/${weId}`, { method: 'DELETE' }),
    reorder: (workoutId: number, order: { id: number; sortOrder: number }[]) =>
      request<{ ok: boolean }>(`/workouts/${workoutId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
    duplicate: (workoutId: number) =>
      request<any>(`/workouts/${workoutId}/duplicate`, { method: 'POST' }),
  },

  sessions: {
    list: () => request<any[]>('/sessions'),
    get: (id: number) => request<any>(`/sessions/${id}`),
    create: (workoutId: number) =>
      request<any>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ workoutId }),
      }),
    toggleExercise: (sessionId: number, seId: number) =>
      request<any>(`/sessions/${sessionId}/exercises/${seId}`, { method: 'PUT' }),
    complete: (sessionId: number) =>
      request<any>(`/sessions/${sessionId}/complete`, { method: 'PUT' }),
    pause: (sessionId: number) =>
      request<any>(`/sessions/${sessionId}/pause`, { method: 'PUT' }),
    resume: (sessionId: number) =>
      request<any>(`/sessions/${sessionId}/resume`, { method: 'PUT' }),
    delete: (sessionId: number) =>
      request<{ ok: boolean }>(`/sessions/${sessionId}`, { method: 'DELETE' }),
    stats: () => request<any>('/sessions/stats/overview'),
  },

  schedules: {
    list: (workoutId?: number) =>
      request<any[]>(workoutId ? `/schedules?workoutId=${workoutId}` : '/schedules'),
    upcoming: () => request<any[]>('/schedules/upcoming'),
    create: (data: { workoutId: number; type: string; dayOfWeek?: number; specificDate?: string }) =>
      request<any>('/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/schedules/${id}`, { method: 'DELETE' }),
  },
};
