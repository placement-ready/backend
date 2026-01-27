/**
 * Resume Export Routes
 * HTML generation, preview, and PDF download
 * Route: /api/resume-export
 */

import { Router, Request, Response, NextFunction } from "express";
import {
    generateResumeHtml,
    previewResume,
    downloadResumePdf,
} from "../controllers/resumeExport.controller";

const router = Router();

function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// POST /api/resume-export/generate - Generate HTML
router.post("/generate", asyncHandler(generateResumeHtml));

// GET /api/resume-export/:resumeId/preview - Preview HTML
router.get("/:resumeId/preview", asyncHandler(previewResume));

// GET /api/resume-export/:resumeId/download - Download PDF
router.get("/:resumeId/download", asyncHandler(downloadResumePdf));

export const resumeExportRoutes = () => router;
