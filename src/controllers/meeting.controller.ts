import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { Meeting } from "../models/meeting";

// Schedule a new 1:1 meeting
export const scheduleMeeting = async (req: Request, res: Response): Promise<void> => {
	try {
		const { title, startTime, meetingType, duration } = req.body;
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ success: false, message: "User not found" });
			return;
		}

		// Check for existing active meeting
		const ongoingMeeting = await Meeting.findOne({
			user_id: userId,
			status: { $ne: "attended" },
		});
		if (ongoingMeeting) {
			res.status(409).json({ success: false, message: "You already have an active meeting." });
			return;
		}

		const meetingCode = nanoid(6).toUpperCase();
		const meeting = new Meeting({
			user_id: userId,
			meetingCode,
			title,
			startTime,
			meetingType,
			duration,
		});

		await meeting.save();

		const meetingLink = `http://localhost:5173/meeting/${meetingCode}`;
		res.status(201).json({ success: true, meeting, meetingLink });
	} catch (error: any) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Get scheduled meetings for logged-in user
export const getMeetings = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({ success: false, message: "User not found" });
			return;
		}

		const meetings = await Meeting.find({
			user_id: userId,
			meetingType: "Scheduled Meet",
		});

		res.status(200).json({ success: true, meetings });
	} catch (error: any) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Clear all scheduled meetings for logged-in user
export const clearAllMeetings = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({ success: false, message: "User not found" });
			return;
		}

		await Meeting.deleteMany({
			user_id: userId,
			meetingType: "Scheduled Meet",
		});

		res.status(200).json({ success: true, message: "Your meetings cleared successfully" });
	} catch (error: any) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Mark a meeting as attended
export const markAsAttended = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const meeting = await Meeting.findByIdAndUpdate(
			id,
			{ $set: { status: "attended" } },
			{ new: true }
		);
		res.json(meeting);
	} catch (err) {
		res.status(500).json({ message: "Error marking as attended" });
	}
};

// For admin: Get all meetings (no user filter)
export const getAllMeetings = async (req: Request, res: Response): Promise<void> => {
	try {
		const meetings = await Meeting.find({});
		res.status(200).json({ success: true, meetings });
	} catch (error: any) {
		res.status(500).json({ success: false, message: error.message });
	}
};
