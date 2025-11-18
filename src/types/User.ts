/**
 * Core User types for the authentication service
 */

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  isActive: boolean;
  roles: string[]; // e.g., ['user', 'admin']
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  theme?: "light" | "dark" | "auto";
}

// Type for user login credentials
export interface UserLogin {
  email: string;
  password: string;
}

// Type for user registration
export interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

// Type for user profile updates
export interface UserUpdate {
  username?: string;
  email?: string;
  preferences?: Partial<UserPreferences>;
}

// Public user data (without sensitive fields)
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

// User with household/workspace context (from prototype)
export interface UserHousehold extends PublicUser {
  isAdmin: boolean;
  isWatcher: boolean;
  isInvited?: boolean;
}

// Helper type to convert User to PublicUser
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    roles: user.roles,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
