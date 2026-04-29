import asyncHandler from "express-async-handler";
import { nanoid } from "nanoid";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { ApiError } from "../middleware/errorMiddleware.js";

const sanitizeUser = (userDoc) => ({
  _id: userDoc._id,
  userId: userDoc.userId,
  name: userDoc.name,
  email: userDoc.email,
  avatar: userDoc.avatar,
  isOnline: userDoc.isOnline,
  lastSeen: userDoc.lastSeen,
  createdAt: userDoc.createdAt
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, avatar } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "Email already in use");
  }

  const uniqueUserId = `usr_${nanoid(10)}`;

  const user = await User.create({
    name,
    email,
    password,
    avatar: avatar || "",
    userId: uniqueUserId
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordMatched = await user.matchPassword(password);
  if (!passwordMatched) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: sanitizeUser(req.user)
  });
});
