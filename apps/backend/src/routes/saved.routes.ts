import { Router } from "express";
import {
  getSavedPosts,
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
} from "../controllers/saved.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/", getSavedPosts);
router.get("/collections", listCollections);
router.post("/collections", createCollection);
router.patch("/collections/:collectionId", renameCollection);
router.delete("/collections/:collectionId", deleteCollection);

export default router;
