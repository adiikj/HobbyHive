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
import { getMyHobbies, setMyHobbies } from "../controllers/hobby.controller.js";
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

// Keep dynamic routes last so they never shadow the static ones above
router.get("/:username", getPublicProfile);
router.patch("/:username", verifyJWT, updateProfile);

export default router;
