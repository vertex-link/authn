/**
 * Author management routes
 */

import { Router } from "oak";
import type { AppState } from "@controllers/AuthController.ts";
import * as authorController from "@controllers/AuthorController.ts";

const router = new Router<AppState>();

// GET /api/v1/authors/me - Get current user's author profile
router.get("/me", authorController.getMyAuthor);

// GET /api/v1/authors/user/:userId - Get author by user ID
router.get("/user/:userId", authorController.getAuthorByUser);

// GET /api/v1/authors - List all authors
router.get("/", authorController.listAuthors);

// POST /api/v1/authors - Create author profile
router.post("/", authorController.createAuthor);

// GET /api/v1/authors/:id - Get author by ID
router.get("/:id", authorController.getAuthor);

// PATCH /api/v1/authors/:id - Update author
router.patch("/:id", authorController.updateAuthor);

// DELETE /api/v1/authors/:id - Delete author
router.delete("/:id", authorController.deleteAuthor);

export default router;
