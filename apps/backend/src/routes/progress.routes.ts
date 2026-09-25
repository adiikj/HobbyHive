import { Router } from "express";
import {
  createProgressLog,
  getProgressLog,
  updateProgressLog,
  deleteProgressLog,
} from "../controllers/progress.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", createProgressLog);
router.get("/:logId", getProgressLog);
router.patch("/:logId", updateProgressLog);
router.delete("/:logId", deleteProgressLog);

export default router;
