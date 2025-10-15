import { Request, Response } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Meeting, IMeeting } from "../models/meeting";
import { User, IUser } from "../models/index";

// Extract userId from authorization header (expects Bearer <userId>)
function getUserIdFromAuthHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length > 1 ? parts[1] : parts[0]; // Returns userId string
}

// Schedule a new 1:1 meeting
export const scheduleMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, startTime, meetingType, duration } = req.body;
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "No userId provided" });
      return;
    }

    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    const userIdString = user._id.toString();

    // Check for existing active meeting
    const ongoingMeeting = await Meeting.findOne({
      user_id: userIdString,
      status: { $ne: "attended" },
    });
    if (ongoingMeeting) {
      res.status(409).json({ success: false, message: "You already have an active meeting." });
      return;
    }

    const meetingCode = nanoid(6).toUpperCase();
    const meeting = new Meeting({
      user_id: userIdString,
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
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "No userId provided" });
      return;
    }

    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    const userIdString = user._id.toString();

    const meetings = await Meeting.find({
      user_id: userIdString,
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
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "No userId provided" });
      return;
    }

    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    const userIdString = user._id.toString();

    await Meeting.deleteMany({
      user_id: userIdString,
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
      { new: true },
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
