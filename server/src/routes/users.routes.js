import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getCurrentUser,
  searchUser,
  updateCurrentUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router
  .route("/me")
  .get(authMiddleware, getCurrentUser) // Get Current user routes
  .put(authMiddleware, updateCurrentUser); // Update current user route
router.get("/", authMiddleware, searchUser); // Secrch user route

export default router;
