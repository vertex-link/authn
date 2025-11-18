/**
 * Main application entry point
 * Authentication and user management service for Vertex Link
 */

import { Application } from "oak";
import type { AppState } from "@controllers/AuthController.ts";
import { initKv } from "@db/kv.ts";
import { authRoutes, userRoutes, authorRoutes } from "@/routes/mod.ts";
import { corsMiddleware, errorHandler, logger, sessionMiddleware } from "@middleware/mod.ts";

// Load environment variables
const PORT = parseInt(Deno.env.get("PORT") || "8080");
const KV_PATH = Deno.env.get("KV_PATH");

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ██╗   ██╗███████╗██████╗ ████████╗███████╗██╗  ██╗  ║
║     ██║   ██║██╔════╝██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝  ║
║     ██║   ██║█████╗  ██████╔╝   ██║   █████╗   ╚███╔╝   ║
║     ╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║   ██╔══╝   ██╔██╗   ║
║      ╚████╔╝ ███████╗██║  ██║   ██║   ███████╗██╔╝ ██╗  ║
║       ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝  ║
║                                                          ║
║              Authentication Service v1.0                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

// Initialize database
console.log("Initializing Deno KV database...");
await initKv(KV_PATH);

// Create application
const app = new Application<AppState>();

// Global error handler
app.use(errorHandler);

// Request logger
app.use(logger);

// CORS middleware
app.use(corsMiddleware);

// Session middleware
app.use(sessionMiddleware);

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/health") {
    ctx.response.status = 200;
    ctx.response.body = {
      status: "healthy",
      service: "authn",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
    return;
  }
  await next();
});

// API routes
app.use(authRoutes.prefix("/api/v1/auth").routes());
app.use(authRoutes.allowedMethods());

app.use(userRoutes.prefix("/api/v1/users").routes());
app.use(userRoutes.allowedMethods());

app.use(authorRoutes.prefix("/api/v1/authors").routes());
app.use(authorRoutes.allowedMethods());

// 404 handler
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    error: {
      type: "NotFound",
      code: 404,
      message: "Route not found",
    },
  };
});

// Start server
console.log(`\n🚀 Server starting on port ${PORT}...`);
console.log(`\n📋 Available endpoints:`);
console.log(`   Health:         GET  /health`);
console.log(`   Auth:           POST /api/v1/auth/login`);
console.log(`                   POST /api/v1/auth/logout`);
console.log(`                   POST /api/v1/auth/register`);
console.log(`                   GET  /api/v1/auth/state`);
console.log(`   Users:          GET  /api/v1/users`);
console.log(`                   GET  /api/v1/users/me`);
console.log(`                   GET  /api/v1/users/:id`);
console.log(`   Authors:        GET  /api/v1/authors`);
console.log(`                   GET  /api/v1/authors/me`);
console.log(`                   POST /api/v1/authors`);
console.log(`                   GET  /api/v1/authors/:id`);
console.log(`\n✅ Server running at http://localhost:${PORT}\n`);

await app.listen({ port: PORT });
