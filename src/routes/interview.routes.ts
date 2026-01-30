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

router.use(authMiddleware);

router.post("/questions/generate", generateQuestions);

router.post("/", createInterview);
router.get("/", getInterviews);
router.get("/stats", getInterviewStats);
router.get("/:id", getInterview);

router.post("/:id/start", startInterview);
router.post("/:id/message", addMessage);
router.post("/:id/next", nextQuestion);
router.post("/:id/complete", completeInterview);
router.post("/:id/evaluate", evaluateInterview);

export const interviewRoutes = () => router;
