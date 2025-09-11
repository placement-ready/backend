import mongoose from "mongoose";

const url = process.env.MONGODB_URL;

export const connectDB = async () => {
  if (!url) {
    throw new Error("MONGODB_URL environment variable is not defined");
  }
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
