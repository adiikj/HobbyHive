import { Router } from "express";
import { getFeed, getFollowingFeed } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, getFeed);
router.get("/following", verifyJWT, getFollowingFeed);

export default router;
