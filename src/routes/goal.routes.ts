import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    getGoalStats,
} from "../controllers/goal.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getGoals);
router.get("/stats", getGoalStats);
router.post("/", createGoal);
router.patch("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/milestones", addMilestone);
router.patch("/:id/milestones/:milestoneId", toggleMilestone);

export const goalRoutes = () => router;
