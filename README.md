# ResolveX – Full Stack Civic Issue Platform

A complete MERN stack application for reporting and tracking civic issues.

## Project Structure
```
resolvex-full/
├── server/          Express + MongoDB + Socket.io backend
└── client/          React + Vite + Tailwind CSS frontend
```

## Quick Start (Development)

### 1. Setup the backend
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT secrets, and ImageKit keys
npm run dev        # Starts on http://localhost:5000
```

### 2. Seed an admin user (optional)
```bash
# In server/.env set: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
npm run seed:admin
```

### 3. Setup the frontend
```bash
cd client
npm install
npm run dev        # Starts on http://localhost:5173
```
The Vite dev server proxies `/api` and `/socket.io` to `localhost:5000` — no extra config needed.

## Production Build
```bash
cd client && npm run build          # Outputs to client/dist/
cd ../server && NODE_ENV=production npm start
# Backend serves client/dist as static files + handles SPA routing
```

## Features
- 🗺️  Report issues with map pin, images, category, and location
- 📊  Real-time status tracking via Socket.io
- 👍  Upvote system with live counter updates
- 💬  Nested comment threads (max depth 3)
- 🔔  In-app notifications
- 🛡️  Role-based access: user / moderator / admin
- 📈  Public analytics dashboard with charts
- 🔍  Full-text search with debounced filters
- 📱  Fully responsive mobile-first design
- 🔐  HttpOnly cookie auth with auto token refresh

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.io |
| Auth | JWT (access + refresh) via httpOnly cookies |
| Images | ImageKit (upload, thumbnail, delete) |
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand |
| Routing | React Router v6 |
| HTTP | Axios with auto-refresh interceptor |
| Maps | React-Leaflet + OpenStreetMap |

## API Base URL
`http://localhost:5000/api/v1`

## Default Roles
- **user** — report issues, comment, upvote
- **moderator** — admin panel, update any issue status
- **admin** — all moderator rights + manage users
