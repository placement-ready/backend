import express, { Express, Request, Response } from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth/betterAuth";

// Importing route handlers
import { userRoutes } from "./routes/user.routes";
import { mentorRoutes } from "./routes/mentor.routes";
import { templateRoutes } from "./routes/template.routes";
import { resumeRoutes } from "./routes/resume.routes";

// Importing middleware and utilities
import { requestLogger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import rateLimiter from "./middleware/rateLimiter";
import { config } from "./config";
import cookieParser from "cookie-parser";

const app: Express = express();

// Root route
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the HireMind API",
		version: "0.2.0",
	});
});

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
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

// Auth routes
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiting
// app.use(rateLimiter);

// API routes
app.use("/api/user", userRoutes());
app.use("/api/mentor", mentorRoutes());
app.use("/api/templates", templateRoutes());
app.use("/api/resume", resumeRoutes());

// Get current session
app.get("/api/me", async (req, res) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	console.log("Session info:", session);
	return res.json(session);
});

// Error handling middleware
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: {
			message: "Route not found",
			path: req.path,
		},
	});
});

app.use(errorHandler);

export default app;
