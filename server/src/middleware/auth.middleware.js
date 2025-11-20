import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const cookieName = process.env.COOKIE_NAME || "token";
const jwtSecret = process.env.JWT_SECRET || "secret";

export function signToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role || "USER",
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

export function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export { cookieName };
