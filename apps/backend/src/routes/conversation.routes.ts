import { Router } from "express";
import {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} from "../controllers/conversation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/", listConversations);
router.post("/", getOrCreateConversation);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);
router.post("/:conversationId/read", markConversationRead);

export default router;
