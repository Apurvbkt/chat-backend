import express from "express";

import { getUserById, searchUsers } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import { searchUsersValidator } from "../validators/validators.js";

const router = express.Router();

router.get("/search", protect, searchUsersValidator, validate, searchUsers);
router.get("/:userId", protect, getUserById);

export default router;
