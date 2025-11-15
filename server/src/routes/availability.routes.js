import express from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  updateAvailability,
} from "../controllers/availability.controller.js";

const router = express.Router();

router
  .route("/")
  .post(authMiddleware, createAvailability) // create availability
  .get(authMiddleware, getAvailability); // expand recurring and get availabilities for a user or multiple users within range

router
  .route("/:id")
  .put(authMiddleware, updateAvailability) // update availability
  .delete(authMiddleware, deleteAvailability); //delete availability

export default router;
