import express from "express";
import ResumeInfo from "../models/resumeInfo";

const router = express.Router();

// GET resume info (NO userId needed)
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/resume-info called");
    
    // Find the first/any resume (no userId filter)
    const resume = await ResumeInfo.findOne().populate("template");
    
    if (!resume) {
      // Return empty structure if no resume exists
      return res.json({
        personal: { fullName: "", email: "", phone: "", location: "", website: "", summary: "" },
        experience: [],
        education: [],
        skills: [],
        achievements: [],
        template: null
      });
    }
    
    res.json(resume);
  } catch (err) {
    console.error("GET resume error:", err);
    res.status(500).json({ error: "Failed to fetch resume info" });
  }
});

// CREATE or UPDATE resume info (NO userId needed)
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/resume-info called with data:", req.body);
    
    const data = req.body;
    
    // Find existing resume or create new one (no userId filter)
    let resume = await ResumeInfo.findOne();
    
    if (resume) {
      // Update existing resume
      Object.assign(resume, data);
      await resume.save();
      await resume.populate("template");
      res.json({ message: "Resume updated", resume });
    } else {
      // Create new resume
      resume = new ResumeInfo(data);
      await resume.save();
      await resume.populate("template");
      res.json({ message: "Resume created", resume });
    }
  } catch (err) {
    console.error("POST resume error:", err);
    res.status(500).json({ error: "Failed to save resume info" });
  }
});

// DELETE resume info (NO userId needed)
router.delete("/", async (req, res) => {
  try {
    await ResumeInfo.deleteOne();
    res.json({ message: "Resume deleted" });
  } catch (err) {
    console.error("DELETE resume error:", err);
    res.status(500).json({ error: "Failed to delete resume info" });
  }
});

export default router;
