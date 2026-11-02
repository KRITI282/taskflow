import Notification from "../models/Notification.js";
export async function listNotifications(req, res, next) {
  try {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(items);
  } catch (e) { next(e); }
}
export async function markRead(req, res, next) {
  try {
    const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
    if (!item) return res.status(404).json({ message: "Notification not found" });
    res.json(item);
  } catch (e) { next(e); }
}
