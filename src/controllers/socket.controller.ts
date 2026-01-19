import { Server, Socket } from "socket.io";
import http from "http";
import { Interview } from "../models";

interface Connections {
	[key: string]: string[];
}

interface TimeOnline {
	[key: string]: Date;
}

interface InterviewRoom {
	sessionId: string;
	participants: string[];
}

let connections: Connections = {};
let timeOnline: TimeOnline = {};
let interviewRooms: Map<string, InterviewRoom> = new Map();

export const connectToSocket = (server: http.Server): Server => {
	console.log("Socket.io server initializing...");

	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			allowedHeaders: ["*"],
			credentials: true,
		},
	});

	io.on("connection", (socket: Socket) => {
		console.log("A user has connected:", socket.id);

		// ========== Video Call Events (existing) ==========
		socket.on("join-call", (path: string) => {
			if (connections[path] === undefined) {
				connections[path] = [];
			}

			// 1:1 calls
			if (connections[path].length >= 2) {
				socket.emit("room-full", "Cannot join: this meeting already has 2 participants");
				return;
			}

			connections[path].push(socket.id);
			timeOnline[socket.id] = new Date();

			// Notify all users in the room about the new user
			for (const id of connections[path]) {
				io.to(id).emit("user-joined", socket.id, connections[path]);
			}
		});

		socket.on("signal", (toId: string, message: any) => {
			io.to(toId).emit("signal", socket.id, message);
		});

		// ========== Text Interview Events (new) ==========

		// Join an interview room
		socket.on("interview:join", async (sessionId: string) => {
			try {
				const interview = await Interview.findOne({ sessionId });

				if (!interview) {
					socket.emit("interview:error", { message: "Interview not found" });
					return;
				}

				// Join the socket room
				socket.join(`interview:${sessionId}`);

				// Track in interview rooms
				if (!interviewRooms.has(sessionId)) {
					interviewRooms.set(sessionId, {
						sessionId,
						participants: [],
					});
				}
				const room = interviewRooms.get(sessionId)!;
				if (!room.participants.includes(socket.id)) {
					room.participants.push(socket.id);
				}

				// Send current interview state
				socket.emit("interview:joined", {
					sessionId,
					status: interview.status,
					messages: interview.messages,
					questions: interview.questions,
					currentQuestionIndex: interview.currentQuestionIndex,
					title: interview.title,
					type: interview.type,
				});

				console.log(`User ${socket.id} joined interview: ${sessionId}`);
			} catch (error) {
				console.error("interview:join error:", error);
				socket.emit("interview:error", { message: "Failed to join interview" });
			}
		});

		// Send a message in the interview
		socket.on("interview:message", async (data: { sessionId: string; content: string }) => {
			try {
				const { sessionId, content } = data;

				if (!content?.trim()) {
					socket.emit("interview:error", { message: "Message content is required" });
					return;
				}

				const interview = await Interview.findOne({ sessionId });

				if (!interview) {
					socket.emit("interview:error", { message: "Interview not found" });
					return;
				}

				if (interview.status !== "in-progress") {
					socket.emit("interview:error", { message: "Interview not in progress" });
					return;
				}

				// Add user message
				const userMessage = {
					role: "user" as const,
					content: content.trim(),
					timestamp: new Date(),
				};
				interview.messages.push(userMessage);
				await interview.save();

				// Broadcast user message to room
				io.to(`interview:${sessionId}`).emit("interview:message", userMessage);

				// Generate AI response after a brief delay to feel natural
				setTimeout(async () => {
					const currentQuestion = interview.questions[interview.currentQuestionIndex];
					const isLastQuestion = interview.currentQuestionIndex >= interview.questions.length - 1;

					let aiContent: string;

					if (content.length < 50) {
						aiContent = "I see. Could you elaborate a bit more on your response? Providing specific examples helps demonstrate your experience.";
					} else if (content.length > 500) {
						aiContent = "That's a comprehensive response! You've covered a lot of ground. In actual interviews, try to keep your answers focused and under 2 minutes.";
					} else {
						const feedbackOptions = [
							"Great response! You've structured your answer well. Let's continue when you're ready.",
							"Thank you for sharing that. I appreciate the specific examples you provided.",
							"Good answer. Remember to quantify your achievements when possible - numbers make your impact tangible.",
							"Well articulated! You demonstrated good self-awareness in your response.",
						];
						aiContent = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
					}

					if (isLastQuestion) {
						aiContent += "\n\nThis was the final question. Click 'Complete Interview' when you're ready to finish and receive your feedback.";
					}

					const aiMessage = {
						role: "ai" as const,
						content: aiContent,
						timestamp: new Date(),
					};

					interview.messages.push(aiMessage);
					await interview.save();

					io.to(`interview:${sessionId}`).emit("interview:message", aiMessage);
				}, 1500);
			} catch (error) {
				console.error("interview:message error:", error);
				socket.emit("interview:error", { message: "Failed to send message" });
			}
		});

		// Move to next question
		socket.on("interview:next", async (sessionId: string) => {
			try {
				const interview = await Interview.findOne({ sessionId });

				if (!interview) {
					socket.emit("interview:error", { message: "Interview not found" });
					return;
				}

				if (interview.status !== "in-progress") {
					socket.emit("interview:error", { message: "Interview not in progress" });
					return;
				}

				const nextIndex = interview.currentQuestionIndex + 1;

				if (nextIndex >= interview.questions.length) {
					socket.emit("interview:lastQuestion", {
						message: "This is the final question. Complete the interview when ready.",
					});
					return;
				}

				interview.currentQuestionIndex = nextIndex;

				const aiMessage = {
					role: "ai" as const,
					content: `Perfect! Let's move on.\n\n**Question ${nextIndex + 1}:** ${interview.questions[nextIndex]}`,
					timestamp: new Date(),
				};

				interview.messages.push(aiMessage);
				await interview.save();

				io.to(`interview:${sessionId}`).emit("interview:message", aiMessage);
				io.to(`interview:${sessionId}`).emit("interview:questionChanged", {
					currentQuestionIndex: nextIndex,
					question: interview.questions[nextIndex],
					isLastQuestion: nextIndex === interview.questions.length - 1,
				});
			} catch (error) {
				console.error("interview:next error:", error);
				socket.emit("interview:error", { message: "Failed to move to next question" });
			}
		});

		// Complete the interview
		socket.on("interview:complete", async (sessionId: string) => {
			try {
				const interview = await Interview.findOne({ sessionId });

				if (!interview) {
					socket.emit("interview:error", { message: "Interview not found" });
					return;
				}

				if (interview.status === "completed") {
					socket.emit("interview:completed", {
						score: interview.score,
						feedback: interview.feedback,
					});
					return;
				}

				// Calculate score
				const userMessages = interview.messages.filter((m) => m.role === "user");
				const totalWords = userMessages.reduce((acc, m) => acc + m.content.split(" ").length, 0);
				const avgWordCount = Math.round(totalWords / Math.max(userMessages.length, 1));

				const baseScore = 70;
				const engagementBonus = Math.min(15, avgWordCount / 10);
				const questionsAnsweredBonus = (userMessages.length / interview.questions.length) * 15;
				const score = Math.round(Math.min(100, baseScore + engagementBonus + questionsAnsweredBonus));

				interview.status = "completed";
				interview.completedAt = new Date();
				interview.score = score;
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

				const completionMessage = {
					role: "ai" as const,
					content: `🎉 **Interview Complete!**\n\nYour Performance Score: **${score}%**\n\nThank you for completing this practice session. Check your detailed feedback to see areas of strength and opportunities for improvement.`,
					timestamp: new Date(),
				};

				interview.messages.push(completionMessage);
				await interview.save();

				io.to(`interview:${sessionId}`).emit("interview:message", completionMessage);
				io.to(`interview:${sessionId}`).emit("interview:completed", {
					score: interview.score,
					feedback: interview.feedback,
					completedAt: interview.completedAt,
				});
			} catch (error) {
				console.error("interview:complete error:", error);
				socket.emit("interview:error", { message: "Failed to complete interview" });
			}
		});

		// Leave interview room
		socket.on("interview:leave", (sessionId: string) => {
			socket.leave(`interview:${sessionId}`);

			const room = interviewRooms.get(sessionId);
			if (room) {
				room.participants = room.participants.filter((id) => id !== socket.id);
				if (room.participants.length === 0) {
					interviewRooms.delete(sessionId);
				}
			}

			console.log(`User ${socket.id} left interview: ${sessionId}`);
		});

		// ========== Disconnect Handler ==========
		socket.on("disconnect", () => {
			// Clean up video call connections
			for (const [roomId, participants] of Object.entries(connections)) {
				if (!participants.includes(socket.id)) {
					continue;
				}

				// Notify other user
				participants.forEach((id) => {
					if (id !== socket.id) {
						io.to(id).emit("user-left", socket.id);
					}
				});

				// Remove the user
				const idx = participants.indexOf(socket.id);
				participants.splice(idx, 1);

				// If room is empty, delete it
				if (participants.length === 0) {
					delete connections[roomId];
				}
				break;
			}

			// Clean up interview rooms
			for (const [sessionId, room] of interviewRooms.entries()) {
				if (room.participants.includes(socket.id)) {
					room.participants = room.participants.filter((id) => id !== socket.id);
					if (room.participants.length === 0) {
						interviewRooms.delete(sessionId);
					}
				}
			}

			delete timeOnline[socket.id];
			console.log("User disconnected:", socket.id);
		});
	});

	return io;
};
