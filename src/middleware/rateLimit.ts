/**
 * Rate limiting middleware
 * Prevents brute force attacks on authentication endpoints
 */

import type { Context } from "oak";
import { config } from "../config.ts";
import { getKv, KV_KEYS } from "@db/kv.ts";

interface RateLimitInfo {
  count: number;
  resetAt: number; // timestamp
  blockedUntil?: number; // timestamp
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIp(ctx: Context, next: () => Promise<unknown>) {
  const ip = ctx.request.ip;
  const path = ctx.request.url.pathname;

  // Only rate limit authentication endpoints
  if (!path.startsWith("/api/v1/auth/")) {
    await next();
    return;
  }

  const kv = getKv();
  const key = ["rate_limit", "ip", ip, path];

  const result = await kv.get<RateLimitInfo>(key);
  const now = Date.now();

  let info: RateLimitInfo = result.value || {
    count: 0,
    resetAt: now + config.rateLimitWindow,
  };

  // Check if blocked
  if (info.blockedUntil && info.blockedUntil > now) {
    const remainingSeconds = Math.ceil((info.blockedUntil - now) / 1000);
    ctx.response.status = 429;
    ctx.response.headers.set("Retry-After", remainingSeconds.toString());
    ctx.response.body = {
      success: false,
      error: {
        type: "TooManyRequests",
        code: 429,
        message: `Too many requests. Please try again in ${remainingSeconds} seconds.`,
      },
    };
    return;
  }

  // Reset if window expired
  if (now > info.resetAt) {
    info = {
      count: 0,
      resetAt: now + config.rateLimitWindow,
    };
  }

  // Increment counter
  info.count++;

  // Check if limit exceeded
  if (info.count > config.rateLimitMaxRequests) {
    info.blockedUntil = now + (config.rateLimitWindow * 2); // Block for 2x the window
    await kv.set(key, info, { expireIn: config.rateLimitWindow * 2 });

    const remainingSeconds = Math.ceil((info.blockedUntil - now) / 1000);
    ctx.response.status = 429;
    ctx.response.headers.set("Retry-After", remainingSeconds.toString());
    ctx.response.body = {
      success: false,
      error: {
        type: "TooManyRequests",
        code: 429,
        message: `Too many requests. Blocked for ${remainingSeconds} seconds.`,
      },
    };
    return;
  }

  // Save updated info
  await kv.set(key, info, { expireIn: config.rateLimitWindow });

  // Add rate limit headers
  ctx.response.headers.set("X-RateLimit-Limit", config.rateLimitMaxRequests.toString());
  ctx.response.headers.set("X-RateLimit-Remaining", (config.rateLimitMaxRequests - info.count).toString());
  ctx.response.headers.set("X-RateLimit-Reset", info.resetAt.toString());

  await next();
}

/**
 * Rate limit login attempts by email
 * More strict than general rate limiting
 */
export async function rateLimitLogin(email: string): Promise<{ allowed: boolean; remainingSeconds?: number }> {
  const kv = getKv();
  const key = KV_KEYS.LOGIN_ATTEMPTS(email);
  const now = Date.now();

  const result = await kv.get<RateLimitInfo>(key);
  let info: RateLimitInfo = result.value || {
    count: 0,
    resetAt: now + 900000, // 15 minutes
  };

  // Check if blocked
  if (info.blockedUntil && info.blockedUntil > now) {
    const remainingSeconds = Math.ceil((info.blockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  // Reset if window expired
  if (now > info.resetAt) {
    info = {
      count: 0,
      resetAt: now + 900000,
    };
  }

  // Check if limit exceeded (5 failed attempts in 15 minutes)
  if (info.count >= 5) {
    info.blockedUntil = now + 3600000; // Block for 1 hour
    await kv.set(key, info, { expireIn: 3600000 });

    const remainingSeconds = Math.ceil((info.blockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const kv = getKv();
  const key = KV_KEYS.LOGIN_ATTEMPTS(email);
  const now = Date.now();

  const result = await kv.get<RateLimitInfo>(key);
  let info: RateLimitInfo = result.value || {
    count: 0,
    resetAt: now + 900000, // 15 minutes
  };

  // Reset if window expired
  if (now > info.resetAt) {
    info = {
      count: 0,
      resetAt: now + 900000,
    };
  }

  info.count++;
  await kv.set(key, info, { expireIn: 900000 });
}

/**
 * Clear login attempts for an email (on successful login)
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  const kv = getKv();
  const key = KV_KEYS.LOGIN_ATTEMPTS(email);
  await kv.delete(key);
}
