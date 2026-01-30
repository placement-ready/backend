import { Router, Request, Response, NextFunction } from "express";
import {
	generateResumeHtml,
	previewResume,
	downloadResumePdf,
} from "../controllers/resumeExport.controller";

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

router.post("/generate", asyncHandler(generateResumeHtml));

router.get("/:resumeId/preview", asyncHandler(previewResume));

router.get("/:resumeId/download", asyncHandler(downloadResumePdf));

export const resumeExportRoutes = () => router;
