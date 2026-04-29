import express from "express";

import { sendMessageFromRest } from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import { chatIdParamValidator, sendMessageValidator } from "../validators/validators.js";

const router = express.Router();

router.post("/:chatId", protect, chatIdParamValidator, sendMessageValidator, validate, sendMessageFromRest);

export default router;
