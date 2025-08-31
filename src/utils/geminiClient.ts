import { GoogleGenAI } from "@google/genai";
import config from "../config";

export async function askGemini(prompt: string) {
	const ai = new GoogleGenAI({
		apiKey: config.ai.apiKey,
	});

	const clientConfig = {
		thinkingConfig: {
			thinkingBudget: -1,
		},
	};
	const model = "gemini-2.5-flash";
	const contents = [
		{
			role: "model",
			parts: [
				{
					text: "You are an expert career and education mentor.",
				},
				{
					text: "Only respond with advice in the domains of education, technology, studying strategies, career paths, and placement preparation.",
				},
				{
					text: "Politely refuse any requests for information outside of these areas.",
				},
			],
		},
		{
			role: "user",
			parts: [
				{
					text: prompt,
				},
			],
		},
	];

	const response = await ai.models.generateContentStream({
		model,
		config: clientConfig,
		contents,
	});
	for await (const chunk of response) {
		return chunk.text;
	}
}
