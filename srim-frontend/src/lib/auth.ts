export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token?: string
  access?: string
  access_token?: string
  refresh?: string
  refresh_token?: string
  detail?: string
  message?: string
}

const TOKEN_KEY = "access_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

export function logout(): void {
  clearAuthToken();
  window.location.href = "/login";
}

