import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { config } from "../config";
import { getAuthDb } from "../db/mongo";

let authInstance: ReturnType<typeof betterAuth>;

export function getAuth() {
	if (!authInstance) {
		authInstance = betterAuth({
			appName: "HireMind",
			secret: config.auth.secret,
			database: mongodbAdapter(getAuthDb()),
			emailAndPassword: {
				enabled: true,
				autoSignIn: true,
				requireEmailVerification: false,
			},
			socialProviders: {
				google: {
					clientId: config.auth.googleClientId,
					clientSecret: config.auth.googleClientSecret,
				},
			},
			trustedOrigins: [config.server.clientUrl || "http://localhost:3000"],
			hooks: {
				after: createAuthMiddleware(async (ctx) => {
					if (ctx.path.startsWith("/callback")) {
						throw ctx.redirect(config.server.clientUrl + "/dashboard");
					}
				}),
			},
		});
	}

	return authInstance;
}
