import { Router } from "express";
import {
  listHobbies,
  getTrendingHobbies,
  getHobbyBySlug,
  getHobbyPosts,
  getHobbyRoomMessages,
  getHobbyPinnedPosts,
} from "../controllers/hobby.controller.js";
import { listHobbyChallenges, createChallenge } from "../controllers/challenge.controller.js";
import { listFlaggedPosts } from "../controllers/ml.controller.js";
import { getHobbyEvents, createEvent } from "../controllers/event.controller.js";
import { getHobbySkills } from "../controllers/skill.controller.js";
import { listFeedbackRequests, listHiveMentors } from "../controllers/feedback.controller.js";
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
router.get("/:slug/pinned", verifyJWT, getHobbyPinnedPosts);
router.get("/:slug/challenges", verifyJWT, listHobbyChallenges);
router.post("/:slug/challenges", verifyJWT, createChallenge);
router.get("/:slug/flagged", verifyJWT, listFlaggedPosts);
router.get("/:slug/skills", verifyJWT, getHobbySkills);
router.get("/:slug/feedback-requests", verifyJWT, listFeedbackRequests);
router.get("/:slug/mentors", verifyJWT, listHiveMentors);

export default router;
