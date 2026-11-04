
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary configuration missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env"
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Separate folders for Admin and Student images
export const CLOUDINARY_FOLDERS = {
  ADMIN_PROFILE: "tuition-management/admin/profile-photos",
  STUDENT_PROFILE: "tuition-management/student/profile-photos",
} as const;

// Common Cloudinary instance
export { cloudinary };
