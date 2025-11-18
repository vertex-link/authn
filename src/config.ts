/**
 * Configuration management
 */

export interface Config {
  // Server
  port: number;
  environment: "development" | "production" | "test";

  // CORS
  corsOrigin: string;

  // Session
  sessionSecret: string;
  sessionMaxAge: number;

  // JWT (optional)
  jwtSecret?: string;
  jwtExpiresIn?: string;

  // Database
  kvPath?: string;

  // Security
  bcryptRounds: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = Deno.env.get(key);
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = Deno.env.get(key);
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

export function loadConfig(): Config {
  return {
    // Server
    port: getEnvNumber("PORT", 8080),
    environment: (getEnv("ENVIRONMENT", "development") as Config["environment"]),

    // CORS
    corsOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),

    // Session
    sessionSecret: getEnv("SESSION_SECRET", "change-this-secret-in-production"),
    sessionMaxAge: getEnvNumber("SESSION_MAX_AGE", 86400000), // 24 hours

    // JWT
    jwtSecret: Deno.env.get("JWT_SECRET"),
    jwtExpiresIn: Deno.env.get("JWT_EXPIRES_IN") || "7d",

    // Database
    kvPath: Deno.env.get("KV_PATH"),

    // Security
    bcryptRounds: getEnvNumber("BCRYPT_ROUNDS", 12),
    rateLimitWindow: getEnvNumber("RATE_LIMIT_WINDOW", 900000), // 15 minutes
    rateLimitMaxRequests: getEnvNumber("RATE_LIMIT_MAX_REQUESTS", 100),
  };
}

// Export singleton config
export const config = loadConfig();
