import bcrypt from "bcrypt";
import db from "../db.js";
import { signToken, cookieName } from "../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  responseMessage,
} from "../utils/utils.js";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

// Updated Zod schema to include role (optional, default USER)
export const registerUser = async (req, res) => {
  try {
    const extendedRegisterSchema = registerSchema.extend({
      role: z.enum(["USER", "ADMIN"]).optional(),
    });

    const parsed = extendedRegisterSchema.parse(req.body);
    let { name, email, password, department, role } = parsed;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the VERY FIRST user in the entire system
    const countRes = await db.query("SELECT COUNT(*) FROM users");
    const isFirstUser = Number(countRes.rows[0].count) === 0;

    // If first user → force role to ADMIN (even if someone tries to send "USER")
    if (isFirstUser) {
      role = "ADMIN";
    } else {
      // For all other users, default to USER unless explicitly allowed
      role = role || "USER";
    }

    const result = await db.query(
      `INSERT INTO users (name, email, password, department, role)
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, department, role, created_at`,
      [name, email, hashedPassword, department || null, role]
    );

    const user = result.rows[0];

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: isFirstUser
        ? "Welcome! You're the first user — you've been made Admin."
        : responseMessage.userRegisteredSuccess,
      user: safeUser,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        message: responseMessage.emailAlreadyExists,
      });
    }
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorRegisteringUser,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const result = await db.query(
      "SELECT id, name, email, password, department, role FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: responseMessage.invalidCredentials,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: responseMessage.invalidCredentials,
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role, // include role in token
    });

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send user without password
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: responseMessage.userLoggedInSuccess,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorLoggingInUser,
    });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    });
    res.json({
      success: true,
      message: responseMessage.userLogoutSuccess,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorLoggingOutUser,
    });
  }
};
