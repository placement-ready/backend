import express from "express";
import { getTemplates, getTemplateById, searchTemplates } from "../controllers/template.controller";
import expressAsyncHandler from "express-async-handler";

const router = express.Router();

export const templateRoutes = () => {
	router.get("/", expressAsyncHandler(getTemplates));
	router.get("/search", expressAsyncHandler(searchTemplates));
	router.get("/:id", expressAsyncHandler(getTemplateById));

	return router;
};
