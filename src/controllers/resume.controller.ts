import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { ResumeData, ResumeTemplate } from "../models/resume";
import { renderResume } from "../utils/renderResume";

function requireUser(req: Request, res: Response): { userId: string } | null {
	const user = req.user;
	if (!user?.id) {
		res.status(401).json({ success: false, error: "Authentication required" });
		return null;
	}
	return { userId: user.id };
}

function toObjectId(value: string) {
	if (!Types.ObjectId.isValid(value)) {
		return null;
	}
	return new Types.ObjectId(value);
}

// Get all user's resumes
export const getResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const payload = (req.body?.data ?? {}) as Record<string, any>;
		const resumeId = payload?._id ? toObjectId(payload._id) : null;
		const userObjectId = toObjectId(auth.userId);
		if (!resumeId || !userObjectId) {
			res.status(400).json({ success: false, error: "Invalid resume identifier" });
			return;
		}

		const resume = await ResumeData.findOne({ _id: resumeId, userId: userObjectId }).populate(
			"template"
		);
		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		if (Object.keys(payload).length > 0) {
			const updates = { ...payload } as Record<string, unknown>;
			delete updates._id;
			if (updates.template) {
				const templateId =
					typeof updates.template === "string" ? updates.template : (updates.template as any)?._id;
				const templateObjectId = templateId ? toObjectId(templateId) : null;
				if (!templateObjectId) {
					res.status(400).json({ success: false, error: "Invalid template identifier" });
					return;
				}
				updates.template = templateObjectId;
			}
			resume.set(updates);
			await resume.save();
			await resume.populate("template");
		}

		const templateDoc: any = resume.get("template");
		const templateFile = templateDoc?.templateFile;
		if (!templateFile) {
			res.status(400).json({ success: false, error: "Template file missing" });
			return;
		}

		const compiledHtml = await renderResume(templateFile, resume.toObject());

		res.status(200).json({
			success: true,
			message: "Resumes fetched successfully",
			data: resume,
		});
	} catch (error) {
		next(error);
	}
};

// Get resume by ID
export const getResumeById = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const resumeId = toObjectId("");
		const userObjectId = toObjectId(auth.userId);
		if (!resumeId || !userObjectId) {
			res.status(400).json({ success: false, error: "Invalid identifier supplied" });
			return;
		}

		const resume = await ResumeData.findOne({ _id: resumeId, userId: userObjectId })
			.populate("template")
			.exec();
		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Resume fetched successfully",
			data: resume,
		});
	} catch (error) {
		next(error);
	}
};

// Create new resume
export const createResume = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const userObjectId = toObjectId(auth.userId);
		if (!userObjectId) {
			res.status(400).json({ success: false, error: "Invalid user identifier" });
			return;
		}

		const data = req.body;
		const templateId = typeof data.template === "string" ? data.template : data.template?._id;
		const templateObjectId = templateId ? toObjectId(templateId) : null;
		if (!templateObjectId) {
			res.status(400).json({ success: false, error: "Template is required" });
			return;
		}

		const templateExists = await ResumeTemplate.exists({ _id: templateObjectId });
		if (!templateExists) {
			res.status(404).json({ success: false, error: "Template not found" });
			return;
		}

		const resume = new ResumeData({
			...data,
			userId: userObjectId,
			template: templateObjectId,
		});
		await resume.save();
		await resume.populate("template");

		res.status(201).json({
			success: true,
			message: "Resume created successfully",
			data: resume,
		});
	} catch (error) {
		next(error);
	}
};

// Update resume by ID
export const updateResume = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const resumeData = req.body;
		const userObjectId = toObjectId(auth.userId);
		const resumeId = resumeData?._id ? toObjectId(resumeData._id) : null;
		if (!userObjectId || !resumeId) {
			res.status(400).json({ success: false, error: "Invalid resume identifier" });
			return;
		}

		const resume = await ResumeData.findOne({ _id: resumeId, userId: userObjectId });
		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		const updates = { ...resumeData } as Record<string, unknown>;
		delete updates._id;

		const templateId =
			typeof resumeData.template === "string" ? resumeData.template : resumeData.template?._id;
		if (templateId) {
			const templateObjectId = toObjectId(templateId);
			if (!templateObjectId) {
				res.status(400).json({ success: false, error: "Invalid template identifier" });
				return;
			}

			const templateExists = await ResumeTemplate.exists({ _id: templateObjectId });
			if (!templateExists) {
				res.status(404).json({ success: false, error: "Template not found" });
				return;
			}

			updates.template = templateObjectId;
		}

		resume.set(updates);
		await resume.save();
		await resume.populate("template");

		res.status(200).json({
			success: true,
			message: "Resume updated successfully",
			data: resume,
		});
	} catch (error) {
		next(error);
	}
};

// Delete resume by ID
export const deleteResume = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const resumeId = toObjectId("");
		const userObjectId = toObjectId(auth.userId);
		if (!resumeId || !userObjectId) {
			res.status(400).json({ success: false, error: "Invalid resume identifier" });
			return;
		}

		const deleted = await ResumeData.findOneAndDelete({ _id: resumeId, userId: userObjectId });
		if (!deleted) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Resume deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const compileResume = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const auth = requireUser(req, res);
		if (!auth) return;

		const payload = req.body?.data ?? {};
		const resumeId = payload?._id ? toObjectId(payload._id) : null;
		const userObjectId = toObjectId(auth.userId);
		if (!resumeId || !userObjectId) {
			res.status(400).json({ success: false, error: "Invalid resume identifier" });
			return;
		}

		const resume = await ResumeData.findOne({ _id: resumeId, userId: userObjectId }).populate(
			"template"
		);
		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		if (Object.keys(payload).length > 0) {
			const updates = { ...payload } as Record<string, unknown>;
			delete updates._id;

			if (updates.template) {
				const templateId =
					typeof updates.template === "string" ? updates.template : (updates.template as any)?._id;
				const templateObjectId = templateId ? toObjectId(templateId) : null;
				if (!templateObjectId) {
					res.status(400).json({ success: false, error: "Invalid template identifier" });
					return;
				}
				updates.template = templateObjectId;
			}

			resume.set(updates);
			await resume.save();
			await resume.populate("template");
		}

		const templateDoc: any = resume.get("template");
		const templateFile = templateDoc?.templateFile;
		if (!templateFile) {
			res.status(400).json({ success: false, error: "Template file missing" });
			return;
		}

		const compiledHtml = await renderResume(templateFile, resume.toObject());

		res.status(200).json({
			success: true,
			message: "Resume compiled successfully",
			data: compiledHtml,
		});
	} catch (error) {
		next(error);
	}
};
