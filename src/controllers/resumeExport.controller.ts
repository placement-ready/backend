import { Request, Response } from "express";
import { ResumeContent } from "../models";
import { resumeRenderService, ResumeData } from "../services/resumeRender.service";

function transformContentToTemplateFormat(content: any): ResumeData {
	// Transform personalInfo to basics
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

	// Transform education (add date field from startDate/endDate)
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

	// Transform experience to internships format
	const internships = (content.experience || []).map((exp: any) => ({
		title: `${exp.role} at ${exp.company}`,
		period: exp.current
			? `${exp.startDate} – Present`
			: `${exp.startDate} – ${exp.endDate || "Present"}`,
		highlights: exp.highlights || [],
	}));

	// Transform projects
	const projects = (content.projects || []).map((proj: any) => ({
		name: proj.name || "",
		link: proj.url || null,
		highlights: proj.highlights || [proj.description].filter(Boolean),
	}));

	// Transform certifications
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

		resumeData = transformContentToTemplateFormat(content);
	}

	const validation = resumeRenderService.validateData(resumeData);
	if (!validation.valid) {
		res.status(400).json({ success: false, error: validation.error });
		return;
	}

	resumeRenderService.renderHtml(resumeId, resumeData);
	res.status(200).json({ success: true, resumeId });
}

export async function previewResume(req: Request, res: Response): Promise<void> {
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
}

export async function downloadResumePdf(req: Request, res: Response): Promise<void> {
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
	} catch (error) {
		console.error("PDF generation failed:", error);
		res.status(500).json({ error: "Failed to generate PDF" });
	}
}
