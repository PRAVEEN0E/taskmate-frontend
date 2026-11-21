export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let csrf = '';
export function setCsrf(token: string) {
  csrf = token;
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': csrf } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach your workspace. Check your connection and try again.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    if (response.status === 401 && path !== '/auth/login')
      window.dispatchEvent(new Event('taskmate:expired'));
    throw new ApiError(
      response.status,
      body?.error?.message ?? 'The request failed. Please try again.',
    );
  }
  if (response.status === 204) return undefined as T;
  return ((await response.json()) as { data: T }).data;
}
