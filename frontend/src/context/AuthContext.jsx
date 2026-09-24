import { useEffect, useState } from "react";
import { AuthContext } from "./context";
import { api } from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const data = await api.post("/api/auth/login", {
      email,
      password,
    });

    localStorage.setItem("campusone_token", data.access_token);
    localStorage.setItem("campusone_user", JSON.stringify(data.user));

    setUser(data.user);

    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.post("/api/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("campusone_token", data.access_token);
    localStorage.setItem("campusone_user", JSON.stringify(data.user));

    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("campusone_token");
    localStorage.removeItem("campusone_user");
    setUser(null);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("campusone_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.get("/api/auth/me");

        setUser(currentUser);

        localStorage.setItem(
          "campusone_user",
          JSON.stringify(currentUser)
        );
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}