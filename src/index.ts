import { config } from "./config";
import { connectMongo } from "./db/mongo";
import app from "./server";
import { connectToSocket } from "./controllers";
import { createServer } from "node:http";

const port = config.server.port;
const SERVER_START_MSG = `Server running on port: ${port}`;

async function bootstrap() {
	try {
		await connectMongo();

		const server = createServer(app);
		server.listen(port, () => {
			console.log(SERVER_START_MSG);
		});

		const io = connectToSocket(server);
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

bootstrap();
