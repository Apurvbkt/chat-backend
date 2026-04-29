import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { getSocketCorsOptions } from "../config/cors.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const onlineUsers = new Map();

const addSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

const removeSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    return;
  }

  const sockets = onlineUsers.get(userId);
  sockets.delete(socketId);

  if (!sockets.size) {
    onlineUsers.delete(userId);
  }
};

const isOnline = (userId) => onlineUsers.has(userId);

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("Unauthorized: user not found"));
    }

    socket.user = user;
    return next();
  } catch (_error) {
    return next(new Error("Unauthorized"));
  }
};

const populateMessage = (messageId) => {
  return Message.findById(messageId)
    .populate("sender", "name avatar userId isOnline lastSeen")
    .populate("recipient", "name avatar userId isOnline lastSeen");
};

const emitPresence = (io, userId, state) => {
  io.emit("presence:update", {
    userId,
    isOnline: state,
    lastSeen: state ? null : new Date().toISOString()
  });
};

const handleUserOnline = async (io, userId, socketId) => {
  const wasOnline = isOnline(userId);
  addSocket(userId, socketId);

  if (!wasOnline) {
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: null
    });
    emitPresence(io, userId, true);
  }
};

const handleUserOffline = async (io, userId, socketId) => {
  removeSocket(userId, socketId);

  if (!isOnline(userId)) {
    const now = new Date();
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: now
    });
    io.emit("presence:update", {
      userId,
      isOnline: false,
      lastSeen: now.toISOString()
    });
  }
};

const joinExistingChats = async (socket, userId) => {
  const chats = await Chat.find({ members: userId }).select("_id");
  chats.forEach((chat) => socket.join(chat._id.toString()));
};

const updateMessageStatus = async (messageId, statusField) => {
  const update =
    statusField === "delivered"
      ? { status: "delivered", deliveredAt: new Date() }
      : { status: "seen", seenAt: new Date(), deliveredAt: new Date() };

  return Message.findByIdAndUpdate(messageId, update, { new: true });
};

const createSocketServer = (server) => {
  const io = new Server(server, {
    cors: getSocketCorsOptions()
  });

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    await handleUserOnline(io, userId, socket.id);

    socket.join(`user:${userId}`);
    await joinExistingChats(socket, userId);

    socket.on("chat:join", async ({ chatId }, callback = () => {}) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
          callback({ ok: false, message: "Chat not found" });
          return;
        }

        const isMember = chat.members.some((member) => member.toString() === userId);
        if (!isMember) {
          callback({ ok: false, message: "Unauthorized" });
          return;
        }

        socket.join(chatId);
        callback({ ok: true });
      } catch (error) {
        callback({ ok: false, message: error.message || "Could not join chat" });
      }
    });

    socket.on("message:send", async (payload, callback = () => {}) => {
      try {
        const content = (payload?.content || "").trim();
        const chatId = payload?.chatId;

        if (!content || !chatId) {
          callback({ ok: false, message: "chatId and content required" });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          callback({ ok: false, message: "Chat not found" });
          return;
        }

        const isMember = chat.members.some((member) => member.toString() === userId);
        if (!isMember) {
          callback({ ok: false, message: "Unauthorized" });
          return;
        }

        const recipient = chat.members.find((member) => member.toString() !== userId);
        if (!recipient) {
          callback({ ok: false, message: "Recipient missing" });
          return;
        }

        const message = await Message.create({
          chat: chat._id,
          sender: userId,
          recipient,
          content,
          status: "sent"
        });

        chat.lastMessage = message._id;
        await chat.save();

        const populatedMessage = await populateMessage(message._id);

        io.to(chatId).emit("message:new", {
          ...populatedMessage.toObject(),
          tempId: payload.tempId || null
        });

        callback({ ok: true, data: populatedMessage });
      } catch (error) {
        callback({ ok: false, message: error.message || "Failed to send message" });
      }
    });

    socket.on("message:delivered", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return;
        }

        if (message.recipient.toString() !== userId || message.status !== "sent") {
          return;
        }

        const updated = await updateMessageStatus(messageId, "delivered");
        io.to(message.chat.toString()).emit("message:status", {
          messageId: updated._id,
          status: updated.status,
          deliveredAt: updated.deliveredAt,
          seenAt: updated.seenAt
        });
      } catch (_error) {}
    });

    socket.on("message:seen", async ({ chatId, messageId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return;
        }

        const isMember = chat.members.some((member) => member.toString() === userId);
        if (!isMember) {
          return;
        }

        const updateQuery = messageId
          ? { _id: messageId, chat: chatId, recipient: userId }
          : { chat: chatId, recipient: userId, status: { $ne: "seen" } };

        const messages = await Message.find(updateQuery);

        for (const msg of messages) {
          const updated = await updateMessageStatus(msg._id, "seen");
          io.to(chatId).emit("message:status", {
            messageId: updated._id,
            status: updated.status,
            deliveredAt: updated.deliveredAt,
            seenAt: updated.seenAt
          });
        }
      } catch (_error) {
        // Ignore status updates on transient failures to keep socket session alive.
      }
    });

    socket.on("typing:start", ({ chatId }) => {
      socket.to(chatId).emit("typing:update", { chatId, userId, isTyping: true });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:update", { chatId, userId, isTyping: false });
    });

    socket.on("disconnect", async () => {
      await handleUserOffline(io, userId, socket.id);
    });
  });

  return io;
};

export { createSocketServer };
