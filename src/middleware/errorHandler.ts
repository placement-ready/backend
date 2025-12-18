import { NextFunction, Request, Response } from "express";

type KnownError = {
	status?: number;
	statusCode?: number;
	message?: string;
	stack?: string;
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
	const typedError = err as KnownError | undefined;
	if (typedError?.stack) {
		console.error(typedError.stack);
	} else {
		console.error(err);
	}

	const status = typedError?.statusCode || typedError?.status || 500;
	const message = typedError?.message || "Internal Server Error";

	res.status(status).json({
		message,
	});
}
