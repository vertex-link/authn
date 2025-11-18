/**
 * Session and authentication state types
 * Sessions are managed by Oak sessions middleware
 */

export interface SessionData {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  loginAttempts: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number; // timestamp
}

export interface AuthState {
  authorized: boolean;
  userId?: string;
  email?: string;
  roles?: string[];
}

export interface AuthResponse {
  success: boolean;
  authorized: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
  };
  message?: string;
  loggedInFromSession?: boolean;
}
