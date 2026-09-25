import { Router } from "express";
import { ask } from "../controllers/ask.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, ask);

export default router;
