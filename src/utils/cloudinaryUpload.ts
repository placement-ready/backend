import cloudinary from "./cloudinary"; // your configured Cloudinary instance

export async function uploadPDFToCloudinary(pdfFilePath: string, publicId: string): Promise<string> {
  try {
    const response = await cloudinary.uploader.upload(pdfFilePath, {
      resource_type: "raw",       // Important for PDF upload
      folder: "resumes_pdfs",     // Optional: organize under this folder
      public_id: publicId,        // Unique name per resume/template
      overwrite: true,            // Overwrite if updating same file
    });
    return response.secure_url;   // Return Cloudinary URL of uploaded PDF
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
}
