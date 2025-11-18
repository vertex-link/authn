/**
 * Authentication service
 * Session management handled by Oak sessions middleware
 */

import type { User, UserLogin, UserRegistration } from "@types/User.ts";
import type { AuthResponse } from "@types/Session.ts";
import { userRepository } from "@db/UserRepository.ts";
import { hashPassword, verifyPassword } from "@utils/crypto.ts";
import { validateRegistration } from "@utils/validation.ts";

export class AuthService {
  /**
   * Attempt user login
   * Returns user data on success, error on failure
   */
  async attemptLogin(credentials: UserLogin): Promise<AuthResponse> {
    try {
      // Normalize email
      const email = credentials.email.toLowerCase().trim();

      // Find user by email
      const user = await userRepository.findByEmail(email);

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
   */
  async attemptRegistration(data: UserRegistration): Promise<AuthResponse> {
    try {
      // Normalize email
      const email = data.email.toLowerCase().trim();
      const username = data.username.trim();

      // Validate registration data
      const validation = validateRegistration(username, email, data.password);
      if (!validation.valid) {
        return {
          success: false,
          authorized: false,
          message: validation.errors.join(", "),
        };
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          authorized: false,
          message: "User with this email already exists",
        };
      }

      // Check if username is taken
      const existingUsername = await userRepository.findByUsername(username);
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
        username,
        email,
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
   * Get user by ID (for session validation)
   */
  async getUserById(userId: string): Promise<User | null> {
    return await userRepository.findById(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
