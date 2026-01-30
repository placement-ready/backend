import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { config, isProd } from "../config";
import { getAuthDb } from "../db/mongo";

let authInstance: ReturnType<typeof betterAuth>;

export function getAuth() {
	if (!authInstance) {
		const baseURL = config.server.apiUrl;
		const clientUrl = config.server.clientUrl;

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
					redirectURI: `${baseURL}/api/auth/callback/google`,
				},
			},
			session: {
				cookieCache: {
					enabled: true,
					maxAge: 5 * 60,
				},
				expiresIn: 60 * 60 * 24 * 7,
				updateAge: 60 * 60 * 24,
			},
			baseURL,
			advanced: {
				useSecureCookies: true,
				crossSubDomainCookies: {
					enabled: true,
					domain: clientUrl,
				},
				defaultCookieAttributes: {
					httpOnly: true,
					secure: true,
				},
			},
			trustedOrigins: [clientUrl],
			hooks: {
				after: createAuthMiddleware(async (ctx) => {
					if (ctx.path.startsWith("/callback")) {
						throw ctx.redirect(`${clientUrl}/dashboard`);
					}
				}),
			},
		});
	}
	return authInstance;
}
