const Chat = require("../models/Chat");
const Message = require("../models/Message");

// Initiate a chat between users
exports.initiateChat = async (req, res, next) => {
  try {
    const { participantIds, chatType, groupName } = req.body;
    const participants = [req.user._id, ...participantIds];

    // Create a new chat
    const chat = await Chat.create({
      chatType,
      participants,
      groupName: chatType === "group" ? groupName : undefined,
    });

    res.status(201).json(chat);
  } catch (error) {
    next(error);
  }
};

// Get chats for the authenticated user
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "username accountType")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    next(error);
  }
};

// Send a message in a chat
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, messageType, fileUrl } = req.body;

    // Verify that the chat exists and the user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this chat" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      messageType,
      fileUrl,
    });

    // Update chat's messages array and updatedAt timestamp
    chat.messages.push(message._id);
    chat.updatedAt = Date.now();
    await chat.save();

    // Emit message via Socket.io if implemented here

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// Get messages for a chat
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // Verify that the chat exists and the user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this chat" });
    }

    // Retrieve the last 100 messages
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("sender", "username");

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// Delete a message (Admin/Moderator only)
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).populate("chat");
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Check if the user is admin or moderator
    if (
      req.user.accountType !== "admin" &&
      req.user.accountType !== "moderator"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this message" });
    }

    // Remove message from chat's messages array
    await Chat.findByIdAndUpdate(message.chat._id, {
      $pull: { messages: messageId },
    });

    await message.remove();

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};
