import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const Schema = mongoose.Schema;

// User Schema
export interface IUser extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	name?: string;
	email: string;
	password: string;
	profileImage?: string;
	role: "student" | "admin" | "recruiter";
	loginMethod: "google" | "credentials";
	emailVerified?: Date;
	lastLoginAt?: Date;
	isBlocked: boolean;
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
	{
		_id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
		name: String,
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		profileImage: String,
		role: { type: String, enum: ["student", "admin", "recruiter"], default: "student" },
		loginMethod: { type: String, enum: ["google", "credentials"] },
		emailVerified: Date,
		lastLoginAt: Date,
		isBlocked: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

// Pre/Post Hooks
userSchema.pre("save", async function (next): Promise<void> {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified("password")) return next();

	try {
		const saltRounds = 12;
		const hashedPassword = await bcryptjs.hash(this.password ?? "", saltRounds);
		this.password = hashedPassword;
		next();
	} catch (error: any) {
		next(error);
	}
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	try {
		return await bcryptjs.compare(candidatePassword, this.password);
	} catch (error) {
		throw new Error("Password comparison failed");
	}
};

const User = mongoose.model<IUser>("User", userSchema);
export { User };

// Account Schema
interface IAccount extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	provider: "google" | "credentials";
	providerId?: string;
	accessToken: string;
	refreshToken: string;
	createdAt: Date;
	updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		provider: { type: String, enum: ["google", "credentials"] },
		providerId: { type: String },
		accessToken: { type: String, required: true },
		refreshToken: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

const Account = mongoose.model<IAccount>("Account", accountSchema);
export { Account };

// Session Schema
interface ISession extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	refreshToken?: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const Session = new Schema<ISession>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		refreshToken: { type: String },
		expiresAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	}
);

const SessionModel = mongoose.model<ISession>("Session", Session);
export { SessionModel };

// Verification Token Schema

interface IVerificationToken extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	code: string;
	expiresAt: Date;
	type: "email_verification" | "passwordReset";
}

const verificationTokenSchema = new Schema<IVerificationToken>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User" },
		code: String,
		expiresAt: Date,
		type: { type: String, enum: ["emailVerification", "passwordReset"] },
	},
	{
		timestamps: true,
	}
);

const VerificationTokenModel = mongoose.model<IVerificationToken>("VerificationToken", verificationTokenSchema);
export { VerificationTokenModel };
