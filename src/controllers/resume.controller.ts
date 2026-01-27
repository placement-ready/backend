import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { ResumeMetadata, ResumeContent, ResumeChatMessage } from "../models";

// Helper to compute progress from completed sections
async function getResumeProgress(sessionId: string): Promise<number> {
	const content = await ResumeContent.findOne({ sessionId }).lean();
	const completedCount = content?.completedSections?.length || 0;
	const totalSections = 9;
	return Math.round((completedCount / totalSections) * 100);
}

// Create a new resume session
export const createResume = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { title, jobDescription, targetRole, targetCompany } = req.body;

		const sessionId = nanoid(12);

		// Create resume metadata
		const resume = new ResumeMetadata({
			userId,
			sessionId,
			title: title || "Untitled Resume",
			status: "gathering", // draft state
			jobDescription,
			targetRole,
			targetCompany,
		});

		await resume.save();

		// Create empty resume content
		const content = new ResumeContent({
			sessionId,
			personalInfo: {},
			experience: [],
			education: [],
			skills: [],
			projects: [],
			certifications: [],
			languages: [],
			achievements: [],
			completedSections: [],
			currentSection: "personalInfo",
			isComplete: false,
			refineMode: false,
		});

		await content.save();

		const progress = await getResumeProgress(sessionId);

		res.status(201).json({
			success: true,
			resume: {
				id: resume._id,
				sessionId: resume.sessionId,
				title: resume.title,
				status: resume.status,
				progress,
				targetRole: resume.targetRole,
				createdAt: resume.createdAt,
				updatedAt: resume.updatedAt,
			},
		});
	} catch (error: any) {
		console.error("createResume error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Get all resumes for user
export const getResumes = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { status, limit = 10, page = 1 } = req.query;

		const query: any = { userId };
		if (status) {
			query.status = status;
		}

		const resumes = await ResumeMetadata.find(query)
			.sort({ updatedAt: -1 })
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit))
			.lean();

		const resumesWithProgress = await Promise.all(
			resumes.map(async (resume) => {
				const progress = await getResumeProgress(resume.sessionId);
				return {
					id: resume._id,
					sessionId: resume.sessionId,
					title: resume.title || "Untitled Resume",
					status: resume.status,
					progress,
					targetRole: resume.targetRole,
					createdAt: resume.createdAt,
					updatedAt: resume.updatedAt,
				};
			}),
		);

		const total = await ResumeMetadata.countDocuments(query);

		res.status(200).json({ success: true, resumes: resumesWithProgress, total });
	} catch (error: any) {
		console.error("getResumes error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Get recent resumes for user
export const getRecentResumes = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const limit = parseInt(req.query.limit as string) || 3;

		const resumes = await ResumeMetadata.find({ userId })
			.sort({ updatedAt: -1 })
			.limit(limit)
			.lean();

		const resumesWithProgress = await Promise.all(
			resumes.map(async (resume) => {
				const progress = await getResumeProgress(resume.sessionId);
				return {
					id: resume._id,
					sessionId: resume.sessionId,
					title: resume.title || "Untitled Resume",
					status: resume.status,
					progress,
					targetRole: resume.targetRole,
					createdAt: resume.createdAt,
					updatedAt: resume.updatedAt,
				};
			}),
		);

		res.status(200).json({ success: true, resumes: resumesWithProgress });
	} catch (error: any) {
		console.error("getRecentResumes error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Get single resume by ID or sessionId
export const getResume = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;

		// Try to find by sessionId first, then by _id
		let resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			resume = await ResumeMetadata.findOne({ _id: id, userId });
		}

		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		const progress = await getResumeProgress(resume.sessionId);
		const content = await ResumeContent.findOne({ sessionId: resume.sessionId }).lean();
		const messages = await ResumeChatMessage.find({ sessionId: resume.sessionId })
			.sort({ timestamp: 1 })
			.lean();

		res.status(200).json({
			success: true,
			resume: {
				id: resume._id,
				sessionId: resume.sessionId,
				title: resume.title,
				status: resume.status,
				progress,
				targetRole: resume.targetRole,
				targetCompany: resume.targetCompany,
				jobDescription: resume.jobDescription,
				createdAt: resume.createdAt,
				updatedAt: resume.updatedAt,
				content: content || null,
				messages: messages.map((m) => ({
					role: m.role,
					content: m.content,
					timestamp: m.timestamp,
				})),
			},
		});
	} catch (error: any) {
		console.error("getResume error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Start a resume session
export const startResumeSession = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;

		const resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		if (resume.status !== "gathering") {
			res
				.status(400)
				.json({ success: false, message: "Resume session already started or completed" });
			return;
		}

		resume.status = "reviewing";
		await resume.save();

		// Add first AI message
		const welcomeMessage = new ResumeChatMessage({
			sessionId: id,
			role: "assistant",
			content:
				"Welcome to the Resume Builder! I'll help you create a professional resume. Let's start with your personal information. What's your full name?",
			timestamp: new Date(),
		});

		await welcomeMessage.save();

		const progress = await getResumeProgress(id);

		res.status(200).json({
			success: true,
			resume: {
				id: resume._id,
				sessionId: resume.sessionId,
				title: resume.title,
				status: resume.status,
				progress,
			},
			message: welcomeMessage,
		});
	} catch (error: any) {
		console.error("startResumeSession error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Add a message to resume session
export const addResumeMessage = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;
		const { content } = req.body;

		if (!content?.trim()) {
			res.status(400).json({ success: false, message: "Message content is required" });
			return;
		}

		const resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		if (resume.status === "completed") {
			res.status(400).json({ success: false, message: "Resume already completed" });
			return;
		}

		// Add user message
		const userMessage = new ResumeChatMessage({
			sessionId: id,
			role: "user",
			content: content.trim(),
			timestamp: new Date(),
		});

		await userMessage.save();

		res.status(200).json({
			success: true,
			message: {
				role: userMessage.role,
				content: userMessage.content,
				timestamp: userMessage.timestamp,
			},
		});
	} catch (error: any) {
		console.error("addResumeMessage error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Generate resume (mark as completed)
export const generateResume = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;

		const resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		if (resume.status === "completed") {
			res.status(400).json({ success: false, message: "Resume already generated" });
			return;
		}

		// Get resume content
		const content = await ResumeContent.findOne({ sessionId: id });
		if (!content) {
			res.status(400).json({ success: false, message: "Resume content not found" });
			return;
		}

		// Mark as completed
		resume.status = "completed";
		content.isComplete = true;

		await Promise.all([resume.save(), content.save()]);

		const progress = await getResumeProgress(id);

		res.status(200).json({
			success: true,
			resume: {
				id: resume._id,
				sessionId: resume.sessionId,
				title: resume.title,
				status: resume.status,
				progress,
			},
			content: {
				personalInfo: content.personalInfo,
				summary: content.summary,
				experience: content.experience,
				education: content.education,
				skills: content.skills,
				projects: content.projects,
				certifications: content.certifications,
				languages: content.languages,
				achievements: content.achievements,
			},
			message: "Resume generated successfully",
		});
	} catch (error: any) {
		console.error("generateResume error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Rename a resume
export const renameResume = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;
		const { title } = req.body;

		if (!title?.trim()) {
			res.status(400).json({ success: false, message: "Title is required" });
			return;
		}

		const resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		resume.title = title.trim();
		await resume.save();

		res.status(200).json({
			success: true,
			title: resume.title,
		});
	} catch (error: any) {
		console.error("renameResume error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Delete a resume and all related data
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const { id } = req.params;

		const resume = await ResumeMetadata.findOne({ sessionId: id, userId });
		if (!resume) {
			res.status(404).json({ success: false, message: "Resume not found" });
			return;
		}

		// Delete all related data
		await Promise.all([
			ResumeMetadata.deleteOne({ sessionId: id }),
			ResumeContent.deleteOne({ sessionId: id }),
			ResumeChatMessage.deleteMany({ sessionId: id }),
		]);

		res.status(200).json({ success: true, message: "Resume deleted successfully" });
	} catch (error: any) {
		console.error("deleteResume error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};
