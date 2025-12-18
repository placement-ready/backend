import express from "express";
import { getProfile, updateProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

const userRoutes = () => {
	router.get("/profile", authMiddleware, getProfile);
	router.put("/profile", authMiddleware, updateProfile);

	return router;
};

export { userRoutes };
