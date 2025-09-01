import express from "express";
import ResumeTemplate from "../models/resume";
import fs from "fs";

const router = express.Router();

router.get("/resume", async (req, res) => {
  try {
    const templates = await ResumeTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume templates" });
  }
});

router.post("/resume/:title/latex", async (req, res) => {
  const { title } = req.params;
  const { latexCode } = req.body;

  if (!latexCode) return res.status(400).json({ error: "Latex code is required" });

  try {
    const template = await ResumeTemplate.findOneAndUpdate(
      { title },
      { latexCode },
      { new: true }
    );

    if (!template) return res.status(404).json({ error: "Template not found" });

    res.json({ message: "LaTeX code updated successfully", template });
  } catch (error) {
    res.status(500).json({ error: "Failed to update LaTeX code" });
  }
});

router.post("/resume/save", async (req, res) => {
  try {
    const templateData = req.body;

    if (!templateData.title) {
      return res.status(400).json({ error: "Template title is required" });
    }

    let template = await ResumeTemplate.findOne({ title: templateData.title });

    if (template) {
      template.set(templateData);
      await template.save();
      return res.json({ message: "Template updated", template });
    } else {
      template = new ResumeTemplate(templateData);
      await template.save();
      return res.json({ message: "Template created", template });
    }
  } catch (error) {
  // Narrow error type
  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: String(error) });
  }
}
});



export default router;
