/**
 * Authentication service
 * Ported from studio-prototype with enhancements
 */

import type { User, UserLogin, UserRegistration } from "@types/User.ts";
import type { AuthResponse, Session } from "@types/Session.ts";
import { userRepository } from "@db/UserRepository.ts";
import { sessionRepository } from "@db/SessionRepository.ts";
import { hashPassword, verifyPassword } from "@utils/crypto.ts";
import { validateRegistration } from "@utils/validation.ts";

const SESSION_MAX_AGE = parseInt(Deno.env.get("SESSION_MAX_AGE") || "86400000"); // 24 hours

export class AuthService {
  /**
   * Attempt user login
   * Based on prototype's attemptLogin function
   */
  async attemptLogin(
    credentials: UserLogin,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(credentials.email);

      if (!user) {
        return {
          success: false,
          authorized: false,
          message: "Invalid email or password",
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          authorized: false,
          message: "Account is deactivated",
        };
      }

      // Verify password
      const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);

      if (!isValidPassword) {
        return {
          success: false,
          authorized: false,
          message: "Invalid email or password",
        };
      }

      // Update last login time
      await userRepository.updateLastLogin(user.id);

      // Create session
      const session = await sessionRepository.create(
        user.id,
        user.email,
        SESSION_MAX_AGE,
        metadata,
      );

      return {
        success: true,
        authorized: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        authorized: false,
        message: "An error occurred during login",
      };
    }
  }

  /**
   * Attempt user registration
   * Based on prototype's attemptRegistration function
   */
  async attemptRegistration(data: UserRegistration): Promise<AuthResponse> {
    try {
      // Validate registration data
      const validation = validateRegistration(data.username, data.email, data.password);
      if (!validation.valid) {
        return {
          success: false,
          authorized: false,
          message: validation.errors.join(", "),
        };
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          authorized: false,
          message: "User with this email already exists",
        };
      }

      // Check if username is taken
      const existingUsername = await userRepository.findByUsername(data.username);
      if (existingUsername) {
        return {
          success: false,
          authorized: false,
          message: "Username is already taken",
        };
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const user = await userRepository.create({
        username: data.username,
        email: data.email,
        password: data.password, // not used, just for type compatibility
        passwordHash,
      });

      return {
        success: true,
        authorized: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        message: "Registration successful",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        authorized: false,
        message: error instanceof Error ? error.message : "An error occurred during registration",
      };
    }
  }

  /**
   * Check if user is authenticated via session
   */
  async isUserAuthenticated(sessionId?: string): Promise<boolean> {
    if (!sessionId) {
      return false;
    }

    const session = await sessionRepository.findById(sessionId);
    return session !== null;
  }

  /**
   * Get user from session
   */
  async getUserFromSession(sessionId: string): Promise<User | null> {
    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    return await userRepository.findById(session.userId);
  }

  /**
   * Logout user (delete session)
   */
  async logout(sessionId: string): Promise<boolean> {
    return await sessionRepository.delete(sessionId);
  }

  /**
   * Logout all user sessions
   */
  async logoutAll(userId: string): Promise<number> {
    return await sessionRepository.deleteByUserId(userId);
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string): Promise<Session | null> {
    return await sessionRepository.extend(sessionId, SESSION_MAX_AGE);
  }
}

// Export singleton instance
export const authService = new AuthService();
