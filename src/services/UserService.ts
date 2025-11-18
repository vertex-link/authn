/**
 * User management service
 */

import type { User, UserUpdate, PublicUser } from "@types/User.ts";
import { toPublicUser } from "@types/User.ts";
import { userRepository } from "@db/UserRepository.ts";
import { hashPassword } from "@utils/crypto.ts";
import { isValidEmail, isValidUsername } from "@utils/validation.ts";

export class UserService {
  /**
   * Get user by ID (returns public data only)
   */
  async getUser(id: string): Promise<PublicUser | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      return null;
    }
    return toPublicUser(user);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<PublicUser | null> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return toPublicUser(user);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<PublicUser | null> {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      return null;
    }
    return toPublicUser(user);
  }

  /**
   * Check if username is available
   * From prototype's isUsernameAvail function
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    return await userRepository.isUsernameAvailable(username);
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    return await userRepository.isEmailAvailable(email);
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, data: UserUpdate): Promise<PublicUser | null> {
    // Validate data
    if (data.username && !isValidUsername(data.username)) {
      throw new Error("Invalid username format");
    }

    if (data.email && !isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    const user = await userRepository.update(id, data);
    if (!user) {
      return null;
    }

    return toPublicUser(user);
  }

  /**
   * Change user password
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await userRepository.findById(id);
    if (!user) {
      return false;
    }

    // Verify current password
    const { verifyPassword } = await import("@utils/crypto.ts");
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password using repository
    return await userRepository.updatePassword(id, newHash);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<boolean> {
    return await userRepository.updateActiveStatus(id, false);
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(id: string): Promise<boolean> {
    return await userRepository.updateActiveStatus(id, true);
  }

  /**
   * Delete user account
   */
  async deleteUser(id: string): Promise<boolean> {
    return await userRepository.delete(id);
  }

  /**
   * List all users (with pagination)
   */
  async listUsers(limit = 50, cursor?: string): Promise<{
    users: PublicUser[];
    cursor?: string;
  }> {
    const result = await userRepository.list(limit, cursor);
    return {
      users: result.users.map(toPublicUser),
      cursor: result.cursor,
    };
  }

  /**
   * Add role to user
   */
  async addRole(id: string, role: string): Promise<boolean> {
    return await userRepository.addRole(id, role);
  }

  /**
   * Remove role from user
   */
  async removeRole(id: string, role: string): Promise<boolean> {
    return await userRepository.removeRole(id, role);
  }
}

// Export singleton instance
export const userService = new UserService();
