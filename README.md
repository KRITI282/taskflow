# TaskFlow – MERN Project Management Tool

A full-stack project management app built with React, Express, MongoDB, JWT authentication and Socket.IO.

## Features
- Register, log in and log out
- Create projects and add team members by email
- Project boards with To Do, In Progress and Done columns
- Create, edit, delete and assign tasks
- Task comments
- In-app notifications and live Socket.IO events
- Responsive dashboard UI

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas connection string

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
```
Set `MONGO_URI` and a long random `JWT_SECRET` in `backend/.env`.

```bash
npm install
npm run dev
```
Backend runs at http://localhost:5000.

### 2. Frontend
Open another terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs at http://localhost:5173.

## Notes
- Register a first user, then create a project.
- To add members, use the exact email address they registered with.
- Project and task APIs require a valid JWT.
- Socket.IO sends live notification events to connected users. The notification list is also persisted in MongoDB.
- This is a learning/project starter. Before production, add email verification, password reset, rate limiting, stronger validation, audit logging and deployment-specific CORS settings.

## Main API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET, POST /api/projects`
- `GET, PUT, DELETE /api/projects/:id`
- `POST /api/projects/:id/members`
- `GET, POST /api/tasks`
- `PUT, DELETE /api/tasks/:id`
- `GET, POST /api/tasks/:id/comments`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## Project structure
```text
taskflow/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    socket/
    server.js
  frontend/
    src/
      components/
      context/
      pages/
      services/
      App.jsx
      main.jsx
```
