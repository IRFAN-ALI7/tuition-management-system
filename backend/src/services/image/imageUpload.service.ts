
import sharp from "sharp";
import type { UploadApiResponse } from "cloudinary";

import {
  cloudinary,
  CLOUDINARY_FOLDERS,
} from "../../config/cloudinary";

// ---------------------------------------------
// Types
// ---------------------------------------------

export type ProfileImageType = "admin" | "student";

export interface UploadedImage {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

interface UploadProfileImageOptions {
  file: Buffer;
  type: ProfileImageType;
  oldPublicId?: string;
}

// ---------------------------------------------
// Constants
// ---------------------------------------------

const MAX_IMAGE_SIZE = 200 * 1024; // 200 KB
const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FORMATS = ["jpeg", "png", "webp"] as const;

const MAX_WIDTH = 1200;
const MIN_WIDTH = 400;

// ---------------------------------------------
// Get Cloudinary folder
// ---------------------------------------------

const getUploadFolder = (type: ProfileImageType): string => {
  return type === "admin"
    ? CLOUDINARY_FOLDERS.ADMIN_PROFILE
    : CLOUDINARY_FOLDERS.STUDENT_PROFILE;
};

// ---------------------------------------------
// Image compression
// ---------------------------------------------

const compressImage = async (file: Buffer): Promise<Buffer> => {
  if (!Buffer.isBuffer(file) || file.length === 0) {
    throw new Error("Invalid image file.");
  }

  if (file.length > MAX_ORIGINAL_SIZE) {
    throw new Error("Original image size cannot exceed 10 MB.");
  }

  const image = sharp(file, {
    failOn: "error",
    limitInputPixels: 40000000,
  });

  const metadata = await image.metadata();

  if (!metadata.format || !ALLOWED_FORMATS.includes(
    metadata.format as (typeof ALLOWED_FORMATS)[number]
  )) {
    throw new Error("Only JPEG, PNG and WebP images are allowed.");
  }

  let width = Math.min(metadata.width || MAX_WIDTH, MAX_WIDTH);
  let quality = 82;

  while (width >= MIN_WIDTH) {
    const compressed = await sharp(file)
      .rotate()
      .resize({
        width,
        height: width,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 5,
      })
      .toBuffer();

    if (compressed.length <= MAX_IMAGE_SIZE) {
      return compressed;
    }

    if (quality > 42) {
      quality -= 10;
    } else {
      width -= 100;
      quality = 75;
    }
  }

  throw new Error(
    "Image could not be compressed below 200 KB. Please choose another image."
  );
};

// ---------------------------------------------
// Upload buffer to Cloudinary
// ---------------------------------------------

const uploadToCloudinary = (
  file: Buffer,
  folder: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file);
  });
};

// ---------------------------------------------
// Common profile image upload
// ---------------------------------------------

export const uploadProfileImage = async ({
  file,
  type,
}: UploadProfileImageOptions): Promise<UploadedImage> => {
  const folder = getUploadFolder(type);

  // Resize and compress before uploading
  const compressedImage = await compressImage(file);

  // Upload compressed image
  const result = await uploadToCloudinary(
    compressedImage,
    folder
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  };
};

// ---------------------------------------------
// Delete old profile image
// ---------------------------------------------

export const deleteProfileImage = async (
  publicId?: string
): Promise<boolean> => {
  if (!publicId) {
    return false;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") {
    return true;
  }

  if (result.result === "not found") {
    return false;
  }

  throw new Error("Failed to delete old profile image.");
};
