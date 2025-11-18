/**
 * CORS middleware
 */

import { oakCors } from "cors";

const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") || "http://localhost:3000";

export const corsMiddleware = oakCors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
