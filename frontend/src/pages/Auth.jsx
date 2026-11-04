import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Layers3,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await (isRegister ? register(form) : login(form));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setForm({
      name: "Alex River",
      email: "alex@example.com",
      password: "password123",
    });
  };

  return (
    <div className="auth-page">
      {/* Visual Showcase Side */}
      <div className="auth-visual">
        <div className="brand light">
          <div className="brand-mark">
            <span>T</span>
          </div>
          <div className="brand-title-wrap">
            <span style={{ color: "#fff" }}>TaskFlow</span>
            <span className="brand-tag">Work in Sync</span>
          </div>
        </div>

        <div className="visual-copy">
          <span className="pill">
            <span className="status-dot" /> MODERN SPRINT & KANBAN
          </span>

          <h1>
            Work that flows.<br />
            <em>Results that matter.</em>
          </h1>

          <p>
            Experience lightning-fast project coordination, intuitive boards, and real-time
            team synchrony designed for modern high-performance teams.
          </p>

          <div className="visual-checks">
            <span>
              <CheckCircle2 size={18} /> Interactive Kanban Boards with live status transitions
            </span>
            <span>
              <Zap size={18} /> Real-time instant notifications & comment threads
            </span>
            <span>
              <Users size={18} /> Seamless cross-workspace team collaboration
            </span>
            <span>
              <ShieldCheck size={18} /> Secure JWT authentication & protected endpoints
            </span>
          </div>
        </div>

        <div className="visual-footer">
          Designed for high-velocity teams · Powered by TaskFlow MERN
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-icon">
            <Layers3 size={24} />
          </div>

          <div>
            <span className="eyebrow">
              {isRegister ? "GET STARTED IN SECONDS" : "WELCOME BACK"}
            </span>
            <h2>{isRegister ? "Create your account" : "Sign in to TaskFlow"}</h2>
          </div>

          <p className="muted">
            {isRegister
              ? "Start managing your projects and teammates with clarity."
              : "Enter your credentials to access your workspaces."}
          </p>

          {error && <div className="error-box">{error}</div>}

          {isRegister && (
            <label>
              Full Name
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Jane Doe"
                required
              />
            </label>
          )}

          <label>
            Email Address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="you@company.com"
              required
            />
          </label>

          <label>
            Password
            <div className="password-input-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={change}
                placeholder="At least 6 characters"
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button className="primary-btn full" disabled={busy} type="submit">
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            <ArrowRight size={16} />
          </button>

          {!isRegister && (
            <button
              type="button"
              className="outline-btn full"
              style={{ fontSize: "12px", padding: "8px" }}
              onClick={fillDemo}
            >
              Fill Demo Credentials
            </button>
          )}

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to TaskFlow?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
