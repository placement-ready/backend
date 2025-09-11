import express from "express";
import { getTemplates, getTemplateById, searchTemplates } from "../controllers/template.controller";
import { validateParams } from "../middleware/validation";
import { idParamSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

export const templateRoutes = () => {
	router.get("/", asyncHandler(getTemplates));
	router.get("/search", asyncHandler(searchTemplates));
	router.get("/:id", validateParams(idParamSchema), asyncHandler(getTemplateById));

	return router;
};
