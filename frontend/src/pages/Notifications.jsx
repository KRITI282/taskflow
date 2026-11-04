import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'read'
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setItems(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      toast.success("Notification marked as read");
      window.dispatchEvent(new Event("taskflow-notification"));
    } catch {
      toast.error("Could not update notification");
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
      window.dispatchEvent(new Event("taskflow-notification"));
    } catch {
      toast.error("Could not mark all as read");
    }
  };

  const filteredItems = items.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getIconForType = (type) => {
    switch (type) {
      case "project":
        return <FolderKanban size={18} />;
      case "comment":
        return <MessageSquare size={18} />;
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">ACTIVITY FEED</span>
          <h1>Notifications</h1>
          <p className="muted">
            Stay up to date with project assignments, comments, and workspace activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="secondary-btn" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="notifications-toolbar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({items.length})
          </button>
          <button
            className={`filter-tab ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-tab ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read ({items.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="notification-list">
        {filteredItems.map((n) => (
          <div
            className={`notification-item ${n.read ? "read" : "unread"}`}
            key={n._id}
          >
            <div className="notification-icon">
              {getIconForType(n.type)}
            </div>

            <div className="notification-copy">
              <p>{n.message}</p>
              <small>
                <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {formatTime(n.createdAt)}
              </small>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {n.link && (
                <Link
                  to={n.link}
                  className="outline-btn"
                  style={{ padding: "6px 12px", fontSize: "11.5px" }}
                >
                  View <ArrowRight size={13} />
                </Link>
              )}

              {!n.read && (
                <button className="mark-read" onClick={() => markRead(n._id)}>
                  <Check size={14} /> Mark read
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Bell size={26} />
            </div>
            <h3>
              {filter === "unread"
                ? "No unread notifications"
                : "You're completely caught up"}
            </h3>
            <p>
              {filter === "unread"
                ? "You have acknowledged all recent project alerts and comments."
                : "New updates from your team and assigned tasks will appear here."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
