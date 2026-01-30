import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { config, isProd } from "../config";
import { getAuthDb } from "../db/mongo";

let authInstance: ReturnType<typeof betterAuth>;

export function getAuth() {
	if (!authInstance) {
		const baseURL = config.server.apiUrl || "http://localhost:4000";
		const clientUrl = config.server.clientUrl || "http://localhost:3000";

		const useSecureCookies = isProd || baseURL.startsWith("https://");

		const sameSiteValue = isProd ? "none" : "lax";

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
			baseURL: baseURL,
			advanced: {
				useSecureCookies: useSecureCookies,
				cookies: {
					session_token: {
						name: "hiremind_session_token",
						attributes: {
							httpOnly: true,
							sameSite: sameSiteValue,
							secure: useSecureCookies,
							...(isProd && { domain: undefined }),
						},
					},
				},
			},
			trustedOrigins: [clientUrl],
			hooks: {
				after: createAuthMiddleware(async (ctx) => {
					if (ctx.path.startsWith("/callback")) {
						throw ctx.redirect(clientUrl + "/dashboard");
					}
				}),
			},
		});
	}

	return authInstance;
}
