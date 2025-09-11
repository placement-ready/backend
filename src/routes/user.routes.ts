import express from "express";
import { getProfile, updateProfile } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { updateProfileSchema } from "../validations/schemas";

const router = express.Router();

const userRoutes = () => {
	router.get("/profile", authenticateToken, getProfile);
	router.put("/profile", authenticateToken, validateBody(updateProfileSchema), updateProfile);

	return router;
};

export { userRoutes };
