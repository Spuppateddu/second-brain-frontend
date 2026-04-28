"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { api, setUnauthorizedHandler } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import type {
  AuthMe,
  LoginPayload,
  LoginResponse,
  Privilege,
  User,
} from "@/types/auth";

type AuthState =
  | { status: "loading"; user: null; privileges: Privilege[]; vapidPublicKey: null }
  | {
      status: "unauthenticated";
      user: null;
      privileges: Privilege[];
      vapidPublicKey: null;
    }
  | {
      status: "authenticated";
      user: User;
      privileges: Privilege[];
      vapidPublicKey: string | null;
    };

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // `null` means we haven't checked localStorage yet (server render & first
  // client paint). Until then, status stays "loading" so AuthGate doesn't
  // briefly redirect a logged-in user to /login on reload.
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const read = () => setHasToken(authStorage.get() != null);
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  const [me, setMe] = useState<{
    user: User;
    privileges: Privilege[];
    vapidPublicKey: string | null;
  } | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const fetchMe = useCallback(async () => {
    const { data } = await api.get<AuthMe>("/me");
    setMe({
      user: data.user,
      privileges: data.privileges,
      vapidPublicKey: data.vapid_public_key ?? null,
    });
    setMeLoaded(true);
  }, []);

  const clearSession = useCallback(() => {
    authStorage.clear();
    setMe(null);
    setMeLoaded(true);
    setHasToken(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [router, clearSession]);

  useEffect(() => {
    if (hasToken !== true) return;
    // Resetting meLoaded here is intentional: when the token changes (e.g. cross-tab
    // login or refresh) we want to flip back into "loading" until /me resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeLoaded(false);
    fetchMe().catch(() => clearSession());
  }, [hasToken, fetchMe, clearSession]);

  const state: AuthState = useMemo(() => {
    if (hasToken === null) {
      return {
        status: "loading",
        user: null,
        privileges: [],
        vapidPublicKey: null,
      };
    }
    if (!hasToken) {
      return {
        status: "unauthenticated",
        user: null,
        privileges: [],
        vapidPublicKey: null,
      };
    }
    if (!meLoaded || !me) {
      return {
        status: "loading",
        user: null,
        privileges: [],
        vapidPublicKey: null,
      };
    }
    return {
      status: "authenticated",
      user: me.user,
      privileges: me.privileges,
      vapidPublicKey: me.vapidPublicKey,
    };
  }, [hasToken, meLoaded, me]);

  const login = useCallback<AuthContextValue["login"]>(
    async (payload) => {
      const { data } = await api.post<LoginResponse>("/auth/login", payload);
      authStorage.set(data.token);
      setHasToken(true);
      await fetchMe();
    },
    [fetchMe],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — we're tearing down regardless
    }
    clearSession();
    router.replace("/login");
  }, [router, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh: fetchMe }),
    [state, login, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
