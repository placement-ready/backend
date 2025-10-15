import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import { authRoutes } from "./routes/auth.routes";
import { googleRoutes } from "./routes/google.routes";
import { userRoutes } from "./routes/user.routes";
import { mentorRoutes } from "./routes/mentor.routes";
import { templateRoutes } from "./routes/template.routes";
import { resumeRoutes } from "./routes/resume.routes";
import { pdfRoutes } from "./routes/pdf.routes";
// meeting connection 
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socket.controller";
import meetingRoutes  from "./routes/meeting.routes";

import {
	requestLogger,
	errorHandler,
	notFoundHandler,
	generalRateLimit,
	authRateLimit,
	securityHeaders,
	sanitizeInput,
	requestSizeLimit,
} from "./middleware";
import { config } from "./config";

// Load environment variables
dotenv.config();

const app: Express = express();

//creating websocket server
const server = createServer(app);
const io = connectToSocket(server);
// Security middleware
app.use(securityHeaders);
app.use(compression());
app.use(requestSizeLimit);
app.use(sanitizeInput);

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// CORS configuration
app.use(
	cors({
		origin: config.cors.origin,
		methods: config.cors.methods,
		allowedHeaders: config.cors.allowedHeaders,
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(generalRateLimit);

// API routes with specific rate limiting
app.use("/api/auth", authRateLimit, authRoutes());
app.use("/api/google", authRateLimit, googleRoutes());
app.use("/api/user", userRoutes());
app.use("/api/mentor", mentorRoutes());
app.use("/api/templates", templateRoutes());
app.use("/api/resume", resumeRoutes());
app.use("/api/pdf", pdfRoutes());
app.use("/api/meetings", meetingRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the HireMind API",
		version: "1.0.0",
		documentation: "/api/docs",
	});
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
