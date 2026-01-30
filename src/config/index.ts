import { CorsOptions } from "cors";
import dotenv from "dotenv";

dotenv.config();

export const isProd = process.env.NODE_ENV === "production";

function requiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export const config = {
	server: {
		port: process.env.PORT || 4000,
		env: process.env.NODE_ENV || "development",
		clientUrl: isProd
			? requiredEnv("CLIENT_URL")
			: process.env.CLIENT_URL || "http://localhost:3000",
		apiUrl: isProd ? requiredEnv("API_URL") : process.env.API_URL || "http://localhost:4000",
	},

	auth: {
		secret: requiredEnv("AUTH_SECRET"),
		googleClientId: requiredEnv("GOOGLE_CLIENT_ID"),
		googleClientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
	},

	cors: {
		origin: (origin, callback) => {
			const allowed = [config.server.clientUrl];

			if (!origin || allowed.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	} satisfies CorsOptions,

	api: {
		prefix: "/api",
		version: "v1",
	},

	database: {
		uri: isProd
			? requiredEnv("MONGODB_URI")
			: process.env.MONGODB_URI || "mongodb://localhost:27017/hiremind",
	},

	groq: {
		apiKey: process.env.GROQ_API_KEY || "",
		model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
		temperature: parseFloat(process.env.GROQ_TEMPERATURE || "0.7"),
		maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || "8192", 10),
	},
};
