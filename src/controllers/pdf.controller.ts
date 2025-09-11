import { Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { Types } from "mongoose";
import ResumeData from "../models/resume";
import { AuthenticatedRequest, CustomError } from "../types";

const createError = (message: string, statusCode: number): CustomError => {
	const error = new Error(message) as CustomError;
	error.statusCode = statusCode;
	error.isOperational = true;
	return error;
};

// Get resume by user ID
const getResumeByUserId = async (userId: string): Promise<any | null> => {
	try {
		if (!Types.ObjectId.isValid(userId)) {
			throw createError("Invalid user ID format", 400);
		}

		const resume = await ResumeData.findOne({ userId: new Types.ObjectId(userId) })
			.populate("template")
			.exec();

		return resume;
	} catch (error) {
		if (error instanceof Error && (error as CustomError).statusCode) {
			throw error;
		}
		throw createError("Failed to fetch resume", 500);
	}
};

// Get resume by ID
const getResumeById = async (resumeId: string): Promise<any | null> => {
	try {
		if (!Types.ObjectId.isValid(resumeId)) {
			throw createError("Invalid resume ID format", 400);
		}

		const resume = await ResumeData.findById(resumeId).populate("template").exec();

		return resume;
	} catch (error) {
		if (error instanceof Error && (error as CustomError).statusCode) {
			throw error;
		}
		throw createError("Failed to fetch resume", 500);
	}
};

// Get secure template path with validation
const getSecureTemplatePath = (templateFile: string): string => {
	const allowedTemplateDir = path.resolve(__dirname, "..", "template");

	// Sanitize filename to prevent path traversal
	const sanitizedFile = path.basename(templateFile);

	// Validate file extension
	const allowedExtensions = [".html", ".hbs", ".handlebars"];
	const extension = path.extname(sanitizedFile).toLowerCase();

	if (!allowedExtensions.includes(extension)) {
		throw createError("Invalid template file extension", 400);
	}

	// Construct full path
	const fullPath = path.resolve(allowedTemplateDir, sanitizedFile);

	// Ensure the resolved path is within allowed directory
	if (!fullPath.startsWith(allowedTemplateDir)) {
		throw createError("Invalid template file path", 400);
	}

	return fullPath;
};

// Load template file with existence check
const loadTemplate = async (templatePath: string): Promise<string> => {
	try {
		// Check if file exists
		if (!fs.existsSync(templatePath)) {
			throw createError("Template file not found", 404);
		}

		// Check if it's actually a file (not directory)
		const stats = fs.statSync(templatePath);
		if (!stats.isFile()) {
			throw createError("Template path is not a file", 400);
		}

		// Read template content
		const templateString = fs.readFileSync(templatePath, "utf8");

		if (!templateString || templateString.trim().length === 0) {
			throw createError("Template file is empty", 400);
		}

		return templateString;
	} catch (error) {
		if (error instanceof Error && (error as CustomError).statusCode) {
			throw error;
		}
		throw createError("Failed to load template", 500);
	}
};

// Generate PDF from HTML with security settings
const generatePdfFromHtml = async (html: string): Promise<Buffer> => {
	let browser;
	try {
		// Launch browser with security settings
		browser = await puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-web-security",
				"--disable-features=VizDisplayCompositor",
			],
		});

		const page = await browser.newPage();

		// Set content with timeout and security options
		await page.setContent(html, {
			waitUntil: "networkidle0",
			timeout: 30000,
		});

		// Set viewport for consistent rendering
		await page.setViewport({
			width: 1200,
			height: 800,
			deviceScaleFactor: 1,
		});

		// Generate PDF with optimized settings
		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: {
				top: "0.5cm",
				bottom: "0.5cm",
				left: "0.5cm",
				right: "0.5cm",
			},
			preferCSSPageSize: true,
		});

		return Buffer.from(pdfBuffer);
	} catch (error) {
		throw createError("Failed to generate PDF from HTML", 500);
	} finally {
		if (browser) {
			await browser.close();
		}
	}
};

// Generate PDF for a user's resume
const generatePdf = async (userId: string, resumeId?: string): Promise<Buffer> => {
	try {
		// Get resume data
		let resumeData;
		if (resumeId) {
			resumeData = await getResumeById(resumeId);
			// Verify the resume belongs to the user
			if (resumeData && resumeData.userId.toString() !== userId) {
				throw createError("Resume not found", 404);
			}
		} else {
			resumeData = await getResumeByUserId(userId);
		}

		if (!resumeData || !resumeData.template) {
			throw createError("Resume or template not found", 404);
		}

		// Get template information
		const template = resumeData.template;
		if (!template.templateFile) {
			throw createError("Template file not specified", 400);
		}

		// Validate and load template file securely
		const templatePath = getSecureTemplatePath(template.templateFile);
		const templateString = await loadTemplate(templatePath);

		// Compile template with resume data
		const compiledTemplate = Handlebars.compile(templateString);
		const html = compiledTemplate(resumeData.toObject ? resumeData.toObject() : resumeData);

		// Generate PDF with security settings
		const pdfBuffer = await generatePdfFromHtml(html);

		return pdfBuffer;
	} catch (error) {
		if (error instanceof Error && (error as CustomError).statusCode) {
			throw error;
		}
		throw createError("Failed to generate PDF", 500);
	}
};

// Generate HTML preview for a user's resume
const generateHtmlPreview = async (userId: string, resumeId?: string): Promise<string> => {
	try {
		// Get resume data
		let resumeData;
		if (resumeId) {
			resumeData = await getResumeById(resumeId);
			// Verify the resume belongs to the user
			if (resumeData && resumeData.userId.toString() !== userId) {
				throw createError("Resume not found", 404);
			}
		} else {
			resumeData = await getResumeByUserId(userId);
		}

		if (!resumeData || !resumeData.template) {
			throw createError("Resume or template not found", 404);
		}

		// Get template information
		const template = resumeData.template;
		if (!template.templateFile) {
			throw createError("Template file not specified", 400);
		}

		// Validate and load template file securely
		const templatePath = getSecureTemplatePath(template.templateFile);
		const templateString = await loadTemplate(templatePath);

		// Compile template with resume data
		const compiledTemplate = Handlebars.compile(templateString);
		const html = compiledTemplate(resumeData.toObject ? resumeData.toObject() : resumeData);

		return html;
	} catch (error) {
		if (error instanceof Error && (error as CustomError).statusCode) {
			throw error;
		}
		throw createError("Failed to generate HTML preview", 500);
	}
};

// Generate PDF for user's resume
export const generatePdfController = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const { resumeId } = req.body;

		const pdfBuffer = await generatePdf(userId, resumeId);

		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": 'attachment; filename="resume.pdf"',
			"Content-Length": pdfBuffer.length.toString(),
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		});

		res.send(pdfBuffer);
	} catch (error) {
		next(error);
	}
};

// Generate HTML preview for user's resume
export const generateHtmlPreviewController = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const { resumeId } = req.body;

		const html = await generateHtmlPreview(userId, resumeId);

		res.set({
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		});

		res.send(html);
	} catch (error) {
		next(error);
	}
};
