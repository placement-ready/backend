import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

export async function renderResume(templateFile: string, data: object): Promise<string> {
	const allowedTemplateDir = path.resolve(__dirname, "..", "template");
	const sanitizedFile = path.basename(templateFile);

	const templatePath = path.resolve(allowedTemplateDir, sanitizedFile);
	const templateSource = await fs.promises.readFile(templatePath, "utf8");

	const template = Handlebars.compile(templateSource);
	const html = template(data);

	return html;
}
