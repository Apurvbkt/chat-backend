import asyncHandler from "express-async-handler";

import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { ApiError } from "../middleware/errorMiddleware.js";

export const sendMessageFromRest = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const senderId = req.user._id.toString();
  const isMember = chat.members.some((member) => member.toString() === senderId);

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this chat");
  }

  const recipient = chat.members.find((member) => member.toString() !== senderId);
  if (!recipient) {
    throw new ApiError(400, "Recipient missing in chat");
  }

  const message = await Message.create({
    chat: chat._id,
    sender: req.user._id,
    recipient,
    content,
    status: "sent"
  });

  chat.lastMessage = message._id;
  await chat.save();

  const populated = await Message.findById(message._id)
    .populate("sender", "name avatar userId")
    .populate("recipient", "name avatar userId");

  res.status(201).json({
    success: true,
    data: populated
  });
});
