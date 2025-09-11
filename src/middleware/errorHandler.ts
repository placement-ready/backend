import { Request, Response, NextFunction } from "express";
import { ApiResponse, CustomError } from "../types";

// Custom error class
export class AppError extends Error implements CustomError {
	statusCode: number;
	isOperational: boolean;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

// Error handling middleware
export const errorHandler = (
	error: CustomError,
	req: Request,
	res: Response<ApiResponse>,
	next: NextFunction
): void => {
	let { statusCode = 500, message } = error;

	// Handle different types of errors
	if (error.name === "ValidationError") {
		statusCode = 400;
		message = "Validation Error";
	} else if (error.name === "CastError") {
		statusCode = 400;
		message = "Invalid ID format";
	} else if (error.name === "MongoServerError" && (error as any).code === 11000) {
		statusCode = 409;
		message = "Duplicate field value";
	} else if (error.name === "JsonWebTokenError") {
		statusCode = 401;
		message = "Invalid token";
	} else if (error.name === "TokenExpiredError") {
		statusCode = 401;
		message = "Token expired";
	} else if (error.name === "MulterError") {
		statusCode = 400;
		message = "File upload error";
	}

	// Log error for debugging (in development)
	if (process.env.NODE_ENV === "development") {
		console.error("Error Details:", {
			message: error.message,
			stack: error.stack,
			statusCode,
			url: req.url,
			method: req.method,
			body: req.body,
			params: req.params,
			query: req.query,
			user: req.user?.userId,
		});
	} else {
		// In production, log only essential information
		console.error("Error:", {
			message: error.message,
			statusCode,
			url: req.url,
			method: req.method,
			user: req.user?.userId,
			timestamp: new Date().toISOString(),
		});
	}

	// Send error response
	res.status(statusCode).json({
		success: false,
		error: message,
		...(process.env.NODE_ENV === "development" && {
			stack: error.stack,
			details: error,
		}),
	});
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response<ApiResponse>): void => {
	res.status(404).json({
		success: false,
		error: "Route not found",
		message: `Cannot ${req.method} ${req.originalUrl}`,
	});
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

// Create specific error types
export const createNotFoundError = (resource: string): AppError => {
	return new AppError(`${resource} not found`, 404);
};

export const createValidationError = (message: string): AppError => {
	return new AppError(message, 400);
};

export const createUnauthorizedError = (message: string = "Unauthorized"): AppError => {
	return new AppError(message, 401);
};

export const createForbiddenError = (message: string = "Forbidden"): AppError => {
	return new AppError(message, 403);
};

export const createConflictError = (message: string): AppError => {
	return new AppError(message, 409);
};

export const createInternalError = (message: string = "Internal server error"): AppError => {
	return new AppError(message, 500);
};
