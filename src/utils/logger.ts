import { Request, Response, NextFunction } from "express";
import { isProd } from "../config";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - start;

		if (isProd && res.statusCode < 400 && duration < 500) {
			return;
		}

		const log = {
			method: req.method,
			path: req.originalUrl,
			status: res.statusCode,
			duration: `${duration}ms`,
			ip: req.ip,
		};

		if (isProd) {
			console.log(JSON.stringify(log));
		} else {
			console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
		}
	});

	next();
};
