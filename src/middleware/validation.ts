import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse } from "../types";

export const validate = (schema: z.ZodSchema, target: "body" | "params" | "query" = "body") => {
	return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
		const dataToValidate = target === "body" ? req.body : target === "params" ? req.params : req.query;

		const result = schema.safeParse(dataToValidate);

		if (!result.success) {
			const errors = result.error.issues.map((issue) => {
				const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
				return `${path}${issue.message}`;
			});

			res.status(400).json({
				success: false,
				error: "Validation failed",
				errors,
			});
			return;
		}

		// Replace the target with sanitized and validated value
		if (target === "body") {
			req.body = result.data as any;
		} else if (target === "params") {
			req.params = result.data as any;
		} else {
			req.query = result.data as any;
		}

		next();
	};
};

// Specific validation middleware functions
export const validateBody = (schema: z.ZodSchema) => validate(schema, "body");
export const validateParams = (schema: z.ZodSchema) => validate(schema, "params");
export const validateQuery = (schema: z.ZodSchema) => validate(schema, "query");

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
	if (req.body) {
		sanitizeObject(req.body);
	}
	if (req.query) {
		sanitizeObject(req.query);
	}
	if (req.params) {
		sanitizeObject(req.params);
	}
	next();
};

function sanitizeObject(obj: any) {
	if (typeof obj !== "object" || obj === null) return;

	for (const key in obj) {
		if (typeof obj[key] === "string") {
			// Remove potentially dangerous characters
			obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
			obj[key] = obj[key].replace(/javascript:/gi, "");
			obj[key] = obj[key].replace(/on\w+\s*=/gi, "");
		} else if (typeof obj[key] === "object") {
			sanitizeObject(obj[key]);
		}
	}
}
