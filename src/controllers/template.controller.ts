import { Response, NextFunction } from "express";
import ResumeTemplate from "../models/resume";
import { AuthenticatedRequest, ApiResponse } from "../types";

// Get all templates with pagination
export const getTemplates = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse<any[]>>,
	next: NextFunction
): Promise<void> => {
	try {
		const templates = await ResumeTemplate.find({}).lean().exec();
		res.status(200).json({
			success: true,
			message: "Templates fetched successfully",
			data: templates,
		});
	} catch (error) {
		next(error);
	}
};

// Get template by ID
export const getTemplateById = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const { templateId } = req.params;
		const template = await ResumeTemplate.findById(templateId).lean().exec();

		if (!template) {
			res.status(404).json({
				success: false,
				error: "Template not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Template fetched successfully",
			data: template,
		});
	} catch (error) {
		next(error);
	}
};

// Search templates
export const searchTemplates = async (
	req: AuthenticatedRequest,
	res: Response<ApiResponse>,
	next: NextFunction
): Promise<void> => {
	try {
		const { atsFriendly, preferredBy, search } = req.query as any;

		const criteria = {
			...(atsFriendly !== undefined && { atsFriendly: atsFriendly === "true" }),
			...(preferredBy && { preferredBy }),
			...(search && { search }),
		};

		const filter: any = {};

		if (criteria.atsFriendly !== undefined) {
			filter.atsFriendly = criteria.atsFriendly;
		}

		if (criteria.preferredBy) {
			filter.preferredBy = { $in: [criteria.preferredBy] };
		}

		if (criteria.search) {
			filter.$or = [
				{ title: { $regex: criteria.search, $options: "i" } },
				{ description: { $regex: criteria.search, $options: "i" } },
			];
		}

		const templates = await ResumeTemplate.find(filter).lean().exec();

		res.status(200).json({
			success: true,
			message: "Templates searched successfully",
			data: templates,
		});
	} catch (error) {
		next(error);
	}
};
