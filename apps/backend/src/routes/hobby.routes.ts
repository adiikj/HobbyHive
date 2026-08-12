import { Router } from "express";
import {
  listHobbies,
  getTrendingHobbies,
  getHobbyBySlug,
  getHobbyPosts,
  getHobbyRoomMessages,
} from "../controllers/hobby.controller.js";
import { getHobbyEvents, createEvent } from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listHobbies);
router.get("/trending", getTrendingHobbies);

// Keep dynamic routes last so they never shadow the static ones above
router.get("/:slug", verifyJWT, getHobbyBySlug);
router.get("/:slug/posts", verifyJWT, getHobbyPosts);
router.get("/:slug/room/messages", verifyJWT, getHobbyRoomMessages);
router.get("/:slug/events", verifyJWT, getHobbyEvents);
router.post("/:slug/events", verifyJWT, createEvent);

export default router;
