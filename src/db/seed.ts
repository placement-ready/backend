import { connectMongo, disconnect } from "./mongo";
import { User } from "../models";

async function main() {
	await connectMongo();

	await User.findOneAndUpdate(
		{ email: "admin@example.com" },
		{
			name: "Admin",
			email: "admin@example.com",
		},
		{ upsert: true, new: true }
	);

	console.log("Seed completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await disconnect();
	});
