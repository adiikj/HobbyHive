import { Router } from "express";
import { search } from "../controllers/search.controller.js";
import { semanticSearch } from "../controllers/ml.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, search);
router.get("/semantic", verifyJWT, semanticSearch);

export default router;
