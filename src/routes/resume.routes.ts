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

router.use(authMiddleware);

router.post("/", createResume);
router.get("/", getResumes);
router.get("/recent", getRecentResumes);
router.get("/:id", getResume);

router.post("/:id/start", startResumeSession);
router.post("/:id/message", addResumeMessage);
router.post("/:id/generate", generateResume);

router.patch("/:id/rename", renameResume);
router.delete("/:id", deleteResume);

export const resumeRoutes = () => router;
