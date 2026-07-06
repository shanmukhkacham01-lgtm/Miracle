import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Config Cloudinary only if environment keys are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadImage = async (file: any): Promise<string> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'miracle_products',
        use_filename: true,
      });
      // Delete local temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (error) {
      console.error('[Cloudinary upload failed, falling back to local path]:', error);
    }
  }

  // Fallback to local server serving path
  // Since Express serves files statically, we will move it from tmp to a public upload folder
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const targetPath = path.join(uploadDir, `${Date.now()}-${file.originalname}`);
  fs.renameSync(file.path, targetPath);

  // Return the relative URL served by Express static
  const filename = path.basename(targetPath);
  return `/uploads/${filename}`;
};
