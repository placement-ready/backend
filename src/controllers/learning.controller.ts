import { Request, Response } from "express";
import { LearningResource } from "../models";

// Get all learning resources for user
export const getLearningResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { category, type, completed } = req.query;
        const query: Record<string, unknown> = { userId };
        if (category) query.category = category;
        if (type) query.type = type;
        if (completed !== undefined) query.completed = completed === "true";

        const resources = await LearningResource.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, resources });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Create a new learning resource
export const createLearningResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const {
            title,
            description,
            type = "article",
            url,
            category = "general",
            difficulty = "beginner",
            estimatedMinutes = 15,
        } = req.body;

        if (!title) {
            res.status(400).json({ success: false, message: "Title is required" });
            return;
        }

        const resource = new LearningResource({
            userId,
            title,
            description,
            type,
            url,
            category,
            difficulty,
            estimatedMinutes,
            completed: false,
            progress: 0,
        });

        await resource.save();
        res.status(201).json({ success: true, resource });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Update learning resource
export const updateLearningResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const updates = req.body;

        const resource = await LearningResource.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            { new: true }
        );

        if (!resource) {
            res.status(404).json({ success: false, message: "Resource not found" });
            return;
        }

        res.status(200).json({ success: true, resource });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Delete learning resource
export const deleteLearningResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const resource = await LearningResource.findOneAndDelete({ _id: id, userId });

        if (!resource) {
            res.status(404).json({ success: false, message: "Resource not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Resource deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Mark resource as completed
export const completeResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const resource = await LearningResource.findOneAndUpdate(
            { _id: id, userId },
            { $set: { completed: true, progress: 100 } },
            { new: true }
        );

        if (!resource) {
            res.status(404).json({ success: false, message: "Resource not found" });
            return;
        }

        res.status(200).json({ success: true, resource });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Get learning statistics
export const getLearningStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const resources = await LearningResource.find({ userId });

        const totalResources = resources.length;
        const completedResources = resources.filter((r) => r.completed).length;
        const inProgressResources = resources.filter((r) => r.progress > 0 && !r.completed).length;
        const totalMinutes = resources
            .filter((r) => r.completed)
            .reduce((acc, r) => acc + r.estimatedMinutes, 0);

        // Group by category
        const byCategory = resources.reduce(
            (acc, resource) => {
                if (!acc[resource.category]) {
                    acc[resource.category] = { total: 0, completed: 0 };
                }
                acc[resource.category].total++;
                if (resource.completed) {
                    acc[resource.category].completed++;
                }
                return acc;
            },
            {} as Record<string, { total: number; completed: number }>
        );

        // Group by type
        const byType = resources.reduce(
            (acc, resource) => {
                if (!acc[resource.type]) {
                    acc[resource.type] = { total: 0, completed: 0 };
                }
                acc[resource.type].total++;
                if (resource.completed) {
                    acc[resource.type].completed++;
                }
                return acc;
            },
            {} as Record<string, { total: number; completed: number }>
        );

        res.status(200).json({
            success: true,
            stats: {
                totalResources,
                completedResources,
                inProgressResources,
                totalMinutesLearned: totalMinutes,
                completionRate: totalResources > 0
                    ? Math.round((completedResources / totalResources) * 100)
                    : 0,
                byCategory: Object.entries(byCategory).map(([category, data]) => ({
                    category,
                    ...data,
                })),
                byType: Object.entries(byType).map(([type, data]) => ({
                    type,
                    ...data,
                })),
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};

// Get recommended resources (based on incomplete ones and categories)
export const getRecommendedResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Get incomplete resources sorted by progress (highest first) and difficulty
        const recommended = await LearningResource.find({
            userId,
            completed: false,
        })
            .sort({ progress: -1, difficulty: 1 })
            .limit(5);

        res.status(200).json({ success: true, recommended });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
};
