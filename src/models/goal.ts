import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IMilestone {
    _id?: Types.ObjectId;
    title: string;
    completed: boolean;
    completedAt?: Date;
}

interface IGoal extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    targetDate: Date;
    status: "active" | "completed" | "paused";
    progress: number;
    milestones: IMilestone[];
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

const milestoneSchema = new Schema(
    {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
    },
    { _id: true }
);

const goalSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        targetDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["active", "completed", "paused"],
            default: "active",
        },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        milestones: [milestoneSchema],
        category: { type: String, default: "general" },
    },
    { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1 });

const Goal: Model<IGoal> = mongoose.model<IGoal>("Goal", goalSchema);

export { Goal, IGoal, IMilestone };
