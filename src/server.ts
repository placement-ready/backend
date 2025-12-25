import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { getAuth } from "./auth/betterAuth";

// Importing middleware and utilities
import { requestLogger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import rateLimiter from "./middleware/rateLimiter";
import { config } from "./config";
import cookieParser from "cookie-parser";

// Importing route handlers
import { templateRoutes } from "./routes/template.routes";
import { resumeRoutes } from "./routes/resume.routes";

const app = express();

// Root route
app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the HireMind API",
	});
});

// Health check route
app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Request logging
app.use(requestLogger);

// CORS configuration
app.use(
	cors({
		origin: config.cors.origin,
		methods: config.cors.methods,
		credentials: true,
	})
);

// Rate limiting
app.use(rateLimiter);

// Auth routes
app.all("/api/auth/*any", (req, res) => {
	return toNodeHandler(getAuth())(req, res);
});

// Parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// API routes
app.use("/api/templates", templateRoutes());
app.use("/api/resume", resumeRoutes());

// Get current session
app.get("/api/me", async (req, res) => {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session) {
		return res.status(401).json({ user: null });
	}

	return res.json(session);
});

// Error handling middleware
app.use((req, res) => {
	res.status(404).json({
		error: {
			message: "Route not found",
			path: req.path,
		},
	});
});

app.use(errorHandler);

export default app;
