import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FolderKanban,
  Plus,
  Calendar,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Search,
  Users
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const outletCtx = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
      ]);
      setProjects(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load workspace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      await api.post("/projects", form);
      toast.success("Project created successfully!");
      setForm({ name: "", description: "" });
      setShowModal(false);
      await loadData();
      outletCtx?.refreshSidebar?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics computation
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "Todo").length;
  const activeTasks = totalTasks - doneTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Unique team members across projects
  const uniqueMembers = new Set(
    projects.flatMap((p) => p.members?.map((m) => m._id || m) || [])
  ).size;

  // Urgent & Due Soon tasks (not Done, sorted by dueDate)
  const upcomingTasks = tasks
    .filter((t) => t.status !== "Done" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  // Filter projects by search
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <>
      {/* Header Banner */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">{todayStr}</span>
          <h1>
            {getGreeting()}, {user?.name?.split(" ")[0]}{" "}
            <span className="wave">✦</span>
          </h1>
          <p className="muted">
            Here's what's happening across your team's projects today.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> New project
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Workspace Progress Banner */}
      <div className="workspace-progress-banner">
        <div className="progress-banner-info">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="stat-pill" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--brand-500)" }}>
              Workspace Pulse
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {doneTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <h3>Your Team Productivity</h3>
          <p>
            {completionPercentage >= 75
              ? "Outstanding momentum! You're crushing this sprint."
              : completionPercentage >= 40
              ? "Solid progress across active workstreams."
              : "Kickstart your momentum with priority tasks today."}
          </p>
        </div>

        <div className="progress-banner-stats">
          <div className="progress-bar-container">
            <div className="progress-bar-header">
              <span>Overall Completion</span>
              <strong style={{ color: "var(--brand-500)", fontSize: "15px" }}>
                {completionPercentage}%
              </strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Elevated Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Projects</span>
            <div className="stat-icon purple">
              <FolderKanban size={20} />
            </div>
          </div>
          <strong>{projects.length}</strong>
          <small>Active workspaces</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Tasks</span>
            <div className="stat-icon orange">
              <CircleDashed size={20} />
            </div>
          </div>
          <strong>{activeTasks}</strong>
          <small>{inProgressTasks} in progress · {todoTasks} todo</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Completed</span>
            <div className="stat-icon green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{doneTasks}</strong>
          <small>Tasks checked off</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Team Members</span>
            <div className="stat-icon blue">
              <Users size={20} />
            </div>
          </div>
          <strong>{uniqueMembers || 1}</strong>
          <small>Collaborating together</small>
        </div>
      </div>

      {/* Urgent & Upcoming Tasks Section (If any) */}
      {upcomingTasks.length > 0 && (
        <section className="section-block" style={{ marginTop: "24px" }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">ATTENTION NEEDED</span>
              <h2>Upcoming & Priority Deadlines</h2>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {upcomingTasks.map((task) => {
              const isOverdue = new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);
              return (
                <div
                  key={task._id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <span
                      className={`date-pill ${isOverdue ? "overdue" : ""}`}
                      style={{ fontSize: "11px" }}
                    >
                      {isOverdue && <AlertTriangle size={12} />}
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <strong style={{ fontSize: "13.5px", color: "var(--text-main)" }}>
                    {task.title}
                  </strong>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      {task.assignee?.name || "Unassigned"}
                    </span>
                    <Link
                      to={`/projects/${task.project}`}
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--brand-500)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      View board <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Projects Section */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR WORK</span>
            <h2>Recent Projects</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="filter-input-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Link className="text-link" to="/projects">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FolderKanban size={26} />
            </div>
            <h3>
              {searchQuery ? "No matching projects found" : "Your workspace starts here"}
            </h3>
            <p>
              {searchQuery
                ? `No projects matched "${searchQuery}". Try a different keyword.`
                : "Create your first project and bring your tasks and team together."}
            </p>
            {!searchQuery && (
              <button
                className="primary-btn"
                onClick={() => setShowModal(true)}
              >
                <Plus size={17} /> Create a project
              </button>
            )}
          </div>
        ) : (
          <div className="project-grid">
            {filteredProjects.slice(0, 6).map((project, i) => {
              // Calculate completion for this project
              const projTasks = tasks.filter((t) => t.project === project._id);
              const projDone = projTasks.filter((t) => t.status === "Done").length;
              const projPct = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;

              return (
                <Link
                  className="project-card"
                  to={`/projects/${project._id}`}
                  key={project._id}
                >
                  <div className="project-card-header">
                    <div className={`project-color color-${i % 4}`}>
                      <FolderKanban size={22} />
                    </div>

                    <div className="project-card-actions">
                      <span className="project-tag">
                        {project.members?.length || 1} {project.members?.length === 1 ? "member" : "members"}
                      </span>
                      <div className="icon-btn">
                        <ArrowUpRight size={17} />
                      </div>
                    </div>
                  </div>

                  <h3>{project.name}</h3>
                  <p>{project.description || "No description added yet."}</p>

                  {/* Mini Progress */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>
                      <span>{projTasks.length} {projTasks.length === 1 ? "task" : "tasks"}</span>
                      <span style={{ fontWeight: "700", color: "var(--brand-500)" }}>{projPct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: "6px" }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${projPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <div className="member-stack">
                      {project.members?.slice(0, 4).map((m) => (
                        <span
                          className="avatar tiny"
                          title={m.name || "Member"}
                          key={m._id || m}
                        >
                          {(m.name?.[0] || "U").toUpperCase()}
                        </span>
                      ))}
                      {project.members?.length > 4 && (
                        <span className="member-more-count">
                          +{project.members.length - 4}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "600" }}>
                      Open Board →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Project Modal */}
      {showModal && (
        <Modal
          title="Create a New Project"
          subtitle="Set up a workspace to track goals and coordinate tasks."
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleCreateProject} className="modal-form">
            <label>
              Project Name
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Website Redesign Q4"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what this project aims to accomplish…"
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn full"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
