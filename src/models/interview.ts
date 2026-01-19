import mongoose, { Schema, Document, Model } from "mongoose";

interface IMessage {
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

interface IFeedback {
    strengths: string[];
    improvements: string[];
    tips: string[];
}

interface IInterview extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    title: string;
    type: "behavioral" | "technical" | "case-study";
    status: "pending" | "in-progress" | "completed";
    messages: IMessage[];
    questions: string[];
    currentQuestionIndex: number;
    score?: number;
    feedback?: IFeedback;
    duration: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}

const messageSchema = new Schema(
    {
        role: { type: String, enum: ["user", "ai"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const feedbackSchema = new Schema(
    {
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        tips: [{ type: String }],
    },
    { _id: false }
);

const interviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    sessionId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ["behavioral", "technical", "case-study"],
        default: "behavioral",
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
    },
    messages: [messageSchema],
    questions: [{ type: String }],
    currentQuestionIndex: { type: Number, default: 0 },
    score: { type: Number },
    feedback: feedbackSchema,
    duration: { type: Number, default: 30 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ sessionId: 1 });

const Interview: Model<IInterview> = mongoose.model<IInterview>("Interview", interviewSchema);

export { Interview, IInterview, IMessage, IFeedback };
