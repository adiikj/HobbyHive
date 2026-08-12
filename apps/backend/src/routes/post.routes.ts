import { Router } from "express";
import { createPost, likePost, unlikePost } from "../controllers/post.controller.js";
import { listComments, addComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, createPost);
router.post("/:postId/like", verifyJWT, likePost);
router.delete("/:postId/like", verifyJWT, unlikePost);
router.get("/:postId/comments", listComments);
router.post("/:postId/comments", verifyJWT, addComment);

export default router;
