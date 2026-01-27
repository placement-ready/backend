/**
 * Resume Render Service
 * Handles HTML rendering with Handlebars and PDF generation with Puppeteer
 */

import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";
import puppeteer, { Browser } from "puppeteer";

// Types
interface PersonalInfo {
    fullName?: string;
    email?: string;
    phone?: string | null;
    location?: string | null;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
}

interface Experience {
    company?: string;
    role?: string;
    location?: string | null;
    startDate?: string;
    endDate?: string | null;
    current?: boolean;
    description?: string;
    highlights?: string[];
}

interface Education {
    institution?: string;
    degree?: string;
    field?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    gpa?: string | null;
    highlights?: string[];
}

interface Project {
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string | null;
    highlights?: string[];
}

export interface ResumeData {
    personalInfo: PersonalInfo;
    summary?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: string[];
    projects?: Project[];
    certifications?: string[];
    languages?: string[];
    achievements?: string[];
}

// In-memory cache for generated HTML
const htmlCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Browser instance for Puppeteer
let browserInstance: Browser | null = null;

class ResumeRenderService {
    private template: HandlebarsTemplateDelegate | null = null;

    constructor() {
        this.loadTemplate();
    }

    /**
     * Load and compile Handlebars template
     */
    private loadTemplate(): void {
        try {
            const templatePath = path.join(__dirname, "../../templates/modern-v1/resume.hbs");
            const templateSource = fs.readFileSync(templatePath, "utf-8");
            this.template = Handlebars.compile(templateSource);
        } catch (error) {
            console.error("Failed to load resume template:", error);
        }
    }

    /**
     * Validate resume data has required fields
     */
    validateData(data: Partial<ResumeData>): { valid: boolean; error?: string } {
        if (!data.personalInfo?.fullName) {
            return { valid: false, error: "Name is required" };
        }

        const hasContent =
            (data.experience && data.experience.length > 0) ||
            (data.projects && data.projects.length > 0) ||
            (data.education && data.education.length > 0);

        if (!hasContent) {
            return { valid: false, error: "At least one section (experience, projects, or education) is required" };
        }

        return { valid: true };
    }

    /**
     * Render resume HTML from data
     */
    renderHtml(resumeId: string, data: ResumeData): string {
        if (!this.template) {
            throw new Error("Template not loaded");
        }

        // Normalize data
        const normalizedData: ResumeData = {
            personalInfo: data.personalInfo,
            summary: data.summary || "",
            experience: data.experience || [],
            education: data.education || [],
            skills: data.skills || [],
            projects: data.projects || [],
            certifications: data.certifications || [],
            languages: data.languages || [],
            achievements: data.achievements || [],
        };

        const html = this.template(normalizedData);

        // Cache the HTML
        htmlCache.set(resumeId, {
            html,
            timestamp: Date.now(),
        });

        return html;
    }

    /**
     * Get cached HTML for a resume
     */
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

    /**
     * Get or create browser instance
     */
    private async getBrowser(): Promise<Browser> {
        if (!browserInstance || !browserInstance.isConnected()) {
            browserInstance = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            });
        }
        return browserInstance;
    }

    /**
     * Generate PDF from HTML
     */
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

    /**
     * Clean up browser instance
     */
    async cleanup(): Promise<void> {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
        }
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of htmlCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                htmlCache.delete(key);
            }
        }
    }
}

// Export singleton instance
export const resumeRenderService = new ResumeRenderService();

// Cleanup on process exit
process.on("SIGINT", async () => {
    await resumeRenderService.cleanup();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await resumeRenderService.cleanup();
    process.exit(0);
});
