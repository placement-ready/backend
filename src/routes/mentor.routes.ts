import express from "express";
import { mentorResponse } from "../controllers/mentor.controller";
import { authenticateToken } from "../middleware";
import { validateBody } from "../middleware/validation";
import { mentorRequestSchema } from "../validations/schemas";

const router = express.Router();

const mentorRoutes = () => {
	router.post("/", authenticateToken, validateBody(mentorRequestSchema), mentorResponse);
	return router;
};

export { mentorRoutes };
