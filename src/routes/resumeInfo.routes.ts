import express from "express";
import ResumeInfo from "../models/resumeInfo";
import { authenticateToken } from "../middleware/auth";
const router = express.Router();

// GET the user's resume info
router.get("/test", (req, res) => {
  res.json({ message: "Test route works, no auth needed!" });
});

router.get("/", async (req, res) => {
  const userId = req.user?.userId;
  try {
    const resume = await ResumeInfo.findOne({ userId }).populate("template");
    res.json(resume || {});
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resume info" });
  }
});

// CREATE or UPDATE resume info (now always references template)
router.post("/", async (req, res) => {
  const data = req.body;
  data.userId = req.user?.userId; // get userId from JWT
  try {
    let resume = await ResumeInfo.findOne({ userId: data.userId });
    if (resume) {
      resume.set(data);
      await resume.save();
      res.json({ message: "Resume updated", resume });
    } else {
      resume = new ResumeInfo(data);
      await resume.save();
      res.json({ message: "Resume created", resume });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to save resume info" });
  }
});

// DELETE resume info
router.delete("/", async (req, res) => {
  const userId = req.user?.userId;
  try {
    await ResumeInfo.deleteOne({ userId });
    res.json({ message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resume info" });
  }
});

export default router;
