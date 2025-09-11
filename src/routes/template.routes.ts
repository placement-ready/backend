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

// router.post("/save", async (req, res) => {
//   try {
//     const { link, title, description, compiledPdf, templateFile, atsFriendly, atsNotes, preferredBy } = req.body;

//     if (!title || !templateFile) {
//       return res.status(400).json({ error: "Title and templateFile are required." });
//     }

//     const newTemplate = new ResumeTemplate({
//       link, title, description, compiledPdf, templateFile, atsFriendly, atsNotes, preferredBy
//     });

//     await newTemplate.save();

//     res.status(201).json({ message: "Template saved successfully", template: newTemplate });
//   } catch (error) {
//     console.error("Error saving template:", error);
//     res.status(500).json({ error: "Failed to save template" });
//   }
// });

router.post("/save", async (req, res) => {
  console.log("BODY:", JSON.stringify(req.body));
  try {
    const templates = Array.isArray(req.body) ? req.body : [req.body];

    for (const tpl of templates) {
      if (!tpl.title || !tpl.templateFile) {
        return res.status(400).json({ error: "Title and templateFile are required for all templates." });
      }
    }

    const savedTemplates = await ResumeTemplate.insertMany(templates);
    res.status(201).json({ message: "Templates saved successfully.", templates: savedTemplates });
  } catch (error) {
    console.error("Error saving templates:", error);
    res.status(500).json({ error: "Failed to save templates." });
  }
});



export default router;
