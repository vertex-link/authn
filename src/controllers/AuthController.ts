/**
 * Authentication controllers
 * Based on studio-prototype auth controllers
 */

import type { Context } from "oak";
import type { UserLogin, UserRegistration } from "@types/User.ts";
import type { SessionData, AuthState } from "@types/Session.ts";
import { authService } from "@services/AuthService.ts";
import { userService } from "@services/UserService.ts";

export interface AppState {
  session: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    deleteSession(): Promise<void>;
    id: string;
  };
}

/**
 * Login handler
 * Based on prototype's login controller
 */
export async function login(ctx: Context<AppState>) {
  try {
    const body = await ctx.request.body.json();
    const credentials: UserLogin = {
      email: body.email || body.mail, // Support both field names
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

    // Check if already logged in via session
    const sessionData = ctx.state.session.get("data") as SessionData | undefined;
    if (sessionData?.email && sessionData?.userId) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        authorized: true,
        loggedInFromSession: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
        },
      };
      return;
    }

    // Get client metadata
    const ipAddress = ctx.request.ip;
    const userAgent = ctx.request.headers.get("user-agent") || undefined;

    // Attempt login
    const result = await authService.attemptLogin(credentials, { ipAddress, userAgent });

    if (result.success && result.user) {
      // Store in session
      ctx.state.session.set("data", {
        userId: result.user.id,
        email: result.user.email,
        loginAttempts: 0,
      });

      ctx.response.status = 200;
      ctx.response.body = result;
    } else {
      // Increment failed login attempts
      const attempts = (sessionData?.loginAttempts || 0) + 1;
      ctx.state.session.set("data", {
        ...sessionData,
        loginAttempts: attempts,
      });

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
 * Based on prototype's registration controller
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

    // Check username availability
    const isAvailable = await userService.isUsernameAvailable(body.username);
    if (!isAvailable) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Username is already taken",
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

    if (result.success) {
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
      // Get user to check roles
      const user = await userService.getUser(sessionData.userId);

      const authState: AuthState = {
        authorized: true,
        userId: sessionData.userId,
        email: sessionData.email,
        roles: user?.roles,
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
