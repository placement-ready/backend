import { Schema, model } from "mongoose";

const ResumeTemplateSchema = new Schema({
  title: { type: String, required: true, unique: true },
  link: String,
  description: String,
  latexCode: String,
  compiledPdf: String,
  atsFriendly: Boolean,
  atsNotes: String,
  preferredBy: [String],
});

export default model("ResumeTemplate", ResumeTemplateSchema);
