/**
 * Deno KV database connection and utilities
 */

let kv: Deno.Kv | null = null;

/**
 * Initialize the Deno KV database
 */
export async function initKv(path?: string): Promise<Deno.Kv> {
  if (kv) {
    return kv;
  }

  kv = await Deno.openKv(path);
  console.log(`✓ Deno KV database initialized${path ? ` at ${path}` : ""}`);
  return kv;
}

/**
 * Get the KV database instance
 */
export function getKv(): Deno.Kv {
  if (!kv) {
    throw new Error("KV database not initialized. Call initKv() first.");
  }
  return kv;
}

/**
 * Close the KV database connection
 */
export async function closeKv(): Promise<void> {
  if (kv) {
    kv.close();
    kv = null;
    console.log("✓ Deno KV database closed");
  }
}

/**
 * Key prefixes for different data types
 * This creates a clear namespace structure for the KV store
 * Note: Sessions are managed by Oak sessions middleware
 */
export const KV_KEYS = {
  // User keys
  USERS: ["users"],
  USER_BY_ID: (id: string) => ["users", id],
  USER_BY_EMAIL: (email: string) => ["users_by_email", email.toLowerCase()],
  USER_BY_USERNAME: (username: string) => ["users_by_username", username.toLowerCase()],

  // Author keys
  AUTHORS: ["authors"],
  AUTHOR_BY_ID: (id: string) => ["authors", id],
  AUTHOR_BY_USER: (userId: string) => ["authors_by_user", userId],

  // Login attempts (for rate limiting)
  LOGIN_ATTEMPTS: (email: string) => ["login_attempts", email.toLowerCase()],
};

/**
 * Generate a unique ID (UUID v4)
 */
export function generateId(): string {
  return crypto.randomUUID();
}
