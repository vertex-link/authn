/**
 * Session middleware
 * Uses oak-sessions with Deno KV store (singleton connection)
 */

import { Session } from "oak-sessions";
import { config } from "../config.ts";
import { getKv } from "@db/kv.ts";

/**
 * Custom KV session store for oak-sessions
 * Uses the singleton KV connection instead of creating a separate one
 */
class KvStore {
  async sessionExists(sessionId: string): Promise<boolean> {
    const kv = getKv();
    const result = await kv.get(["sessions", "oak", sessionId]);
    return result.value !== null;
  }

  async getSession(sessionId: string): Promise<unknown> {
    const kv = getKv();
    const result = await kv.get(["sessions", "oak", sessionId]);
    return result.value;
  }

  async createSession(sessionId: string, initialData: unknown): Promise<void> {
    const kv = getKv();
    await kv.set(["sessions", "oak", sessionId], initialData, {
      expireIn: config.sessionMaxAge,
    });
  }

  async persistSessionData(sessionId: string, sessionData: unknown): Promise<void> {
    const kv = getKv();
    await kv.set(["sessions", "oak", sessionId], sessionData, {
      expireIn: config.sessionMaxAge,
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const kv = getKv();
    await kv.delete(["sessions", "oak", sessionId]);
  }
}

const store = new KvStore();

export const sessionMiddleware = Session.initMiddleware(store, {
  cookieSetOptions: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: config.sessionMaxAge,
    secure: config.environment === "production",
  },
  sessionCookieName: "authn_session",
});
