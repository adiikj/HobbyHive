import { Router } from "express";
import { removeGuideEntry } from "../controllers/guide.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.delete("/:entryId", removeGuideEntry);

export default router;
