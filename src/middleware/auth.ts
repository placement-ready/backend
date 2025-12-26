import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../auth/betterAuth";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	if (!session) return res.status(401).json({ message: "Unauthorized" });

	req.user = session.user;
	next();
}
