import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
    createResume,
    getResumes,
    getRecentResumes,
    getResume,
    startResumeSession,
    addResumeMessage,
    generateResume,
    renameResume,
    deleteResume,
} from "../controllers/resume.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Resume CRUD (recent must be before :id to avoid route conflict)
router.post("/", createResume);
router.get("/", getResumes);
router.get("/recent", getRecentResumes);
router.get("/:id", getResume);

// Resume session actions
router.post("/:id/start", startResumeSession);
router.post("/:id/message", addResumeMessage);
router.post("/:id/generate", generateResume);

// Resume management
router.patch("/:id/rename", renameResume);
router.delete("/:id", deleteResume);

export const resumeRoutes = () => router;
