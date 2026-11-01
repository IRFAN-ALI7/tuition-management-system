
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middleware/authenticate";

import User from "../models/User.model";

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

    response.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000,
    });

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

// LOGOUT
export function logout(
  _request: Request,
  response: Response
) {
  response.clearCookie("session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  response.status(204).end();
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
