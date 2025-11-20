// routes/availability.routes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availability.controller.js";

const router = express.Router();

// Create & Get
router.post("/", authMiddleware, createAvailability);
router.get("/", authMiddleware, getAvailability);

// Single instance: /instance/:instanceId
router
  .route("/instance/:instanceId")
  .put(authMiddleware, updateAvailability) // edit this one only
  .delete(authMiddleware, deleteAvailability); // delete this one only

// Entire series: /instance/:instanceId/all
router
  .route("/instance/:instanceId/all")
  .put(authMiddleware, updateAvailability) // edit all future
  .delete(authMiddleware, deleteAvailability); // delete all future

export default router;
