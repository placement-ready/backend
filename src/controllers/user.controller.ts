import { Request, Response } from "express";
import { User } from "../models/";

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		const user = await User.findById(req.user.id).select("-password");
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		res.status(200).json({ user });
	} catch (error: any) {
		console.error("Get profile error:", error);
		res.status(500).json({ error: "Internal server error while fetching profile" });
	}
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		const user = await User.findById(req.user.id);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const { name, email, password } = req.body;

		await User.updateOne(
			{ _id: req.user.id },
			{
				$set: {
					name: name || user.name,
					email: email || user.email,
					passwordHash: password ? password : user.passwordHash,
				},
			}
		);

		res.status(200).json({ message: "Profile updated successfully", user });
	} catch (error: any) {
		console.error("Update profile error:", error);
		res.status(500).json({ error: "Internal server error while updating profile" });
	}
};
