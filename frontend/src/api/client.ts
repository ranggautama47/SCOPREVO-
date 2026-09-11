import type {
  AuthResponse,
  OverviewData,
  Project,
  RevisionBatchSummary,
  RevisionBatchDetail,
  ShareBatchResponse,
  PortalBatchResponse,
  ApiErrorResponse,
  ProjectDocument,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'scoprevo_jwt';

// Module-level guard: prevents infinite redirect loops if /login itself ever returns 401.
// window.location.href triggers an immediate navigation/reload, so this is belt-and-suspenders.
let _isRedirectingFor401 = false;

function handleUnauthorized(): void {
  // Always clear the (now invalid) token.
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors (e.g., disabled storage)
  }

  const path = window.location.pathname;
  const onAuthPage = path.startsWith('/login') || path.startsWith('/register');

  if (_isRedirectingFor401 || onAuthPage) return;

  _isRedirectingFor401 = true;
  // Hard redirect (not router.push) so all in-memory state is discarded cleanly.
  window.location.href = '/login';
}

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: any;

  constructor(code: string, message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    // Network-level failure (offline, DNS, CORS, etc.) — surface as a typed error.
    throw new ApiError('NETWORK_ERROR', 'Unable to reach the server.', 0);
  }

  // Global 401 interceptor: clear token + hard redirect to /login.
  if (response.status === 401) {
    handleUnauthorized();
    // Continue to parse and throw so the caller still sees a structured error.
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
    throw new ApiError(code, message, response.status, details);
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
    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> =>
      request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendVerification: (): Promise<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }> =>
      request<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }>('/auth/verification-email', {
        method: 'POST',
      }),
    verifyEmail: (token: string): Promise<{ message: string }> =>
      request<{ message: string }>(`/auth/verify-email/${token}`, {
        method: 'GET',
      }),
    me: (): Promise<{ account: { id: string; name: string; email: string; createdAt: string; emailVerified: boolean } }> =>
      request<{ account: { id: string; name: string; email: string; createdAt: string; emailVerified: boolean } }>('/auth/me', {
        method: 'GET',
      }),
    requestEmailChange: (data: { newEmail: string; currentPassword: string }): Promise<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }> =>
      request<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }>('/auth/email-change/request', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyEmailChange: (token: string): Promise<{ message: string }> =>
      request<{ message: string }>(`/auth/verify-email-change/${token}`, {
        method: 'GET',
      }),
    forgotPassword: (data: { email: string }): Promise<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }> =>
      request<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data: { token: string; newPassword: string }): Promise<{ message: string }> =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
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
    // PATCH /api/projects/:id
    update: (id: string, data: {
      name?: string;
      clientName?: string;
      totalAllowedRevisions?: number;
      status?: 'ACTIVE' | 'COMPLETED';
    }) =>
      request<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    // DELETE /api/projects/:id (Backend returns 204 No Content)
    remove: (id: string) =>
      request<void>(`/projects/${id}`, {
        method: 'DELETE',
      }),
  },
  batches: {
    getDetail: (id: string): Promise<{ batch: RevisionBatchDetail }> =>
      request<{ batch: RevisionBatchDetail }>(`/batches/${id}`, {
        method: 'GET',
      }),
    share: (id: string): Promise<ShareBatchResponse> =>
      request<ShareBatchResponse>(`/batches/${id}/share`, {
        method: 'PATCH',
      }),
  },
  portal: {
    getByToken: (token: string): Promise<PortalBatchResponse> =>
      request<PortalBatchResponse>(`/portal/${token}`, {
        method: 'GET',
      }),
    confirm: (token: string): Promise<void> =>
      request<void>(`/portal/${token}/confirm`, {
        method: 'POST',
      }),
  },
  documents: {
    list: (projectId: string): Promise<{ documents: ProjectDocument[] }> =>
      request<{ documents: ProjectDocument[] }>(`/projects/${projectId}/documents`, {
        method: 'GET',
      }),
    upload: (projectId: string, body: FormData): Promise<{ document: ProjectDocument }> =>
      request<{ document: ProjectDocument }>(`/projects/${projectId}/documents`, {
        method: 'POST',
        body,
      }),
    remove: (projectId: string, documentId: string): Promise<void> =>
      request<void>(`/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      }),
  },
};
