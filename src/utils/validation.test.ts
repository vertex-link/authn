/**
 * Tests for validation utilities
 */

import { assertEquals } from "std/assert/mod.ts";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  validateRegistration,
} from "./validation.ts";

Deno.test("isValidEmail - valid emails", () => {
  assertEquals(isValidEmail("test@example.com"), true);
  assertEquals(isValidEmail("user.name@domain.co.uk"), true);
  assertEquals(isValidEmail("user+tag@example.com"), true);
});

Deno.test("isValidEmail - invalid emails", () => {
  assertEquals(isValidEmail("invalid"), false);
  assertEquals(isValidEmail("@example.com"), false);
  assertEquals(isValidEmail("user@"), false);
  assertEquals(isValidEmail(""), false);
});

Deno.test("isValidUsername - valid usernames", () => {
  assertEquals(isValidUsername("john"), true);
  assertEquals(isValidUsername("john_doe"), true);
  assertEquals(isValidUsername("user123"), true);
  assertEquals(isValidUsername("a12"), true); // minimum 3 chars
});

Deno.test("isValidUsername - invalid usernames", () => {
  assertEquals(isValidUsername("ab"), false); // too short
  assertEquals(isValidUsername("123user"), false); // must start with letter
  assertEquals(isValidUsername("user@name"), false); // invalid char
  assertEquals(isValidUsername(""), false);
});

Deno.test("isValidPassword - valid passwords", () => {
  const result = isValidPassword("SecurePass123");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("isValidPassword - too short", () => {
  const result = isValidPassword("Pass1");
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Password must be at least 8 characters long"), true);
});

Deno.test("isValidPassword - missing uppercase", () => {
  const result = isValidPassword("securepass123");
  assertEquals(result.valid, false);
  assertEquals(
    result.errors.includes("Password must contain at least one uppercase letter"),
    true,
  );
});

Deno.test("isValidPassword - missing lowercase", () => {
  const result = isValidPassword("SECUREPASS123");
  assertEquals(result.valid, false);
  assertEquals(
    result.errors.includes("Password must contain at least one lowercase letter"),
    true,
  );
});

Deno.test("isValidPassword - missing number", () => {
  const result = isValidPassword("SecurePassword");
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Password must contain at least one number"), true);
});

Deno.test("validateRegistration - valid data", () => {
  const result = validateRegistration("johndoe", "john@example.com", "SecurePass123");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateRegistration - invalid username", () => {
  const result = validateRegistration("ab", "john@example.com", "SecurePass123");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("validateRegistration - invalid email", () => {
  const result = validateRegistration("johndoe", "invalid-email", "SecurePass123");
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Invalid email format"), true);
});

Deno.test("validateRegistration - invalid password", () => {
  const result = validateRegistration("johndoe", "john@example.com", "weak");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
});
