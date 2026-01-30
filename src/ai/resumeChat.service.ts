import Groq from "groq-sdk";
import { config } from "../config";
import {
	RESUME_BUILDER_SYSTEM_PROMPT,
	FINAL_RESUME_GENERATION_PROMPT,
	REFINEMENT_MODE_PROMPT,
	JD_ALIGNMENT_PROMPT,
	PROGRESS_DETECTION_PROMPT,
} from "./prompts/resume.prompts";
import {
	ResumeContent,
	ResumeMetadata,
	ResumeChatMessage,
	IResumeContent,
	ResumeSection,
	REQUIRED_SECTIONS,
	SECTION_ORDER,
} from "../models";

export interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

export interface StreamCallbacks {
	onToken: (token: string) => void;
	onComplete: (fullMessage: string) => void;
	onError: (error: Error) => void;
}

export interface CreateSessionOptions {
	title?: string;
	jobDescription?: string;
	targetRole?: string;
	targetCompany?: string;
}

export interface StreamOptions {
	refineMode?: boolean;
}

export interface ResumeListItem {
	sessionId: string;
	title: string;
	status: string;
	jobDescription?: string;
	targetRole?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SessionInfo {
	sessionId: string;
	userId: string;
	status: string;
	currentSection: ResumeSection;
	completedSections: ResumeSection[];
	isComplete: boolean;
	refineMode: boolean;
	jobDescription?: string;
	title: string;
}

export interface FinalResumeData {
	personalInfo: {
		fullName: string;
		email: string;
		phone: string | null;
		location: string | null;
		website: string | null;
		linkedin: string | null;
		github: string | null;
	};
	summary: string;
	experience: Array<{
		company: string;
		role: string;
		location: string | null;
		startDate: string;
		endDate: string | null;
		current: boolean;
		description: string;
		highlights: string[];
	}>;
	education: Array<{
		institution: string;
		degree: string;
		field: string | null;
		startDate: string | null;
		endDate: string | null;
		gpa: string | null;
		highlights: string[];
	}>;
	skills: string[];
	projects: Array<{
		name: string;
		description: string;
		technologies: string[];
		url: string | null;
		highlights: string[];
	}>;
	certifications: string[];
	languages: string[];
	achievements: string[];
}

class ResumeChatService {
	private groq: Groq | null = null;

	private getClient(): Groq {
		if (!this.groq) {
			if (!config.groq.apiKey) {
				throw new Error("GROQ_API_KEY is not configured. Please set the environment variable.");
			}
			this.groq = new Groq({ apiKey: config.groq.apiKey });
		}
		return this.groq;
	}

	private generateSessionId(): string {
		const timestamp = Date.now().toString(36);
		const randomPart = Math.random().toString(36).substring(2, 10);
		return `resume_${timestamp}_${randomPart}`;
	}

	async createSession(userId: string, options?: CreateSessionOptions): Promise<SessionInfo> {
		const sessionId = this.generateSessionId();
		const title = options?.title || "Untitled Resume";

		// Create metadata with optional JD and target info
		await ResumeMetadata.create({
			userId,
			sessionId,
			status: "gathering",
			title,
			jobDescription: options?.jobDescription,
			targetRole: options?.targetRole,
			targetCompany: options?.targetCompany,
		});

		// Create empty content
		await ResumeContent.create({
			sessionId,
			personalInfo: {},
			experience: [],
			education: [],
			skills: [],
			projects: [],
			certifications: [],
			languages: [],
			achievements: [],
			completedSections: [],
			currentSection: "personalInfo",
			isComplete: false,
			refineMode: false,
		});

		// Add initial system message
		await ResumeChatMessage.create({
			sessionId,
			role: "system",
			content: "Resume building session started.",
			timestamp: new Date(),
		});

		return {
			sessionId,
			userId,
			status: "gathering",
			currentSection: "personalInfo",
			completedSections: [],
			isComplete: false,
			refineMode: false,
			jobDescription: options?.jobDescription,
			title,
		};
	}

	async getSession(sessionId: string): Promise<SessionInfo | null> {
		const metadata = await ResumeMetadata.findOne({ sessionId });
		if (!metadata) return null;

		const content = await ResumeContent.findOne({ sessionId });

		return {
			sessionId,
			userId: metadata.userId.toString(),
			status: metadata.status,
			currentSection: content?.currentSection || "personalInfo",
			completedSections: content?.completedSections || [],
			isComplete: content?.isComplete || false,
			refineMode: content?.refineMode || false,
			jobDescription: metadata.jobDescription,
			title: metadata.title,
		};
	}

	async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
		const messages = await ResumeChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean();

		return messages.map((m) => ({
			role: m.role as "user" | "assistant" | "system",
			content: m.content,
		}));
	}

	private async buildConversationMessages(sessionId: string, systemPrompt: string): Promise<any[]> {
		const history = await this.getChatHistory(sessionId);

		const messages = [{ role: "system", content: systemPrompt }];

		history.forEach((msg) => {
			if (msg.role !== "system") {
				messages.push({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				});
			}
		});

		return messages;
	}

	async streamResponse(
		sessionId: string,
		userMessage: string,
		callbacks: StreamCallbacks,
		options?: StreamOptions,
	): Promise<void> {
		try {
			const client = this.getClient();

			// Get session metadata for JD alignment
			const metadata = await ResumeMetadata.findOne({ sessionId });
			const content = await ResumeContent.findOne({ sessionId });

			// Update refineMode if provided
			if (options?.refineMode !== undefined && content) {
				content.refineMode = options.refineMode;
				await content.save();
			}

			const refineMode = options?.refineMode ?? content?.refineMode ?? false;

			// Save user message
			await ResumeChatMessage.create({
				sessionId,
				role: "user",
				content: userMessage,
				timestamp: new Date(),
			});

			// Build dynamic system prompt
			let systemPrompt = RESUME_BUILDER_SYSTEM_PROMPT;

			// Add refinement mode instructions if enabled
			if (refineMode) {
				systemPrompt += "\n\n" + REFINEMENT_MODE_PROMPT;
			}

			// Add JD alignment if provided
			if (metadata?.jobDescription) {
				systemPrompt += "\n\n" + JD_ALIGNMENT_PROMPT(metadata.jobDescription);
			}

			// Prepare messages
			const messages = await this.buildConversationMessages(sessionId, systemPrompt);

			// Stream response
			const completion = await client.chat.completions.create({
				messages: messages,
				model: config.groq.model,
				temperature: config.groq.temperature,
				max_tokens: config.groq.maxTokens,
				stream: true,
			});

			let fullMessage = "";

			for await (const chunk of completion) {
				const text = chunk.choices[0]?.delta?.content || "";
				if (text) {
					fullMessage += text;
					callbacks.onToken(text);
				}
			}

			// Save assistant message
			await ResumeChatMessage.create({
				sessionId,
				role: "assistant",
				content: fullMessage,
				timestamp: new Date(),
			});

			callbacks.onComplete(fullMessage);
		} catch (error: any) {
			console.error("Error streaming response:", error);
			callbacks.onError(error);
		}
	}

	async generateResponse(sessionId: string, userMessage: string): Promise<string> {
		const client = this.getClient();

		// Save user message
		await ResumeChatMessage.create({
			sessionId,
			role: "user",
			content: userMessage,
			timestamp: new Date(),
		});

		const messages = await this.buildConversationMessages(sessionId, RESUME_BUILDER_SYSTEM_PROMPT);

		const completion = await client.chat.completions.create({
			messages: messages,
			model: config.groq.model,
			temperature: config.groq.temperature,
			max_tokens: config.groq.maxTokens,
		});

		const assistantMessage = completion.choices[0]?.message?.content || "";

		// Save assistant message
		await ResumeChatMessage.create({
			sessionId,
			role: "assistant",
			content: assistantMessage,
			timestamp: new Date(),
		});

		return assistantMessage;
	}

	async getGreetingMessage(sessionId: string): Promise<string> {
		const greeting = `Paste your resume info below and I'll create your resume. Include whatever you have: work experience, education, skills, projects.`;

		// Save as assistant message
		await ResumeChatMessage.create({
			sessionId,
			role: "assistant",
			content: greeting,
			timestamp: new Date(),
		});

		return greeting;
	}

	async markSectionComplete(sessionId: string, section: ResumeSection): Promise<void> {
		const content = await ResumeContent.findOne({ sessionId });
		if (!content) return;

		if (!content.completedSections.includes(section)) {
			content.completedSections.push(section);
		}

		// Determine next section
		const currentIndex = SECTION_ORDER.indexOf(section);
		if (currentIndex < SECTION_ORDER.length - 1) {
			content.currentSection = SECTION_ORDER[currentIndex + 1];
		}

		// Check if all required sections are complete
		const requiredComplete = REQUIRED_SECTIONS.every((s) => content.completedSections.includes(s));

		if (requiredComplete) {
			content.isComplete = true;
			await ResumeMetadata.updateOne({ sessionId }, { status: "reviewing" });
		}

		await content.save();
	}

	async checkCompletion(sessionId: string): Promise<{
		isReady: boolean;
		missingRequired: ResumeSection[];
		completedSections: ResumeSection[];
	}> {
		const content = await ResumeContent.findOne({ sessionId });
		if (!content) {
			return {
				isReady: false,
				missingRequired: [...REQUIRED_SECTIONS],
				completedSections: [],
			};
		}

		const missingRequired = REQUIRED_SECTIONS.filter((s) => !content.completedSections.includes(s));

		return {
			isReady: missingRequired.length === 0,
			missingRequired,
			completedSections: content.completedSections,
		};
	}

	async generateFinalResume(sessionId: string): Promise<FinalResumeData> {
		const client = this.getClient();

		// Verify completion status
		const completion = await this.checkCompletion(sessionId);
		if (!completion.isReady) {
			throw new Error(
				`Cannot generate resume. Missing required sections: ${completion.missingRequired.join(", ")}`,
			);
		}

		// Get full conversation history
		const messages = await ResumeChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean();

		const conversationText = messages
			.filter((m) => m.role !== "system")
			.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
			.join("\n\n");

		// Generate JSON with very low temperature
		const prompt = `Extract the resume data from this conversation:\n\n${conversationText}`;

		const completionResponse = await client.chat.completions.create({
			messages: [
				{ role: "system", content: FINAL_RESUME_GENERATION_PROMPT },
				{ role: "user", content: prompt },
			],
			model: config.groq.model,
			temperature: 0.1, // Low temp for JSON
			max_tokens: config.groq.maxTokens,
			response_format: { type: "json_object" },
		});

		const responseText = completionResponse.choices[0]?.message?.content || "";

		// Parse JSON response
		let resumeData: FinalResumeData;
		try {
			let cleanText = responseText.trim();
			console.log("---- FINAL RESUME GENERATION DEBUG ----");
			console.log("Raw Groq Response Length:", responseText.length);
			console.log("Raw Groq Response Preview:", responseText.substring(0, 100) + "...");

			// Try to find JSON object if wrapped in text
			const firstBrace = cleanText.indexOf("{");
			const lastBrace = cleanText.lastIndexOf("}");

			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				cleanText = cleanText.substring(firstBrace, lastBrace + 1);
			} else {
				console.warn(
					"WARN: No curly braces found in response. Attempting markdown strip fallback.",
				);
				// Remove markdown code blocks if brace extraction failed
				if (cleanText.startsWith("```json")) {
					cleanText = cleanText.slice(7);
				} else if (cleanText.startsWith("```")) {
					cleanText = cleanText.slice(3);
				}
				if (cleanText.endsWith("```")) {
					cleanText = cleanText.slice(0, -3);
				}
			}

			cleanText = cleanText.trim();
			console.log("Cleaned JSON Length:", cleanText.length);
			console.log("Cleaned JSON Preview:", cleanText.substring(0, 100) + "...");

			resumeData = JSON.parse(cleanText);
			console.log("Successfully parsed JSON. Keys:", Object.keys(resumeData));
			console.log("-----------------------------------------");
		} catch (error) {
			console.error("CRITICAL: Failed to parse resume JSON.");
			console.error("Error Message:", error instanceof Error ? error.message : String(error));
			console.error("Raw Output was:", responseText);
			throw new Error("Failed to generate valid resume JSON");
		}

		// Update content with final data
		await ResumeContent.updateOne(
			{ sessionId },
			{
				$set: {
					personalInfo: resumeData.personalInfo,
					summary: resumeData.summary,
					experience: resumeData.experience,
					education: resumeData.education,
					skills: resumeData.skills,
					projects: resumeData.projects || [],
					certifications: resumeData.certifications || [],
					languages: resumeData.languages || [],
					achievements: resumeData.achievements || [],
					isComplete: true,
				},
			},
		);

		// Update metadata status
		await ResumeMetadata.updateOne({ sessionId }, { status: "completed" });

		return resumeData;
	}

	async updateSectionData(
		sessionId: string,
		section: ResumeSection,
		data: Partial<IResumeContent>,
	): Promise<void> {
		await ResumeContent.updateOne({ sessionId }, { $set: data });
	}

	async getResumeContent(sessionId: string): Promise<IResumeContent | null> {
		return ResumeContent.findOne({ sessionId });
	}

	isConfigured(): boolean {
		return !!config.groq.apiKey;
	}

	async listUserResumes(userId: string): Promise<ResumeListItem[]> {
		const resumes = await ResumeMetadata.find({ userId }).sort({ createdAt: -1 }).lean();

		return resumes.map((r) => ({
			sessionId: r.sessionId,
			title: r.title,
			status: r.status,
			jobDescription: r.jobDescription,
			targetRole: r.targetRole,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		}));
	}

	async updateJobDescription(sessionId: string, jobDescription: string): Promise<void> {
		await ResumeMetadata.updateOne({ sessionId }, { $set: { jobDescription } });
	}

	async updateRefineMode(sessionId: string, refineMode: boolean): Promise<void> {
		await ResumeContent.updateOne({ sessionId }, { $set: { refineMode } });
	}

	async getActiveSession(userId: string): Promise<SessionInfo | null> {
		const existingSession = await ResumeMetadata.findOne({
			userId,
			status: { $in: ["gathering", "reviewing"] },
		}).sort({ updatedAt: -1 });

		if (!existingSession) return null;

		const content = await ResumeContent.findOne({ sessionId: existingSession.sessionId });
		return {
			sessionId: existingSession.sessionId,
			userId,
			status: existingSession.status,
			currentSection: content?.currentSection || "personalInfo",
			completedSections: content?.completedSections || [],
			isComplete: content?.isComplete || false,
			refineMode: content?.refineMode || false,
			jobDescription: existingSession.jobDescription,
			title: existingSession.title,
		};
	}

	async updateTitle(sessionId: string, title: string): Promise<void> {
		await ResumeMetadata.updateOne({ sessionId }, { $set: { title } });
	}

	async getSectionData(
		sessionId: string,
		sections: string[],
	): Promise<Partial<IResumeContent> | null> {
		const content = await ResumeContent.findOne({ sessionId }).lean();
		if (!content) return null;

		const result: Partial<IResumeContent> = {};
		for (const section of sections) {
			if (section in content) {
				(result as any)[section] = (content as any)[section];
			}
		}
		return result;
	}

	async analyzeAndUpdateProgress(sessionId: string): Promise<SessionInfo | null> {
		try {
			const client = this.getClient();
			const metadata = await ResumeMetadata.findOne({ sessionId });
			if (!metadata) return null;

			// Get conversation history
			const messages = await ResumeChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean();

			// Need at least user messages to analyze
			const userMessages = messages.filter((m) => m.role === "user");
			if (userMessages.length === 0) {
				return this.getSession(sessionId);
			}

			const conversationText = messages
				.filter((m) => m.role !== "system")
				.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
				.join("\n\n");

			// Use AI to detect which sections have data
			const completion = await client.chat.completions.create({
				messages: [
					{ role: "system", content: PROGRESS_DETECTION_PROMPT },
					{ role: "user", content: `Analyze this resume conversation:\n\n${conversationText}` },
				],
				model: config.groq.model,
				temperature: 0.1,
				max_tokens: config.groq.maxTokens,
				response_format: { type: "json_object" },
			});

			const responseText = (completion.choices[0]?.message?.content || "").trim();

			// Parse JSON response
			let progressData: Record<string, string>;
			try {
				let cleanText = responseText;

				// Remove markdown code blocks
				if (cleanText.startsWith("```json")) {
					cleanText = cleanText.slice(7);
				} else if (cleanText.startsWith("```")) {
					cleanText = cleanText.slice(3);
				}
				if (cleanText.endsWith("```")) {
					cleanText = cleanText.slice(0, -3);
				}
				cleanText = cleanText.trim();

				// Try direct parse first
				try {
					progressData = JSON.parse(cleanText);
				} catch {
					// Try to extract JSON from text
					const jsonMatch = cleanText.match(/\{[\s\S]*?\}/);
					if (jsonMatch) {
						progressData = JSON.parse(jsonMatch[0]);
					} else {
						throw new Error("No JSON found in response");
					}
				}

				// Validate that progressData has the expected structure
				const expectedKeys = ["personalInfo", "summary", "experience", "education", "skills"];
				const hasExpectedKeys = expectedKeys.some((key) => key in progressData);
				if (!hasExpectedKeys) {
					throw new Error("Invalid progress data structure");
				}
			} catch (error) {
				console.warn(
					"Failed to parse progress JSON, using fallback:",
					responseText.substring(0, 200),
				);
				// Fallback: return current session state without updates
				return this.getSession(sessionId);
			}

			// Convert to completed sections array
			const allSections: ResumeSection[] = [
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

			const completedSections = allSections.filter((section) => progressData[section] === "yes");

			// Determine current section
			const REQUIRED: ResumeSection[] = [
				"personalInfo",
				"summary",
				"experience",
				"education",
				"skills",
			];
			let currentSection: ResumeSection = "personalInfo";

			for (const section of REQUIRED) {
				if (!completedSections.includes(section)) {
					currentSection = section;
					break;
				}
			}

			// If all required complete, move to optional or mark reviewing
			const allRequiredComplete = REQUIRED.every((s) => completedSections.includes(s));

			// Update content in DB
			await ResumeContent.updateOne(
				{ sessionId },
				{
					$set: {
						completedSections,
						currentSection,
						isComplete: allRequiredComplete,
					},
				},
			);

			// Update metadata status if all required complete
			if (allRequiredComplete) {
				await ResumeMetadata.updateOne({ sessionId }, { status: "reviewing" });
			}

			return this.getSession(sessionId);
		} catch (error) {
			console.error("Error analyzing progress:", error);
			return this.getSession(sessionId);
		}
	}
}

export const resumeChatService = new ResumeChatService();
