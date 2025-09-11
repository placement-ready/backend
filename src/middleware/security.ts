import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ApiResponse } from "../types";

// Rate limiting configurations
export const generalRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: {
		success: false,
		error: "Too many requests, please try again later",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: {
		success: false,
		error: "Too many authentication attempts, please try again later",
	},
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true,
});

export const pdfRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	message: {
		success: false,
		error: "PDF generation rate limit exceeded, please try again later",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Security headers
export const securityHeaders = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
		},
	},
	crossOriginEmbedderPolicy: false,
});

// File access security middleware
export const validateTemplatePath = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
	const { templateFile } = req.body;

	if (templateFile) {
		if (templateFile.includes("..") || templateFile.includes("/") || templateFile.includes("\\")) {
			res.status(400).json({
				success: false,
				error: "Invalid template file path",
			});
			return;
		}

		// Only allow specific file extensions
		const allowedExtensions = [".html", ".hbs", ".handlebars"];
		const fileExtension = templateFile.substring(templateFile.lastIndexOf("."));

		if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
			res.status(400).json({
				success: false,
				error: "Invalid template file extension",
			});
			return;
		}
	}

	next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
	const contentLength = req.get("content-length");
	const maxSize = 1024 * 1024 * 5;
	if (contentLength && parseInt(contentLength) > maxSize) {
		res.status(413).json({
			success: false,
			error: "Request payload too large",
		});
		return;
	}

	next();
};

// CORS validation
export const validateOrigin = (req: Request, res: Response, next: NextFunction): void => {
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
	const origin = req.get("origin");

	if (origin && !allowedOrigins.includes(origin)) {
		res.status(403).json({
			success: false,
			error: "Origin not allowed",
		});
		return;
	}

	next();
};
