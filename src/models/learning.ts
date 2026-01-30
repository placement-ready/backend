import mongoose, { Schema, Document, Model } from "mongoose";

interface ILearningResource extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    type: "article" | "video" | "course" | "practice";
    url?: string;
    completed: boolean;
    progress: number;
    category: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

const learningResourceSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        type: {
            type: String,
            enum: ["article", "video", "course", "practice"],
            default: "article",
        },
        url: { type: String },
        completed: { type: Boolean, default: false },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        category: { type: String, default: "general" },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner",
        },
        estimatedMinutes: { type: Number, default: 15 },
    },
    { timestamps: true }
);

learningResourceSchema.index({ userId: 1, category: 1 });

const LearningResource: Model<ILearningResource> = mongoose.model<ILearningResource>(
    "LearningResource",
    learningResourceSchema
);

export { LearningResource, ILearningResource };
