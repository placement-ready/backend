import { CorsOptions } from "cors";
import dotenv from "dotenv";
dotenv.config();

interface ServerConfig {
	port: number | string;
	env: string;
	clientUrl?: string;
}

interface AuthConfig {
	authSecret: string;
	googleClientId: string;
	googleClientSecret: string;
}

interface ApiConfig {
	prefix: string;
	version: string;
}

interface DatabaseConfig {
	uri: string;
}

interface MailProviderConfig {
	apiKey: string;
	from: string;
}

interface AiConfig {
	apiKey: string;
}

interface AppConfig {
	server: ServerConfig;
	auth: AuthConfig;
	cors: CorsOptions;
	api: ApiConfig;
	database: DatabaseConfig;
	mail: MailProviderConfig;
	ai: AiConfig;
}

export const config: AppConfig = {
	// Server configuration
	server: {
		port: process.env.PORT || 4000,
		env: process.env.NODE_ENV || "development",
		clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
	},

	// Authentication configuration
	auth: {
		authSecret: process.env.AUTH_SECRET || "",
		googleClientId: process.env.GOOGLE_CLIENT_ID || "",
		googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
	},

	// CORS options
	cors: {
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	},

	// API configuration
	api: {
		prefix: "/api",
		version: "v1",
	},

	// Database configuration
	database: {
		uri: process.env.MONGODB_URI || "mongodb://localhost:27017/hiremind",
	},

	// Mail provider configuration
	mail: {
		apiKey: process.env.RESEND_API_KEY || "",
		from: process.env.EMAIL_FROM || "",
	},

	// AI configuration
	ai: {
		apiKey: process.env.GEMINI_API_KEY || "",
	},
};

export default config;
