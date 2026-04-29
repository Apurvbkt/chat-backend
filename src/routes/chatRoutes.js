import express from "express";

import {
  createOrGetDirectChat,
  getChatMessages,
  getInviteLink,
  getMyChats,
  joinByInviteCode
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  chatIdParamValidator,
  createChatValidator,
  inviteCodeValidator
} from "../validators/validators.js";

const router = express.Router();

router.post("/direct", protect, createChatValidator, validate, createOrGetDirectChat);
router.post("/join/:inviteCode", protect, inviteCodeValidator, validate, joinByInviteCode);
router.get("/my", protect, getMyChats);
router.get("/:chatId/messages", protect, chatIdParamValidator, validate, getChatMessages);
router.get("/:chatId/invite", protect, chatIdParamValidator, validate, getInviteLink);

export default router;
