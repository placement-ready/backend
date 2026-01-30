import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";
import puppeteer, { Browser } from "puppeteer";

interface Basics {
	name?: string;
	email?: string;
	phone?: string | null;
	leetcode?: string | null;
	leetcodeLabel?: string | null;
	linkedin?: string | null;
	linkedinLabel?: string | null;
	github?: string | null;
	githubLabel?: string | null;
}

interface Education {
	institution?: string;
	degree?: string;
	date?: string;
	grade?: string | null;
}

interface Skill {
	label?: string;
	items?: string;
}

interface Internship {
	title?: string;
	period?: string;
	highlights?: string[];
}

interface Project {
	name?: string;
	link?: string | null;
	highlights?: string[];
}

interface Certification {
	name?: string;
	period?: string;
}

export interface ResumeData {
	basics: Basics;
	summary?: string;
	education?: Education[];
	skills?: Skill[];
	internships?: Internship[];
	projects?: Project[];
	certifications?: Certification[];
	achievements?: string[];
}

const htmlCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

let browserInstance: Browser | null = null;

class ResumeRenderService {
	private template: HandlebarsTemplateDelegate | null = null;

	constructor() {
		this.loadTemplate();
	}

	private loadTemplate(): void {
		try {
			const templatePath = path.join(__dirname, "../templates/rendercv/resume.hbs");
			const templateSource = fs.readFileSync(templatePath, "utf-8");
			this.template = Handlebars.compile(templateSource);
		} catch (error) {
			console.error("Failed to load resume template:", error);
		}
	}

	validateData(data: Partial<ResumeData>): { valid: boolean; error?: string } {
		if (!data.basics?.name) {
			return { valid: false, error: "Name is required" };
		}

		const hasContent =
			(data.internships && data.internships.length > 0) ||
			(data.projects && data.projects.length > 0) ||
			(data.education && data.education.length > 0);

		if (!hasContent) {
			return {
				valid: false,
				error: "At least one section (internships, projects, or education) is required",
			};
		}

		return { valid: true };
	}

	renderHtml(resumeId: string, data: ResumeData): string {
		if (!this.template) {
			throw new Error("Template not loaded");
		}

		const normalizedData: ResumeData = {
			basics: data.basics,
			summary: data.summary || "",
			education: data.education || [],
			skills: data.skills || [],
			internships: data.internships || [],
			projects: data.projects || [],
			certifications: data.certifications || [],
			achievements: data.achievements || [],
		};

		const html = this.template(normalizedData);

		htmlCache.set(resumeId, {
			html,
			timestamp: Date.now(),
		});

		return html;
	}

	getCachedHtml(resumeId: string): string | null {
		const cached = htmlCache.get(resumeId);
		if (!cached) return null;

		// Check TTL
		if (Date.now() - cached.timestamp > CACHE_TTL) {
			htmlCache.delete(resumeId);
			return null;
		}

		return cached.html;
	}

	private async getBrowser(): Promise<Browser> {
		if (!browserInstance || !browserInstance.isConnected()) {
			browserInstance = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
			});
		}
		return browserInstance;
	}

	async generatePdf(resumeId: string): Promise<Buffer> {
		const html = this.getCachedHtml(resumeId);
		if (!html) {
			throw new Error("Resume not generated. Call /generate first.");
		}

		const browser = await this.getBrowser();
		const page = await browser.newPage();

		try {
			await page.setContent(html, { waitUntil: "networkidle0" });

			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "15mm",
					bottom: "15mm",
					left: "15mm",
					right: "15mm",
				},
			});

			return Buffer.from(pdfBuffer);
		} finally {
			await page.close();
		}
	}

	async cleanup(): Promise<void> {
		if (browserInstance) {
			await browserInstance.close();
			browserInstance = null;
		}
	}

	clearExpiredCache(): void {
		const now = Date.now();
		for (const [key, value] of htmlCache.entries()) {
			if (now - value.timestamp > CACHE_TTL) {
				htmlCache.delete(key);
			}
		}
	}
}

export const resumeRenderService = new ResumeRenderService();

process.on("SIGINT", async () => {
	await resumeRenderService.cleanup();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await resumeRenderService.cleanup();
	process.exit(0);
});
