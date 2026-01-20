import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { Interview } from "../models";
import { geminiService, SeniorityLevel, InterviewType } from "../ai/gemini.service";

// Default interview questions by type
const INTERVIEW_QUESTIONS = {
    behavioral: [
        "Tell me about yourself and your background.",
        "Describe a challenging project you worked on and how you handled it.",
        "How do you prioritize tasks when working on multiple projects?",
        "Tell me about a time you had to work with a difficult team member.",
        "Where do you see yourself in 5 years?",
    ],
    technical: [
        "Walk me through your approach to debugging a complex issue.",
        "How do you stay updated with new technologies?",
        "Describe a system you designed and the trade-offs you made.",
        "How do you handle technical disagreements with teammates?",
        "Explain a complex technical concept to a non-technical person.",
    ],
    "case-study": [
        "How would you approach entering a new market?",
        "Analyze this business scenario and suggest improvements.",
        "What metrics would you track for a new product launch?",
        "How would you prioritize features for a limited budget?",
        "Walk me through your problem-solving process.",
    ],
};

// Create a new interview session
export const createInterview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const {
            title,
            type = "behavioral",
            duration = 30,
            jobDescription,
            seniorityLevel,
            useAI = false,
            numberOfQuestions,
        } = req.body;

        const sessionId = nanoid(12);
        let questions: string[] = [];
        let questionsMetadata: any[] = [];
        let aiGenerated = false;

        // If useAI is true and we have job context, generate questions with Gemini
        if (useAI && jobDescription && seniorityLevel && geminiService.isConfigured()) {
            try {
                const generatedQuestions = await geminiService.generateQuestions(
                    jobDescription,
                    seniorityLevel as SeniorityLevel,
                    type as InterviewType,
                    numberOfQuestions
                );
                questions = generatedQuestions.map((q) => q.question);
                questionsMetadata = generatedQuestions;
                aiGenerated = true;
            } catch (error) {
                console.error("AI question generation failed, using defaults:", error);
                questions = INTERVIEW_QUESTIONS[type as keyof typeof INTERVIEW_QUESTIONS] || INTERVIEW_QUESTIONS.behavioral;
            }
        } else {
            questions = INTERVIEW_QUESTIONS[type as keyof typeof INTERVIEW_QUESTIONS] || INTERVIEW_QUESTIONS.behavioral;
        }

        const interview = new Interview({
            userId,
            sessionId,
            title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Interview`,
            type,
            status: "pending",
            questions,
            questionsMetadata: aiGenerated ? questionsMetadata : undefined,
            currentQuestionIndex: 0,
            duration,
            messages: [],
            jobDescription,
            seniorityLevel,
            aiGenerated,
        });

        await interview.save();

        res.status(201).json({
            success: true,
            interview: {
                id: interview._id,
                sessionId: interview.sessionId,
                title: interview.title,
                type: interview.type,
                status: interview.status,
                questions: interview.questions,
                questionsMetadata: interview.questionsMetadata,
                currentQuestionIndex: interview.currentQuestionIndex,
                duration: interview.duration,
                jobDescription: interview.jobDescription,
                seniorityLevel: interview.seniorityLevel,
                aiGenerated: interview.aiGenerated,
            },
        });
    } catch (error: any) {
        console.error("createInterview error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all interviews for user
export const getInterviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { status, limit = 10 } = req.query;

        const query: any = { userId };
        if (status) {
            query.status = status;
        }

        const interviews = await Interview.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .select("-messages");

        res.status(200).json({ success: true, interviews });
    } catch (error: any) {
        console.error("getInterviews error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single interview by ID or sessionId
export const getInterview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        // Try to find by sessionId first, then by _id
        let interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            interview = await Interview.findOne({ _id: id, userId });
        }

        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        res.status(200).json({ success: true, interview });
    } catch (error: any) {
        console.error("getInterview error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Start an interview session
export const startInterview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        if (interview.status !== "pending") {
            res.status(400).json({ success: false, message: "Interview already started or completed" });
            return;
        }

        interview.status = "in-progress";
        interview.startedAt = new Date();

        // Add first AI message
        interview.messages.push({
            role: "ai",
            content: `Welcome to your ${interview.type} interview! Let's begin with your first question:\n\n${interview.questions[0]}`,
            timestamp: new Date(),
        });

        await interview.save();

        res.status(200).json({ success: true, interview });
    } catch (error: any) {
        console.error("startInterview error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a message to interview
export const addMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const { content } = req.body;

        if (!content?.trim()) {
            res.status(400).json({ success: false, message: "Message content is required" });
            return;
        }

        const interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        if (interview.status !== "in-progress") {
            res.status(400).json({ success: false, message: "Interview not in progress" });
            return;
        }

        // Add user message
        interview.messages.push({
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        });

        await interview.save();

        res.status(200).json({
            success: true,
            message: interview.messages[interview.messages.length - 1],
        });
    } catch (error: any) {
        console.error("addMessage error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Move to next question
export const nextQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        if (interview.status !== "in-progress") {
            res.status(400).json({ success: false, message: "Interview not in progress" });
            return;
        }

        const nextIndex = interview.currentQuestionIndex + 1;

        if (nextIndex >= interview.questions.length) {
            res.status(400).json({
                success: false,
                message: "No more questions. Please complete the interview.",
                isLastQuestion: true,
            });
            return;
        }

        interview.currentQuestionIndex = nextIndex;

        // Add AI message with next question
        interview.messages.push({
            role: "ai",
            content: `Great response! Here's your next question:\n\n${interview.questions[nextIndex]}`,
            timestamp: new Date(),
        });

        await interview.save();

        res.status(200).json({
            success: true,
            currentQuestionIndex: interview.currentQuestionIndex,
            question: interview.questions[nextIndex],
            isLastQuestion: nextIndex === interview.questions.length - 1,
        });
    } catch (error: any) {
        console.error("nextQuestion error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Complete interview with feedback
export const completeInterview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        if (interview.status === "completed") {
            res.status(400).json({ success: false, message: "Interview already completed" });
            return;
        }

        // Generate mock feedback (replace with AI service later)
        const userMessages = interview.messages.filter((m) => m.role === "user");
        const totalWords = userMessages.reduce((acc, m) => acc + m.content.split(" ").length, 0);
        const avgWordCount = Math.round(totalWords / Math.max(userMessages.length, 1));

        // Calculate score based on engagement
        const baseScore = 70;
        const engagementBonus = Math.min(15, avgWordCount / 10);
        const questionsAnsweredBonus = (userMessages.length / interview.questions.length) * 15;
        const score = Math.round(baseScore + engagementBonus + questionsAnsweredBonus);

        interview.status = "completed";
        interview.completedAt = new Date();
        interview.score = Math.min(100, score);
        interview.feedback = {
            strengths: [
                "Clear and structured responses",
                "Good use of examples",
                "Demonstrated relevant experience",
            ],
            improvements: [
                "Add more specific metrics and outcomes",
                "Quantify achievements where possible",
                "Practice concise delivery",
            ],
            tips: [
                "Use the STAR method for behavioral questions",
                "Prepare 2-3 strong examples for common themes",
                "Practice answering in under 2 minutes",
            ],
        };

        // Add closing message
        interview.messages.push({
            role: "ai",
            content: `Thank you for completing this interview session! Your overall score is ${interview.score}%. Check your detailed feedback to see areas of strength and opportunities for improvement.`,
            timestamp: new Date(),
        });

        await interview.save();

        res.status(200).json({
            success: true,
            interview: {
                id: interview._id,
                sessionId: interview.sessionId,
                status: interview.status,
                score: interview.score,
                feedback: interview.feedback,
                completedAt: interview.completedAt,
            },
        });
    } catch (error: any) {
        console.error("completeInterview error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get interview statistics
export const getInterviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const interviews = await Interview.find({ userId, status: "completed" });

        const totalInterviews = interviews.length;
        const avgScore =
            totalInterviews > 0 ? Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / totalInterviews) : 0;

        // Calculate total practice time
        const totalMinutes = interviews.reduce((acc, i) => {
            if (i.startedAt && i.completedAt) {
                const diff = new Date(i.completedAt).getTime() - new Date(i.startedAt).getTime();
                return acc + Math.round(diff / 60000);
            }
            return acc;
        }, 0);

        // Weekly data for chart
        const weeklyData = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekInterviews = interviews.filter((interview) => {
                const created = new Date(interview.createdAt);
                return created >= weekStart && created < weekEnd;
            });

            const weekScore = weekInterviews.length > 0
                ? Math.round(weekInterviews.reduce((acc, w) => acc + (w.score || 0), 0) / weekInterviews.length)
                : 0;

            weeklyData.push({
                week: `W${6 - i}`,
                score: weekScore,
                interviews: weekInterviews.length,
            });
        }

        res.status(200).json({
            success: true,
            stats: {
                totalInterviews,
                avgScore,
                totalMinutes,
                weeklyData,
            },
        });
    } catch (error: any) {
        console.error("getInterviewStats error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate interview questions using Gemini AI
export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { jobDescription, seniorityLevel, type = "behavioral", numberOfQuestions } = req.body;

        if (!jobDescription || !seniorityLevel) {
            res.status(400).json({
                success: false,
                message: "jobDescription and seniorityLevel are required",
            });
            return;
        }

        if (!geminiService.isConfigured()) {
            res.status(503).json({
                success: false,
                message: "AI service is not configured. Please set GEMINI_API_KEY.",
            });
            return;
        }

        const questions = await geminiService.generateQuestions(
            jobDescription,
            seniorityLevel as SeniorityLevel,
            type as InterviewType,
            numberOfQuestions
        );

        res.status(200).json({
            success: true,
            questions,
            metadata: {
                jobDescription,
                seniorityLevel,
                type,
                count: questions.length,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error("generateQuestions error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Evaluate interview answers using Gemini AI
export const evaluateInterview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const interview = await Interview.findOne({ sessionId: id, userId });
        if (!interview) {
            res.status(404).json({ success: false, message: "Interview not found" });
            return;
        }

        if (interview.status !== "completed" && interview.status !== "in-progress") {
            res.status(400).json({
                success: false,
                message: "Interview must be completed or in-progress to evaluate",
            });
            return;
        }

        if (!geminiService.isConfigured()) {
            res.status(503).json({
                success: false,
                message: "AI service is not configured. Please set GEMINI_API_KEY.",
            });
            return;
        }

        // Extract answers from messages
        const userMessages = interview.messages.filter((m) => m.role === "user");
        const answers = userMessages.map((m) => m.content);

        // Use questionsMetadata questions or fallback to simple questions array
        const questions = interview.questionsMetadata?.map((q) => q.question) || interview.questions;

        if (answers.length === 0) {
            res.status(400).json({
                success: false,
                message: "No answers found to evaluate",
            });
            return;
        }

        const evaluation = await geminiService.evaluateAnswers(
            questions.slice(0, answers.length), // Only evaluate answered questions
            answers,
            interview.jobDescription || `${interview.type} interview`,
            (interview.seniorityLevel as SeniorityLevel) || "mid"
        );

        // Update interview with evaluation
        interview.evaluation = {
            ...evaluation,
            evaluatedAt: new Date(),
        };
        interview.score = evaluation.overallScore;
        interview.status = "evaluated";
        interview.feedback = {
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            tips: evaluation.recommendations,
        };

        await interview.save();

        res.status(200).json({
            success: true,
            evaluation: interview.evaluation,
            score: interview.score,
            feedback: interview.feedback,
        });
    } catch (error: any) {
        console.error("evaluateInterview error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
