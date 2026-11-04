import http from "http";
import { Server } from "socket.io";
import app, { connectDB } from "./app.js";
import { setIO } from "./socket/socket.js";

const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});
setIO(io);

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`TaskFlow Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to database connection error:", err.message);
  });

export { app, server };
