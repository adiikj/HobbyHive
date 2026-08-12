import { Router } from "express";
import {
  listHobbies,
  getTrendingHobbies,
  getHobbyBySlug,
  getHobbyPosts,
} from "../controllers/hobby.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listHobbies);
router.get("/trending", getTrendingHobbies);

// Keep dynamic routes last so they never shadow the static ones above
router.get("/:slug", verifyJWT, getHobbyBySlug);
router.get("/:slug/posts", verifyJWT, getHobbyPosts);

export default router;
