/**
 * Authentication controllers
 * Sessions managed via Oak sessions middleware
 */

import type { Context } from "oak";
import type { UserLogin, UserRegistration } from "@types/User.ts";
import type { SessionData, AuthState } from "@types/Session.ts";
import { authService } from "@services/AuthService.ts";
import { userService } from "@services/UserService.ts";
import {
  rateLimitLogin,
  recordFailedLogin,
  clearLoginAttempts,
} from "@middleware/rateLimit.ts";

export interface AppState {
  session: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    deleteSession(): Promise<void>;
    id: string;
  };
}

/**
 * Create session data from user information
 */
function createSessionData(
  user: { id: string; email: string; username: string },
  roles: string[],
  metadata?: { ipAddress?: string; userAgent?: string },
): SessionData {
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    roles,
    loginAttempts: 0,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    createdAt: Date.now(),
  };
}

/**
 * Login handler
 */
export async function login(ctx: Context<AppState>) {
  try {
    const body = await ctx.request.body.json();
    const credentials: UserLogin = {
      email: body.email || body.mail,
      password: body.password,
    };

    if (!credentials.email || !credentials.password) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Email and password are required",
      };
      return;
    }

    // Normalize email for rate limiting
    const normalizedEmail = credentials.email.toLowerCase().trim();

    // Check if already logged in via session
    const existingSession = ctx.state.session.get("data") as SessionData | undefined;
    if (existingSession?.userId && existingSession?.email) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        authorized: true,
        loggedInFromSession: true,
        user: {
          id: existingSession.userId,
          email: existingSession.email,
          username: existingSession.username,
        },
      };
      return;
    }

    // Check rate limit for this email
    const rateLimit = await rateLimitLogin(normalizedEmail);
    if (!rateLimit.allowed) {
      ctx.response.status = 429;
      ctx.response.body = {
        success: false,
        message: `Too many failed login attempts. Please try again in ${Math.ceil((rateLimit.remainingSeconds || 0) / 60)} minutes.`,
      };
      return;
    }

    // Attempt login
    const result = await authService.attemptLogin(credentials);

    if (result.success && result.user) {
      // Clear login attempts on successful login
      await clearLoginAttempts(normalizedEmail);

      // Get full user data for roles
      const user = await userService.getUser(result.user.id);
      if (!user) {
        ctx.response.status = 500;
        ctx.response.body = {
          success: false,
          message: "Internal server error",
        };
        return;
      }

      // Get client metadata
      const ipAddress = ctx.request.ip;
      const userAgent = ctx.request.headers.get("user-agent") || undefined;

      // Create complete session
      const sessionData = createSessionData(
        result.user,
        user.roles,
        { ipAddress, userAgent },
      );

      ctx.state.session.set("data", sessionData);

      ctx.response.status = 200;
      ctx.response.body = result;
    } else {
      // Record failed login attempt
      await recordFailedLogin(normalizedEmail);

      ctx.response.status = 401;
      ctx.response.body = result;
    }
  } catch (error) {
    console.error("Login controller error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Logout handler
 */
export async function logout(ctx: Context<AppState>) {
  try {
    await ctx.state.session.deleteSession();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      authorized: false,
      message: "Logged out successfully",
    };
  } catch (error) {
    console.error("Logout controller error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Registration handler
 */
export async function register(ctx: Context<AppState>) {
  try {
    const body = await ctx.request.body.json();

    // Validate all required fields
    if (!body.username || !body.email || !body.password) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Username, email, and password are required",
      };
      return;
    }

    // Check password confirmation if provided
    if (body.password_repeat && body.password !== body.password_repeat) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Passwords do not match",
      };
      return;
    }

    const userData: UserRegistration = {
      username: body.username,
      email: body.email || body.mail,
      password: body.password,
    };

    // Attempt registration
    const result = await authService.attemptRegistration(userData);

    if (result.success && result.user) {
      // Get full user data for roles
      const user = await userService.getUser(result.user.id);
      if (!user) {
        ctx.response.status = 500;
        ctx.response.body = {
          success: false,
          message: "Internal server error",
        };
        return;
      }

      // Get client metadata
      const ipAddress = ctx.request.ip;
      const userAgent = ctx.request.headers.get("user-agent") || undefined;

      // Create session for newly registered user (auto-login)
      const sessionData = createSessionData(
        result.user,
        user.roles,
        { ipAddress, userAgent },
      );

      ctx.state.session.set("data", sessionData);

      ctx.response.status = 201;
      ctx.response.body = result;
    } else {
      ctx.response.status = 400;
      ctx.response.body = result;
    }
  } catch (error) {
    console.error("Registration controller error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

/**
 * Get authentication state
 */
export async function getAuthState(ctx: Context<AppState>) {
  try {
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;

    if (sessionData?.userId && sessionData?.email) {
      const authState: AuthState = {
        authorized: true,
        userId: sessionData.userId,
        email: sessionData.email,
        roles: sessionData.roles,
      };

      ctx.response.status = 200;
      ctx.response.body = authState;
    } else {
      const authState: AuthState = {
        authorized: false,
      };

      ctx.response.status = 200;
      ctx.response.body = authState;
    }
  } catch (error) {
    console.error("Auth state controller error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      authorized: false,
      message: "Internal server error",
    };
  }
}
