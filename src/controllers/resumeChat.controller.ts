/**
 * Resume Chat WebSocket Controller
 * Handles real-time resume building chat via Socket.IO
 */

import { Server, Socket } from "socket.io";
import { resumeChatService, StreamCallbacks } from "../ai/resumeChat.service";
import { ResumeMetadata, ResumeChatMessage } from "../models";

// ============================================================
// TYPES
// ============================================================

interface ResumeSession {
    sessionId: string;
    participants: Set<string>;
}

// Track active resume chat sessions
const resumeSessions: Map<string, ResumeSession> = new Map();

// ============================================================
// SOCKET EVENT HANDLERS
// ============================================================

/**
 * Register resume chat event handlers on a Socket.IO server
 */
export function registerResumeChatHandlers(io: Server): void {
    io.on("connection", (socket: Socket) => {
        // ========== Resume Chat Events ==========

        /**
         * Start a new resume chat session
         * Event: resume:start
         * Payload: { userId: string, title?: string, jobDescription?: string, resumeId?: string }
         * Response: resume:started | resume:error
         */
        socket.on("resume:start", async (data: {
            userId: string;
            title?: string;
            jobDescription?: string;
            resumeId?: string;
        }) => {
            try {
                const { userId, title, jobDescription, resumeId } = data;

                if (!userId) {
                    socket.emit("resume:error", { message: "User ID is required" });
                    return;
                }

                // Check if AI service is configured
                if (!resumeChatService.isConfigured()) {
                    socket.emit("resume:error", {
                        message: "AI service is not configured. Please check API key.",
                    });
                    return;
                }

                let sessionInfo;

                // If resumeId provided, try to join existing session
                if (resumeId) {
                    sessionInfo = await resumeChatService.getSession(resumeId);
                    if (!sessionInfo) {
                        socket.emit("resume:error", { message: "Resume not found" });
                        return;
                    }
                } else {
                    // Create new session with optional title and JD
                    sessionInfo = await resumeChatService.createSession(userId, {
                        title,
                        jobDescription,
                    });
                }

                // Join the socket room for this session
                socket.join(`resume:${sessionInfo.sessionId}`);

                // Track session
                if (!resumeSessions.has(sessionInfo.sessionId)) {
                    resumeSessions.set(sessionInfo.sessionId, {
                        sessionId: sessionInfo.sessionId,
                        participants: new Set(),
                    });
                }
                resumeSessions.get(sessionInfo.sessionId)!.participants.add(socket.id);

                // Get greeting message for new sessions or history for existing
                let messages: Array<{ role: string; content: string; timestamp: Date }> = [];
                const chatHistory = await resumeChatService.getChatHistory(sessionInfo.sessionId);

                if (chatHistory.length <= 1) {
                    // New session - send greeting
                    const greeting = await resumeChatService.getGreetingMessage(sessionInfo.sessionId);
                    messages = [
                        {
                            role: "assistant",
                            content: greeting,
                            timestamp: new Date(),
                        },
                    ];
                } else {
                    // Existing session - return history
                    messages = chatHistory.map((m) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(),
                    }));
                }

                socket.emit("resume:started", {
                    sessionId: sessionInfo.sessionId,
                    status: sessionInfo.status,
                    currentSection: sessionInfo.currentSection,
                    completedSections: sessionInfo.completedSections,
                    isComplete: sessionInfo.isComplete,
                    refineMode: sessionInfo.refineMode,
                    jobDescription: sessionInfo.jobDescription,
                    title: sessionInfo.title,
                    messages,
                });

                console.log(`User ${userId} started resume session: ${sessionInfo.sessionId}`);
            } catch (error: any) {
                console.error("resume:start error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to start session" });
            }
        });

        /**
         * Join an existing resume chat session
         * Event: resume:join
         * Payload: { sessionId: string }
         * Response: resume:joined | resume:error
         */
        socket.on("resume:join", async (data: { sessionId: string }) => {
            try {
                const { sessionId } = data;

                if (!sessionId) {
                    socket.emit("resume:error", { message: "Session ID is required" });
                    return;
                }

                const sessionInfo = await resumeChatService.getSession(sessionId);

                if (!sessionInfo) {
                    socket.emit("resume:error", { message: "Session not found" });
                    return;
                }

                // Join socket room
                socket.join(`resume:${sessionId}`);

                // Track participant
                if (!resumeSessions.has(sessionId)) {
                    resumeSessions.set(sessionId, {
                        sessionId,
                        participants: new Set(),
                    });
                }
                resumeSessions.get(sessionId)!.participants.add(socket.id);

                // Get chat history
                const chatHistory = await resumeChatService.getChatHistory(sessionId);
                const messages = chatHistory.map((m) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(),
                }));

                socket.emit("resume:joined", {
                    sessionId,
                    status: sessionInfo.status,
                    currentSection: sessionInfo.currentSection,
                    completedSections: sessionInfo.completedSections,
                    isComplete: sessionInfo.isComplete,
                    messages,
                });

                console.log(`Socket ${socket.id} joined resume session: ${sessionId}`);
            } catch (error: any) {
                console.error("resume:join error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to join session" });
            }
        });

        /**
         * Send a message in the resume chat
         * Event: resume:message
         * Payload: { sessionId: string, content: string, refineMode?: boolean }
         * Response: resume:token (streamed) -> resume:messageComplete | resume:error
         */
        socket.on("resume:message", async (data: {
            sessionId: string;
            content: string;
            refineMode?: boolean;
        }) => {
            try {
                const { sessionId, content, refineMode } = data;

                if (!sessionId || !content?.trim()) {
                    socket.emit("resume:error", { message: "Session ID and message content are required" });
                    return;
                }

                const sessionInfo = await resumeChatService.getSession(sessionId);

                if (!sessionInfo) {
                    socket.emit("resume:error", { message: "Session not found" });
                    return;
                }

                if (sessionInfo.status === "completed") {
                    socket.emit("resume:error", { message: "This resume is already completed" });
                    return;
                }

                // Emit user message to all participants
                io.to(`resume:${sessionId}`).emit("resume:userMessage", {
                    role: "user",
                    content: content.trim(),
                    timestamp: new Date(),
                });

                // Stream AI response
                const callbacks: StreamCallbacks = {
                    onToken: (token: string) => {
                        io.to(`resume:${sessionId}`).emit("resume:token", { token });
                    },
                    onComplete: async (fullMessage: string) => {
                        // Emit complete message
                        io.to(`resume:${sessionId}`).emit("resume:messageComplete", {
                            role: "assistant",
                            content: fullMessage,
                            timestamp: new Date(),
                        });

                        // Check completion status and update session info
                        const completion = await resumeChatService.checkCompletion(sessionId);
                        const updatedSession = await resumeChatService.getSession(sessionId);

                        io.to(`resume:${sessionId}`).emit("resume:sessionUpdate", {
                            status: updatedSession?.status,
                            currentSection: updatedSession?.currentSection,
                            completedSections: updatedSession?.completedSections,
                            isComplete: completion.isReady,
                            refineMode: updatedSession?.refineMode,
                        });
                    },
                    onError: (error: Error) => {
                        socket.emit("resume:error", { message: error.message || "Failed to generate response" });
                    },
                };

                await resumeChatService.streamResponse(sessionId, content.trim(), callbacks, { refineMode });
            } catch (error: any) {
                console.error("resume:message error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to process message" });
            }
        });

        /**
         * Mark a section as complete
         * Event: resume:sectionComplete
         * Payload: { sessionId: string, section: string }
         * Response: resume:sectionCompleted | resume:error
         */
        socket.on(
            "resume:sectionComplete",
            async (data: { sessionId: string; section: string }) => {
                try {
                    const { sessionId, section } = data;

                    if (!sessionId || !section) {
                        socket.emit("resume:error", {
                            message: "Session ID and section are required",
                        });
                        return;
                    }

                    await resumeChatService.markSectionComplete(
                        sessionId,
                        section as any
                    );

                    const sessionInfo = await resumeChatService.getSession(sessionId);
                    const completion = await resumeChatService.checkCompletion(sessionId);

                    io.to(`resume:${sessionId}`).emit("resume:sectionCompleted", {
                        section,
                        completedSections: sessionInfo?.completedSections,
                        currentSection: sessionInfo?.currentSection,
                        isReady: completion.isReady,
                        missingRequired: completion.missingRequired,
                    });
                } catch (error: any) {
                    console.error("resume:sectionComplete error:", error);
                    socket.emit("resume:error", {
                        message: error.message || "Failed to complete section",
                    });
                }
            }
        );

        /**
         * Generate the final resume JSON
         * Event: resume:generate
         * Payload: { sessionId: string }
         * Response: resume:complete | resume:error
         */
        socket.on("resume:generate", async (data: { sessionId: string }) => {
            try {
                const { sessionId } = data;

                if (!sessionId) {
                    socket.emit("resume:error", { message: "Session ID is required" });
                    return;
                }

                // Check if ready
                const completion = await resumeChatService.checkCompletion(sessionId);

                if (!completion.isReady) {
                    socket.emit("resume:error", {
                        message: `Cannot generate resume. Missing required sections: ${completion.missingRequired.join(", ")}`,
                    });
                    return;
                }

                // Emit generating status
                io.to(`resume:${sessionId}`).emit("resume:generating", {
                    message: "Generating your resume...",
                });

                // Generate final resume
                const resumeData = await resumeChatService.generateFinalResume(sessionId);

                io.to(`resume:${sessionId}`).emit("resume:complete", {
                    sessionId,
                    resume: resumeData,
                    message: "Your resume has been generated successfully!",
                });

                console.log(`Resume generated for session: ${sessionId}`);
            } catch (error: any) {
                console.error("resume:generate error:", error);
                socket.emit("resume:error", {
                    message: error.message || "Failed to generate resume",
                });
            }
        });

        /**
         * Leave a resume chat session
         * Event: resume:leave
         * Payload: { sessionId: string }
         */
        socket.on("resume:leave", (data: { sessionId: string }) => {
            const { sessionId } = data;

            if (!sessionId) return;

            socket.leave(`resume:${sessionId}`);

            const session = resumeSessions.get(sessionId);
            if (session) {
                session.participants.delete(socket.id);
                if (session.participants.size === 0) {
                    resumeSessions.delete(sessionId);
                }
            }

            console.log(`Socket ${socket.id} left resume session: ${sessionId}`);
        });

        /**
         * Get session status
         * Event: resume:status
         * Payload: { sessionId: string }
         * Response: resume:statusUpdate | resume:error
         */
        socket.on("resume:status", async (data: { sessionId: string }) => {
            try {
                const { sessionId } = data;

                if (!sessionId) {
                    socket.emit("resume:error", { message: "Session ID is required" });
                    return;
                }

                const sessionInfo = await resumeChatService.getSession(sessionId);

                if (!sessionInfo) {
                    socket.emit("resume:error", { message: "Session not found" });
                    return;
                }

                const completion = await resumeChatService.checkCompletion(sessionId);

                socket.emit("resume:statusUpdate", {
                    sessionId,
                    status: sessionInfo.status,
                    currentSection: sessionInfo.currentSection,
                    completedSections: sessionInfo.completedSections,
                    isComplete: sessionInfo.isComplete,
                    isReady: completion.isReady,
                    missingRequired: completion.missingRequired,
                });
            } catch (error: any) {
                console.error("resume:status error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to get status" });
            }
        });

        /**
         * List all resumes for a user
         * Event: resume:list
         * Payload: { userId: string }
         * Response: resume:resumeList | resume:error
         */
        socket.on("resume:list", async (data: { userId: string }) => {
            try {
                const { userId } = data;

                if (!userId) {
                    socket.emit("resume:error", { message: "User ID is required" });
                    return;
                }

                const resumes = await resumeChatService.listUserResumes(userId);

                socket.emit("resume:resumeList", { resumes });
            } catch (error: any) {
                console.error("resume:list error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to list resumes" });
            }
        });

        /**
         * Update job description for a session
         * Event: resume:updateJD
         * Payload: { sessionId: string, jobDescription: string }
         * Response: resume:jdUpdated | resume:error
         */
        socket.on("resume:updateJD", async (data: { sessionId: string; jobDescription: string }) => {
            try {
                const { sessionId, jobDescription } = data;

                if (!sessionId) {
                    socket.emit("resume:error", { message: "Session ID is required" });
                    return;
                }

                await resumeChatService.updateJobDescription(sessionId, jobDescription);

                io.to(`resume:${sessionId}`).emit("resume:jdUpdated", {
                    sessionId,
                    jobDescription,
                });

                console.log(`JD updated for session: ${sessionId}`);
            } catch (error: any) {
                console.error("resume:updateJD error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to update JD" });
            }
        });

        /**
         * Update resume title
         * Event: resume:updateTitle
         * Payload: { sessionId: string, title: string }
         * Response: resume:titleUpdated | resume:error
         */
        socket.on("resume:updateTitle", async (data: { sessionId: string; title: string }) => {
            try {
                const { sessionId, title } = data;

                if (!sessionId || !title?.trim()) {
                    socket.emit("resume:error", { message: "Session ID and title are required" });
                    return;
                }

                await resumeChatService.updateTitle(sessionId, title.trim());

                io.to(`resume:${sessionId}`).emit("resume:titleUpdated", {
                    sessionId,
                    title: title.trim(),
                });

                console.log(`Title updated for session: ${sessionId}`);
            } catch (error: any) {
                console.error("resume:updateTitle error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to update title" });
            }
        });

        /**
         * Get section data from existing resume for reuse
         * Event: resume:getSectionData
         * Payload: { sessionId: string, sections: string[] }
         * Response: resume:sectionData | resume:error
         */
        socket.on("resume:getSectionData", async (data: { sessionId: string; sections: string[] }) => {
            try {
                const { sessionId, sections } = data;

                if (!sessionId || !sections?.length) {
                    socket.emit("resume:error", { message: "Session ID and sections are required" });
                    return;
                }

                const sectionData = await resumeChatService.getSectionData(sessionId, sections);

                socket.emit("resume:sectionData", {
                    sessionId,
                    sections: sectionData,
                });
            } catch (error: any) {
                console.error("resume:getSectionData error:", error);
                socket.emit("resume:error", { message: error.message || "Failed to get section data" });
            }
        });

        // ========== Cleanup on Disconnect ==========
        socket.on("disconnect", () => {
            // Clean up from all resume sessions
            for (const [sessionId, session] of resumeSessions.entries()) {
                if (session.participants.has(socket.id)) {
                    session.participants.delete(socket.id);
                    if (session.participants.size === 0) {
                        resumeSessions.delete(sessionId);
                    }
                }
            }
        });
    });
}

/**
 * Get active sessions count (for monitoring)
 */
export function getActiveSessionsCount(): number {
    return resumeSessions.size;
}

/**
 * Get session participants count
 */
export function getSessionParticipants(sessionId: string): number {
    return resumeSessions.get(sessionId)?.participants.size || 0;
}
