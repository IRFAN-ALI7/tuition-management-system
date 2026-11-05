import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";

import User from "../../models/User.model";
import { getStudentByUserId } from "../../services/student/studentData.service";

import {
  uploadProfileImage,
  deleteProfileImage,
} from "../../services/image/imageUpload.service";

import { normalizePhone } from "../../utils/normalization";

// GET /api/student/profile
export async function getStudentProfile(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student profile not found.",
      });
      return;
    }

    response.json({
      profile: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        phone: student.phone,
        fatherName: student.fatherName,
        profilePhoto: student.profilePhoto,
        address: student.address,
        gender: student.gender,
        className: student.className,
        admissionDate: student.admissionDate,
        monthlyFees: student.monthlyFees,
        batchId: student.batchId,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/student/profile
export async function updateStudentProfile(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  let uploadedPublicId = "";
  let userMobileUpdated = false;

  let userDocument: InstanceType<typeof User> | null = null;
  let previousUserMobile = "";

  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student profile not found.",
      });
      return;
    }

    const body = request.body as Record<string, unknown>;

    const allowedFields = ["phone", "address", "profilePhoto"];

    const unexpectedFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unexpectedFields.length) {
      response.status(400).json({
        error:
          "Only phone number, address and profile photo can be updated.",
      });
      return;
    }

    let nextPhone = student.phone;
    let nextAddress = student.address;

    if (body.phone !== undefined) {
      if (
        typeof body.phone !== "string" ||
        normalizePhone(body.phone).length !== 10
      ) {
        response.status(400).json({
          error: "Enter a valid 10-digit phone number.",
        });
        return;
      }

      nextPhone = body.phone.trim();
    }

    if (body.address !== undefined) {
      if (
        typeof body.address !== "string" ||
        !body.address.trim() ||
        body.address.trim().length > 300
      ) {
        response.status(400).json({
          error: "Enter a valid address under 300 characters.",
        });
        return;
      }

      nextAddress = body.address.trim().replace(/\s+/g, " ");
    }

    const user = await User.findById(request.auth!.userId);

    if (!user || user.role !== "student" || !user.active) {
      response.status(401).json({
        error: "Student session is no longer valid.",
      });
      return;
    }

    userDocument = user;
    previousUserMobile = user.mobile ?? "";

    if (nextPhone !== student.phone) {
      const existingUser = await User.exists({
        mobile: nextPhone,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        response.status(409).json({
          error: "This phone number is already in use.",
        });
        return;
      }
    }

    let nextPhoto = student.profilePhoto;
    let nextPublicId = student.profilePhotoPublicId ?? "";

    if (body.profilePhoto !== undefined) {
      if (typeof body.profilePhoto !== "string") {
        response.status(400).json({
          error: "Invalid profile photo.",
        });
        return;
      }

      if (body.profilePhoto === "") {
        nextPhoto = "";
        nextPublicId = "";
      } else {
        const match = body.profilePhoto.match(
          /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/
        );

        if (!match) {
          response.status(400).json({
            error: "Only JPEG, PNG and WebP images are allowed.",
          });
          return;
        }

        const file = Buffer.from(match[2], "base64");

        if (!file.length || file.length > 10 * 1024 * 1024) {
          response.status(400).json({
            error: "Original image cannot exceed 10 MB.",
          });
          return;
        }

        const uploaded = await uploadProfileImage({
          file,
          type: "student",
        });

        nextPhoto = uploaded.url;
        nextPublicId = uploaded.publicId;
        uploadedPublicId = uploaded.publicId;
      }
    }

    const oldPublicId = student.profilePhotoPublicId ?? "";

    // Update User phone first.
    // If the Student save fails, this change will be rolled back.
    if (user.mobile !== nextPhone) {
      user.mobile = nextPhone;
      await user.save();
      userMobileUpdated = true;
    }

    student.phone = nextPhone;
    student.phoneKey = normalizePhone(nextPhone);
    student.address = nextAddress;
    student.profilePhoto = nextPhoto;
    student.profilePhotoPublicId = nextPublicId;

    // Save the new profile data.
    await student.save();

    // The new image is now referenced by the Student document.
    uploadedPublicId = "";

    // Delete old image only after the database update succeeds.
    if (oldPublicId && oldPublicId !== nextPublicId) {
      await deleteProfileImage(oldPublicId).catch((error) => {
        console.error(
          "Old student profile image cleanup failed:",
          error
        );
      });
    }

    response.json({
      message: "Profile updated successfully.",
      profile: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        phone: student.phone,
        fatherName: student.fatherName,
        profilePhoto: student.profilePhoto,
        address: student.address,
        gender: student.gender,
        className: student.className,
        admissionDate: student.admissionDate,
        monthlyFees: student.monthlyFees,
        batchId: student.batchId,
      },
    });
  } catch (error) {
    // If Student save failed after User phone update,
    // restore the previous User phone.
    if (userMobileUpdated && userDocument) {
      try {
        userDocument.mobile = previousUserMobile;
        await userDocument.save();
      } catch (rollbackError) {
        console.error(
          "Student profile phone rollback failed:",
          rollbackError
        );
      }
    }

    // Delete only the new image that was not committed to the database.
    if (uploadedPublicId) {
      await deleteProfileImage(uploadedPublicId).catch((cleanupError) => {
        console.error(
          "New student profile image cleanup failed:",
          cleanupError
        );
      });
    }

    next(error);
  }
}