import express from "express";
import { generatePdfController, generateHtmlPreviewController } from "../controllers/pdf.controller";
import { authenticateToken } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { generatePdfSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/errorHandler";
import { pdfRateLimit } from "../middleware/security";

const router = express.Router();

export const pdfRoutes = () => {
	router.use(authenticateToken);
	router.use(pdfRateLimit);

	router.post("/render-resume", validateBody(generatePdfSchema), asyncHandler(generatePdfController));
	router.post("/render-html", validateBody(generatePdfSchema), asyncHandler(generateHtmlPreviewController));

	return router;
};
