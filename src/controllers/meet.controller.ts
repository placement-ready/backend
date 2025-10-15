import { Request, Response } from "express";
import { User, IUser } from "../models/index";
import { Meeting, IMeeting } from "../models/meeting";
import httpStatus from "http-status";

// Get user meeting history by token from query
export const getUserHistory = async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string | undefined;

  if (!token) {
    res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    return;
  }

  try {
    const user = await User.findOne({ token }) as IUser | null;
    if (!user) {
      res.status(httpStatus.NOT_FOUND).json({ message: "User not found for the given token" });
      return;
    }

    const meetings = await Meeting.find({ user_id: user._id });
    res.status(httpStatus.OK).json(meetings);
  } catch (err: any) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${err.message}` });
  }
};

// Add a meeting reference to user history
export const addToHistory = async (req: Request, res: Response): Promise<void> => {
  const { token, meeting_code } = req.body;

  if (!token || !meeting_code) {
    res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting_code are required" });
    return;
  }

  try {
    const user = await User.findOne({ token }) as IUser | null;
    if (!user) {
      res.status(httpStatus.NOT_FOUND).json({ message: "User not found for the given token" });
      return;
    }

    const newMeeting = new Meeting({
      user_id: user._id,
      meetingCode: meeting_code,
    } as IMeeting);

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (err: any) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${err.message}` });
  }
};
