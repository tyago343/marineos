import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
  ValidationError,
} from "../index";

describe("emailSchema", () => {
  it("rejects empty string", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ValidationError.REQUIRED);
    }
  });

  it("rejects invalid email format", () => {
    const result = emailSchema.safeParse("notanemail");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ValidationError.INVALID);
    }
  });

  it("accepts valid email", () => {
    const result = emailSchema.safeParse("user@example.com");
    expect(result.success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("rejects empty string with required", () => {
    const result = passwordSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ValidationError.REQUIRED);
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("short");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ValidationError.TOO_SHORT);
    }
  });

  it("rejects password longer than 72 characters", () => {
    const result = passwordSchema.safeParse("a".repeat(73));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ValidationError.TOO_LONG);
    }
  });

  it("accepts valid password (8-72 chars)", () => {
    expect(passwordSchema.safeParse("password").success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue?.message).toBe(ValidationError.REQUIRED);
    }
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue?.message).toBe(ValidationError.INVALID);
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(pwIssue?.message).toBe(ValidationError.REQUIRED);
    }
  });

  it("rejects password too short", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(pwIssue?.message).toBe(ValidationError.TOO_SHORT);
    }
  });

  it("rejects password too long", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(pwIssue?.message).toBe(ValidationError.TOO_LONG);
    }
  });

  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "validpassword123",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("rejects empty fullName", () => {
    const result = registerSchema.safeParse({
      fullName: "",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fnIssue = result.error.issues.find((i) => i.path[0] === "fullName");
      expect(fnIssue?.message).toBe(ValidationError.REQUIRED);
    }
  });

  it("rejects fullName longer than 100 characters", () => {
    const result = registerSchema.safeParse({
      fullName: "a".repeat(101),
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fnIssue = result.error.issues.find((i) => i.path[0] === "fullName");
      expect(fnIssue?.message).toBe(ValidationError.TOO_LONG);
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      fullName: "John Doe",
      email: "invalid",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue?.message).toBe(ValidationError.INVALID);
    }
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      fullName: "John Doe",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const cpIssue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(cpIssue?.message).toBe(ValidationError.MISMATCH);
    }
  });

  it("rejects empty confirmPassword", () => {
    const result = registerSchema.safeParse({
      fullName: "John Doe",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const cpIssue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(cpIssue?.message).toBe(ValidationError.REQUIRED);
    }
  });

  it("accepts valid register input", () => {
    const result = registerSchema.safeParse({
      fullName: "John Doe",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });
});
