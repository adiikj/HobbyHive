import { Router } from "express";
import { getFeed } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, getFeed);

export default router;
