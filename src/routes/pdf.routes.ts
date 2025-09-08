import express from "express";
import ResumeTemplate from "../models/resume";
import ResumeInfo from "../models/resumeInfo";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";

const router = express.Router();

// PDF Generation Route (Updated - no userId param)
router.post("/render-resume", async (req, res) => {
  try {
    // For testing without auth - use a default userId or get from request body
    const userId = req.body.userId || "testUser123";
    
    const resumeInfo = await ResumeInfo.findOne({ userId }).populate("template");
    
    if (!resumeInfo || !resumeInfo.template) {
      return res.status(404).json({ error: "Resume info or template not found" });
    }

    // Cast to any to avoid TypeScript issues with populated fields
    const info = resumeInfo.toObject() as any;
    
    if (!info.template.templateFile) {
      return res.status(404).json({ error: "Template file not specified" });
    }

    // Load HTML template from filesystem
    const templatePath = path.resolve(__dirname, "..", "templates", info.template.templateFile);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: "Template file not found on filesystem" });
    }

    const templateString = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateString);
    const html = template(info);

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({ "Content-Type": "application/pdf" });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).json({ error: "Failed to render PDF." });
  }
});

// HTML Preview Route (New - no userId param)
router.post("/render-html", async (req, res) => {
  try {
    // For testing without auth - use a default userId or get from request body
    const userId = req.body.userId || "testUser123";
    
    const resumeInfo = await ResumeInfo.findOne({ userId }).populate("template");
    
    if (!resumeInfo || !resumeInfo.template) {
      return res.status(404).json({ error: "Resume info or template not found" });
    }

    // Cast to any to avoid TypeScript issues with populated fields
    const info = resumeInfo.toObject() as any;
    
    if (!info.template.templateFile) {
      return res.status(404).json({ error: "Template file not specified" });
    }

    // Load HTML template from filesystem
    const templatePath = path.resolve(__dirname, "..", "templates", info.template.templateFile);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: "Template file not found on filesystem" });
    }

    const templateString = fs.readFileSync(templatePath, "utf8");
    
    // Compile template with Handlebars
    const template = Handlebars.compile(templateString);
    const html = template(info);

    // Return HTML directly
    res.set({ 
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    });
    res.send(html);
  } catch (err) {
    console.error("HTML Preview Error:", err);
    res.status(500).json({ error: "Failed to render HTML preview." });
  }
});

export default router;
