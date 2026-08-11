import { Router } from "express";
import { listHobbies } from "../controllers/hobby.controller.js";

const router = Router();

router.get("/", listHobbies);

export default router;
