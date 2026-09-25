import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import {
  createPost,
  getPost,
  deletePost,
  pinPost,
  unpinPost,
  likePost,
  unlikePost,
  uploadPostImage,
} from "../controllers/post.controller.js";
import { savePost, unsavePost } from "../controllers/saved.controller.js";
import { listComments, addComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.post(
  "/upload-image",
  verifyJWT,
  (req: Request, res: Response, next: NextFunction) => {
    uploadImage.single("image")(req, res, (err) => {
      if (err) return next(new ApiError(400, err instanceof Error ? err.message : "Failed to upload image"));
      next();
    });
  },
  uploadPostImage
);
router.post("/", verifyJWT, createPost);
router.get("/:postId", verifyJWT, getPost);
router.delete("/:postId", verifyJWT, deletePost);
router.post("/:postId/pin", verifyJWT, pinPost);
router.delete("/:postId/pin", verifyJWT, unpinPost);
router.post("/:postId/like", verifyJWT, likePost);
router.delete("/:postId/like", verifyJWT, unlikePost);
router.get("/:postId/comments", listComments);
router.post("/:postId/comments", verifyJWT, addComment);
router.put("/:postId/save", verifyJWT, savePost);
router.delete("/:postId/save", verifyJWT, unsavePost);

export default router;
