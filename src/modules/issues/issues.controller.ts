import { pool } from "../../db";

import { sendSuccess, sendError } from "../../utils/response";
import { isValidType } from "../../utils/validation";
import { StatusCodes } from "http-status-codes";
import type { Response } from "express";
import type { AuthRequest } from "../../middleware/authenticate";
import type {
  CreateIssueBody,
  IssueQuery,
  UpdateIssueBody,
} from "./issues.types";

// Create a new issue
export const createIssue = async (req: AuthRequest, res: Response) => {
  const { title, description, type }: CreateIssueBody = req.body;
  const reporter_id = req.user!.id;

  // Validation
  if (!title || !description || !type) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Title, description, type required",
    );
  }
  if (title.length > 150) {
    return sendError(res, StatusCodes.BAD_REQUEST, "Title max 150 characters");
  }
  if (description.length < 20) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Description min 20 characters",
    );
  }
  if (!isValidType(type)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Type must be bug or feature_request",
    );
  }

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id],
  );

  return sendSuccess(
    res,
    StatusCodes.CREATED,
    "Issue created successfully",
    result.rows[0],
  );
};

// Get all issues with optional filters and sorting
export const getAllIssues = async (req: AuthRequest, res: Response) => {
  const { sort = "newest", type, status }: IssueQuery = req.query as IssueQuery;

  let query = "SELECT * FROM issues";
  const params: string[] = [];
  const conditions: string[] = [];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query +=
    sort === "oldest"
      ? " ORDER BY created_at ASC"
      : " ORDER BY created_at DESC";

  const issues = await pool.query(query, params);

  if (issues.rows.length === 0) {
    return sendSuccess(res, StatusCodes.OK, "Issues fetched", []);
  }

  const reporterIds = [...new Set(issues.rows.map((i) => i.reporter_id))];
  const reporters = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds],
  );

  const reporterMap: Record<number, object> = {};
  reporters.rows.forEach((r) => {
    reporterMap[r.id] = r;
  });

  const data = issues.rows.map((issue) => {
    const { reporter_id, ...rest } = issue;
    return { ...rest, reporter: reporterMap[reporter_id] || null };
  });

  return sendSuccess(res, StatusCodes.OK, "Issues fetched", data);
};

// Get a single issue by ID
export const getIssueById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
  }

  const issue = result.rows[0];
  const reporter = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id],
  );

  const { reporter_id, ...rest } = issue;
  return sendSuccess(res, StatusCodes.OK, "Issue fetched", {
    ...rest,
    reporter: reporter.rows[0] || null,
  });
};

export const updateIssue = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, type }: UpdateIssueBody = req.body;
  const user = req.user!;

  const found = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  if (found.rows.length === 0) {
    return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
  }

  const issue = found.rows[0];

  // Permission check
  if (user.role !== "maintainer") {
    if (issue.reporter_id !== user.id) {
      return sendError(
        res,
        StatusCodes.FORBIDDEN,
        "You can only edit your own issues",
      );
    }

    if (issue.status !== "open") {
      return sendError(
        res,
        StatusCodes.CONFLICT,
        "Can only edit issues with open status",
      );
    }
  }

  // Validation
  if (title && title.length > 150) {
    return sendError(res, StatusCodes.BAD_REQUEST, "Title max 150 characters");
  }
  if (description && description.length < 20) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Description min 20 characters",
    );
  }
  if (type && !isValidType(type)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Type must be bug or feature_request",
    );
  }

  const result = await pool.query(
    `UPDATE issues
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [title || null, description || null, type || null, id],
  );

  return sendSuccess(
    res,
    StatusCodes.OK,
    "Issue updated successfully",
    result.rows[0],
  );
};

export const deleteIssue = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const found = await pool.query("SELECT id FROM issues WHERE id = $1", [id]);
  if (found.rows.length === 0) {
    return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
  }

  await pool.query("DELETE FROM issues WHERE id = $1", [id]);

  return sendSuccess(res, StatusCodes.OK, "Issue deleted successfully");
};
