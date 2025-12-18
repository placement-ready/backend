import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
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
