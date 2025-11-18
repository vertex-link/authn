/**
 * Session and authentication state types
 */

export interface Session {
  id: string; // Session ID
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: Date;
}

export interface SessionData {
  userId?: string;
  email?: string;
  loginAttempts?: number;
  flash?: {
    type: "success" | "error" | "info";
    message: string;
  };
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

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
}
