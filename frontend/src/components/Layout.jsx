
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const leave = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <span>taskflow</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav>
          <NavLink to="/" end>
            <LayoutDashboard size={18} /> Overview
          </NavLink>

          <NavLink to="/projects">
            <FolderKanban size={18} /> Projects
          </NavLink>

          <NavLink to="/notifications">
            <Bell size={18} /> Notifications
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={leave}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h2>Make work flow.</h2>
          </div>

          <div className="top-user">
            <NavLink
              to="/notifications"
              className="notification-bell"
              title="Notifications"
            >
              <Bell size={21} />
            </NavLink>

            <span className="status-dot" /> Online

            <div className="avatar small">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
