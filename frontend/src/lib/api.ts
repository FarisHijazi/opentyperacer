const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const stored = localStorage.getItem('typeracer-auth');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          headers['Authorization'] = `Bearer ${state.token}`;
        }
      } catch {}
    }

    return headers;
  }

  async get<T>(path: string): Promise<{ data: T }> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return { data: await response.json() };
  }

  async post<T>(path: string, body?: unknown): Promise<{ data: T }> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return { data: await response.json() };
  }

  async delete<T>(path: string): Promise<{ data: T }> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return { data: await response.json() };
  }
}

export const api = new ApiClient(API_URL);
