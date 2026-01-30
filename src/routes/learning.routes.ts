import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
    getLearningResources,
    createLearningResource,
    updateLearningResource,
    deleteLearningResource,
    completeResource,
    getLearningStats,
    getRecommendedResources,
} from "../controllers/learning.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getLearningResources);
router.get("/stats", getLearningStats);
router.get("/recommended", getRecommendedResources);
router.post("/", createLearningResource);
router.patch("/:id", updateLearningResource);
router.delete("/:id", deleteLearningResource);
router.post("/:id/complete", completeResource);

export const learningRoutes = () => router;
