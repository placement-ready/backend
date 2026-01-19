import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { config, isProd } from "../config";
import { getAuthDb } from "../db/mongo";

let authInstance: ReturnType<typeof betterAuth>;

/**
 * Get the cookie domain for cross-subdomain cookies.
 * Returns undefined for localhost to avoid cookie issues in development.
 */
function getCookieDomain(url: string): string | undefined {
	const hostname = new URL(url).hostname;
	// For localhost, don't set a domain - browsers handle this automatically
	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return undefined;
	}
	// For production, use the root domain with leading dot for subdomain sharing
	const parts = hostname.split(".");
	if (parts.length > 2) {
		// Return last two parts for standard domains (e.g., ".vercel.app")
		return "." + parts.slice(-2).join(".");
	}
	// For simple domains, return with leading dot
	return "." + hostname;
}

export function getAuth() {
	if (!authInstance) {
		const cookieDomain = getCookieDomain(config.server.clientUrl);

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
					redirectURI: `${config.server.apiUrl}/api/auth/callback/google`,
				},
			},
			session: {
				cookieCache: {
					enabled: true,
					maxAge: 1000 * 60 * 5,
				},
			},
			baseURL: config.server.apiUrl || "http://localhost:4000",
			advanced: {
				useSecureCookies: isProd,
				crossSubDomainCookies: {
					enabled: isProd && !!cookieDomain,
					domain: cookieDomain,
				},
				cookies: {
					session_token: {
						name: "hiremind_session_token",
						attributes: {
							httpOnly: true,
							sameSite: isProd ? "none" : "lax",
							secure: isProd,
							...(cookieDomain && { domain: cookieDomain }),
						},
					},
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

