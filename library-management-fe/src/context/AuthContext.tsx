import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginApi, registerCustomer as registerApi } from "../api/authApi";
import { getAuthToken, normalizeAuthUser } from "../lib/auth";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

const USER_STORAGE_KEY = "library_auth_user";
const TOKEN_STORAGE_KEY = "token";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rawUser =
      localStorage.getItem(USER_STORAGE_KEY) ?? localStorage.getItem("user");
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (rawUser && token) {
      try {
        setUser(normalizeAuthUser(JSON.parse(rawUser)));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem("user");
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("user");
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const persist = (nextUser: AuthUser, token?: string) => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (input: LoginInput) => {
    const result = await loginApi(input);
    const userData = normalizeAuthUser(result);

    persist(userData, getAuthToken(result));
    return userData;
  };

  const register = async (input: RegisterInput) => {
    const result = await registerApi(input);
    const userData = normalizeAuthUser(result);

    persist(userData, getAuthToken(result));
    return userData;
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
