import { NextFunction, Request, Response } from "express";
import { isProd } from "../config";

type KnownError = {
	status?: number;
	statusCode?: number;
	message?: string;
	stack?: string;
	name?: string;
	code?: string | number;
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
	const error = err as KnownError;

	const status =
		error?.statusCode || error?.status || (error?.name === "ValidationError" ? 400 : 500);

	if (isProd) {
		console.error(
			JSON.stringify({
				message: error?.message || "Internal Server Error",
				status,
				path: req.originalUrl,
				method: req.method,
				code: error?.code,
			})
		);
	} else {
		console.error(error?.stack || error);
	}

	// 🔐 Response (safe)
	res.status(status).json({
		message:
			isProd && status === 500
				? "Internal Server Error"
				: error?.message || "Internal Server Error",
	});
}
