import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";
import { StatusCodes } from "http-status-codes";
import type { Request, NextFunction, Response } from "express";
import config from "../config/db";

export interface AuthRequest extends Request {
  user?: { id: number; name: string; role: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers["authorization"];

  // Check if token is provided
  if (!token) {
    return sendError(res, StatusCodes.UNAUTHORIZED, "No token provided");
  }

  try {
    const decoded = jwt.verify(token, config.jwt!) as {
      id: number;
      name: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    return sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
};
