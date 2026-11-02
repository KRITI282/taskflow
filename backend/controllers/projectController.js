import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { notifyUser } from "../socket/socket.js";

export async function listProjects(req, res, next) {
  try {
    const projects = await Project.find({ members: req.user._id }).populate("owner", "name email").populate("members", "name email").sort({ updatedAt: -1 });
    res.json(projects);
  } catch (e) { next(e); }
}
export async function createProject(req, res, next) {
  try {
    const { name, description = "" } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Project name is required" });
    const project = await Project.create({ name, description, owner: req.user._id, members: [req.user._id] });
    await project.populate("owner members", "name email");
    res.status(201).json(project);
  } catch (e) { next(e); }
}
export async function getProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, members: req.user._id }).populate("owner", "name email").populate("members", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (e) { next(e); }
}
export async function updateProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found or you are not the owner" });
    project.name = req.body.name ?? project.name;
    project.description = req.body.description ?? project.description;
    await project.save();
    await project.populate("owner members", "name email");
    res.json(project);
  } catch (e) { next(e); }
}
export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found or you are not the owner" });
    res.json({ message: "Project deleted" });
  } catch (e) { next(e); }
}
export async function addMember(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found or you are not the owner" });
    const email = (req.body.email || "").toLowerCase().trim();
    const member = await User.findOne({ email });
    if (!member) return res.status(404).json({ message: "No registered user found with that email" });
    if (!project.members.some(id => id.equals(member._id))) project.members.push(member._id);
    await project.save();
    const note = await Notification.create({ user: member._id, message: `You were added to project "${project.name}"`, type: "project", link: `/projects/${project._id}` });
    notifyUser(member._id.toString(), note);
    await project.populate("owner members", "name email");
    res.json(project);
  } catch (e) { next(e); }
}
