import { Router } from "express";
import { markFeedbackHelpful, deleteFeedback } from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.put("/:feedbackId/helpful", markFeedbackHelpful);
router.delete("/:feedbackId", deleteFeedback);

export default router;
