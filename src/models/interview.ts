import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Interfaces ====================

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

interface IQuestionMetadata {
	question: string;
	category: string;
	difficulty: string;
	expectedDuration: number;
	evaluationCriteria: string[];
	answer?: string;
	answeredAt?: Date;
}

interface IQuestionResult {
	questionIndex: number;
	score: number;
	strengths: string[];
	improvements: string[];
	feedback: string;
}

interface IInterviewEvaluation {
	overallScore: number;
	summary: string;
	questionResults: IQuestionResult[];
	strengths: string[];
	improvements: string[];
	recommendations: string[];
	readinessLevel: "not-ready" | "needs-work" | "almost-ready" | "ready" | "exceptional";
	evaluatedAt: Date;
}

type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "principal";

interface IInterview extends Document {
	userId: mongoose.Types.ObjectId;
	sessionId: string;
	title: string;
	type: "behavioral" | "technical" | "case-study";
	status: "pending" | "in-progress" | "completed" | "evaluated";
	messages: IMessage[];
	questions: string[];
	questionsMetadata?: IQuestionMetadata[];
	currentQuestionIndex: number;
	score?: number;
	feedback?: IFeedback;
	evaluation?: IInterviewEvaluation;
	duration: number;
	startedAt?: Date;
	completedAt?: Date;
	createdAt: Date;
	// New fields for AI-powered interviews
	jobDescription?: string;
	seniorityLevel?: SeniorityLevel;
	aiGenerated: boolean;
}

// ==================== Schemas ====================

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

const questionMetadataSchema = new Schema(
	{
		question: { type: String, required: true },
		category: { type: String, required: true },
		difficulty: { type: String, required: true },
		expectedDuration: { type: Number, default: 3 },
		evaluationCriteria: [{ type: String }],
		answer: { type: String },
		answeredAt: { type: Date },
	},
	{ _id: false }
);

const questionResultSchema = new Schema(
	{
		questionIndex: { type: Number, required: true },
		score: { type: Number, required: true },
		strengths: [{ type: String }],
		improvements: [{ type: String }],
		feedback: { type: String },
	},
	{ _id: false }
);

const evaluationSchema = new Schema(
	{
		overallScore: { type: Number, required: true },
		summary: { type: String, required: true },
		questionResults: [questionResultSchema],
		strengths: [{ type: String }],
		improvements: [{ type: String }],
		recommendations: [{ type: String }],
		readinessLevel: {
			type: String,
			enum: ["not-ready", "needs-work", "almost-ready", "ready", "exceptional"],
			default: "needs-work",
		},
		evaluatedAt: { type: Date, default: Date.now },
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
		enum: ["pending", "in-progress", "completed", "evaluated"],
		default: "pending",
	},
	messages: [messageSchema],
	questions: [{ type: String }],
	questionsMetadata: [questionMetadataSchema],
	currentQuestionIndex: { type: Number, default: 0 },
	score: { type: Number },
	feedback: feedbackSchema,
	evaluation: evaluationSchema,
	duration: { type: Number, default: 30 },
	startedAt: { type: Date },
	completedAt: { type: Date },
	createdAt: { type: Date, default: Date.now },
	// New fields for AI-powered interviews
	jobDescription: { type: String },
	seniorityLevel: {
		type: String,
		enum: ["junior", "mid", "senior", "lead", "principal"],
	},
	aiGenerated: { type: Boolean, default: false },
});

// Index for efficient queries
interviewSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
interviewSchema.index({ userId: 1, status: 1 });

const Interview: Model<IInterview> = mongoose.model<IInterview>("Interview", interviewSchema);

export {
	Interview,
	IInterview,
	IMessage,
	IFeedback,
	IQuestionMetadata,
	IQuestionResult,
	IInterviewEvaluation,
	SeniorityLevel,
};
