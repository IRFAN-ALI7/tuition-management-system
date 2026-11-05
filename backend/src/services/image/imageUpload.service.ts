import sharp from "sharp";
import type { UploadApiResponse } from "cloudinary";

import {
  cloudinary,
  CLOUDINARY_FOLDERS,
} from "../../config/cloudinary";

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
}

const MAX_IMAGE_SIZE = 200 * 1024;
const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;

const ALLOWED_FORMATS = ["jpeg", "png", "webp"] as const;

const MAX_DIMENSION = 1200;
const RESIZE_DIMENSIONS = [1200, 1000, 800, 600, 400, 300, 200, 160];
const WEBP_QUALITIES = [82, 76, 70, 64, 58, 52, 46, 40, 32];

const getUploadFolder = (type: ProfileImageType): string => {
  return type === "admin"
    ? CLOUDINARY_FOLDERS.ADMIN_PROFILE
    : CLOUDINARY_FOLDERS.STUDENT_PROFILE;
};

const getResizeDimensions = (
  originalWidth: number,
  originalHeight: number
): number[] => {
  const longestSide = Math.max(originalWidth, originalHeight);
  const startingDimension = Math.min(longestSide, MAX_DIMENSION);

  const dimensions = [
    startingDimension,
    ...RESIZE_DIMENSIONS.filter(
      (dimension) => dimension < startingDimension
    ),
  ];

  return [...new Set(dimensions)];
};

const compressImage = async (file: Buffer): Promise<Buffer> => {
  if (!Buffer.isBuffer(file) || file.length === 0) {
    throw new Error("Invalid image file.");
  }

  if (file.length > MAX_ORIGINAL_SIZE) {
    throw new Error("Original image size cannot exceed 10 MB.");
  }

  const sharpOptions = {
    failOn: "error" as const,
    limitInputPixels: MAX_INPUT_PIXELS,
  };

  const metadata = await sharp(file, sharpOptions).metadata();

  if (
    !metadata.format ||
    !ALLOWED_FORMATS.includes(
      metadata.format as (typeof ALLOWED_FORMATS)[number]
    )
  ) {
    throw new Error("Only JPEG, PNG and WebP images are allowed.");
  }

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions.");
  }

  const dimensions = getResizeDimensions(
    metadata.width,
    metadata.height
  );

  for (const dimension of dimensions) {
    for (const quality of WEBP_QUALITIES) {
      const compressed = await sharp(file, sharpOptions)
        .rotate()
        .resize({
          width: dimension,
          height: dimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 6,
          smartSubsample: true,
        })
        .toBuffer();

      if (compressed.length <= MAX_IMAGE_SIZE) {
        return compressed;
      }
    }
  }

  throw new Error(
    "Unable to compress this image below 200 KB. Please choose a smaller image."
  );
};

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

export const uploadProfileImage = async ({
  file,
  type,
}: UploadProfileImageOptions): Promise<UploadedImage> => {
  const compressedImage = await compressImage(file);

  if (compressedImage.length > MAX_IMAGE_SIZE) {
    throw new Error("Compressed image cannot exceed 200 KB.");
  }

  const result = await uploadToCloudinary(
    compressedImage,
    getUploadFolder(type)
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  };
};

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