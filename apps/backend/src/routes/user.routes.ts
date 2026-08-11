import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyOTP,
  getProfile,
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

export default router;
