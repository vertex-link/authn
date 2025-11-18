/**
 * Session repository for Deno KV operations
 */

import type { Session } from "@types/Session.ts";
import { generateId, getKv, KV_KEYS } from "./kv.ts";

export class SessionRepository {
  /**
   * Create a new session
   */
  async create(
    userId: string,
    email: string,
    expiresInMs: number,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Session> {
    const kv = getKv();
    const id = generateId();
    const now = new Date();

    const session: Session = {
      id,
      userId,
      email,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiresInMs),
      lastActivityAt: now,
      ...metadata,
    };

    await kv.atomic()
      .set(KV_KEYS.SESSION_BY_ID(id), session)
      .set(KV_KEYS.SESSION_BY_USER_ID(userId, id), session)
      .commit();

    return session;
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<Session | null> {
    const kv = getKv();
    const result = await kv.get<Session>(KV_KEYS.SESSION_BY_ID(id));

    if (!result.value) {
      return null;
    }

    // Check if session is expired
    if (new Date() > new Date(result.value.expiresAt)) {
      await this.delete(id);
      return null;
    }

    return result.value;
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const kv = getKv();
    const sessions: Session[] = [];

    const iter = kv.list<Session>({ prefix: KV_KEYS.SESSIONS_BY_USER(userId) });

    for await (const entry of iter) {
      // Filter out expired sessions
      if (new Date() <= new Date(entry.value.expiresAt)) {
        sessions.push(entry.value);
      } else {
        // Clean up expired session
        await this.delete(entry.value.id);
      }
    }

    return sessions;
  }

  /**
   * Update session activity
   */
  async updateActivity(id: string): Promise<Session | null> {
    const kv = getKv();
    const session = await this.findById(id);

    if (!session) {
      return null;
    }

    session.lastActivityAt = new Date();

    await kv.atomic()
      .set(KV_KEYS.SESSION_BY_ID(id), session)
      .set(KV_KEYS.SESSION_BY_USER_ID(session.userId, id), session)
      .commit();

    return session;
  }

  /**
   * Extend session expiration
   */
  async extend(id: string, expiresInMs: number): Promise<Session | null> {
    const kv = getKv();
    const session = await this.findById(id);

    if (!session) {
      return null;
    }

    const now = new Date();
    session.expiresAt = new Date(now.getTime() + expiresInMs);
    session.lastActivityAt = now;

    await kv.atomic()
      .set(KV_KEYS.SESSION_BY_ID(id), session)
      .set(KV_KEYS.SESSION_BY_USER_ID(session.userId, id), session)
      .commit();

    return session;
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    const kv = getKv();
    const session = await kv.get<Session>(KV_KEYS.SESSION_BY_ID(id));

    if (!session.value) {
      return false;
    }

    await kv.atomic()
      .delete(KV_KEYS.SESSION_BY_ID(id))
      .delete(KV_KEYS.SESSION_BY_USER_ID(session.value.userId, id))
      .commit();

    return true;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const kv = getKv();
    const sessions = await this.findByUserId(userId);

    for (const session of sessions) {
      await this.delete(session.id);
    }

    return sessions.length;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    const kv = getKv();
    const now = new Date();
    let count = 0;

    const iter = kv.list<Session>({ prefix: KV_KEYS.SESSIONS });

    for await (const entry of iter) {
      if (now > new Date(entry.value.expiresAt)) {
        await this.delete(entry.value.id);
        count++;
      }
    }

    return count;
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository();
