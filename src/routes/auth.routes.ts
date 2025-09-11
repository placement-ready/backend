import express from "express";
import {
	register,
	login,
	refreshToken,
	logout,
	logoutAll,
	checkEmailExists,
	checkEmailVerification,
	createVerificationToken,
	verifyEmail,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validation";
import { registerSchema, loginSchema, refreshTokenSchema, emailParamSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

const authRoutes = () => {
	// Public routes (no authentication required)
	router.post("/register", validateBody(registerSchema), asyncHandler(register));
	router.post("/login", validateBody(loginSchema), asyncHandler(login));
	router.post("/refresh-token", validateBody(refreshTokenSchema), asyncHandler(refreshToken));
	router.post("/verify-email", asyncHandler(verifyEmail));
	router.post("/create-verification-token", asyncHandler(createVerificationToken));

	// Utility routes
	router.get("/check-email/:email", validateParams(emailParamSchema), asyncHandler(checkEmailExists));
	router.get("/check-email-verification/:email", validateParams(emailParamSchema), asyncHandler(checkEmailVerification));

	// Protected routes (authentication required)
	router.post("/logout", authenticateToken, validateBody(refreshTokenSchema), asyncHandler(logout));
	router.post("/logout-all", authenticateToken, asyncHandler(logoutAll));

	return router;
};

export { authRoutes };
