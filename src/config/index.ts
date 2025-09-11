import { CorsOptions } from "cors";
import dotenv from "dotenv";
dotenv.config();

interface ServerConfig {
	port: number | string;
	env: string;
}

interface ApiConfig {
	prefix: string;
	version: string;
}

interface JwtConfig {
	secret: string;
	refreshSecret: string;
	expiresIn: string;
	refreshExpiresIn: string;
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
	cors: CorsOptions;
	api: ApiConfig;
	jwt: JwtConfig;
	database: DatabaseConfig;
	mail: MailProviderConfig;
	ai: AiConfig;
}

export const config: AppConfig = {
	// Server configuration
	server: {
		port: process.env.PORT || 5000,
		env: process.env.NODE_ENV || "development",
	},

	// CORS options
	cors: {
		origin: process.env.CORS_ORIGIN || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
	},

	// API configuration
	api: {
		prefix: "/api",
		version: "v1",
	},

	// JWT configuration
	jwt: {
		secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
		refreshSecret: process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
		expiresIn: process.env.JWT_EXPIRES_IN || "15m",
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
	},

	// Database configuration
	database: {
		uri: process.env.MONGODB_URI || "mongodb://localhost:27017/placement-db",
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
