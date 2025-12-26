# HireMind Backend

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Express](https://img.shields.io/badge/Express-Minimalist-black?logo=express&logoColor=white)](https://expressjs.com/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Ready-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

> Lean, TypeScript-first API powering HireMind's user profile and interview experiences. Currently undergoing a clean-room rewrite focused on five core endpoints and zero bloat.

## Highlights

- **Minimal surface**: only `/health`, `/user/me`, and `/interview/*` endpoints survive the purge.
- **Strict typing**: end-to-end TypeScript with lightweight domain models.
- **Mongo-ready**: thin connection layer (re)built for fast local dev + easy Atlas deploys.
- **Ship-fast mindset**: tiny middleware stack, opinionated API responses, batteries-optional.

## API Surface

| Method | Path                 | Purpose                                       |
| ------ | -------------------- | --------------------------------------------- |
| `GET`  | `/health`            | Infra heartbeat + uptime snapshot             |
| `GET`  | `/user/me`           | Return the authenticated HireMind user        |
| `POST` | `/interview/start`   | Open a new mock interview session             |
| `POST` | `/interview/message` | Send conversation turns within a session      |
| `GET`  | `/interview/history` | Fetch the user's recent interview transcripts |

## Getting Started

1. **Install**: `cd backend && npm install`
2. **Configure**: copy `.env.example` → `.env` and set the essentials below.
3. **Run**: `npm run dev` (hot reload) or `npm run build && npm start` for production smoke tests.

## Environment

| Variable      | Description                   | Example                              |
| ------------- | ----------------------------- | ------------------------------------ |
| `PORT`        | HTTP port                     | `4000`                               |
| `NODE_ENV`    | `development` \| `production` | `development`                        |
| `MONGODB_URI` | Mongo connection string       | `mongodb://localhost:27017/hiremind` |
| `CORS_ORIGIN` | Allowed frontend origin(s)    | `http://localhost:3000`              |

## Scripts

| Command         | Description                                       |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Start the TypeScript watcher + nodemon dev server |
| `npm run build` | Compile to `dist/` via `tsc`                      |
| `npm start`     | Serve the compiled build                          |
