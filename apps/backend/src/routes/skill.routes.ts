import { Router } from "express";
import { setSkillStatus } from "../controllers/skill.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.put("/:skillId/status", setSkillStatus);

export default router;
