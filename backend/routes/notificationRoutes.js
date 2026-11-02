import { Router } from "express";
import auth from "../middleware/auth.js";
import { listNotifications, markRead } from "../controllers/notificationController.js";
const router = Router();
router.use(auth);
router.get("/", listNotifications);
router.patch("/:id/read", markRead);
export default router;
