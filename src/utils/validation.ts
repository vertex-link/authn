/**
 * Validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username
 * - Must be 3-20 characters
 * - Can contain letters, numbers, underscores, and hyphens
 * - Must start with a letter
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function isValidPassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user registration data
 */
export function validateRegistration(
  username: string,
  email: string,
  password: string,
): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  } else if (!isValidUsername(username)) {
    errors.push(
      "Username must be 3-20 characters, start with a letter, and contain only letters, numbers, underscores, or hyphens",
    );
  }

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password || password.trim().length === 0) {
    errors.push("Password is required");
  } else {
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}
