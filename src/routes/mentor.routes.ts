import express from "express";
import { mentorResponse } from "../controllers/mentor.controller";
import { authenticateToken } from "../middleware";
const router = express.Router();

const mentorRoutes = () => {
	router.post("/", authenticateToken, mentorResponse);
	return router;
};

export { mentorRoutes };
