/**
 * Resume Export Controller
 * Handles HTML generation, preview, and PDF download
 */

import { Request, Response } from "express";
import { ResumeContent } from "../models";
import { resumeRenderService, ResumeData } from "../services/resumeRender.service";

/**
 * Generate HTML from resume data and cache it
 */
export async function generateResumeHtml(req: Request, res: Response): Promise<void> {
	const { resumeId, data } = req.body;

	if (!resumeId) {
		res.status(400).json({ error: "resumeId is required" });
		return;
	}

	let resumeData: ResumeData;

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

	const validation = resumeRenderService.validateData(resumeData);
	if (!validation.valid) {
		res.status(400).json({ success: false, error: validation.error });
		return;
	}

	resumeRenderService.renderHtml(resumeId, resumeData);
	res.status(200).json({ success: true, resumeId });
}

/**
 * Serve rendered HTML for browser preview
 */
export async function previewResume(req: Request, res: Response): Promise<void> {
	const { resumeId } = req.params;

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

		html = resumeRenderService.renderHtml(resumeId, resumeData);
	}

	res.setHeader("Content-Type", "text/html");
	res.send(html);
}

/**
 * Generate PDF and stream to client
 */
export async function downloadResumePdf(req: Request, res: Response): Promise<void> {
	const { resumeId } = req.params;

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

		const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
		const name = content?.personalInfo?.fullName || "Resume";
		const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Resume.pdf"`);
		res.send(pdfBuffer);
	} catch (error) {
		console.error("PDF generation failed:", error);
		res.status(500).json({ error: "Failed to generate PDF" });
	}
}
