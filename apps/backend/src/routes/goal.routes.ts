import { Router } from "express";
import { createGoal, listMyGoals, updateGoal, deleteGoal } from "../controllers/goal.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", createGoal);
router.get("/", listMyGoals);
router.patch("/:goalId", updateGoal);
router.delete("/:goalId", deleteGoal);

export default router;
