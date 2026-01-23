import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
	createInterview,
	getInterviews,
	getInterview,
	startInterview,
	addMessage,
	nextQuestion,
	completeInterview,
	getInterviewStats,
	generateQuestions,
	evaluateInterview,
} from "../controllers/interview.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// AI-powered question generation (must be before /:id to avoid route conflict)
router.post("/questions/generate", generateQuestions);

// Interview CRUD
router.post("/", createInterview);
router.get("/", getInterviews);
router.get("/stats", getInterviewStats);
router.get("/:id", getInterview);

// Interview session actions
router.post("/:id/start", startInterview);
router.post("/:id/message", addMessage);
router.post("/:id/next", nextQuestion);
router.post("/:id/complete", completeInterview);
router.post("/:id/evaluate", evaluateInterview);

export const interviewRoutes = () => router;
