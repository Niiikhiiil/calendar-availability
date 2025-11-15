import bcrypt from "bcrypt";
import db from "../db.js";
import { signToken, cookieName } from "../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  responseMessage,
} from "../utils/utils.js";

const isProduction = process.env.NODE_ENV === "production";

export const registerUser = async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { name, email, password, department } = parsed;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password, department)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, department, created_at`,
      [name, email, hashedPassword, department || null]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email });

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(201).json({
      success: true,
      message: responseMessage.userRegisteredSuccess,
      user,
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
    console.error(err);
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

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const existUser = result.rows[0];

    if (!existUser) {
      return res.status(400).json({
        success: false,
        message: responseMessage.invalidCredentials,
      });
    }

    const ok = await bcrypt.compare(password, existUser.password);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: responseMessage.invalidCredentials,
      });
    }
    const token = signToken({ id: existUser.id, email: existUser.email });
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.json({
      success: true,
      message: responseMessage.userLoggedInSuccess,
      user: {
        id: existUser.id,
        name: existUser.name,
        email: existUser.email,
        department: existUser.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorLoggingInUser,
    });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.clearCookie(cookieName);
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
