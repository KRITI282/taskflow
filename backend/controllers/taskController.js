import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import { notifyUser } from "../socket/socket.js";

async function accessibleProject(projectId, userId) {
  return Project.findOne({ _id: projectId, members: userId });
}
export async function listTasks(req, res, next) {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await accessibleProject(req.query.project, req.user._id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      filter.project = project._id;
    } else {
      const projects = await Project.find({ members: req.user._id }).select("_id");
      filter.project = { $in: projects.map(p => p._id) };
    }
    const tasks = await Task.find(filter).populate("assignee", "name email").populate("createdBy", "name").sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) { next(e); }
}
export async function createTask(req, res, next) {
  try {
    const { title, description = "", project: projectId, status = "Todo", priority = "Medium", dueDate = null, assignee = null } = req.body;
    const project = await accessibleProject(projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!title?.trim()) return res.status(400).json({ message: "Task title is required" });
    if (assignee && !project.members.some(id => id.equals(assignee))) return res.status(400).json({ message: "Assignee must be a project member" });
    const task = await Task.create({ title, description, project: projectId, status, priority, dueDate: dueDate || null, assignee, createdBy: req.user._id });
    await task.populate("assignee", "name email");
    await task.populate("createdBy", "name");
    if (assignee) {
      const note = await Notification.create({ user: assignee, message: `You were assigned "${task.title}"`, type: "task", link: `/projects/${projectId}` });
      notifyUser(assignee.toString(), note);
    }
    res.status(201).json(task);
  } catch (e) { next(e); }
}
export async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await accessibleProject(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: "Access denied" });
    const allowed = ["title", "description", "status", "priority", "dueDate", "assignee"];
    for (const key of allowed) if (req.body[key] !== undefined) task[key] = req.body[key] || (key === "assignee" || key === "dueDate" ? null : task[key]);
    if (task.assignee && !project.members.some(id => id.equals(task.assignee))) return res.status(400).json({ message: "Assignee must be a project member" });
    await task.save();
    await task.populate("assignee", "name email");
    await task.populate("createdBy", "name");
    res.json(task);
  } catch (e) { next(e); }
}
export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await accessibleProject(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: "Access denied" });
    await task.deleteOne();
    await Comment.deleteMany({ task: task._id });
    res.json({ message: "Task deleted" });
  } catch (e) { next(e); }
}
export async function listComments(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !(await accessibleProject(task.project, req.user._id))) return res.status(404).json({ message: "Task not found" });
    const comments = await Comment.find({ task: task._id }).populate("user", "name").sort({ createdAt: 1 });
    res.json(comments);
  } catch (e) { next(e); }
}
export async function addComment(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !(await accessibleProject(task.project, req.user._id))) return res.status(404).json({ message: "Task not found" });
    if (!req.body.message?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });
    const comment = await Comment.create({ task: task._id, user: req.user._id, message: req.body.message });
    await comment.populate("user", "name");
    const recipients = new Set([task.createdBy.toString(), ...(task.assignee ? [task.assignee.toString()] : [])]);
    recipients.delete(req.user._id.toString());
    for (const recipient of recipients) {
      const note = await Notification.create({ user: recipient, message: `${req.user.name} commented on "${task.title}"`, type: "comment", link: `/projects/${task.project}` });
      notifyUser(recipient, note);
    }
    res.status(201).json(comment);
  } catch (e) { next(e); }
}
