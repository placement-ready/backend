import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";
import { config } from "../config";

let client: MongoClient;
let db: Db;

export async function connectMongo() {
	try {
		await mongoose.connect(config.database.uri, {
			dbName: "hiremind",
		});

		console.log("Mongoose connected");

		client = new MongoClient(config.database.uri);
		await client.connect();

		db = client.db("hiremind");

		console.log("MongoClient connected");
	} catch (err) {
		console.error("Mongo connection error:", err);
		process.exit(1);
	}
}

export function getAuthDb(): Db {
	if (!db) {
		throw new Error("Auth DB not initialized");
	}
	return db;
}

export async function disconnectMongo() {
	await mongoose.disconnect();
	if (client) await client.close();
}
