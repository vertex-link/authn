/**
 * Author management controllers
 */

import type { Context } from "oak";
import type { AppState } from "./AuthController.ts";
import type { SessionData } from "@types/Session.ts";
import type { AuthorCreate, AuthorUpdate } from "@types/Author.ts";
import { authorService } from "@services/AuthorService.ts";
import { userService } from "@services/UserService.ts";

/**
 * Create author profile
 */
export async function createAuthor(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    const body = await ctx.request.body.json();

    // Users can only create author profiles for themselves (unless admin)
    const targetUserId = body.userId || sessionData.userId;
    if (targetUserId !== sessionData.userId) {
      const user = await userService.getUser(sessionData.userId);
      if (!user?.roles.includes("admin")) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "Forbidden",
        };
        return;
      }
    }

    const authorData: AuthorCreate = {
      userId: targetUserId,
      displayName: body.displayName,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      website: body.website,
      socialLinks: body.socialLinks,
      metadata: body.metadata,
    };

    const author = await authorService.createAuthor(authorData);

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: author,
    };
  } catch (error) {
    console.error("Create author error:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create author profile",
    };
  }
}

/**
 * Get author by ID
 */
export async function getAuthor(ctx: Context<AppState>) {
  try {
    const authorId = ctx.params.id;

    if (!authorId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Author ID is required",
      };
      return;
    }

    const author = await authorService.getAuthor(authorId);

    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: author,
    };
  } catch (error) {
    console.error("Get author error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Get author by user ID
 */
export async function getAuthorByUser(ctx: Context<AppState>) {
  try {
    const userId = ctx.params.userId;

    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "User ID is required",
      };
      return;
    }

    const author = await authorService.getAuthorByUserId(userId);

    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found for this user",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: author,
    };
  } catch (error) {
    console.error("Get author by user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Get current user's author profile
 */
export async function getMyAuthor(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    const author = await authorService.getAuthorByUserId(sessionData.userId);

    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "No author profile found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: author,
    };
  } catch (error) {
    console.error("Get my author error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Update author profile
 */
export async function updateAuthor(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;
    const authorId = ctx.params.id;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    // Check if user owns this author profile
    const author = await authorService.getAuthor(authorId);
    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found",
      };
      return;
    }

    // Get full author to check userId
    const fullAuthor = await authorService.getAuthorWithUser(authorId);
    if (!fullAuthor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found",
      };
      return;
    }

    // Only allow author owner or admin to update
    if (fullAuthor.user.id !== sessionData.userId) {
      const user = await userService.getUser(sessionData.userId);
      if (!user?.roles.includes("admin")) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "Forbidden",
        };
        return;
      }
    }

    const body = await ctx.request.body.json();
    const updateData: AuthorUpdate = {
      displayName: body.displayName,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      website: body.website,
      socialLinks: body.socialLinks,
      metadata: body.metadata,
    };

    const updatedAuthor = await authorService.updateAuthor(authorId, updateData);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: updatedAuthor,
    };
  } catch (error) {
    console.error("Update author error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * List all authors
 */
export async function listAuthors(ctx: Context<AppState>) {
  try {
    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "50");
    const cursor = ctx.request.url.searchParams.get("cursor") || undefined;

    const result = await authorService.listAuthors(limit, cursor);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: result.authors,
      cursor: result.cursor,
    };
  } catch (error) {
    console.error("List authors error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Delete author profile
 */
export async function deleteAuthor(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;
    const authorId = ctx.params.id;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    // Get full author to check userId
    const fullAuthor = await authorService.getAuthorWithUser(authorId);
    if (!fullAuthor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found",
      };
      return;
    }

    // Only allow author owner or admin to delete
    if (fullAuthor.user.id !== sessionData.userId) {
      const user = await userService.getUser(sessionData.userId);
      if (!user?.roles.includes("admin")) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "Forbidden",
        };
        return;
      }
    }

    const deleted = await authorService.deleteAuthor(authorId);

    if (!deleted) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Author not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Author profile deleted successfully",
    };
  } catch (error) {
    console.error("Delete author error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}
