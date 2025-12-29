import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import api from "@/lib/api";

interface Admin {
  id: string;
  email: string;
  name?: string;
  role: "admin";
  adminRole: "super_admin" | "moderator" | "support";
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");

        if (res.data.role !== "admin") {
          localStorage.removeItem("admin_token");
          setAdmin(null);
        } else {
          setAdmin(res.data);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("admin_token");
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });

    if (res.data.user.role !== "admin") {
      throw new Error("Access denied. Admin account required.");
    }

    localStorage.setItem("admin_token", res.data.token);
    setAdmin(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
