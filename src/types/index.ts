import { Types } from "mongoose";
import { Request } from "express";

// User related interfaces
export interface IUser {
	_id: Types.ObjectId;
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
}

export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
		email: string;
		role: string;
	};
}

// Resume related interfaces
export interface IResumeInfo {
	userId: Types.ObjectId;
	fullName?: string;
	email?: string;
	phone?: string;
	location?: string;
	website?: string;
	summary?: string;
	skills?: string[];
	achievements?: string[];
	experience?: IExperience[];
	education?: IEducation[];
	template: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

export interface IExperience {
	company: string;
	role: string;
	duration: string;
	description: string;
}

export interface IEducation {
	college: string;
	degree: string;
	year: string;
}

export interface IResumeTemplate {
	_id: Types.ObjectId;
	title: string;
	link?: string;
	description?: string;
	templateFile?: string;
	compiledPdf?: string;
	atsFriendly?: boolean;
	atsNotes?: string;
	preferredBy?: string[];
	createdAt: Date;
	updatedAt: Date;
}

// Request/Response interfaces
export interface CreateResumeRequest {
	fullName?: string;
	email?: string;
	phone?: string;
	location?: string;
	website?: string;
	summary?: string;
	skills?: string[];
	achievements?: string[];
	experience?: IExperience[];
	education?: IEducation[];
	template: string; // ObjectId as string
}

export interface UpdateResumeRequest extends Partial<CreateResumeRequest> {}

export interface CreateTemplateRequest {
	title: string;
	link?: string;
	description?: string;
	templateFile?: string;
	compiledPdf?: string;
	atsFriendly?: boolean;
	atsNotes?: string;
	preferredBy?: string[];
}

export interface GeneratePdfRequest {
	userId?: string;
	resumeId?: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
	errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
	pagination?: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
}

// JWT Payload interface
export interface JwtPayload {
	userId: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

// Error interfaces
export interface CustomError extends Error {
	statusCode?: number;
	isOperational?: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
	value?: any;
}
