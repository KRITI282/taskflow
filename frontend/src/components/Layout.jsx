import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Sparkles,
  ChevronRight,
  Plus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarProjects, setSidebarProjects] = useState([]);

  // Fetch unread count & recent projects for sidebar
  const loadSidebarData = async () => {
    try {
      const [notifRes, projRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/projects"),
      ]);
      const unread = notifRes.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
      setSidebarProjects(projRes.data.slice(0, 5));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSidebarData();
    const handleNotification = () => loadSidebarData();
    window.addEventListener("taskflow-notification", handleNotification);
    return () => window.removeEventListener("taskflow-notification", handleNotification);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const leave = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview";
    if (path.startsWith("/projects/")) return "Project Board";
    if (path === "/projects") return "Projects";
    if (path === "/notifications") return "Notifications";
    return "Workspace";
  };

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      <div
        className={`mobile-drawer-backdrop ${mobileOpen ? "mobile-open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <span>T</span>
          </div>
          <div className="brand-title-wrap">
            <span>TaskFlow</span>
            <span className="brand-tag">Workspace</span>
          </div>
        </div>

        <div className="workspace-label">MENU</div>

        <nav>
          <NavLink to="/" end>
            <div className="nav-link-content">
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </div>
          </NavLink>

          <NavLink to="/projects">
            <div className="nav-link-content">
              <FolderKanban size={18} />
              <span>Projects</span>
            </div>
          </NavLink>

          <NavLink to="/notifications">
            <div className="nav-link-content">
              <Bell size={18} />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          </NavLink>
        </nav>

        {/* Quick Projects in Sidebar */}
        <div className="sidebar-projects-section">
          <div className="sidebar-projects-head">
            <span>Recent Projects</span>
            <NavLink to="/projects" title="View all projects">
              <ChevronRight size={13} />
            </NavLink>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {sidebarProjects.map((p, i) => {
              const dots = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6"];
              return (
                <NavLink
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className={({ isActive }) =>
                    `sidebar-project-link ${isActive ? "active" : ""}`
                  }
                >
                  <span
                    className="sidebar-dot"
                    style={{ backgroundColor: dots[i % dots.length] }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                </NavLink>
              );
            })}

            {sidebarProjects.length === 0 && (
              <span style={{ fontSize: "12px", color: "#64748b", padding: "8px 12px" }}>
                No projects yet
              </span>
            )}
          </div>
        </div>

        {/* User profile & Sign out */}
        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase()}
              <span className="avatar-online-ping" />
            </div>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={leave}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="topbar-title-block">
              <span className="eyebrow">TASKFLOW HUB</span>
              <h2>{getPageTitle()}</h2>
            </div>
          </div>

          <div className="topbar-right">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} theme`}
              aria-label="Toggle color theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className="notification-bell"
              title="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="bell-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>

            {/* User status */}
            <div className="top-user-pill">
              <div className="avatar small">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span>{user?.name?.split(" ")[0]}</span>
              <span className="online-indicator">
                <span className="status-dot" />
              </span>
            </div>
          </div>
        </header>

        {/* Page View */}
        <div className="page-content">
          <Outlet context={{ refreshSidebar: loadSidebarData }} />
        </div>
      </main>
    </div>
  );
}
