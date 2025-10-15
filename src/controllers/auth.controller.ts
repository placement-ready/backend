import { Request, Response } from "express";
import mongoose from "mongoose";
import { User, Account, SessionModel, VerificationTokenModel } from "../models";
import  Profile  from "../models/profile";
import { JwtUtils } from "../utils/jwt";
import { sendVerificationEmail } from "../utils/mailClient";

interface RegisterRequest {
	name?: string;
	email: string;
	password: string;
	role?: "student" | "admin" | "recruiter";
}

interface LoginRequest {
	email: string;
	password: string;
}

interface RefreshTokenRequest {
	refreshToken: string;
}

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name, email, password, role = "student" }: RegisterRequest = req.body;

		// Validate required fields
		if (!email || !password) {
			res.status(400).json({ error: "Email and password are required" });
			return;
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(409).json({ error: "User with this email already exists" });
			return;
		}

		// Create new user
		const user = new User({
			_id: new mongoose.Types.ObjectId(),
			name,
			email,
			password,
			role,
			loginMethod: "credentials",
			isBlocked: false,
			isDeleted: false,
		});

		await user.save();

		// Generate tokens
		const tokenPayload = {
			userId: user._id.toString(),
			email: user.email,
			role: user.role,
		};

		const { accessToken, refreshToken } = JwtUtils.generateTokenPair(tokenPayload);

		const account = new Account({
			userId: user._id,
			provider: "credentials",
			accessToken,
			refreshToken,
		});
		await account.save();

		// Save refresh token to database
		const session = new SessionModel({
			userId: user._id,
			refreshToken,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});
		await session.save();

		// Create user profile
		const profile = new Profile({
			userId: user._id,
			name: user.name,
			email: user.email,
			image: user.profileImage || "",
			bio: "",
			skills: [],
			experience: [],
			education: [],
			projects: [],
			achievements: [],
		});
		await profile.save();

		// Update last login
		user.lastLoginAt = new Date();
		await user.save();

		// Return user info (excluding password) and tokens
		const userResponse = {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			profileImage: user.profileImage,
			createdAt: (user as any).createdAt,
		};

		res.status(201).json({
			message: "User registered successfully",
			user: userResponse,
			tokens: {
				accessToken: accessToken,
				refreshToken: refreshToken,
				expiresIn: 7 * 24 * 60 * 60,
			},
		});
	} catch (error: any) {
		console.error("Registration error:", error);
		res.status(500).json({ error: "Internal server error during registration" });
	}
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password }: LoginRequest = req.body;

		// Validate required fields
		if (!email || !password) {
			res.status(400).json({ error: "Email and password are required" });
			return;
		}

		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			res.status(401).json({ error: "Invalid email or password" });
			return;
		}

		// Check if user is blocked
		if (user.isBlocked) {
			res.status(403).json({ error: "Account is blocked. Please contact administrator." });
			return;
		}

		if (user.isDeleted) {
			res.status(403).json({ error: "Account is deleted. Please contact administrator." });
			return;
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			res.status(401).json({ error: "Invalid email or password" });
			return;
		}

		// Generate tokens
		const tokenPayload = {
			userId: user._id.toString(),
			email: user.email,
			role: user.role,
		};

		const { accessToken, refreshToken } = JwtUtils.generateTokenPair(tokenPayload);

		// Save refresh token to database
		const session = new SessionModel({
			userId: user._id,
			refreshToken,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});
		await session.save();

		// Update last login
		user.lastLoginAt = new Date();
		await user.save();

		// Return user info (excluding password) and tokens
		const userResponse = {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			image: user.profileImage,
			lastLoginAt: user.lastLoginAt,
		};

		res.status(200).json({
			message: "Login successful",
			user: userResponse,
			tokens: {
				accessToken: accessToken,
				refreshToken: refreshToken,
				expiresIn: 7 * 24 * 60 * 60,
			},
		});
	} catch (error: any) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error during login" });
	}
};

// Refresh access token using refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
	try {
		const { refreshToken }: RefreshTokenRequest = req.body;

		if (!refreshToken) {
			res.status(400).json({ error: "Refresh token is required" });
			return;
		}

		// Verify refresh token
		let decoded;
		try {
			decoded = JwtUtils.verifyRefreshToken(refreshToken);
		} catch (error) {
			res.status(401).json({ error: "Invalid or expired refresh token" });
			return;
		}

		// Check if refresh token exists in database
		const session = await SessionModel.findOne({ refreshToken, userId: decoded.userId });
		if (!session) {
			res.status(401).json({ error: "Refresh token not found" });
			return;
		}

		// Check if refresh token is expired
		if (session.expiresAt && session.expiresAt < new Date()) {
			await SessionModel.deleteOne({ _id: session._id });
			res.status(401).json({ error: "Refresh token expired" });
			return;
		}

		// Get user details
		const user = await User.findById(decoded.userId);
		if (!user) {
			res.status(401).json({ error: "User not found" });
			return;
		}

		if (user.isBlocked) {
			res.status(403).json({ error: "Account is blocked" });
			return;
		}

		if (user.isDeleted) {
			res.status(403).json({ error: "Account is deleted" });
			return;
		}

		// Generate new tokens
		const tokenPayload = {
			userId: user._id.toString(),
			email: user.email,
			role: user.role,
		};

		const { accessToken, refreshToken: newRefreshToken } = JwtUtils.generateTokenPair(tokenPayload);

		// Update session with new refresh token
		session.refreshToken = newRefreshToken;
		session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
		await session.save();

		res.status(200).json({
			message: "Tokens refreshed successfully",
			accessToken,
			refreshToken: newRefreshToken,
		});
	} catch (error: any) {
		console.error("Token refresh error:", error);
		res.status(500).json({ error: "Internal server error during token refresh" });
	}
};

// Logout user (invalidate refresh token)
export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		const { refreshToken }: RefreshTokenRequest = req.body;

		if (!refreshToken) {
			res.status(400).json({ error: "Refresh token is required" });
			return;
		}

		// Remove refresh token from database
		await SessionModel.deleteOne({ refreshToken });

		res.status(200).json({ message: "Logout successful" });
	} catch (error: any) {
		console.error("Logout error:", error);
		res.status(500).json({ error: "Internal server error during logout" });
	}
};

// Logout from all devices (invalidate all refresh tokens for user)
export const logoutAll = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		// Remove all refresh tokens for the user
		await SessionModel.deleteMany({ userId: req.user.userId });

		res.status(200).json({ message: "Logged out from all devices successfully" });
	} catch (error: any) {
		console.error("Logout all error:", error);
		res.status(500).json({ error: "Internal server error during logout from all devices" });
	}
};

// Check if email exists
export const checkEmailExists = async (req: Request, res: Response) => {
	try {
		const email = req.params.email;
		if (!email) {
			res.status(400).json({ error: "Email is required" });
			return;
		}
		const user = await User.findOne({ email });
		res.json({ exists: user !== null });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

// Check if email is verified
export const checkEmailVerification = async (req: Request, res: Response) => {
	try {
		const email = req.params.email;
		if (!email) {
			res.status(400).json({ error: "Email is required" });
			return;
		}
		const user = await User.findOne({ email, emailVerified: null });
		res.json({ verified: user === null });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

// Create a verification token
export const createVerificationToken = async (req: Request, res: Response) => {
	try {
		const email = req.body.email;
		if (!email) {
			res.status(400).json({ error: "Email is required" });
			return;
		}

		const user = await User.findOne({ email });
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Create a verification token
		const token = new VerificationTokenModel({
			userId: user._id,
			code: Math.floor(100000 + Math.random() * 900000).toString(),
			expiresAt: new Date(Date.now() + 3600000 * 24), // 1 day expiration
		});
		await token.save();

		// Send verification email
		await sendVerificationEmail(user.email, token.code);

		res.status(200).json({ message: "Verification email sent" });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
	try {
		const { email, code } = req.body;
		if (!email || !code) {
			res.status(400).json({ error: "Email and code are required" });
			return;
		}

		const user = await User.findOne({ email });
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const isValidToken = await VerificationTokenModel.findOne({ userId: user._id, code });
		if (!isValidToken) {
			res.status(400).json({ error: "Invalid code" });
			return;
		}

		if (isValidToken.expiresAt < new Date(Date.now())) {
			res.status(400).json({ error: "Code has expired" });
			return;
		}

		user.emailVerified = new Date();
		await user.save();
		await VerificationTokenModel.deleteOne({ userId: user._id, code });

		res.status(200).json({ message: "Email verified successfully", success: true });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};
