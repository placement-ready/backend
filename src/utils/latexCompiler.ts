import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import os from "os";

export function compileLatexToPDF(latexCode: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "latex-"));
    const texFilePath = path.join(tempDir, "resume.tex");
    const pdfFilePath = path.join(tempDir, "resume.pdf");

    fs.writeFileSync(texFilePath, latexCode);

    const pdflatex = spawn("pdflatex", ["-interaction=nonstopmode", "resume.tex"], {
      cwd: tempDir,
    });

    let stderr = "";

    pdflatex.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pdflatex.on("close", (code) => {
      if (code === 0 && fs.existsSync(pdfFilePath)) {
        const pdfBuffer = fs.readFileSync(pdfFilePath);
        fs.rmSync(tempDir, { recursive: true, force: true });
        resolve(pdfBuffer);
      } else {
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(new Error(`LaTeX compilation failed with code ${code}: ${stderr}`));
      }
    });
  });
}
