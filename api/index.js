import app, { connectDB } from "../backend/app.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({
      message: "Database connection failed. Please ensure MONGO_URI is configured in Vercel settings.",
      error: err.message,
    });
  }

  return app(req, res);
}

