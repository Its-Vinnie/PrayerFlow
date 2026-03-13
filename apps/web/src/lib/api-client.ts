const BASE_URL = '';

interface FetchOptions extends RequestInit {
  initData?: string;
}

async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { initData, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Sessions
  getSessions: (initData?: string) =>
    apiFetch<{ success: boolean; data: any[] }>('/api/sessions', { initData }),

  getSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}`, { initData }),

  createSession: (data: any, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
      initData,
    }),

  updateSession: (id: string, data: any, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      initData,
    }),

  deleteSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean }>(`/api/sessions/${id}`, {
      method: 'DELETE',
      initData,
    }),

  duplicateSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}/duplicate`, {
      method: 'POST',
      initData,
    }),

  startSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}/start`, {
      method: 'POST',
      initData,
    }),

  pauseSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}/pause`, {
      method: 'POST',
      initData,
    }),

  resumeSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}/resume`, {
      method: 'POST',
      initData,
    }),

  completeSession: (id: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${id}/complete`, {
      method: 'POST',
      initData,
    }),

  // Prayer Points
  createPoint: (sessionId: string, data: any, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/points`, {
      method: 'POST',
      body: JSON.stringify(data),
      initData,
    }),

  updatePoint: (id: string, data: any, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      initData,
    }),

  deletePoint: (id: string, initData?: string) =>
    apiFetch<{ success: boolean }>(`/api/points/${id}`, {
      method: 'DELETE',
      initData,
    }),

  reorderPoints: (sessionId: string, pointIds: string[], initData?: string) =>
    apiFetch<{ success: boolean }>(`/api/sessions/${sessionId}/points/reorder`, {
      method: 'POST',
      body: JSON.stringify({ pointIds }),
      initData,
    }),

  // Live actions
  sendNext: (sessionId: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'send-next' }),
      initData,
    }),

  sendNow: (sessionId: string, prayerPointId: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'send-now', pointId: prayerPointId }),
      initData,
    }),

  skipPoint: (sessionId: string, prayerPointId: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'skip', pointId: prayerPointId }),
      initData,
    }),

  sendAll: (sessionId: string, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'send-all' }),
      initData,
    }),

  bulkCreatePoints: (sessionId: string, points: Array<{ title: string; body: string }>, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/sessions/${sessionId}/points`, {
      method: 'POST',
      body: JSON.stringify({ points }),
      initData,
    }),

  // Groups
  getGroups: (initData?: string) =>
    apiFetch<{ success: boolean; data: any[] }>('/api/groups', { initData }),

  // Templates
  getTemplates: (initData?: string) =>
    apiFetch<{ success: boolean; data: any[] }>('/api/templates', { initData }),

  createTemplate: (data: { name: string; description?: string; sessionId?: string }, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
      initData,
    }),

  deleteTemplate: (id: string, initData?: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}`, {
      method: 'DELETE',
      initData,
    }),

  createFromTemplate: (templateId: string, data: any, initData?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/api/templates/${templateId}/use`, {
      method: 'POST',
      body: JSON.stringify(data),
      initData,
    }),

  // Logs
  getLogs: (params?: Record<string, string>, initData?: string) => {
    const searchParams = new URLSearchParams(params);
    return apiFetch<{ success: boolean; data: any }>(`/api/logs?${searchParams}`, { initData });
  },
};
