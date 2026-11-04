import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectBoard from "./pages/ProjectBoard";
import Notifications from "./pages/Notifications";

// In production on Vercel without external socket server, default to empty to avoid console errors
const socketUrl =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

function LiveConnection() {
  const { user } = useAuth();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!user || !socketUrl) return;
    const socket = io(socketUrl, {
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });
    socket.on("connect", () => {
      setLive(true);
      socket.emit("join", user.id);
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("notification", () =>
      window.dispatchEvent(new Event("taskflow-notification"))
    );
    return () => socket.disconnect();
  }, [user]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LiveConnection />
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectBoard />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}
