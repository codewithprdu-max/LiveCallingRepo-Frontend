import type {
  AuthResponse,
  Call,
  CallType,
  LiveSwitchConfig,
  TokenResponse,
  User
} from '../types';

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('liveswitch_jwt');
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('liveswitch_jwt', token);
    } else {
      localStorage.removeItem('liveswitch_jwt');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new Event('auth_unauthorized'));
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string):Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(username: string, email: string, displayName: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, displayName, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Users endpoint
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  // LiveSwitch config & tokens
  async getLiveSwitchConfig(): Promise<LiveSwitchConfig> {
    return this.request<LiveSwitchConfig>('/calls/config');
  }

  async getRegisterToken(deviceId: string, clientId: string, channelIds?: string[]): Promise<TokenResponse> {
    return this.request<TokenResponse>('/calls/token/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId, clientId, channelIds }),
    });
  }

  async getJoinToken(callId: string, deviceId: string, clientId: string): Promise<TokenResponse> {
    return this.request<TokenResponse>(`/calls/${callId}/token/join`, {
      method: 'POST',
      body: JSON.stringify({ deviceId, clientId }),
    });
  }

  // Call management
  async createCall(title: string, callType: CallType, participantUserIds: string[]): Promise<Call> {
    return this.request<Call>('/calls', {
      method: 'POST',
      body: JSON.stringify({ title, callType, participantUserIds }),
    });
  }

  async getCall(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}`);
  }

  async joinCall(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}/join`, {
      method: 'POST',
    });
  }

  async leaveCall(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}/leave`, {
      method: 'POST',
    });
  }

  async rejectCall(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}/reject`, {
      method: 'POST',
    });
  }

  async endCall(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}/end`, {
      method: 'POST',
    });
  }

  async getCallHistory(): Promise<Call[]> {
    return this.request<Call[]>('/calls/history');
  }
}

export const api = new ApiService();
