import asyncHandler from "express-async-handler";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorMiddleware.js";

const chatProjection = {
  members: 1,
  inviteCode: 1,
  createdBy: 1,
  lastMessage: 1,
  updatedAt: 1,
  createdAt: 1
};

const populateChat = [
  { path: "members", select: "name email avatar userId isOnline lastSeen" },
  {
    path: "lastMessage",
    select: "content sender recipient status createdAt"
  }
];

const findDirectChat = async (userAId, userBId) => {
  return Chat.findOne({
    members: { $all: [userAId, userBId] },
    $expr: { $eq: [{ $size: "$members" }, 2] }
  });
};

export const createOrGetDirectChat = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { targetUserId } = req.body;

  if (currentUserId.toString() === targetUserId) {
    throw new ApiError(400, "Cannot create chat with yourself");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found");
  }

  let chat = await findDirectChat(currentUserId, targetUserId);

  if (!chat) {
    chat = await Chat.create({
      members: [currentUserId, targetUserId],
      inviteCode: `inv_${nanoid(12)}`,
      createdBy: currentUserId
    });
  }

  const populated = await Chat.findById(chat._id, chatProjection).populate(populateChat);

  const io = req.app.get("io");
  io.to(`user:${targetUserId}`).emit("chat:new", populated);

  res.status(201).json({
    success: true,
    data: populated
  });
});

export const joinByInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findOne({ inviteCode });
  if (!chat) {
    throw new ApiError(404, "Invite link is invalid");
  }

  const alreadyMember = chat.members.some((member) => member.toString() === userId.toString());

  if (!alreadyMember) {
    if (chat.members.length >= 2) {
      throw new ApiError(403, "This invite link already has 2 members");
    }

    chat.members.push(userId);
    await chat.save();
  }

  const populated = await Chat.findById(chat._id, chatProjection).populate(populateChat);

  const io = req.app.get("io");
  populated.members.forEach((member) => {
    io.to(`user:${member._id}`).emit("chat:new", populated);
  });

  res.status(200).json({
    success: true,
    data: populated
  });
});

export const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ members: req.user._id }, chatProjection)
    .populate(populateChat)
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: chats
  });
});

export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "30", 10);

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat id");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const isMember = chat.members.some((member) => member.toString() === req.user._id.toString());
  if (!isMember) {
    throw new ApiError(403, "You are not allowed to view this chat");
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ chat: chatId })
      .populate("sender", "name avatar userId")
      .populate("recipient", "name avatar userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ chat: chatId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + messages.length < total
      }
    }
  });
});

export const getInviteLink = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const isMember = chat.members.some((member) => member.toString() === req.user._id.toString());
  if (!isMember) {
    throw new ApiError(403, "You are not allowed to access this invite link");
  }

  const inviteUrl = `${process.env.CLIENT_URL}/invite/${chat.inviteCode}`;

  res.status(200).json({
    success: true,
    data: {
      inviteCode: chat.inviteCode,
      inviteUrl
    }
  });
});
