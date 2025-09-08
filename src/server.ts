import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { config } from "./config";
import { authRoutes } from "./routes/auth.routes";
import { googleRoutes } from "./routes/google.routes";
import { userRoutes } from "./routes/user.routes";
import { requestLogger } from "./middleware";
import resumeTemplatesRouter from './routes/template.routes';
import resumeInfoRouter from './routes/resumeInfo.routes';
import pdfRouter from "./routes/pdf.routes";

// Load environment variables
dotenv.config();

const app: Express = express();

app.use("/api/health", async (req: Request, res: Response) => {
	res.status(200).json({ status: "Ok! Server is running" });
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",   // The frontend dev URL (must match exactly)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use("/api/auth", authRoutes());
app.use("/api/google", googleRoutes());
app.use("/api/user", userRoutes());
app.use('/api/resume-templates', resumeTemplatesRouter);
app.use('/api/resume-info', resumeInfoRouter);
app.use("/api", pdfRouter);

// Root route
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({ message: "Welcome to the Placement Hub API" });
});

// 404 handler for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({
		error: {
			message: "Route not found",
			path: req.path,
		},
	});
});

export default app;
