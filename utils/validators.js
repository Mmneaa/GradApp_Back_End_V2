// Validators: Provides validation functions for various request payloads using Joi.
const Joi = require("joi");
const mongoose = require("mongoose");

exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    phoneNumber: Joi.string().allow(null, ""),
  });
  validateRequest(req, next, schema);
};

exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

exports.validateVerifyEmail = (req, res, next) => {
  const schema = Joi.object({
    verificationCode: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

exports.validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().allow(null, "").optional(),
    preferredLanguage: Joi.string().valid("EN", "AR").optional(),
  });
  validateRequest(req, next, schema);
};

exports.validatePasswordChange = (req, res, next) => {
  const schema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

exports.validatePostIdInBody = (req, res, next) => {
  const { postId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }
  next();
};
exports.validateFriendId = (req, res, next) => {
  const schema = Joi.object({
    friendId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

exports.validateCreatePost = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().optional(),
    category: Joi.string().valid("Community", "Research", "Courses").required(),
    subCategory: Joi.string().optional(),
    image: Joi.string().optional(),
    url: Joi.string().uri().optional(),
  });
  validateRequest(req, next, schema);
};

exports.validateChangeUserRole = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    newRole: Joi.string()
      .valid("admin", "moderator", "doctor", "user", "guest")
      .required(),
  });
  validateRequest(req, next, schema);
};

exports.validateEditPost = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().optional(),
    content: Joi.string().optional(),
    category: Joi.string().valid("Community", "Research", "Courses").optional(),
    image: Joi.string().optional(),
    url: Joi.string().uri().optional(),
  });
  validateRequest(req, next, schema);
};

exports.validateInitiateChat = (req, res, next) => {
  const schema = Joi.object({
    participantIds: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .required(),
    chatType: Joi.string()
      .valid("user-user", "user-doctor", "group")
      .required(),
    groupName: Joi.string().when("chatType", {
      is: "group",
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),
  });
  validateRequest(req, next, schema);
};

exports.validateSendMessage = (req, res, next) => {
  const schema = Joi.object({
    chatId: Joi.string().required(),
    content: Joi.when("messageType", {
      is: "text",
      then: Joi.string().required(),
      otherwise: Joi.optional(),
    }),
    messageType: Joi.string().valid("text", "audio", "file").required(),
    fileUrl: Joi.when("messageType", {
      is: Joi.valid("audio", "file"),
      then: Joi.string().uri().required(),
      otherwise: Joi.optional(),
    }),
  });
  validateRequest(req, next, schema);
};

exports.validateChatId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }
  next();
};

exports.validateMessageId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
    return res.status(400).json({ message: "Invalid message ID" });
  }
  next();
};

exports.validateRequestPasswordReset = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateRequest(req, next, schema);
};

exports.validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    resetToken: Joi.string().length(6).required(),
    newPassword: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

function validateRequest(req, next, schema) {
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    next(
      new Error(
        `Validation error: ${error.details.map((x) => x.message).join(", ")}`
      )
    );
  } else {
    req.body = value;
    next();
  }
}
