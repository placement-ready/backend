import mongoose, { Schema, Document, Model } from "mongoose";

interface ISkill extends Document {
	userId: mongoose.Types.ObjectId;
	name: string;
	category: "technical" | "behavioral" | "communication";
	level: number;
	practiceCount: number;
	lastPracticed: Date;
	createdAt: Date;
	updatedAt: Date;
}

const skillSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
		name: { type: String, required: true },
		category: {
			type: String,
			enum: ["technical", "behavioral", "communication"],
			default: "behavioral",
		},
		level: { type: Number, default: 0, min: 0, max: 100 },
		practiceCount: { type: Number, default: 0 },
		lastPracticed: { type: Date },
	},
	{ timestamps: true },
);

skillSchema.index({ userId: 1, name: 1 }, { unique: true });

const Skill: Model<ISkill> = mongoose.model<ISkill>("Skill", skillSchema);

export { Skill, ISkill };
