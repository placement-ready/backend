import express from "express";
import ResumeTemplate from "../models/resume";
const router = express.Router();

// GET all templates
router.get("/", async (req, res) => {
  try {
    const templates = await ResumeTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume templates" });
  }
});

// GET single template by ID
router.get("/:id", async (req, res) => {
  try {
    const template = await ResumeTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

export default router;
