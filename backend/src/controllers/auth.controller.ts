import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middleware/authenticate";

import User from "../models/User.model";

const isProduction = process.env.NODE_ENV === "production";

const SESSION_HOURS = 12;
const MAX_PASSWORD_LENGTH = 128;

const MESSAGES = {
  missingDetails: "Please enter your mobile number and password.",
  invalidCredentials:
    "Incorrect mobile number or password. Please try again.",
  studentInactive:
    "Your account is currently inactive. Please contact your tuition administrator to reactivate your account.",
  signInRequired: "Please sign in to continue.",
};

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  maxAge: SESSION_HOURS * 60 * 60 * 1000,
  path: "/",
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  path: "/",
};

/**
 * A real bcrypt hash of a random string. When no user is found we still
 * compare against it, so a wrong number and a wrong password take the same
 * time and an outsider cannot find out which mobile numbers are registered.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  `dummy-${Math.random().toString(36)}-${Date.now()}`,
  12,
);

// ADMIN AND STUDENT LOGIN
export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = (request.body ?? {}) as Record<string, unknown>;

    const identifier =
      typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role =
      body.role === "admin" || body.role === "student" ? body.role : null;

    if (!identifier || !password || !role) {
      response.status(400).json({ error: MESSAGES.missingDetails });
      return;
    }

    // Very long passwords are never valid and only waste server time.
    if (password.length > MAX_PASSWORD_LENGTH || identifier.length > 20) {
      response.status(401).json({ error: MESSAGES.invalidCredentials });
      return;
    }

    // Both admin and student sign in with mobile number + password.
    const user = await User.findOne({ role, mobile: identifier }).select(
      "+passwordHash",
    );

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      response.status(401).json({ error: MESSAGES.invalidCredentials });
      return;
    }

    // The password is correct here, so it is safe to explain an inactive
    // student account. An inactive admin gets the generic message.
    if (!user.active) {
      if (role === "student") {
        response.status(403).json({
          code: "STUDENT_ACCOUNT_INACTIVE",
          error: MESSAGES.studentInactive,
        });
        return;
      }

      response.status(401).json({ error: MESSAGES.invalidCredentials });
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
      { expiresIn: `${SESSION_HOURS}h` },
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
  next: NextFunction,
) {
  try {
    if (!request.auth?.userId) {
      response.clearCookie("session", clearCookieOptions);
      response.status(401).json({ error: MESSAGES.signInRequired });
      return;
    }

    // Invalidates the current token on the server as well.
    await User.findOneAndUpdate(
      { _id: request.auth.userId },
      { $inc: { sessionVersion: 1 } },
    );

    response.clearCookie("session", clearCookieOptions);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

// GET AUTH SESSION
export function getSession(request: Request, response: Response) {
  const auth = (request as AuthRequest).auth;

  response.json({
    user: {
      id: auth?.userId,
      role: auth?.role,
    },
  });
}