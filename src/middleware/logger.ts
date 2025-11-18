/**
 * Request logging middleware
 */

import type { Context } from "oak";

export async function logger(ctx: Context, next: () => Promise<unknown>) {
  const start = Date.now();
  const { method, url } = ctx.request;

  await next();

  const ms = Date.now() - start;
  const status = ctx.response.status;

  // Color code based on status
  let statusColor = "\x1b[32m"; // Green for 2xx
  if (status >= 400 && status < 500) statusColor = "\x1b[33m"; // Yellow for 4xx
  if (status >= 500) statusColor = "\x1b[31m"; // Red for 5xx

  console.log(
    `${method} ${url} - ${statusColor}${status}\x1b[0m - ${ms}ms`,
  );
}
