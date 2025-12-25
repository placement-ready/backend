import mongoose, { Schema, Document, Model } from "mongoose";

interface IMeeting extends Document {
	user_id: mongoose.Types.ObjectId;
	meetingCode?: string;
	title?: string;
	startTime: Date;
	meetingType: string;
	duration: number;
	status: "attended" | "not attended";
	createdAt: Date;
}

const meetingSchema: Schema = new Schema({
	user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" }, // reference added here
	meetingCode: { type: String, unique: true },
	title: { type: String },
	startTime: { type: Date, default: Date.now },
	meetingType: { type: String },
	duration: { type: Number, default: 30 },
	status: { type: String, enum: ["attended", "not attended"], default: "not attended" },
	createdAt: { type: Date, default: Date.now },
});

const Meeting: Model<IMeeting> = mongoose.model<IMeeting>("Meeting", meetingSchema);

export { Meeting };
