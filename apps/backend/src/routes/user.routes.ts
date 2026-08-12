import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
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
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);

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
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowingList);
router.get("/:username/follow-status", verifyJWT, getFollowStatus);
router.post("/:username/follow", verifyJWT, followUser);
router.delete("/:username/follow", verifyJWT, unfollowUser);
router.post("/:username/follow/accept", verifyJWT, acceptFollowRequest);
router.post("/:username/follow/reject", verifyJWT, rejectFollowRequest);

export default router;
