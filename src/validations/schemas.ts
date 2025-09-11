import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be less than 50 characters")
		.optional(),
	email: z.string().email("Please provide a valid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.max(128, "Password must be less than 128 characters long")
		.regex(
			/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
			"Password must contain at least one letter, one number, and one special character"
		),
	role: z.enum(["student", "admin", "recruiter"]).default("student").optional(),
});

export const loginSchema = z.object({
	email: z.string().email("Please provide a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

// Resume validation schemas
export const experienceSchema = z.object({
	company: z
		.string()
		.trim()
		.min(1, "Company name is required")
		.max(100, "Company name must be less than 100 characters"),
	role: z.string().trim().min(1, "Role is required").max(100, "Role must be less than 100 characters"),
	duration: z.string().trim().min(1, "Duration is required").max(50, "Duration must be less than 50 characters"),
	description: z
		.string()
		.trim()
		.min(1, "Description must not be empty")
		.max(1000, "Description must be less than 1000 characters")
		.optional(),
});

export const educationSchema = z.object({
	college: z
		.string()
		.trim()
		.min(1, "College name is required")
		.max(100, "College name must be less than 100 characters"),
	degree: z.string().trim().min(1, "Degree is required").max(100, "Degree must be less than 100 characters"),
	year: z.string().trim().min(1, "Year is required").max(20, "Year must be less than 20 characters"),
});

export const resumeInfoSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(1, "Full name must not be empty")
		.max(100, "Full name must be less than 100 characters")
		.optional(),
	email: z.string().email("Please provide a valid email address").optional(),
	phone: z
		.string()
		.trim()
		.regex(/^\+?[\d\s\-\(\)]+$/, "Please provide a valid phone number")
		.max(20, "Phone number must be less than 20 characters")
		.optional(),
	location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
	website: z.string().url("Please provide a valid URL").optional(),
	summary: z.string().trim().max(2000, "Summary must be less than 2000 characters").optional(),
	skills: z
		.array(z.string().trim().min(1, "Skill must not be empty").max(50, "Skill must be less than 50 characters"))
		.max(50, "Maximum 50 skills allowed")
		.optional(),
	achievements: z
		.array(
			z.string().trim().min(1, "Achievement must not be empty").max(500, "Achievement must be less than 500 characters")
		)
		.max(20, "Maximum 20 achievements allowed")
		.optional(),
	experience: z.array(experienceSchema).max(20, "Maximum 20 experience entries allowed").optional(),
	education: z.array(educationSchema).max(10, "Maximum 10 education entries allowed").optional(),
	template: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format"),
});

export const updateResumeInfoSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(1, "Full name must not be empty")
		.max(100, "Full name must be less than 100 characters")
		.optional(),
	email: z.string().email("Please provide a valid email address").optional(),
	phone: z
		.string()
		.trim()
		.regex(/^\+?[\d\s\-\(\)]+$/, "Please provide a valid phone number")
		.max(20, "Phone number must be less than 20 characters")
		.optional(),
	location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
	website: z.string().url("Please provide a valid URL").optional(),
	summary: z.string().trim().max(2000, "Summary must be less than 2000 characters").optional(),
	skills: z
		.array(z.string().trim().min(1, "Skill must not be empty").max(50, "Skill must be less than 50 characters"))
		.max(50, "Maximum 50 skills allowed")
		.optional(),
	achievements: z
		.array(
			z.string().trim().min(1, "Achievement must not be empty").max(500, "Achievement must be less than 500 characters")
		)
		.max(20, "Maximum 20 achievements allowed")
		.optional(),
	experience: z.array(experienceSchema).max(20, "Maximum 20 experience entries allowed").optional(),
	education: z.array(educationSchema).max(10, "Maximum 10 education entries allowed").optional(),
	template: z
		.string()
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format")
		.optional(),
});

// Template validation schemas
export const templateSchema = z.object({
	name: z.string().min(1, "Template name is required").max(100, "Template name too long"),
	description: z.string().max(500, "Description too long").optional(),
	category: z.string().min(1, "Category is required"),
	isActive: z.boolean().default(true),
	htmlContent: z.string().min(1, "HTML content is required"),
	cssStyles: z.string().optional(),
	previewImage: z.string().url("Must be a valid URL").optional(),
});

export const updateProfileSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
	email: z.string().email("Invalid email format").optional(),
	phone: z
		.string()
		.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
		.optional(),
	bio: z.string().max(500, "Bio too long").optional(),
	skills: z.array(z.string()).optional(),
	experience: z.number().min(0, "Experience cannot be negative").optional(),
	education: z
		.array(
			z.object({
				degree: z.string().min(1, "Degree is required"),
				institution: z.string().min(1, "Institution is required"),
				year: z
					.number()
					.min(1900, "Invalid year")
					.max(new Date().getFullYear() + 10, "Invalid year"),
				grade: z.string().optional(),
			})
		)
		.optional(),
});

export const mentorRequestSchema = z.object({
	message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message too long"),
	category: z.enum(["career", "technical", "interview", "general"], {
		message: "Category must be one of: career, technical, interview, general",
	}),
	priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const idParamSchema = z.object({
	id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});

export const emailParamSchema = z.object({
	email: z.string().email("Please provide a valid email address"),
});

export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1, "Page must be at least 1").default(1).optional(),
	limit: z.coerce
		.number()
		.int()
		.min(1, "Limit must be at least 1")
		.max(100, "Limit must be at most 100")
		.default(10)
		.optional(),
	sort: z.string().trim().default("createdAt").optional(),
	order: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const bulkTemplateSchema = z.object({
	templates: z
		.array(templateSchema)
		.min(1, "At least one template is required")
		.max(100, "Maximum 100 templates allowed"),
});

// Export types for use in controllers/services
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ResumeInfoData = z.infer<typeof resumeInfoSchema>;
export type TemplateData = z.infer<typeof templateSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type MentorRequestData = z.infer<typeof mentorRequestSchema>;

export const generatePdfSchema = z.object({
	userId: z
		.string()
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
		.optional(),
	resumeId: z
		.string()
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid resume ID format")
		.optional(),
});

// Type exports for TypeScript inference
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
export type ExperienceSchema = z.infer<typeof experienceSchema>;
export type EducationSchema = z.infer<typeof educationSchema>;
export type ResumeInfoSchema = z.infer<typeof resumeInfoSchema>;
export type UpdateResumeInfoSchema = z.infer<typeof updateResumeInfoSchema>;
export type TemplateSchema = z.infer<typeof templateSchema>;
export type BulkTemplateSchema = z.infer<typeof bulkTemplateSchema>;
export type EmailParamSchema = z.infer<typeof emailParamSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
export type GeneratePdfSchema = z.infer<typeof generatePdfSchema>;
