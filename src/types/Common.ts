/**
 * Common types and interfaces
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  type: string;
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Invite {
  id: string;
  email: string;
  token: string;
  createdBy: string; // userId
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: string; // userId
}

export interface InviteCreate {
  email: string;
  createdBy: string;
  expiresInDays?: number; // defaults to 7
}
