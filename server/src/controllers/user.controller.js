import db from "../db.js";
import { responseMessage, updateUserSchema } from "../utils/utils.js";

export const getCurrentUser = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, department, role, created_at 
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: responseMessage.userNotFound,
      });
    }

    res.json({
      success: true,
      message: responseMessage.userFetchSuccess,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorFetchingUser,
    });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors.map((e) => e.message).join(", "),
      });
    }

    const { name, department } = parsed.data;

    if (!name && !department) {
      return res.status(400).json({
        success: false,
        message: responseMessage.noFieldProvided,
      });
    }

    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, department, role`,
      [name, department, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: responseMessage.userNotFound,
      });
    }

    res.json({
      success: true,
      message: responseMessage.userUpdatedSuccess,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("updateCurrentUser error:", err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorUpdatingUser,
    });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { search = "", dept = "" } = req.query;

    let sql = `
      SELECT id, name, email, department, role 
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${
        params.length + 1
      })`;
      params.push(`%${search}%`);
    }

    if (dept) {
      sql += ` AND department = $${params.length + 1}`;
      params.push(dept);
    }

    // Optional: hide admins from regular users? Remove if you want everyone visible
    // if (req.user.role !== "ADMIN") {
    //   sql += ` AND role = 'USER'`;
    // }

    const result = await db.query(sql, params);

    res.json({
      success: true,
      message: result.rows.length
        ? responseMessage.usersFetchSuccess
        : responseMessage.noUsersFound,
      data: result.rows,
    });
  } catch (err) {
    console.error("searchUser error:", err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorFetchingUsers,
    });
  }
};
