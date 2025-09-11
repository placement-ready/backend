import mongoose from "mongoose";
import { config } from "../config";

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;

  await mongoose.connect(config.database.uri);
  isConnected = true;

  console.log("MongoDB connected");
}
