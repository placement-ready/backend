import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import ResumeData from "../models/resume";
import ResumeTemplate from "../models/resume";
import { AuthenticatedRequest, ApiResponse, CreateResumeRequest, UpdateResumeRequest } from "../types";

// Utility to attach statusCode without dedicated helper
const withStatus = (err: Error, code: number) => {
	(err as any).statusCode = code;
	return err;
};

// Get user's resume
export const getResume = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;

		if (!Types.ObjectId.isValid(userId)) throw withStatus(new Error("Invalid user ID format"), 400);

		const resume = await ResumeData.findOne({ userId: new Types.ObjectId(userId) })
			.populate("template")
			.exec();

		const payload = resume || {
			personal: {
				fullName: "",
				email: "",
				phone: "",
				location: "",
				website: "",
				summary: "",
			},
			experience: [],
			education: [],
			skills: [],
			achievements: [],
			template: null,
		};

		res.status(200).json({
			success: true,
			message: "Resume fetched successfully",
			data: payload,
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
		const data: CreateResumeRequest = req.body;

		if (!Types.ObjectId.isValid(userId)) throw withStatus(new Error("Invalid user ID format"), 400);
		if (!data.template || !Types.ObjectId.isValid(data.template))
			throw withStatus(new Error("Invalid template ID format"), 400);

		const existing = await ResumeData.findOne({ userId: new Types.ObjectId(userId) });
		if (existing) throw withStatus(new Error("User already has a resume. Use update instead."), 409);

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

// Update resume (create or update)
export const updateResume = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const data: UpdateResumeRequest = req.body;

		if (!Types.ObjectId.isValid(userId)) throw withStatus(new Error("Invalid user ID format"), 400);

		let resume = await ResumeData.findOne({ userId: new Types.ObjectId(userId) });

		if (!resume) {
			// Create if doesn't exist (upsert behavior)
			if (!data.template || !Types.ObjectId.isValid(data.template))
				throw withStatus(new Error("Invalid template ID format"), 400);
			const template = await ResumeTemplate.findById(data.template);
			if (!template) throw withStatus(new Error("Template not found"), 404);
			resume = new (ResumeData as any)({
				...data,
				userId: new Types.ObjectId(userId),
				template: new Types.ObjectId(data.template),
			});
		} else {
			// Update path
			if (data.template) {
				if (!Types.ObjectId.isValid(data.template)) throw withStatus(new Error("Invalid template ID format"), 400);
				const template = await ResumeTemplate.findById(data.template);
				if (!template) throw withStatus(new Error("Template not found"), 404);
				(resume as any).template = new Types.ObjectId(data.template);
			}
			Object.assign(resume, { ...data, template: (resume as any).template });
		}

		await (resume as any).save();
		await (resume as any).populate("template");

		res.status(200).json({
			success: true,
			message: "Resume updated successfully",
			data: resume,
		});
	} catch (error) {
		next(error);
	}
};

// Delete resume
export const deleteResume = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		if (!Types.ObjectId.isValid(userId)) throw withStatus(new Error("Invalid user ID format"), 400);
		const deleted = await ResumeData.findOneAndDelete({ userId: new Types.ObjectId(userId) });
		if (!deleted) throw withStatus(new Error("Resume not found"), 404);

		res.status(200).json({
			success: true,
			message: "Resume deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};

// Get resume by ID (for admin/recruiter)
export const getResumeById = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;
		if (!Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid resume ID format" });
			return;
		}
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
