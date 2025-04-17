// models/Chat.js
const mongoose = require("mongoose");

// Chat model: Defines the schema for chats, including participants, messages, and type.
const chatSchema = new mongoose.Schema(
  {
    chatType: {
      type: String,
      enum: ["user-user", "user-doctor", "group"],
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    groupName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
