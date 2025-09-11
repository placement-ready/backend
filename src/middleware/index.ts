export * from "./auth";
export * from "./errorHandler";
export * from "./security";
export * from "./validation";

import { Request, Response, NextFunction } from "express";
import morgan from "morgan";

// Enhanced request logger using morgan
export const requestLogger = morgan("combined", {
	skip: (req: Request, res: Response) => {
		// Skip logging in test environment
		return process.env.NODE_ENV === "test";
	},
});

// Simple request logger (fallback)
export const simpleRequestLogger = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();

	// Log when the request starts
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request received`);

	// Log when the response is sent
	res.on("finish", () => {
		const duration = Date.now() - start;
		console.log(
			`[${new Date().toISOString()}] ${req.method} ${req.url} - Response sent - Status: ${
				res.statusCode
			} - Duration: ${duration}ms`
		);
	});

	next();
};
