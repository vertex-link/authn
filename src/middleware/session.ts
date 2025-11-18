/**
 * Session middleware
 * Uses oak-sessions with Deno KV store
 */

import { Session } from "oak-sessions";
import type { Context } from "oak";

const SESSION_SECRET = Deno.env.get("SESSION_SECRET") || "change-this-secret-in-production";
const SESSION_MAX_AGE = parseInt(Deno.env.get("SESSION_MAX_AGE") || "86400000"); // 24 hours

// Custom KV session store for oak-sessions
class KvStore {
  private kv: Deno.Kv | null = null;

  async init() {
    if (!this.kv) {
      this.kv = await Deno.openKv();
    }
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    await this.init();
    const result = await this.kv!.get(["sessions", "oak", sessionId]);
    return result.value !== null;
  }

  async getSession(sessionId: string): Promise<unknown> {
    await this.init();
    const result = await this.kv!.get(["sessions", "oak", sessionId]);
    return result.value;
  }

  async createSession(sessionId: string, initialData: unknown): Promise<void> {
    await this.init();
    await this.kv!.set(["sessions", "oak", sessionId], initialData, {
      expireIn: SESSION_MAX_AGE,
    });
  }

  async persistSessionData(sessionId: string, sessionData: unknown): Promise<void> {
    await this.init();
    await this.kv!.set(["sessions", "oak", sessionId], sessionData, {
      expireIn: SESSION_MAX_AGE,
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.init();
    await this.kv!.delete(["sessions", "oak", sessionId]);
  }
}

const store = new KvStore();

export const sessionMiddleware = Session.initMiddleware(store, {
  cookieSetOptions: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    secure: Deno.env.get("ENVIRONMENT") === "production",
  },
  sessionCookieName: "authn_session",
});
