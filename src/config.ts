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

/**
 * Load and validate configuration
 * Fails fast if critical environment variables are missing
 */
export function loadConfig(): Config {
  const environment = getEnv("ENVIRONMENT", "development") as Config["environment"];

  // In production, SESSION_SECRET is required
  let sessionSecret: string;
  if (environment === "production") {
    sessionSecret = getEnv("SESSION_SECRET"); // No default - will throw
  } else {
    sessionSecret = getEnv("SESSION_SECRET", "dev-secret-DO-NOT-USE-IN-PRODUCTION");
    if (sessionSecret === "dev-secret-DO-NOT-USE-IN-PRODUCTION") {
      console.warn("⚠️  WARNING: Using default session secret. Set SESSION_SECRET environment variable!");
    }
  }

  return {
    // Server
    port: getEnvNumber("PORT", 8080),
    environment,

    // CORS
    corsOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),

    // Session
    sessionSecret,
    sessionMaxAge: getEnvNumber("SESSION_MAX_AGE", 86400000), // 24 hours

    // Database
    kvPath: Deno.env.get("KV_PATH"),

    // Security
    bcryptRounds: getEnvNumber("BCRYPT_ROUNDS", 12),
    rateLimitWindow: getEnvNumber("RATE_LIMIT_WINDOW", 900000), // 15 minutes
    rateLimitMaxRequests: getEnvNumber("RATE_LIMIT_MAX_REQUESTS", 100),
  };
}

/**
 * Validate configuration at startup
 */
export function validateConfig(config: Config): void {
  // Validate environment
  if (!["development", "production", "test"].includes(config.environment)) {
    throw new Error(`Invalid ENVIRONMENT: ${config.environment}`);
  }

  // Validate session secret length
  if (config.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  // Validate bcrypt rounds
  if (config.bcryptRounds < 10 || config.bcryptRounds > 15) {
    throw new Error("BCRYPT_ROUNDS must be between 10 and 15");
  }

  // Validate rate limiting
  if (config.rateLimitMaxRequests < 1) {
    throw new Error("RATE_LIMIT_MAX_REQUESTS must be at least 1");
  }

  console.log("✓ Configuration validated");
}

// Export singleton config
export const config = loadConfig();
