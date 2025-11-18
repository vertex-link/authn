/**
 * Authentication routes
 * Based on studio-prototype auth routes
 */

import { Router } from "oak";
import type { AppState } from "@controllers/AuthController.ts";
import * as authController from "@controllers/AuthController.ts";

const router = new Router<AppState>();

// POST /api/v1/auth/login
router.post("/login", authController.login);

// POST /api/v1/auth/logout
router.post("/logout", authController.logout);

// POST /api/v1/auth/register
router.post("/register", authController.register);

// GET /api/v1/auth/state
router.get("/state", authController.getAuthState);

export default router;
