import { Router } from "express";
import { logPractice, listMyPractice, deletePractice, sharePractice } from "../controllers/practice.controller.js";
import { getRecap, shareRecap } from "../controllers/recap.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", logPractice);
router.get("/", listMyPractice);
router.get("/recap", getRecap);
router.post("/recap/share", shareRecap);
router.delete("/:sessionId", deletePractice);
router.post("/:sessionId/share", sharePractice);

export default router;
