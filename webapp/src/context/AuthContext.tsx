import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { authService } from "@/services/authService";
import {
  AUTH_LOGOUT_EVENT,
  AUTH_SESSION_EVENT,
  ensureValidAccessToken,
} from "@/utils/authRefresh";

type AuthUser = Record<string, any>;

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (creds: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sessionUser = await authService.bootstrapSession();
      setUser(sessionUser);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const onSession = (event: Event) => {
      const customEvent = event as CustomEvent<AuthUser | null>;
      setUser(customEvent.detail ?? null);
    };
    const onLogout = () => setUser(null);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        ensureValidAccessToken().then((ok) => {
          if (!ok) setUser(null);
        });
      }
    };

    window.addEventListener(AUTH_SESSION_EVENT, onSession);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, onSession);
      window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const login = useCallback(async (creds: LoginCredentials) => {
    const { user: loggedIn } = await authService.login(creds);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, setUser }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
