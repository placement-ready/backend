import { Router, Request, Response, NextFunction } from "express";
import { resumeRenderService, ResumeData } from "../services/resumeRender.service";
import { ResumeContent } from "../models";

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

function transformContentToTemplateFormat(content: any): ResumeData {
	const basics = {
		name: content.personalInfo?.fullName || "",
		email: content.personalInfo?.email || "",
		phone: content.personalInfo?.phone || null,
		linkedin: content.personalInfo?.linkedin || null,
		linkedinLabel: content.personalInfo?.linkedin ? "LinkedIn" : null,
		github: content.personalInfo?.github || null,
		githubLabel: content.personalInfo?.github ? "GitHub" : null,
		leetcode: content.personalInfo?.website || null,
		leetcodeLabel: content.personalInfo?.website ? "Portfolio" : null,
	};

	const education = (content.education || []).map((edu: any) => ({
		institution: edu.institution || "",
		degree: edu.field ? `${edu.degree} in ${edu.field}` : edu.degree || "",
		date: edu.endDate || edu.startDate || "",
		grade: edu.gpa ? `GPA: ${edu.gpa}` : null,
	}));

	const skills =
		content.skills && content.skills.length > 0
			? [{ label: "Technical Skills", items: content.skills.join(", ") }]
			: [];

	const internships = (content.experience || []).map((exp: any) => ({
		title: `${exp.role} at ${exp.company}`,
		period: exp.current
			? `${exp.startDate} – Present`
			: `${exp.startDate} – ${exp.endDate || "Present"}`,
		highlights: exp.highlights || [],
	}));

	const projects = (content.projects || []).map((proj: any) => ({
		name: proj.name || "",
		link: proj.url || null,
		highlights: proj.highlights || [proj.description].filter(Boolean),
	}));

	const certifications = (content.certifications || []).map((cert: string) => ({
		name: cert,
		period: "",
	}));

	return {
		basics,
		summary: content.summary || "",
		education,
		skills,
		internships,
		projects,
		certifications,
		achievements: content.achievements || [],
	};
}

router.post(
	"/generate",
	asyncHandler(async (req: Request, res: Response) => {
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

			resumeData = transformContentToTemplateFormat(content);
		}

		const validation = resumeRenderService.validateData(resumeData);
		if (!validation.valid) {
			res.status(400).json({ error: validation.error });
			return;
		}

		resumeRenderService.renderHtml(resumeId, resumeData);
		res.json({ status: "generated", resumeId });
	}),
);

router.get(
	"/:resumeId/preview",
	asyncHandler(async (req: Request, res: Response) => {
		const { resumeId } = req.params;

		let html = resumeRenderService.getCachedHtml(resumeId);

		if (!html) {
			const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
			if (!content) {
				res.status(404).json({ error: "Resume not found" });
				return;
			}

			const resumeData = transformContentToTemplateFormat(content);
			html = resumeRenderService.renderHtml(resumeId, resumeData);
		}

		res.setHeader("Content-Type", "text/html");
		res.send(html);
	}),
);

router.get(
	"/:resumeId/download",
	asyncHandler(async (req: Request, res: Response) => {
		const { resumeId } = req.params;

		let html = resumeRenderService.getCachedHtml(resumeId);
		if (!html) {
			const content = await ResumeContent.findOne({ sessionId: resumeId }).lean();
			if (!content) {
				res.status(404).json({ error: "Resume not found" });
				return;
			}

			const resumeData = transformContentToTemplateFormat(content);
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
		} catch (error: any) {
			console.error("PDF generation failed:", error);
			res.status(500).json({ error: "Failed to generate PDF" });
		}
	}),
);

export const resumeRenderRoutes = () => router;
