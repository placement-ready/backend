# HireMind Backend ⚙️

![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb&logoColor=white)

> Lean, TypeScript-first API powering HireMind's user profile and interview experiences.

## Features ⚡

- **Minimal Surface**: Focused endpoints for `/user`, `/interview`, and `/resume`.
- **Strict Typing**: End-to-end TypeScript safety.
- **Fast**: Optimized for speed with a tiny middleware stack.

## API Overview 📡

| Method | Path                 | Purpose                                       |
| ------ | -------------------- | --------------------------------------------- |
| `GET`  | `/health`            | Infrastructure heartbeat                      |
| `GET`  | `/user/me`           | Authenticated user profile                    |
| `POST` | `/interview/start`   | Initialize interview session                  |
| `POST` | `/interview/message` | Conversation turn                             |
| `GET`  | `/interview/history` | User's past interviews                        |

## Getting Started 🛠️

1. **Setup**: Run the setup script.
   ```bash
   ./setup.sh
   # Sets up .env and installs dependencies
   ```

2. **Run**: Start the server.
   ```bash
   npm run dev
   # Runs on localhost:4000
   ```

## Environment Variables

| Variable      | Default                              | Description                   |
| ------------- | ------------------------------------ | ----------------------------- |
| `PORT`        | `4000`                               | Server port                   |
| `MONGODB_URI` | `mongodb://localhost:27017/hiremind` | Database connection string    |
| `CORS_ORIGIN` | `http://localhost:3000`              | Allowed frontend origin       |
