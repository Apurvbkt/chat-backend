import express from "express";

import { getMe, login, register } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import { loginValidator, registerValidator } from "../validators/validators.js";

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, getMe);

export default router;
