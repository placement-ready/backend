import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { ResumeData } from "../models/resume";
import { ResumeTemplate } from "../models/resume";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { renderResume } from "../utils/renderResume";

const withStatus = (err: Error, code: number) => {
	(err as any).statusCode = code;
	return err;
};

// Get all user's resumes
export const getResume = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const resumes = await ResumeData.find({ userId: new Types.ObjectId(userId) }).populate("template");

		res.status(200).json({
			success: true,
			message: "Resumes fetched successfully",
			data: resumes,
		});
	} catch (error) {
		next(error);
	}
};

// Get resume by ID
export const getResumeById = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		const resume = await ResumeData.findById(id).populate("template").exec();
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
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const data = req.body;

		const template = await ResumeTemplate.findById(data.template);
		if (!template) throw withStatus(new Error("Template not found"), 404);

		const resume = new ResumeData({
			...data,
			userId: new Types.ObjectId(userId),
			template: new Types.ObjectId(data.template),
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
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const resumeData = req.body;

		// Find resume by ID and ensure it belongs to the user
		const resume = await ResumeData.findOne({
			_id: resumeData._id,
			userId: userId,
		});

		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found or unauthorized" });
			return;
		}

		const template = await ResumeTemplate.findById(resumeData.template);
		if (!template) throw withStatus(new Error("Template not found"), 404);

		resume.set({ ...resumeData, template: resumeData.template });
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
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const resumeId = req.params.id;

		// Delete resume by ID and ensure it belongs to the user
		const deleted = await ResumeData.findOneAndDelete({
			_id: new Types.ObjectId(resumeId),
			userId: new Types.ObjectId(userId),
		});

		if (!deleted) {
			res.status(404).json({ success: false, error: "Resume not found or unauthorized" });
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
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const { data } = req.body;

		const resume = await ResumeData.findByIdAndUpdate(data._id, data, { new: true }).populate("template");
		if (!resume) {
			res.status(404).json({ success: false, error: "Resume not found" });
			return;
		}

		const templateName = data.template.templateFile;
		const compiledHtml = await renderResume(templateName, data);

		res.status(200).json({
			success: true,
			message: "Resume compiled successfully",
			data: compiledHtml,
		});
	} catch (error) {
		next(error);
	}
};
