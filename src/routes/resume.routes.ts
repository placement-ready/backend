import express from "express";
import {
	getResume,
	createResume,
	updateResume,
	deleteResume,
	getResumeById,
	compileResume,
} from "../controllers";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

export const resumeRoutes = () => {
	router.use(authMiddleware);

	router.get("/", getResume);
	router.get("/:id", getResumeById);
	router.post("/", createResume);
	router.put("/", updateResume);
	router.post("/compile", compileResume);
	router.delete("/:id", deleteResume);

	return router;
};
