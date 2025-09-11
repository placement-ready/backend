import express from "express";
import { getResume, createResume, updateResume, deleteResume, getResumeById } from "../controllers/resume.controller";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validation";
import { resumeInfoSchema, idParamSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

export const resumeRoutes = () => {
	router.use(authenticateToken);

	router.get("/", asyncHandler(getResume));
	router.post("/", validateBody(resumeInfoSchema), asyncHandler(createResume));
	router.put("/", validateBody(resumeInfoSchema), asyncHandler(updateResume));
	router.delete("/", asyncHandler(deleteResume));

	// GET resume by ID (admin only)
	router.get("/:id", authorizeRoles("admin"), validateParams(idParamSchema), asyncHandler(getResumeById));

	return router;
};
