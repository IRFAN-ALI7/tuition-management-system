import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

export interface AuthRequest extends Request { auth?: { userId: string; role: "admin" | "student" }; }

export async function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  try {
    const cookieHeader = request.headers.cookie ?? "";
    const sessionCookie = cookieHeader.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith("session="));
    const token = sessionCookie ? decodeURIComponent(sessionCookie.slice("session=".length)) : undefined;
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) { response.status(401).json({ error: "Please sign in to continue." }); return; }
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || !["admin", "student"].includes(String(payload.role))) { response.status(401).json({ error: "Invalid session." }); return; }
    const user = await User.findById(payload.sub).select("role active sessionVersion");
    if (!user || !user.active || user.role !== payload.role || user.sessionVersion !== payload.version) { response.status(401).json({ error: "Session expired. Please sign in again." }); return; }
    request.auth = { userId: user.id, role: user.role };
    next();
  } catch { response.status(401).json({ error: "Session expired. Please sign in again." }); }
}

export function requireAdmin(request: AuthRequest, response: Response, next: NextFunction) {
  if (request.auth?.role !== "admin") { response.status(403).json({ error: "Administrator access is required." }); return; }
  next();
}
