/**
 * Resume Render Routes
 * APIs for generate, preview, and download
 */

import { Router, Request, Response, NextFunction } from "express";
import { resumeRenderService, ResumeData } from "../services/resumeRender.service";
import { ResumeContent } from "../models";

const router = Router();

/**
 * Wrapper for async route handlers
 */
function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * POST /api/resume/generate
 * Generate HTML from resume data and cache it
 */
router.post(
    "/generate",
    asyncHandler(async (req: Request, res: Response) => {
        const { resumeId, data } = req.body;

        if (!resumeId) {
            res.status(400).json({ error: "resumeId is required" });
            return;
        }

        let resumeData: ResumeData;

        // If data is provided, use it; otherwise fetch from database
        if (data) {
            resumeData = data;
        } else {
            const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
            if (!content) {
                res.status(404).json({ error: "Resume not found" });
                return;
            }

            resumeData = {
                personalInfo: content.personalInfo || { fullName: "", email: "" },
                summary: content.summary || "",
                experience: content.experience || [],
                education: content.education || [],
                skills: content.skills || [],
                projects: content.projects || [],
                certifications: content.certifications || [],
                languages: content.languages || [],
                achievements: content.achievements || [],
            };
        }

        // Validate
        const validation = resumeRenderService.validateData(resumeData);
        if (!validation.valid) {
            res.status(400).json({ error: validation.error });
            return;
        }

        // Render HTML
        resumeRenderService.renderHtml(resumeId, resumeData);

        res.json({ status: "generated", resumeId });
    })
);

/**
 * GET /api/resume/:resumeId/preview
 * Serve rendered HTML for browser preview
 */
router.get(
    "/:resumeId/preview",
    asyncHandler(async (req: Request, res: Response) => {
        const { resumeId } = req.params;

        let html = resumeRenderService.getCachedHtml(resumeId);

        // If not cached, try to generate from database
        if (!html) {
            const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
            if (!content) {
                res.status(404).json({ error: "Resume not found" });
                return;
            }

            const resumeData: ResumeData = {
                personalInfo: content.personalInfo || { fullName: "", email: "" },
                summary: content.summary || "",
                experience: content.experience || [],
                education: content.education || [],
                skills: content.skills || [],
                projects: content.projects || [],
                certifications: content.certifications || [],
                languages: content.languages || [],
                achievements: content.achievements || [],
            };

            html = resumeRenderService.renderHtml(resumeId, resumeData);
        }

        res.setHeader("Content-Type", "text/html");
        res.send(html);
    })
);

/**
 * GET /api/resume/:resumeId/download
 * Generate PDF and stream to client
 */
router.get(
    "/:resumeId/download",
    asyncHandler(async (req: Request, res: Response) => {
        const { resumeId } = req.params;

        // Check if HTML exists in cache, if not generate it
        let html = resumeRenderService.getCachedHtml(resumeId);
        if (!html) {
            const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
            if (!content) {
                res.status(404).json({ error: "Resume not found" });
                return;
            }

            const resumeData: ResumeData = {
                personalInfo: content.personalInfo || { fullName: "", email: "" },
                summary: content.summary || "",
                experience: content.experience || [],
                education: content.education || [],
                skills: content.skills || [],
                projects: content.projects || [],
                certifications: content.certifications || [],
                languages: content.languages || [],
                achievements: content.achievements || [],
            };

            resumeRenderService.renderHtml(resumeId, resumeData);
        }

        try {
            const pdfBuffer = await resumeRenderService.generatePdf(resumeId);

            // Get name for filename
            const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
            const name = content?.personalInfo?.fullName || "Resume";
            const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${safeName}_Resume.pdf"`
            );
            res.send(pdfBuffer);
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            res.status(500).json({ error: "Failed to generate PDF" });
        }
    })
);

export const resumeRenderRoutes = () => router;
