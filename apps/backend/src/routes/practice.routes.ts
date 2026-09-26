import { Router } from "express";
import { logPractice, listMyPractice, deletePractice, sharePractice } from "../controllers/practice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", logPractice);
router.get("/", listMyPractice);
router.delete("/:sessionId", deletePractice);
router.post("/:sessionId/share", sharePractice);

export default router;
