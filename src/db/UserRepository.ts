/**
 * User repository for Deno KV operations
 */

import type { User, UserRegistration, UserUpdate } from "@types/User.ts";
import { generateId, getKv, KV_KEYS } from "./kv.ts";

export class UserRepository {
  /**
   * Create a new user
   */
  async create(data: UserRegistration & { passwordHash: string }): Promise<User> {
    const kv = getKv();
    const id = generateId();
    const now = new Date();

    const user: User = {
      id,
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      emailVerified: false,
      isActive: true,
      roles: ["user"],
      createdAt: now,
      updatedAt: now,
    };

    // Use atomic operation to ensure uniqueness
    const result = await kv.atomic()
      // Check that email doesn't exist
      .check({ key: KV_KEYS.USER_BY_EMAIL(user.email), versionstamp: null })
      // Check that username doesn't exist
      .check({ key: KV_KEYS.USER_BY_USERNAME(user.username), versionstamp: null })
      // Create user
      .set(KV_KEYS.USER_BY_ID(id), user)
      // Create email index
      .set(KV_KEYS.USER_BY_EMAIL(user.email), id)
      // Create username index
      .set(KV_KEYS.USER_BY_USERNAME(user.username), id)
      .commit();

    if (!result.ok) {
      throw new Error("User with this email or username already exists");
    }

    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const kv = getKv();
    const result = await kv.get<User>(KV_KEYS.USER_BY_ID(id));
    return result.value;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const kv = getKv();

    // First get the user ID from the email index
    const idResult = await kv.get<string>(KV_KEYS.USER_BY_EMAIL(email.toLowerCase()));
    if (!idResult.value) {
      return null;
    }

    // Then get the user by ID
    return this.findById(idResult.value);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const kv = getKv();

    // First get the user ID from the username index
    const idResult = await kv.get<string>(KV_KEYS.USER_BY_USERNAME(username.toLowerCase()));
    if (!idResult.value) {
      return null;
    }

    // Then get the user by ID
    return this.findById(idResult.value);
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const kv = getKv();
    const result = await kv.get(KV_KEYS.USER_BY_USERNAME(username.toLowerCase()));
    return result.value === null;
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const kv = getKv();
    const result = await kv.get(KV_KEYS.USER_BY_EMAIL(email.toLowerCase()));
    return result.value === null;
  }

  /**
   * Update user
   */
  async update(id: string, data: UserUpdate): Promise<User | null> {
    const kv = getKv();

    // Get current user
    const currentUser = await this.findById(id);
    if (!currentUser) {
      return null;
    }

    const updatedUser: User = {
      ...currentUser,
      ...data,
      updatedAt: new Date(),
    };

    // Handle username or email change
    const atomic = kv.atomic();

    // If username changed, update index
    if (data.username && data.username !== currentUser.username) {
      // Check new username is available
      atomic.check({ key: KV_KEYS.USER_BY_USERNAME(data.username), versionstamp: null });
      // Delete old username index
      atomic.delete(KV_KEYS.USER_BY_USERNAME(currentUser.username));
      // Create new username index
      atomic.set(KV_KEYS.USER_BY_USERNAME(data.username), id);
    }

    // If email changed, update index
    if (data.email && data.email !== currentUser.email) {
      // Check new email is available
      atomic.check({ key: KV_KEYS.USER_BY_EMAIL(data.email), versionstamp: null });
      // Delete old email index
      atomic.delete(KV_KEYS.USER_BY_EMAIL(currentUser.email));
      // Create new email index
      atomic.set(KV_KEYS.USER_BY_EMAIL(data.email), id);
    }

    // Update user
    atomic.set(KV_KEYS.USER_BY_ID(id), updatedUser);

    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Failed to update user - email or username already exists");
    }

    return updatedUser;
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    const kv = getKv();
    const user = await this.findById(id);
    if (!user) {
      return;
    }

    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    await kv.set(KV_KEYS.USER_BY_ID(id), user);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const kv = getKv();
    const user = await this.findById(id);
    if (!user) {
      return false;
    }

    await kv.atomic()
      .delete(KV_KEYS.USER_BY_ID(id))
      .delete(KV_KEYS.USER_BY_EMAIL(user.email))
      .delete(KV_KEYS.USER_BY_USERNAME(user.username))
      .commit();

    return true;
  }

  /**
   * List all users (with pagination)
   */
  async list(limit = 50, cursor?: string): Promise<{ users: User[]; cursor?: string }> {
    const kv = getKv();
    const users: User[] = [];

    const iter = kv.list<User>({ prefix: KV_KEYS.USERS }, { limit, cursor });

    for await (const entry of iter) {
      users.push(entry.value);
    }

    return {
      users,
      cursor: iter.cursor,
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
