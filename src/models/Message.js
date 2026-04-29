import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["text"],
      default: "text"
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    seenAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
