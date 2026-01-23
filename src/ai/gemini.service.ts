import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerationConfig } from "@google/genai";
import { config } from "../config";
import {
	QUESTION_GENERATION_PROMPT,
	ANSWER_EVALUATION_PROMPT,
	FOLLOW_UP_PROMPT,
	AI_CONFIG,
} from "./prompts/interview.prompts";

export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "principal";
export type InterviewType = "behavioral" | "technical" | "case-study";

export interface GeneratedQuestion {
	question: string;
	category: string;
	difficulty: string;
	expectedDuration: number;
	evaluationCriteria: string[];
}

export interface QuestionResult {
	questionIndex: number;
	score: number;
	strengths: string[];
	improvements: string[];
	feedback: string;
}

export interface InterviewEvaluation {
	overallScore: number;
	summary: string;
	questionResults: QuestionResult[];
	strengths: string[];
	improvements: string[];
	recommendations: string[];
	readinessLevel: "not-ready" | "needs-work" | "almost-ready" | "ready" | "exceptional";
}

export interface FollowUpResponse {
	followUp: string;
	reason: string;
}

const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
];

class GeminiService {
	private genAI: GoogleGenAI | null = null;

	private getClient(): GoogleGenAI {
		if (!this.genAI) {
			if (!config.gemini.apiKey) {
				throw new Error("GEMINI_API_KEY is not configured. Please set the environment variable.");
			}
			this.genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });
		}
		return this.genAI;
	}

	/**
	 * Parse JSON response from Gemini, handling potential formatting issues
	 */
	private parseJsonResponse<T>(text?: string): T {
		if (!text) {
			console.error("Empty response from Gemini API");
			throw new Error("Empty response from Gemini API");
		}
		// Clean potential markdown code blocks
		let cleanText = text.trim();
		if (cleanText.startsWith("```json")) {
			cleanText = cleanText.slice(7);
		} else if (cleanText.startsWith("```")) {
			cleanText = cleanText.slice(3);
		}
		if (cleanText.endsWith("```")) {
			cleanText = cleanText.slice(0, -3);
		}
		cleanText = cleanText.trim();

		try {
			return JSON.parse(cleanText) as T;
		} catch (error) {
			console.error("Failed to parse Gemini response:", cleanText);
			throw new Error("Invalid JSON response from Gemini API");
		}
	}

	/**
	 * Generate interview questions based on job description and context
	 */
	async generateQuestions(
		jobDescription: string,
		seniorityLevel: SeniorityLevel,
		interviewType: InterviewType,
		numberOfQuestions?: number,
	): Promise<GeneratedQuestion[]> {
		const client = this.getClient();

		const questionCount = numberOfQuestions || AI_CONFIG.defaultQuestionCount[seniorityLevel];

		const prompt = `Generate ${questionCount} ${interviewType} interview questions for the following role:

## Job Description
${jobDescription}

## Seniority Level
${seniorityLevel}

## Interview Type
${interviewType}

Generate exactly ${questionCount} questions appropriate for this role and level.`;

		try {
			const response = await client.models.generateContent({
				model: config.gemini.model,
				contents: prompt,
				config: {
					systemInstruction: QUESTION_GENERATION_PROMPT,
					safetySettings,
					temperature: AI_CONFIG.temperature.questionGeneration,
					maxOutputTokens: AI_CONFIG.maxOutputTokens.questionGeneration,
				},
			});
			const parsed = this.parseJsonResponse<{ questions: GeneratedQuestion[] }>(response.text);

			if (!parsed.questions || !Array.isArray(parsed.questions)) {
				throw new Error("Invalid response format: missing questions array");
			}

			return parsed.questions;
		} catch (error: any) {
			console.error("Error generating questions:", error);
			throw new Error(`Failed to generate questions: ${error.message}`);
		}
	}

	/**
	 * Evaluate interview answers and provide detailed feedback
	 */
	async evaluateAnswers(
		questions: string[],
		answers: string[],
		jobDescription: string,
		seniorityLevel: SeniorityLevel,
	): Promise<InterviewEvaluation> {
		const client = this.getClient();

		// Format Q&A pairs for evaluation
		const qaPairs = questions
			.map(
				(q, i) =>
					`**Question ${i + 1}:** ${q}\n**Answer:** ${answers[i] || "(No answer provided)"}`,
			)
			.join("\n\n---\n\n");

		const prompt = `Evaluate the following interview responses:

## Job Context
${jobDescription}

## Expected Seniority Level
${seniorityLevel}

## Questions and Answers
${qaPairs}

Provide a comprehensive evaluation of all responses.`;

		try {
			const response = await client.models.generateContent({
				model: config.gemini.model,
				contents: qaPairs,
				config: {
					systemInstruction: ANSWER_EVALUATION_PROMPT,
					safetySettings,
					temperature: AI_CONFIG.temperature.answerEvaluation,
					maxOutputTokens: AI_CONFIG.maxOutputTokens.answerEvaluation,
				},
			});

			const evaluation = this.parseJsonResponse<InterviewEvaluation>(response.text);

			// Validate required fields
			if (
				typeof evaluation.overallScore !== "number" ||
				!Array.isArray(evaluation.questionResults)
			) {
				throw new Error("Invalid evaluation format");
			}

			return evaluation;
		} catch (error: any) {
			console.error("Error evaluating answers:", error);
			throw new Error(`Failed to evaluate answers: ${error.message}`);
		}
	}

	/**
	 * Generate a follow-up question based on previous response
	 */
	async generateFollowUp(
		originalQuestion: string,
		candidateAnswer: string,
		interviewType: InterviewType,
	): Promise<FollowUpResponse> {
		const client = this.getClient();

		const prompt = `Interview Type: ${interviewType}

Original Question: ${originalQuestion}

Candidate's Response: ${candidateAnswer}

Generate an appropriate follow-up question.`;

		try {
			const response = await client.models.generateContent({
				model: config.gemini.model,
				contents: prompt,
				config: {
					systemInstruction: FOLLOW_UP_PROMPT,
					safetySettings,
					temperature: AI_CONFIG.temperature.followUp,
					maxOutputTokens: AI_CONFIG.maxOutputTokens.followUp,
				},
			});

			return this.parseJsonResponse<FollowUpResponse>(response.text);
		} catch (error: any) {
			console.error("Error generating follow-up:", error);
			throw new Error(`Failed to generate follow-up: ${error.message}`);
		}
	}

	/**
	 * Check if the Gemini service is configured and available
	 */
	isConfigured(): boolean {
		return !!config.gemini.apiKey;
	}
}

// Export singleton instance
export const geminiService = new GeminiService();
