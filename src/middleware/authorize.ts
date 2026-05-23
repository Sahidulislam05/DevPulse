// import { Response, NextFunction } from 'express';

import { sendError } from "../utils/response";
import { StatusCodes } from "http-status-codes";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./authenticate";

export const requireMaintainer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "maintainer") {
    return sendError(res, StatusCodes.FORBIDDEN, "Maintainer access required");
  }
  next();
};
