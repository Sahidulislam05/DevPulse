import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import { sendSuccess, sendError } from "../../utils/response";
import { isValidEmail, isValidRole } from "../../utils/validation";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import type { LoginBody, SignupBody } from "./auth.types";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role }: SignupBody = req.body;
  // Validation
  if (!name || !email || !password) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Name, email, password required",
    );
  }

  if (!isValidEmail(email)) {
    return sendError(res, StatusCodes.BAD_REQUEST, "Invalid email format");
  }

  // Role validation (if provided)
  if (role && !isValidRole(role)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Role must be contributor or maintainer",
    );
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    return sendError(res, StatusCodes.BAD_REQUEST, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || "contributor"],
  );

  return sendSuccess(
    res,
    StatusCodes.CREATED,
    "User registered successfully",
    result.rows[0],
  );
};

export const login = async (req: Request, res: Response) => {
  const { email, password }: LoginBody = req.body;

  if (!email || !password) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Email and password required",
    );
  }

  // User খোঁজো
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const user = result.rows[0];

  if (!user) {
    return sendError(res, StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // Password মেলাও
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // JWT token বানাও
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );

  // Password বাদ দিয়ে user data পাঠাও
  const { password: _, ...userData } = user;

  return sendSuccess(res, StatusCodes.OK, "Login successful", {
    token,
    user: userData,
  });
};
