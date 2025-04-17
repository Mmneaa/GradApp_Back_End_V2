// models/Message.js
const mongoose = require("mongoose");

// Message model: Defines the schema for chat messages, including sender, content, and type.
const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String },
    messageType: {
      type: String,
      enum: ["text", "audio", "file"],
      default: "text",
    },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
