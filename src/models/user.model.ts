import mongoose from "mongoose";

const { Schema } = mongoose;

// User Schema
const userSchema = new Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
		profileImage: { type: String },
		isVerified: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

export const User = mongoose.model("User", userSchema);
