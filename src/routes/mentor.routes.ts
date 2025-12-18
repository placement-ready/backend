import express from "express";
import { mentorResponse } from "../controllers/mentor.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

const mentorRoutes = () => {
	router.post("/", authMiddleware, mentorResponse);
	return router;
};

export { mentorRoutes };
