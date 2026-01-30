import { Request, Response } from "express";
import { Goal } from "../models";

// Get all goals for user
export const getGoals = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { status, category } = req.query;
        const query: Record<string, unknown> = { userId };
        if (status) query.status = status;
        if (category) query.category = category;

        const goals = await Goal.find(query).sort({ targetDate: 1 });

        res.status(200).json({ success: true, goals });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Create a new goal
export const createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { title, description, targetDate, category = "general", milestones = [] } = req.body;

        if (!title || !targetDate) {
            res.status(400).json({ success: false, message: "Title and target date are required" });
            return;
        }

        const goal = new Goal({
            userId,
            title,
            description,
            targetDate: new Date(targetDate),
            category,
            milestones: milestones.map((m: string | { title: string }) => ({
                title: typeof m === "string" ? m : m.title,
                completed: false,
            })),
            progress: 0,
            status: "active",
        });

        await goal.save();
        res.status(201).json({ success: true, goal });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Update goal
export const updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const updates = req.body;

        // Handle date conversion
        if (updates.targetDate) {
            updates.targetDate = new Date(updates.targetDate);
        }

        const goal = await Goal.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            { new: true }
        );

        if (!goal) {
            res.status(404).json({ success: false, message: "Goal not found" });
            return;
        }

        res.status(200).json({ success: true, goal });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Delete goal
export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const goal = await Goal.findOneAndDelete({ _id: id, userId });

        if (!goal) {
            res.status(404).json({ success: false, message: "Goal not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Goal deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Toggle milestone completion
export const toggleMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id, milestoneId } = req.params;

        const goal = await Goal.findOne({ _id: id, userId });

        if (!goal) {
            res.status(404).json({ success: false, message: "Goal not found" });
            return;
        }

        const milestone = goal.milestones.find((m) => m._id?.toString() === milestoneId);
        if (!milestone) {
            res.status(404).json({ success: false, message: "Milestone not found" });
            return;
        }

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date() : undefined;

        // Recalculate progress
        const completedCount = goal.milestones.filter((m) => m.completed).length;
        goal.progress = goal.milestones.length > 0
            ? Math.round((completedCount / goal.milestones.length) * 100)
            : 0;

        // Auto-complete goal if all milestones done
        if (goal.progress === 100) {
            goal.status = "completed";
        }

        await goal.save();

        res.status(200).json({ success: true, goal });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Add milestone to goal
export const addMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const { title } = req.body;

        if (!title) {
            res.status(400).json({ success: false, message: "Milestone title is required" });
            return;
        }

        const goal = await Goal.findOne({ _id: id, userId });

        if (!goal) {
            res.status(404).json({ success: false, message: "Goal not found" });
            return;
        }

        goal.milestones.push({ title, completed: false });

        // Recalculate progress
        const completedCount = goal.milestones.filter((m) => m.completed).length;
        goal.progress = Math.round((completedCount / goal.milestones.length) * 100);

        await goal.save();

        res.status(200).json({ success: true, goal });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Get goal statistics
export const getGoalStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const goals = await Goal.find({ userId });

        const totalGoals = goals.length;
        const activeGoals = goals.filter((g) => g.status === "active").length;
        const completedGoals = goals.filter((g) => g.status === "completed").length;
        const avgProgress = totalGoals > 0
            ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals)
            : 0;

        // Upcoming deadlines (next 7 days)
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingGoals = goals
            .filter((g) => g.status === "active" && g.targetDate <= weekFromNow)
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

        res.status(200).json({
            success: true,
            stats: {
                totalGoals,
                activeGoals,
                completedGoals,
                avgProgress,
                upcomingDeadlines: upcomingGoals.length,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};
