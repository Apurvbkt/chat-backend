import { body, param, query } from "express-validator";

export const registerValidator = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("avatar").optional().isString().isLength({ max: 1000 })
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
];

export const searchUsersValidator = [
  query("q").optional().isString().trim().isLength({ max: 100 }).withMessage("Invalid search query")
];

export const createChatValidator = [
  body("targetUserId").isMongoId().withMessage("Valid target user id is required")
];

export const inviteCodeValidator = [
  param("inviteCode")
    .isString()
    .trim()
    .isLength({ min: 6, max: 32 })
    .withMessage("Invalid invite code")
];

export const chatIdParamValidator = [
  param("chatId").isMongoId().withMessage("Valid chat id is required")
];

export const sendMessageValidator = [
  body("content").trim().isLength({ min: 1, max: 5000 }).withMessage("Message must be 1 to 5000 chars")
];
