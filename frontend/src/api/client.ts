import type {
  AuthResponse,
  OverviewData,
  Project,
  RevisionBatchSummary,
  RevisionBatchDetail,
  ApiErrorResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

class ApiError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('scoprevo_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('scoprevo_jwt');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }

  let data: any;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorBody: ApiErrorResponse = data;
    const code = errorBody.error?.code || 'UNKNOWN_ERROR';
    const message = errorBody.error?.message || response.statusText || 'An error occurred';
    const details = errorBody.error?.details;
    throw new ApiError(code, message, details);
  }

  return data as T;
}

export const apiClient = {
  auth: {
    register: (data: { name: string; email: string; password: string }): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  overview: {
    get: (): Promise<OverviewData> =>
      request<OverviewData>('/overview', {
        method: 'GET',
      }),
  },
  projects: {
    list: (): Promise<{ projects: Project[] }> =>
      request<{ projects: Project[] }>('/projects', {
        method: 'GET',
      }),
    create: (data: { name: string; clientName: string; totalAllowedRevisions?: number }): Promise<{ project: Project }> =>
      request<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDetail: (id: string): Promise<{ project: Project }> =>
      request<{ project: Project }>(`/projects/${id}`, {
        method: 'GET',
      }),
    getBatches: (id: string): Promise<{ batches: RevisionBatchSummary[] }> =>
      request<{ batches: RevisionBatchSummary[] }>(`/projects/${id}/batches`, {
        method: 'GET',
      }),
    submitRevision: (id: string, rawInput: string): Promise<{ batch: RevisionBatchDetail }> =>
      request<{ batch: RevisionBatchDetail }>(`/projects/${id}/revisions`, {
        method: 'POST',
        body: JSON.stringify({ rawInput }),
      }),
  },
  batches: {
    getDetail: (id: string): Promise<{ batch: RevisionBatchDetail }> =>
      request<{ batch: RevisionBatchDetail }>(`/batches/${id}`, {
        method: 'GET',
      }),
  },
};

export { ApiError };
