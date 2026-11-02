import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then(r => setUser(r.data.user)).catch(() => localStorage.removeItem("taskflow_token")).finally(() => setLoading(false));
  }, []);
  const authenticate = async (path, data) => {
    const res = await api.post(`/auth/${path}`, data);
    localStorage.setItem("taskflow_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };
  const logout = () => { localStorage.removeItem("taskflow_token"); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login: d => authenticate("login", d), register: d => authenticate("register", d), logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
