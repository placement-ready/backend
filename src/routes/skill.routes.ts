import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    practiceSkill,
    getSkillStats,
} from "../controllers/skill.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getSkills);
router.get("/stats", getSkillStats);
router.post("/", createSkill);
router.patch("/:id", updateSkill);
router.delete("/:id", deleteSkill);
router.post("/:id/practice", practiceSkill);

export const skillRoutes = () => router;
