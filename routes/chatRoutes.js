const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  initiateChat,
  getChats,
  sendMessage,
  getMessages,
  deleteMessage,
} = require("../controllers/chatController");
const {
  validateInitiateChat,
  validateSendMessage,
  validateChatId,
  validateMessageId,
} = require("../utils/validators");

// Initiate a chat
router.post("/initiate", protect, validateInitiateChat, initiateChat);

// Get user's chats
router.get("/", protect, getChats);

// Send a message
router.post("/message", protect, validateSendMessage, sendMessage);

// Get messages for a chat
router.get("/messages/:chatId", protect, validateChatId, getMessages);

// Delete a message (Admin/Moderator only)
router.delete(
  "/messages/:messageId",
  protect,
  validateMessageId,
  deleteMessage
);

module.exports = router;
