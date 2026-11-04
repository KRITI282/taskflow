import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Connection caching for Serverless environments (e.g. Vercel)
let isConnected = false;
export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn("[TaskFlow] Warning: MONGO_URI is not set in environment variables!");
    return;
  }
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("[TaskFlow] MongoDB connection established.");
  } catch (err) {
    console.error("[TaskFlow] MongoDB connection failed:", err.message);
    throw err;
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/projects", projectRoutes);
app.use("/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);
app.use("/tasks", taskRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

// Static frontend serving if public folder exists
const publicPath = path.join(__dirname, "public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/auth") ||
      req.path.startsWith("/projects") && req.method !== "GET"
    ) {
      return next();
    }
    const indexPath = path.join(publicPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  app.get(["/", "/api"], (_req, res) => {
    res.json({ message: "TaskFlow Unified API is running", status: "healthy" });
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[TaskFlow API Error]", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

export default app;
