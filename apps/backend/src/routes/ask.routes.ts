import { Router } from "express";
import { answerStats, ask, rateAnswer } from "../controllers/ask.controller.js";
import { coachWeek } from "../controllers/coach.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, ask);
router.get("/stats", verifyJWT, answerStats);
router.post("/coach", verifyJWT, coachWeek);
router.post("/:answerId/feedback", verifyJWT, rateAnswer);

export default router;
