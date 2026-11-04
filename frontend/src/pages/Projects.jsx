import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  ArrowUpRight,
  Search,
  LayoutGrid,
  List,
  Crown,
  Users,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const outletCtx = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const [deletingProject, setDeletingProject] = useState(null);

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
      setError(err.response?.data?.message || "Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setSubmitting(true);
      await api.post("/projects", createForm);
      toast.success("Project created successfully!");
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      await loadData();
      outletCtx?.refreshSidebar?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editingProject) return;

    try {
      setSubmitting(true);
      await api.put(`/projects/${editingProject._id}`, editForm);
      toast.success("Project updated!");
      setEditingProject(null);
      await loadData();
      outletCtx?.refreshSidebar?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;

    try {
      setSubmitting(true);
      await api.delete(`/projects/${deletingProject._id}`);
      toast.success("Project deleted successfully");
      setDeletingProject(null);
      await loadData();
      outletCtx?.refreshSidebar?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">WORKSPACE DIRECTORY</span>
          <h1>Projects</h1>
          <p className="muted">
            Manage your initiatives, organize workflows, and track team progress.
          </p>
        </div>

        <button className="primary-btn" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New project
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Toolbar */}
      <div className="board-toolbar">
        <div className="filter-input-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Filter projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "4px" }}>
          {filtered.length} {filtered.length === 1 ? "project" : "projects"} found
        </span>

        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <LayoutGrid size={15} /> Grid
          </button>
          <button
            className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table list view"
          >
            <List size={15} /> List
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="empty-state wide">
          <div className="empty-icon">
            <FolderKanban size={26} />
          </div>
          <h3>{search ? "No matching projects" : "No projects yet"}</h3>
          <p>
            {search
              ? `No projects matched "${search}". Try searching for something else.`
              : "Create a project to start planning sprints and collaborating with your team."}
          </p>
          {!search && (
            <button className="primary-btn" onClick={() => setShowCreate(true)}>
              <Plus size={17} /> Create project
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="project-grid">
          {filtered.map((p, i) => {
            const isOwner = p.owner?._id === user?.id || p.owner === user?.id;
            const pTasks = tasks.filter((t) => t.project === p._id);
            const pDone = pTasks.filter((t) => t.status === "Done").length;
            const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <div key={p._id} className="project-card">
                <div className="project-card-header">
                  <div className={`project-color color-${i % 4}`}>
                    <FolderKanban size={22} />
                  </div>

                  <div className="project-card-actions">
                    {isOwner && (
                      <span
                        className="project-tag"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--brand-500)",
                          borderColor: "var(--brand-200)",
                        }}
                      >
                        <Crown size={12} /> Owner
                      </span>
                    )}

                    <span className="project-tag">
                      {p.members?.length || 1} {p.members?.length === 1 ? "member" : "members"}
                    </span>

                    {isOwner && (
                      <button
                        className="icon-btn"
                        title="Edit Project"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingProject(p);
                          setEditForm({ name: p.name, description: p.description || "" });
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {isOwner && (
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete Project"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeletingProject(p);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <Link to={`/projects/${p._id}`}>
                  <h3>{p.name}</h3>
                </Link>
                <p>{p.description || "No description added yet."}</p>

                {/* Progress bar */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                    }}
                  >
                    <span>
                      {pTasks.length} {pTasks.length === 1 ? "task" : "tasks"} · {pDone} done
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--brand-500)" }}>
                      {pPct}%
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "6px" }}>
                    <div className="progress-fill" style={{ width: `${pPct}%` }} />
                  </div>
                </div>

                <div className="project-card-footer">
                  <div className="member-stack">
                    {p.members?.slice(0, 5).map((m) => (
                      <span
                        className="avatar tiny"
                        title={m.name || "Member"}
                        key={m._id || m}
                      >
                        {(m.name?.[0] || "U").toUpperCase()}
                      </span>
                    ))}
                    {p.members?.length > 5 && (
                      <span className="member-more-count">
                        +{p.members.length - 5}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/projects/${p._id}`}
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "var(--brand-500)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Open Board <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Role</th>
                <th>Tasks</th>
                <th>Progress</th>
                <th>Team</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isOwner = p.owner?._id === user?.id || p.owner === user?.id;
                const pTasks = tasks.filter((t) => t.project === p._id);
                const pDone = pTasks.filter((t) => t.status === "Done").length;
                const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                return (
                  <tr key={p._id}>
                    <td>
                      <Link
                        to={`/projects/${p._id}`}
                        style={{ fontWeight: "700", color: "var(--text-main)" }}
                      >
                        {p.name}
                      </Link>
                      {p.description && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            maxWidth: "320px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.description}
                        </div>
                      )}
                    </td>

                    <td>
                      {isOwner ? (
                        <span
                          className="project-tag"
                          style={{
                            color: "var(--brand-500)",
                            borderColor: "var(--brand-200)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Crown size={12} /> Owner
                        </span>
                      ) : (
                        <span className="project-tag">Member</span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                        {pTasks.length} {pTasks.length === 1 ? "task" : "tasks"}
                      </span>
                    </td>

                    <td style={{ minWidth: "140px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div className="progress-track" style={{ flex: 1, height: "6px" }}>
                          <div className="progress-fill" style={{ width: `${pPct}%` }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700" }}>{pPct}%</span>
                      </div>
                    </td>

                    <td>
                      <div className="member-stack">
                        {p.members?.slice(0, 4).map((m) => (
                          <span
                            className="avatar tiny"
                            title={m.name || "Member"}
                            key={m._id || m}
                          >
                            {(m.name?.[0] || "U").toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Link
                          to={`/projects/${p._id}`}
                          className="secondary-btn"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          Open
                        </Link>
                        {isOwner && (
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => {
                              setEditingProject(p);
                              setEditForm({ name: p.name, description: p.description || "" });
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {isOwner && (
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Delete"
                            onClick={() => setDeletingProject(p)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="Create a New Project"
          subtitle="Start organizing tasks with your team."
          onClose={() => setShowCreate(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <label>
              Project Name
              <input
                autoFocus
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                placeholder="e.g. Mobile Application v2"
              />
            </label>

            <label>
              Description
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="What is this project about?"
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn full" disabled={submitting}>
                {submitting ? "Creating…" : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <Modal
          title="Edit Project Details"
          subtitle="Update the project name or description."
          onClose={() => setEditingProject(null)}
        >
          <form className="modal-form" onSubmit={handleEdit}>
            <label>
              Project Name
              <input
                autoFocus
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn full" disabled={submitting}>
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <Modal
          title="Delete Project"
          subtitle="This action cannot be undone."
          onClose={() => setDeletingProject(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              Are you sure you want to delete <strong>{deletingProject.name}</strong>? All
              associated tasks and comments will be permanently removed.
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setDeletingProject(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn full"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Deleting…" : "Yes, Delete Project"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
