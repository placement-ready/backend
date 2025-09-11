import express from "express";
import { seedResumeTemplates } from "../controllers/admin.controller";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = express.Router();

const adminRoutes = () => {
	router.use(authenticateToken);
	router.use(authorizeRoles("admin"));

	router.get("/seed", seedResumeTemplates);

	return router;
};

export { adminRoutes };
