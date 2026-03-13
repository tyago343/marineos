import type React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "../auth/AuthProvider";
import { useAuth } from "../auth/useAuth";
import type { SupabaseClient } from "@supabase/supabase-js";

function createMockSupabase(
  overrides: {
    signInWithPassword?: () => ReturnType<SupabaseClient["auth"]["signInWithPassword"]>;
    signUp?: () => ReturnType<SupabaseClient["auth"]["signUp"]>;
    signOut?: () => ReturnType<SupabaseClient["auth"]["signOut"]>;
    getSession?: () => ReturnType<SupabaseClient["auth"]["getSession"]>;
    onAuthStateChange?: () => { data: { subscription: { unsubscribe: () => void } } };
  } = {}
) {
  const baseAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
  return {
    auth: {
      ...baseAuth,
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

function createWrapper(supabase: SupabaseClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider supabase={supabase}>{children}</AuthProvider>;
  };
}

describe("AuthProvider", () => {
  describe("signIn", () => {
    it("returns success when credentials are correct", async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signIn("test@example.com", "password123");
      });

      expect(authResult!.success).toBe(true);
      expect(authResult!.error).toBeUndefined();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("returns invalidCredentials when password is wrong", async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signIn("test@example.com", "wrongpassword");
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("invalidCredentials");
    });

    it("returns invalidCredentials when email does not exist", async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signIn("nonexistent@example.com", "password123");
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("invalidCredentials");
    });
  });

  describe("signUp", () => {
    it("returns success when email is new", async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: {}, session: null },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signUp({
          email: "new@example.com",
          password: "password123",
          fullName: "Test User",
        });
      });

      expect(authResult!.success).toBe(true);
      expect(authResult!.error).toBeUndefined();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        options: { data: { full_name: "Test User" } },
      });
    });

    it("returns emailTaken when email already exists", async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: {
            code: "user_already_registered",
            message: "User already registered",
          },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signUp({
          email: "existing@example.com",
          password: "password123",
          fullName: "Test User",
        });
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("emailTaken");
    });

    it("returns emailTaken when error has status 422", async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: "Some validation error",
            status: 422,
          },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signUp({
          email: "existing@example.com",
          password: "password123",
          fullName: "Test User",
        });
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("emailTaken");
    });

    it("returns emailTaken when message includes already registered", async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: "A user with this email already exists",
          },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signUp({
          email: "existing@example.com",
          password: "password123",
          fullName: "Test User",
        });
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("emailTaken");
    });

    it("returns generic for other errors", async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: "Network error",
            status: 500,
          },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(supabase),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: { success: boolean; error?: string };
      await act(async () => {
        authResult = await result.current.signUp({
          email: "test@example.com",
          password: "password123",
          fullName: "Test User",
        });
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe("generic");
    });
  });

  describe("useAuth", () => {
    it("throws when used outside AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");
    });
  });
});
