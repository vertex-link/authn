/**
 * User management routes
 */

import { Router } from "oak";
import type { AppState } from "@controllers/AuthController.ts";
import * as userController from "@controllers/UserController.ts";

const router = new Router<AppState>();

// GET /api/v1/users/me - Get current user
router.get("/me", userController.getMe);

// GET /api/v1/users/username/:username/available - Check username availability
router.get("/username/:username/available", userController.checkUsernameAvailability);

// GET /api/v1/users - List all users (admin only)
router.get("/", userController.listUsers);

// GET /api/v1/users/:id - Get user by ID
router.get("/:id", userController.getUser);

// PATCH /api/v1/users/:id - Update user
router.patch("/:id", userController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete("/:id", userController.deleteUser);

export default router;
