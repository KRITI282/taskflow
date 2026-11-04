import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MessageSquare,
  Trash2,
  Users,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Crown,
  AlertTriangle,
  Edit2,
  CheckCircle2,
  Clock,
  Send,
  MoreVertical
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

const STATUSES = ["Todo", "In Progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function ProjectBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'list'

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    dueDate: "",
    assignee: "",
  });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");

  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });

  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);

  // Task Details & Edit & Comments
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskEditForm, setTaskEditForm] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
      setProjectForm({
        name: projRes.data.name,
        description: projRes.data.description || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setSubmitting(true);
      await api.post("/tasks", {
        ...taskForm,
        project: id,
        dueDate: taskForm.dueDate || null,
        assignee: taskForm.assignee || null,
      });
      toast.success("Task created successfully!");
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        dueDate: "",
        assignee: "",
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  // Change Status (via Drag or Select)
  const handleChangeStatus = async (task, newStatus) => {
    if (task.status === newStatus) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      toast.info(`Task moved to ${newStatus}`);
    } catch (err) {
      toast.error("Could not update task status");
      loadData();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      await handleChangeStatus(task, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Delete Task
  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted");
      if (selectedTask?._id === task._id) {
        setSelectedTask(null);
      }
      loadData();
    } catch (err) {
      toast.error("Unable to delete task");
    }
  };

  // Open Task Modal & Comments
  const handleOpenTask = async (task) => {
    setSelectedTask(task);
    setIsEditingTask(false);
    setTaskEditForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assignee: task.assignee?._id || task.assignee || "",
    });

    try {
      const res = await api.get(`/tasks/${task._id}/comments`);
      setComments(res.data);
    } catch {
      setComments([]);
    }
  };

  // Save Task Edits
  const handleSaveTaskEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/tasks/${selectedTask._id}`, {
        ...taskEditForm,
        dueDate: taskEditForm.dueDate || null,
        assignee: taskEditForm.assignee || null,
      });
      toast.success("Task updated!");
      setSelectedTask(res.data);
      setIsEditingTask(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    try {
      setSendingComment(true);
      const res = await api.post(`/tasks/${selectedTask._id}/comments`, {
        message: newComment.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Could not post comment");
    } finally {
      setSendingComment(false);
    }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${id}/members`, {
        email: memberEmail.trim(),
      });
      setProject(res.data);
      toast.success("Member added to project!");
      setShowMemberModal(false);
      setMemberEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add member");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Project Details
  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/projects/${id}`, projectForm);
      setProject(res.data);
      toast.success("Project updated!");
      setShowEditProjectModal(false);
      outletCtx?.refreshSidebar?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    try {
      setSubmitting(true);
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      outletCtx?.refreshSidebar?.();
      navigate("/projects");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !project) {
    return <div className="center-screen">Loading project workspace…</div>;
  }

  if (!project) {
    return (
      <div className="center-screen">
        <div style={{ textAlign: "center" }}>
          <p>{error || "Project not found or access denied."}</p>
          <Link to="/projects" className="primary-btn" style={{ marginTop: "14px" }}>
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = project.owner?._id === user?.id || project.owner === user?.id;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      priorityFilter === "All" || t.priority.toLowerCase() === priorityFilter.toLowerCase();

    const matchesAssignee =
      assigneeFilter === "All" ||
      (assigneeFilter === "unassigned" && !t.assignee) ||
      t.assignee?._id === assigneeFilter ||
      t.assignee === assigneeFilter;

    return matchesQuery && matchesPriority && matchesAssignee;
  });

  // Project progress
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <>
      <Link to="/projects" className="back-link">
        <ArrowLeft size={16} /> All projects
      </Link>

      {/* Title & Actions Row */}
      <div className="board-title-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="eyebrow">KANBAN WORKSPACE</span>
            {isOwner && (
              <span
                className="project-tag"
                style={{
                  color: "var(--brand-500)",
                  borderColor: "var(--brand-200)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                }}
              >
                <Crown size={12} /> Project Owner
              </span>
            )}
          </div>
          <h1>{project.name}</h1>
          <p className="muted">
            {project.description || "Organize tasks and keep your team moving forward."}
          </p>
        </div>

        <div className="board-actions">
          {isOwner && (
            <button
              className="outline-btn"
              onClick={() => setShowEditProjectModal(true)}
              title="Edit project name and description"
            >
              <Edit2 size={16} /> Edit
            </button>
          )}

          <button
            className="secondary-btn"
            onClick={() => setShowMemberModal(true)}
          >
            <UserPlus size={16} /> Members ({project.members?.length || 1})
          </button>

          <button
            className="primary-btn"
            onClick={() => {
              setTaskForm({
                title: "",
                description: "",
                status: "Todo",
                priority: "Medium",
                dueDate: "",
                assignee: "",
              });
              setShowTaskModal(true);
            }}
          >
            <Plus size={17} /> Add task
          </button>

          {isOwner && (
            <button
              className="icon-btn icon-btn-danger"
              style={{ width: "38px", height: "38px", border: "1px solid var(--border-card)" }}
              onClick={() => setShowDeleteProjectModal(true)}
              title="Delete project"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress & Meta Info Bar */}
      <div className="board-meta">
        <div className="board-meta-left">
          <div className="member-stack">
            {project.members?.map((m) => (
              <span
                className="avatar tiny"
                title={`${m.name} (${m.email})`}
                key={m._id || m}
              >
                {(m.name?.[0] || "U").toUpperCase()}
              </span>
            ))}
          </div>

          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            <strong>{project.members?.length || 1}</strong>{" "}
            {project.members?.length === 1 ? "collaborator" : "collaborators"}
          </span>
        </div>

        {/* Board Completion Metric */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
            {doneCount} of {tasks.length} tasks done
          </span>
          <div className="progress-track" style={{ flex: 1, height: "7px" }}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--brand-500)" }}>
            {progressPct}%
          </span>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Filter and View Mode Toolbar */}
      <div className="board-toolbar">
        <div className="filter-input-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search board tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="filter-select"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="All">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {project.members?.map((m) => (
            <option key={m._id || m} value={m._id || m}>
              {m.name || "Member"}
            </option>
          ))}
        </select>

        {/* View mode toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === "kanban" ? "active" : ""}`}
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid size={14} /> Kanban
          </button>
          <button
            className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {/* Kanban Board Mode */}
      {viewMode === "kanban" ? (
        <div className="kanban">
          {STATUSES.map((status, i) => {
            const columnTasks = filteredTasks.filter((t) => t.status === status);
            const isOver = dragOverColumn === status;

            return (
              <section
                key={status}
                className={`kanban-column ${isOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="column-heading">
                  <span className={`column-dot dot-${i}`} />
                  <h3>{status}</h3>
                  <span className="count">{columnTasks.length}</span>

                  <button
                    className="icon-btn"
                    title={`Add task to ${status}`}
                    onClick={() => {
                      setTaskForm({
                        title: "",
                        description: "",
                        status,
                        priority: "Medium",
                        dueDate: "",
                        assignee: "",
                      });
                      setShowTaskModal(true);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="task-list">
                  {columnTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      task.status !== "Done" &&
                      new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);

                    return (
                      <article
                        key={task._id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                      >
                        <div className="task-card-top">
                          <span className={`priority priority-${task.priority.toLowerCase()}`}>
                            {task.priority === "High" && <AlertTriangle size={11} />}
                            {task.priority}
                          </span>

                          <button
                            className="icon-btn icon-btn-danger"
                            onClick={() => handleDeleteTask(task)}
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <button
                          className="task-title"
                          onClick={() => handleOpenTask(task)}
                        >
                          {task.title}
                        </button>

                        {task.description && <p>{task.description}</p>}

                        <div className="task-card-bottom">
                          <span className="task-assignee">
                            {task.assignee ? (
                              <>
                                <span className="avatar tiny">
                                  {(task.assignee.name?.[0] || "U").toUpperCase()}
                                </span>
                                <span>{task.assignee.name}</span>
                              </>
                            ) : (
                              <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>
                                Unassigned
                              </span>
                            )}
                          </span>

                          <button
                            className="icon-btn"
                            onClick={() => handleOpenTask(task)}
                            title="Comments and details"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </div>

                        <div className="task-controls">
                          <select
                            value={task.status}
                            onChange={(e) => handleChangeStatus(task, e.target.value)}
                            aria-label="Change task status"
                          >
                            {STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>

                          {task.dueDate && (
                            <span className={`date-pill ${isOverdue ? "overdue" : ""}`}>
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button
                  className="add-task-inline"
                  onClick={() => {
                    setTaskForm({
                      title: "",
                      description: "",
                      status,
                      priority: "Medium",
                      dueDate: "",
                      assignee: "",
                    });
                    setShowTaskModal(true);
                  }}
                >
                  <Plus size={15} /> Add a task
                </button>
              </section>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    task.status !== "Done" &&
                    new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);

                  return (
                    <tr key={task._id}>
                      <td>
                        <button
                          onClick={() => handleOpenTask(task)}
                          style={{
                            fontWeight: "700",
                            color: "var(--text-main)",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          {task.title}
                        </button>
                        {task.description && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              maxWidth: "280px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <select
                          className="filter-select"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          value={task.status}
                          onChange={(e) => handleChangeStatus(task, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <span className={`priority priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td>
                        {task.assignee ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="avatar tiny">
                              {(task.assignee.name?.[0] || "U").toUpperCase()}
                            </span>
                            <span style={{ fontSize: "12px" }}>{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td>
                        {task.dueDate ? (
                          <span className={`date-pill ${isOverdue ? "overdue" : ""}`}>
                            <Calendar size={13} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                            No deadline
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="icon-btn"
                            onClick={() => handleOpenTask(task)}
                            title="Open details"
                          >
                            <MessageSquare size={15} />
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            onClick={() => handleDeleteTask(task)}
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <Modal
          title="Create a New Task"
          subtitle="Add a task card to keep work organized and actionable."
          onClose={() => setShowTaskModal(false)}
        >
          <form className="modal-form" onSubmit={handleCreateTask}>
            <label>
              Task Title
              <input
                autoFocus
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
                placeholder="What needs to get done?"
              />
            </label>

            <label>
              Description
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Provide helpful context, requirements, or links…"
              />
            </label>

            <div className="form-row">
              <label>
                Status
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Assign To
                <select
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project.members?.map((m) => (
                    <option value={m._id || m} key={m._id || m}>
                      {m.name || "Member"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn full"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Details & Edit & Comments Modal */}
      {selectedTask && (
        <Modal
          title={isEditingTask ? "Edit Task" : selectedTask.title}
          subtitle={`Created in ${project.name}`}
          maxWidth="600px"
          onClose={() => {
            setSelectedTask(null);
            setIsEditingTask(false);
          }}
        >
          {isEditingTask ? (
            <form className="modal-form" onSubmit={handleSaveTaskEdit}>
              <label>
                Title
                <input
                  value={taskEditForm.title}
                  onChange={(e) =>
                    setTaskEditForm({ ...taskEditForm, title: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={taskEditForm.description}
                  onChange={(e) =>
                    setTaskEditForm({ ...taskEditForm, description: e.target.value })
                  }
                />
              </label>

              <div className="form-row">
                <label>
                  Status
                  <select
                    value={taskEditForm.status}
                    onChange={(e) =>
                      setTaskEditForm({ ...taskEditForm, status: e.target.value })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={taskEditForm.priority}
                    onChange={(e) =>
                      setTaskEditForm({ ...taskEditForm, priority: e.target.value })
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Assignee
                  <select
                    value={taskEditForm.assignee}
                    onChange={(e) =>
                      setTaskEditForm({ ...taskEditForm, assignee: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map((m) => (
                      <option value={m._id || m} key={m._id || m}>
                        {m.name || "Member"}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Due Date
                  <input
                    type="date"
                    value={taskEditForm.dueDate}
                    onChange={(e) =>
                      setTaskEditForm({ ...taskEditForm, dueDate: e.target.value })
                    }
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="outline-btn full"
                  onClick={() => setIsEditingTask(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn full"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="task-detail">
              <p>{selectedTask.description || "No description provided."}</p>

              <div className="detail-line">
                <strong>Status</strong>
                <span className="count">{selectedTask.status}</span>
              </div>

              <div className="detail-line">
                <strong>Priority</strong>
                <span className={`priority priority-${selectedTask.priority.toLowerCase()}`}>
                  {selectedTask.priority}
                </span>
              </div>

              <div className="detail-line">
                <strong>Assignee</strong>
                <span>
                  {selectedTask.assignee?.name ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span className="avatar tiny">
                        {selectedTask.assignee.name[0].toUpperCase()}
                      </span>
                      {selectedTask.assignee.name}
                    </span>
                  ) : (
                    "Unassigned"
                  )}
                </span>
              </div>

              <div className="detail-line">
                <strong>Due Date</strong>
                <span>
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString()
                    : "None set"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  className="secondary-btn full"
                  onClick={() => setIsEditingTask(true)}
                >
                  <Edit2 size={15} /> Edit Details
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => handleDeleteTask(selectedTask)}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Comments Section */}
              <h4>Comments & Activity ({comments.length})</h4>

              <div className="comments-list">
                {comments.map((c) => (
                  <div className="comment-item" key={c._id}>
                    <span className="avatar tiny">
                      {(c.user?.name?.[0] || "U").toUpperCase()}
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong>{c.user?.name || "User"}</strong>
                      <p>{c.message}</p>
                      <small>{new Date(c.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="muted" style={{ margin: "6px 0", fontSize: "13px" }}>
                    No comments yet. Start the conversation below.
                  </p>
                )}
              </div>

              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment or update…"
                  required
                />
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={sendingComment}
                >
                  <Send size={15} /> Send
                </button>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal
          title="Manage Project Members"
          subtitle="Collaborate by inviting existing TaskFlow users."
          onClose={() => setShowMemberModal(false)}
        >
          <div style={{ marginBottom: "20px" }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: "8px" }}>
              CURRENT MEMBERS
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {project.members?.map((m) => {
                const isProjectOwner =
                  project.owner?._id === m._id || project.owner === m._id;
                return (
                  <div
                    key={m._id || m}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-subtle)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="avatar small">
                        {(m.name?.[0] || "U").toUpperCase()}
                      </span>
                      <div>
                        <strong style={{ fontSize: "13px", display: "block" }}>
                          {m.name || "Member"}
                        </strong>
                        <small style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {m.email}
                        </small>
                      </div>
                    </div>

                    {isProjectOwner ? (
                      <span
                        className="project-tag"
                        style={{
                          color: "var(--brand-500)",
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
                  </div>
                );
              })}
            </div>
          </div>

          {isOwner && (
            <form className="modal-form" onSubmit={handleAddMember}>
              <span className="eyebrow">INVITE NEW MEMBER</span>
              <label>
                Teammate Email Address
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </label>

              <button
                type="submit"
                className="primary-btn full"
                disabled={submitting}
              >
                {submitting ? "Inviting…" : "Add Member"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <Modal
          title="Edit Project Details"
          subtitle="Update the title and description for this project."
          onClose={() => setShowEditProjectModal(false)}
        >
          <form className="modal-form" onSubmit={handleEditProject}>
            <label>
              Project Name
              <input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setShowEditProjectModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn full"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Project Modal */}
      {showDeleteProjectModal && (
        <Modal
          title="Delete Project"
          subtitle="Permanent action"
          onClose={() => setShowDeleteProjectModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              Are you sure you want to permanently delete <strong>{project.name}</strong>?
              All columns, tasks, and comments will be erased.
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => setShowDeleteProjectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn full"
                onClick={handleDeleteProject}
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
