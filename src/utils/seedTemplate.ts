import { connectMongo } from "./mongooseClient";
import ResumeTemplate from "../models/resume";
import resumeTemplates from "../resumes/templates";

async function seedResumeTemplates() {
  await connectMongo();

  // Access the array of templates
  const templatesArray = resumeTemplates.templates;

  try {
    // Insert many documents at once; skips duplicates if indexed properly
    await ResumeTemplate.insertMany(templatesArray, { ordered: false });
    console.log("All resume templates inserted successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Insert error:", error.message);
    } else {
      console.error("Unknown error during insert:", error);
    }
  } finally {
    // Close connection to allow Node.js to exit
    await (await import("mongoose")).connection.close();
    process.exit(0);
  }
}

seedResumeTemplates();
