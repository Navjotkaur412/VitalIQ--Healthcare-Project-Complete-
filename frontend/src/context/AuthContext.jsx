import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("vitaliq_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = (token, userObj) => {
    localStorage.setItem("vitaliq_token", token);
    localStorage.setItem("vitaliq_user", JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("vitaliq_token");
    localStorage.removeItem("vitaliq_user");
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    localStorage.setItem("vitaliq_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("vitaliq_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshMe()
      .catch(() => logout())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
