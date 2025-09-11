import { Request, Response } from "express";
import History from "../models/mentor";
import { askGemini } from "../utils/geminiClient";

export const mentorResponse = async (req: Request, res: Response): Promise<void> => {
	try {
		const { message } = req.body;

		if (!message) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		if (!req.user) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const geminiResponse = await askGemini(message);

		const historyEntry = new History({
			userId: req.user.userId,
			message: message,
			response: geminiResponse,
		});
		await historyEntry.save();

		res.status(200).json(geminiResponse);
	} catch (error: any) {
		console.error("Mentor Response Error:", error);
		res.status(500).json({ error: "Internal server error during mentor response" });
	}
};
