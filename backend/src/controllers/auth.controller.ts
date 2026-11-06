
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middleware/authenticate";

import User from "../models/User.model";

const isProduction = process.env.NODE_ENV === "production";

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  maxAge: 12 * 60 * 60 * 1000,
};

// ADMIN AND STUDENT LOGIN
export async function login(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { identifier, password, role } = request.body as {
      identifier?: string;
      password?: string;
      role?: string;
    };

    if (
      !identifier?.trim() ||
      !password ||
      !["admin", "student"].includes(role ?? "")
    ) {
      response.status(400).json({
        error: "Role, phone number and password are required.",
      });
      return;
    }

    // Both Admin and Student login using phone number + password.
    const filter = {
      role,
      mobile: identifier.trim(),
    };

    const user = await User.findOne(filter).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({
        error: "Invalid sign in details.",
      });
      return;
    }

    // Inactive student account check
    if (role === "student" && !user.active) {
      response.status(403).json({
        code: "STUDENT_ACCOUNT_INACTIVE",
        error:
          "Your account is currently inactive. Please contact your tuition administrator to reactivate your account.",
      });
      return;
    }

    // Inactive admin account check
    if (!user.active) {
      response.status(401).json({
        error: "Invalid sign in details.",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        version: user.sessionVersion,
      },
      secret,
      { expiresIn: "12h" }
    );

    response.cookie("session", token, sessionCookieOptions);

    response.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ADMIN AND STUDENT LOGOUT
export async function logout(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    if (!request.auth?.userId) {
      response.status(401).json({
        error: "Please sign in to continue.",
      });
      return;
    }

    await User.findOneAndUpdate(
      { _id: request.auth.userId },
      { $inc: { sessionVersion: 1 } }
    );

    response.clearCookie("session", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    });

    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

// GET AUTH SESSION
export function getSession(
  request: Request,
  response: Response
) {
  const auth = (request as AuthRequest).auth;

  response.json({
    user: {
      id: auth?.userId,
      role: auth?.role,
    },
  });
}
