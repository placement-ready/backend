import { Request, Response, NextFunction } from "express";
import ResumeTemplate from "../models/resume";
import resumeTemplates from "../resumes/templates";

export const seedResumeTemplates = async (req: Request, res: Response) => {
	try {
		// Insert many documents at once; skips duplicates if indexed properly
		await ResumeTemplate.insertMany(resumeTemplates.templates, { ordered: false });
		res.send("Templates seeded successfully");
	} catch (error) {
		if (error instanceof Error) {
			console.error("Insert error:", error.message);
		} else {
			console.error("Unknown error during insert:", error);
		}
	}
};
