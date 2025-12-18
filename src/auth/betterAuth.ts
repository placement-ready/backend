import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { config } from "../config";
import { MongoClient } from "mongodb";

const client = new MongoClient(config.database.uri);
const db = client.db();

export const auth = betterAuth({
	adapter: mongodbAdapter(db, { client }),
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
});
