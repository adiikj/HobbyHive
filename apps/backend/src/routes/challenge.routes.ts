import { Router } from "express";
import { getChallenge, getChallengeEntries } from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/:challengeId", getChallenge);
router.get("/:challengeId/entries", getChallengeEntries);

export default router;
