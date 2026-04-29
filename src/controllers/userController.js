import asyncHandler from "express-async-handler";

import User from "../models/User.js";

const mapUser = (userDoc) => ({
  _id: userDoc._id,
  userId: userDoc.userId,
  name: userDoc.name,
  email: userDoc.email,
  avatar: userDoc.avatar,
  isOnline: userDoc.isOnline,
  lastSeen: userDoc.lastSeen
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = (req.query.q || "").trim();

  const filter = query
    ? {
        _id: { $ne: req.user._id },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { userId: { $regex: query, $options: "i" } }
        ]
      }
    : { _id: { $ne: req.user._id } };

  const users = await User.find(filter).limit(20).sort({ isOnline: -1, name: 1 });

  res.status(200).json({
    success: true,
    data: users.map(mapUser)
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    data: mapUser(user)
  });
});
