import { Schema, model, Types } from "mongoose";

const ResumeInfoSchema = new Schema({
  userId: { type: Types.ObjectId, required: true, ref: "User" }, // reference user
  fullName: String,
  email: String,
  phone: String,
  location: String,
  website: String,
  summary: String,
  skills: [String],
  achievements: [String],
  experience: [{
    company: String,
    role: String,
    duration: String,
    description: String,
  }],
  education: [{
    college: String,
    degree: String,
    year: String,
  }],
  template: { type: Types.ObjectId, ref: "ResumeTemplate", required: true } // reference selected template
});

export default model("ResumeInfo", ResumeInfoSchema);
