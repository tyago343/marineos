import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error?: "invalidCredentials" | "emailTaken" | "generic";
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (data: { email: string; password: string; fullName: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  supabase: SupabaseClient;
  children: ReactNode;
}

export function AuthProvider({ supabase, children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, error: "invalidCredentials" };
      }
      return { success: true };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (data: { email: string; password: string; fullName: string }): Promise<AuthResult> => {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
      });
      if (error) {
        const isEmailTaken =
          error.code === "user_already_registered" ||
          (typeof (error as { status?: number }).status === "number" &&
            (error as { status?: number }).status === 422) ||
          /already (registered|exists)/i.test(error.message);
        if (isEmailTaken) {
          return { success: false, error: "emailTaken" };
        }
        return { success: false, error: "generic" };
      }
      return { success: true };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, signIn, signUp, signOut }),
    [user, session, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
