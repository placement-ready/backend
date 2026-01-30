import { Request, Response } from "express";
import { Skill } from "../models";

// Get all skills for user
export const getSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { category } = req.query;
        const query: Record<string, unknown> = { userId };
        if (category) query.category = category;

        const skills = await Skill.find(query).sort({ level: -1 });

        res.status(200).json({ success: true, skills });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Create a new skill
export const createSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { name, category = "behavioral" } = req.body;

        if (!name) {
            res.status(400).json({ success: false, message: "Skill name is required" });
            return;
        }

        const skill = new Skill({
            userId,
            name,
            category,
            level: 0,
            practiceCount: 0,
        });

        await skill.save();
        res.status(201).json({ success: true, skill });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Update skill (e.g., after practice)
export const updateSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const updates = req.body;

        const skill = await Skill.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            { new: true }
        );

        if (!skill) {
            res.status(404).json({ success: false, message: "Skill not found" });
            return;
        }

        res.status(200).json({ success: true, skill });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Delete skill
export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const skill = await Skill.findOneAndDelete({ _id: id, userId });

        if (!skill) {
            res.status(404).json({ success: false, message: "Skill not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Skill deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Record practice and increase skill level
export const practiceSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const { score = 70 } = req.body;

        const skill = await Skill.findOne({ _id: id, userId });

        if (!skill) {
            res.status(404).json({ success: false, message: "Skill not found" });
            return;
        }

        // Increase level based on score (max 100)
        const levelIncrease = Math.round(score / 20);
        skill.level = Math.min(100, skill.level + levelIncrease);
        skill.practiceCount += 1;
        skill.lastPracticed = new Date();

        await skill.save();

        res.status(200).json({ success: true, skill });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Get skill statistics
export const getSkillStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const skills = await Skill.find({ userId });

        const totalSkills = skills.length;
        const avgLevel = totalSkills > 0
            ? Math.round(skills.reduce((acc, s) => acc + s.level, 0) / totalSkills)
            : 0;
        const totalPractice = skills.reduce((acc, s) => acc + s.practiceCount, 0);

        // Group by category
        const byCategory = skills.reduce(
            (acc, skill) => {
                if (!acc[skill.category]) {
                    acc[skill.category] = { count: 0, avgLevel: 0, skills: [] };
                }
                acc[skill.category].count++;
                acc[skill.category].skills.push(skill);
                return acc;
            },
            {} as Record<string, { count: number; avgLevel: number; skills: typeof skills }>
        );

        // Calculate avg level per category
        Object.keys(byCategory).forEach((cat) => {
            const catSkills = byCategory[cat].skills;
            byCategory[cat].avgLevel = Math.round(
                catSkills.reduce((acc, s) => acc + s.level, 0) / catSkills.length
            );
        });

        res.status(200).json({
            success: true,
            stats: {
                totalSkills,
                avgLevel,
                totalPractice,
                byCategory: Object.entries(byCategory).map(([category, data]) => ({
                    category,
                    count: data.count,
                    avgLevel: data.avgLevel,
                })),
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};
