import { config } from "./config";
import { connectMongo } from "./db/mongo";
import app from "./server";

const port = config.server.port;
const SERVER_START_MSG = `Server running on port: ${port}`;

async function bootstrap() {
	try {
		await connectMongo();

		app.listen(port, () => {
			console.log(SERVER_START_MSG);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

bootstrap();
