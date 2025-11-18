/**
 * User management controllers
 */

import type { Context } from "oak";
import type { AppState } from "./AuthController.ts";
import type { SessionData } from "@types/Session.ts";
import { userService } from "@services/UserService.ts";

/**
 * Get current user (from session)
 */
export async function getMe(ctx: Context<AppState>) {
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

    const user = await userService.getUser(sessionData.userId);

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "User not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Get me error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Get user by ID
 */
export async function getUser(ctx: Context<AppState>) {
  try {
    const userId = ctx.params.id;

    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "User ID is required",
      };
      return;
    }

    const user = await userService.getUser(userId);

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "User not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Get user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Check username availability
 * From prototype's isUsernameAvail endpoint
 */
export async function checkUsernameAvailability(ctx: Context<AppState>) {
  try {
    const username = ctx.params.username;

    if (!username) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Username is required",
      };
      return;
    }

    const available = await userService.isUsernameAvailable(username);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      available,
    };
  } catch (error) {
    console.error("Check username error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Update user profile
 */
export async function updateUser(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;
    const userId = ctx.params.id;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    // Only allow users to update their own profile (unless admin)
    if (userId !== sessionData.userId) {
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
    const updatedUser = await userService.updateUser(userId, body);

    if (!updatedUser) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "User not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Update user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

/**
 * List all users (admin only)
 */
export async function listUsers(ctx: Context<AppState>) {
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

    // Check if user is admin
    const user = await userService.getUser(sessionData.userId);
    if (!user?.roles.includes("admin")) {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "Forbidden - admin access required",
      };
      return;
    }

    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "50");
    const cursor = ctx.request.url.searchParams.get("cursor") || undefined;

    const result = await userService.listUsers(limit, cursor);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: result.users,
      cursor: result.cursor,
    };
  } catch (error) {
    console.error("List users error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Delete user (admin only, or self)
 */
export async function deleteUser(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;
    const userId = ctx.params.id;

    if (!sessionData?.userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Not authenticated",
      };
      return;
    }

    // Allow users to delete their own account, or admins to delete any account
    if (userId !== sessionData.userId) {
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

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "User not found",
      };
      return;
    }

    // If user deleted their own account, logout
    if (userId === sessionData.userId) {
      await ctx.state.session.deleteSession();
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Delete user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}
