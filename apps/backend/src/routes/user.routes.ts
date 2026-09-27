import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyOTP,
  getProfile,
  getPublicProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import { getMyHobbies, setMyHobbies, addMyHobby, removeMyHobby } from "../controllers/hobby.controller.js";
import {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowStatus,
  getMyFollowRequests,
  getFollowers,
  getFollowingList,
} from "../controllers/follow.controller.js";
import { getUserPosts } from "../controllers/post.controller.js";
import { getJourney } from "../controllers/journey.controller.js";
import { getUserSkills } from "../controllers/skill.controller.js";
import { getUserReputation } from "../controllers/feedback.controller.js";
import { listUserProgressLogs } from "../controllers/progress.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../utils/rateLimit.js";

const router = Router();

const MINUTE = 60 * 1000;
const normalised = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null);

// Keyed by the account, not the IP: behind the frontend's proxy every request can come from the same address.
// Guessing one account's password, or mailing codes to one address, is what these stop.
export const loginLimit = rateLimit({
  limit: 10,
  windowMs: 15 * MINUTE,
  key: (req) => normalised(req.body?.emailOrUsername),
  message: "Too many sign-in attempts. Please wait a few minutes and try again.",
});
export const registerLimit = rateLimit({
  limit: 5,
  windowMs: 60 * MINUTE,
  key: (req) => normalised(req.body?.email),
  message: "Too many sign-up attempts for this email. Please try again in an hour.",
});
export const verifyOtpLimit = rateLimit({
  limit: 10,
  windowMs: 15 * MINUTE,
  key: (req) => normalised(req.body?.email),
  message: "Too many attempts. Please wait a few minutes and try again.",
});

// Public Routes
router.post("/register", registerLimit, registerUser);
router.post("/login", loginLimit, loginUser);
router.post("/verify-otp", verifyOtpLimit, verifyOTP);
// Authenticated by the httpOnly refresh cookie, not the (possibly expired) access token
router.post("/refresh", refreshAccessToken);

// Protected Routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/profile", verifyJWT, getProfile);
router.get("/me/hobbies", verifyJWT, getMyHobbies);
router.post("/me/hobbies", verifyJWT, setMyHobbies);
router.post("/me/hobbies/:hobbyId", verifyJWT, addMyHobby);
router.delete("/me/hobbies/:hobbyId", verifyJWT, removeMyHobby);
router.get("/me/follow-requests", verifyJWT, getMyFollowRequests);

// Keep dynamic routes last so they never shadow the static ones above
router.get("/:username", getPublicProfile);
router.patch("/:username", verifyJWT, updateProfile);
router.get("/:username/posts", verifyJWT, getUserPosts);
router.get("/:username/journey", verifyJWT, getJourney);
router.get("/:username/skills", verifyJWT, getUserSkills);
router.get("/:username/reputation", verifyJWT, getUserReputation);
router.get("/:username/progress", verifyJWT, listUserProgressLogs);
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowingList);
router.get("/:username/follow-status", verifyJWT, getFollowStatus);
router.post("/:username/follow", verifyJWT, followUser);
router.delete("/:username/follow", verifyJWT, unfollowUser);
router.post("/:username/follow/accept", verifyJWT, acceptFollowRequest);
router.post("/:username/follow/reject", verifyJWT, rejectFollowRequest);

export default router;
