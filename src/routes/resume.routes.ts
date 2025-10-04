import express from "express";
import {
	getResume,
	createResume,
	updateResume,
	deleteResume,
	getResumeById,
	compileResume,
} from "../controllers/resume.controller";
import { authenticateToken } from "../middleware/auth";
import { validateParams } from "../middleware/validation";
import { idParamSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

export const resumeRoutes = () => {
	router.use(authenticateToken);

	router.get("/", asyncHandler(getResume));
	router.get("/:id", validateParams(idParamSchema), asyncHandler(getResumeById));
	router.post("/", asyncHandler(createResume));
	router.put("/", asyncHandler(updateResume));
	router.post("/compile", asyncHandler(compileResume));
	router.delete("/:id", asyncHandler(deleteResume));

	return router;
};
