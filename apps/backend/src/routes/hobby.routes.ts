import { Router } from "express";
import { listHobbies, getTrendingHobbies } from "../controllers/hobby.controller.js";

const router = Router();

router.get("/", listHobbies);
router.get("/trending", getTrendingHobbies);

export default router;
