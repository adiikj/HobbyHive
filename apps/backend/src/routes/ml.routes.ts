import { Router } from "express";
import { suggestHive } from "../controllers/ml.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/suggest-hive", verifyJWT, suggestHive);

export default router;
