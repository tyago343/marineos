import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, signup } from "@/app/[locale]/(auth)/actions";

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  }),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

describe("auth server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("returns fieldErrors when email is invalid", async () => {
      const formData = new FormData();
      formData.set("email", "notanemail");
      formData.set("password", "password123");

      const result = await login({}, formData);

      expect(result).toEqual({
        fieldErrors: { email: "invalid" },
      });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("returns fieldErrors when password is empty", async () => {
      const formData = new FormData();
      formData.set("email", "test@example.com");
      formData.set("password", "");

      const result = await login({}, formData);

      expect(result.fieldErrors?.password).toBe("required");
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("returns invalidCredentials when Supabase returns error", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const formData = new FormData();
      formData.set("email", "test@example.com");
      formData.set("password", "wrongpassword");

      const result = await login({}, formData);

      expect(result).toEqual({ error: "invalidCredentials" });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "wrongpassword",
      });
    });

    it("calls redirect when login succeeds", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: {}, session: {} },
        error: null,
      });

      const formData = new FormData();
      formData.set("email", "test@example.com");
      formData.set("password", "password123");

      await expect(login({}, formData)).rejects.toThrow("NEXT_REDIRECT:/");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });

  describe("signup", () => {
    it("returns fieldErrors when passwords do not match", async () => {
      const formData = new FormData();
      formData.set("fullName", "Test User");
      formData.set("email", "test@example.com");
      formData.set("password", "password123");
      formData.set("confirmPassword", "different456");

      const result = await signup({}, formData);

      expect(result).toEqual({
        fieldErrors: { confirmPassword: "mismatch" },
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("returns fieldErrors when email is invalid", async () => {
      const formData = new FormData();
      formData.set("fullName", "Test User");
      formData.set("email", "bad-email");
      formData.set("password", "password123");
      formData.set("confirmPassword", "password123");

      const result = await signup({}, formData);

      expect(result.fieldErrors?.email).toBe("invalid");
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("returns success when signup succeeds", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: {}, session: null },
        error: null,
      });

      const formData = new FormData();
      formData.set("fullName", "Test User");
      formData.set("email", "new@example.com");
      formData.set("password", "password123");
      formData.set("confirmPassword", "password123");

      const result = await signup({}, formData);

      expect(result).toEqual({ success: "checkEmail" });
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        options: { data: { full_name: "Test User" } },
      });
    });

    it("returns emailTaken when email already exists", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      });

      const formData = new FormData();
      formData.set("fullName", "Test User");
      formData.set("email", "existing@example.com");
      formData.set("password", "password123");
      formData.set("confirmPassword", "password123");

      const result = await signup({}, formData);

      expect(result).toEqual({ error: "emailTaken" });
    });

    it("returns generic for other signup errors", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Network error", status: 500 },
      });

      const formData = new FormData();
      formData.set("fullName", "Test User");
      formData.set("email", "test@example.com");
      formData.set("password", "password123");
      formData.set("confirmPassword", "password123");

      const result = await signup({}, formData);

      expect(result).toEqual({ error: "generic" });
    });
  });
});
