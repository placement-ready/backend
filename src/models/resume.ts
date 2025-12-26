import { Schema, model, Types } from "mongoose";

const ResumeTemplateSchema = new Schema({
	title: { type: String, required: true, unique: true },
	link: String,
	description: String,
	templateFile: String,
	compiledPdf: String,
	atsFriendly: Boolean,
	atsNotes: String,
	preferredBy: [String],
});

const ResumeTemplate = model("ResumeTemplate", ResumeTemplateSchema);
export { ResumeTemplate };

const ResumeDataSchema = new Schema(
	{
		userId: { type: Types.ObjectId, required: true, ref: "User" },
		name: { type: String, required: true, default: "Untitled Resume" },
		status: { type: String, enum: ["draft", "complete"], default: "draft" },
		fullName: String,
		email: String,
		phone: String,
		location: String,
		website: String,
		summary: String,
		skills: [String],
		achievements: [String],
		experience: [
			{
				company: String,
				role: String,
				duration: String,
				description: String,
			},
		],
		education: [
			{
				college: String,
				degree: String,
				year: String,
			},
		],
		template: { type: Types.ObjectId, ref: "ResumeTemplate", required: true },
	},
	{
		timestamps: true,
	}
);

const ResumeData = model("ResumeData", ResumeDataSchema);
export { ResumeData };
