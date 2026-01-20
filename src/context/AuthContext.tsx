import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);

  const STATIC_USER = { username: "admin", password: "admin123", token: "static-token" };

  const login = async (username: string, password: string) => {
    setLoading(true);
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (username && password) {
          const userData = { username, token: STATIC_USER.token };
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          navigate("/");
          setLoading(false);
          resolve(true);
        } else {
          setLoading(false);
          resolve(false);
        }
      }, 800); // simulate server delay
    });
  };

  const logout = () => {
    setLoading(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem("user");
      setLoading(false);
      navigate("/login");
    }, 300); // small delay to show loader
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
