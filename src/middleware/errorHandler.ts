/**
 * Error handling middleware
 */

import type { Context } from "oak";

export async function errorHandler(ctx: Context, next: () => Promise<unknown>) {
  try {
    await next();
  } catch (error) {
    console.error("Unhandled error:", error);

    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: {
        type: "InternalServerError",
        code: 500,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
  }
}
