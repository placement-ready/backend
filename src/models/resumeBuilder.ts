import { Schema, model, Types, Document } from "mongoose";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface IPersonalInfo {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
}

export interface IExperience {
    company: string;
    role: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    highlights: string[];
}

export interface IEducation {
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    highlights?: string[];
}

export interface IProject {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    highlights?: string[];
}

export type ResumeSection =
    | "personalInfo"
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "certifications"
    | "languages"
    | "achievements";

export type ResumeStatus = "gathering" | "reviewing" | "completed";

export type ChatMessageRole = "user" | "assistant" | "system";

// ============================================================
// RESUME CONTENT SCHEMA
// Stores structured resume data with partial/incomplete support
// ============================================================

export interface IResumeContent extends Document {
    sessionId: string;
    personalInfo: IPersonalInfo;
    summary?: string;
    experience: IExperience[];
    education: IEducation[];
    skills: string[];
    projects: IProject[];
    certifications: string[];
    languages: string[];
    achievements: string[];
    completedSections: ResumeSection[];
    currentSection: ResumeSection;
    isComplete: boolean;
    refineMode: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PersonalInfoSchema = new Schema<IPersonalInfo>(
    {
        fullName: { type: String },
        email: { type: String },
        phone: { type: String },
        location: { type: String },
        website: { type: String },
        linkedin: { type: String },
        github: { type: String },
    },
    { _id: false }
);

const ExperienceSchema = new Schema<IExperience>(
    {
        company: { type: String, required: true },
        role: { type: String, required: true },
        location: { type: String },
        startDate: { type: String, required: true },
        endDate: { type: String },
        current: { type: Boolean, default: false },
        description: { type: String, required: true },
        highlights: { type: [String], default: [] },
    },
    { _id: false }
);

const EducationSchema = new Schema<IEducation>(
    {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        gpa: { type: String },
        highlights: { type: [String], default: [] },
    },
    { _id: false }
);

const ProjectSchema = new Schema<IProject>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        technologies: { type: [String], default: [] },
        url: { type: String },
        highlights: { type: [String], default: [] },
    },
    { _id: false }
);

const ResumeContentSchema = new Schema<IResumeContent>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        personalInfo: { type: PersonalInfoSchema, default: {} },
        summary: { type: String },
        experience: { type: [ExperienceSchema], default: [] },
        education: { type: [EducationSchema], default: [] },
        skills: { type: [String], default: [] },
        projects: { type: [ProjectSchema], default: [] },
        certifications: { type: [String], default: [] },
        languages: { type: [String], default: [] },
        achievements: { type: [String], default: [] },
        completedSections: {
            type: [String],
            enum: [
                "personalInfo",
                "summary",
                "experience",
                "education",
                "skills",
                "projects",
                "certifications",
                "languages",
                "achievements",
            ],
            default: [],
        },
        currentSection: {
            type: String,
            enum: [
                "personalInfo",
                "summary",
                "experience",
                "education",
                "skills",
                "projects",
                "certifications",
                "languages",
                "achievements",
            ],
            default: "personalInfo",
        },
        isComplete: { type: Boolean, default: false },
        refineMode: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const ResumeContent = model<IResumeContent>("ResumeContent", ResumeContentSchema);

// ============================================================
// RESUME METADATA SCHEMA
// Session and status tracking for resume building
// ============================================================

export interface IResumeMetadata extends Document {
    userId: Types.ObjectId;
    sessionId: string;
    status: ResumeStatus;
    title: string;
    jobDescription?: string;
    targetRole?: string;
    targetCompany?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResumeMetadataSchema = new Schema<IResumeMetadata>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "user", index: true },
        sessionId: { type: String, required: true, unique: true, index: true },
        status: {
            type: String,
            enum: ["gathering", "reviewing", "completed"],
            default: "gathering",
        },
        title: { type: String, default: "Untitled Resume" },
        jobDescription: { type: String },
        targetRole: { type: String },
        targetCompany: { type: String },
    },
    { timestamps: true }
);

// Compound index for finding user's resumes
ResumeMetadataSchema.index({ userId: 1, status: 1 });
ResumeMetadataSchema.index({ userId: 1, createdAt: -1 });

export const ResumeMetadata = model<IResumeMetadata>("ResumeMetadata", ResumeMetadataSchema);

// ============================================================
// RESUME CHAT MESSAGE SCHEMA
// Chat history for resume building sessions
// ============================================================

export interface IChatMessageMetadata {
    section?: ResumeSection;
    extractedData?: Record<string, unknown>;
}

export interface IResumeChatMessage extends Document {
    sessionId: string;
    role: ChatMessageRole;
    content: string;
    timestamp: Date;
    metadata?: IChatMessageMetadata;
}

const ChatMessageMetadataSchema = new Schema<IChatMessageMetadata>(
    {
        section: {
            type: String,
            enum: [
                "personalInfo",
                "summary",
                "experience",
                "education",
                "skills",
                "projects",
                "certifications",
                "languages",
                "achievements",
            ],
        },
        extractedData: { type: Schema.Types.Mixed },
    },
    { _id: false }
);

const ResumeChatMessageSchema = new Schema<IResumeChatMessage>({
    sessionId: { type: String, required: true, index: true },
    role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: ChatMessageMetadataSchema },
});

// Index for fetching messages by session in order
ResumeChatMessageSchema.index({ sessionId: 1, timestamp: 1 });

export const ResumeChatMessage = model<IResumeChatMessage>("ResumeChatMessage", ResumeChatMessageSchema);

// ============================================================
// CONSTANTS
// ============================================================

// Required sections that must be completed for a valid resume
export const REQUIRED_SECTIONS: ResumeSection[] = [
    "personalInfo",
    "summary",
    "experience",
    "education",
    "skills",
];

// Optional sections user can choose to include
export const OPTIONAL_SECTIONS: ResumeSection[] = [
    "projects",
    "certifications",
    "languages",
    "achievements",
];

// Order in which sections are collected during chat
export const SECTION_ORDER: ResumeSection[] = [
    "personalInfo",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "achievements",
];
