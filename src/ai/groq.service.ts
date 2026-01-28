import Groq from "groq-sdk";
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

// Groq doesn't use safety settings in the same way, handled server-side

class GroqService {
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

    /**
     * Parse JSON response from AI, handling potential formatting issues
     */
    private parseJsonResponse<T>(text?: string): T {
        if (!text) {
            console.error("Empty response from Groq API");
            throw new Error("Empty response from Groq API");
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
            console.error("Failed to parse Groq response:", cleanText);
            throw new Error("Invalid JSON response from Groq API");
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
            const completion = await client.chat.completions.create({
                messages: [
                    { role: "system", content: QUESTION_GENERATION_PROMPT },
                    { role: "user", content: prompt }
                ],
                model: config.groq.model,
                temperature: AI_CONFIG.temperature.questionGeneration,
                max_tokens: AI_CONFIG.maxOutputTokens.questionGeneration,
                response_format: { type: "json_object" }
            });

            const parsed = this.parseJsonResponse<{ questions: GeneratedQuestion[] }>(completion.choices[0]?.message?.content || "");

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
            const completion = await client.chat.completions.create({
                messages: [
                    { role: "system", content: ANSWER_EVALUATION_PROMPT },
                    { role: "user", content: prompt }
                ],
                model: config.groq.model,
                temperature: AI_CONFIG.temperature.answerEvaluation,
                max_tokens: AI_CONFIG.maxOutputTokens.answerEvaluation,
                response_format: { type: "json_object" }
            });

            const evaluation = this.parseJsonResponse<InterviewEvaluation>(completion.choices[0]?.message?.content || "");

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
            const completion = await client.chat.completions.create({
                messages: [
                    { role: "system", content: FOLLOW_UP_PROMPT },
                    { role: "user", content: prompt }
                ],
                model: config.groq.model,
                temperature: AI_CONFIG.temperature.followUp,
                max_tokens: AI_CONFIG.maxOutputTokens.followUp,
                response_format: { type: "json_object" }
            });

            return this.parseJsonResponse<FollowUpResponse>(completion.choices[0]?.message?.content || "");
        } catch (error: any) {
            console.error("Error generating follow-up:", error);
            throw new Error(`Failed to generate follow-up: ${error.message}`);
        }
    }

    /**
     * Check if the Groq service is configured and available
     */
    isConfigured(): boolean {
        return !!config.groq.apiKey;
    }
}

// Export singleton instance
export const groqService = new GroqService();
