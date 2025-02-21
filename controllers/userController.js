const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");
const Post = require("../models/Post");
const Group = require("../models/Group");

// Get user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    // Access the authenticated user's ID
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { username, email, phoneNumber, preferredLanguage } = req.body;
    let token;

    // Check if email is changing and needs verification
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });

      // Send verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      await sendEmail(
        email,
        "Email Verification",
        `Your verification code is: ${verificationCode}`
      );

      req.user.emailVerificationCode = verificationCode;
      req.user.emailVerified = false;
      req.user.email = email;

      // Generate a new token reflecting updated email
      token = generateToken(req.user._id, req.user.accountType);
    }

    req.user.username = username || req.user.username;
    req.user.phoneNumber = phoneNumber || req.user.phoneNumber;
    req.user.preferredLanguage =
      preferredLanguage || req.user.preferredLanguage;

    await req.user.save();

    if (token) {
      res.json({ message: "Profile updated successfully", token });
    } else {
      res.json({ message: "Profile updated successfully" });
    }
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { verificationCode } = req.body;

    // Find user by the verification code
    const user = await User.findOne({
      emailVerificationCode: verificationCode,
    });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code." });

    // Verify the email
    user.emailVerified = true;
    user.emailVerificationCode = null;
    await user.save();

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;

    // Validate new role
    const validRoles = ["admin", "moderator", "doctor", "user", "guest"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.accountType = newRole;
    await user.save();

    res.json({
      message: "User role updated successfully.",
      userId: user._id,
      newRole: user.accountType,
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old and new passwords are required" });
  }

  const user = await User.findById(req.user.id);

  if (user && (await user.matchPassword(oldPassword))) {
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } else {
    res.status(400).json({ message: "Invalid old password" });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Ban a user (Admin only)
exports.banUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userToBan = await User.findById(userId);
    if (!userToBan) return res.status(404).json({ message: "User not found" });

    userToBan.banned = true;
    userToBan.bannedBy = req.user._id;
    await userToBan.save();

    res.json({ message: "User banned successfully" });
  } catch (error) {
    next(error);
  }
};

// Unban a user (Admin only)
exports.unbanUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userToUnban = await User.findById(userId);

    userToUnban.banned = false;
    userToUnban.bannedBy = null;
    await userToUnban.save();

    res.json({ message: "User unbanned successfully" });
  } catch (error) {
    next(error);
  }
};

// Add a post to user's favourite list
exports.addToFavouriteList = async (req, res, next) => {
  try {
    const { postId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if post is already in favourite list
    if (req.user.favouriteList.includes(postId)) {
      return res
        .status(400)
        .json({ message: "Post already in favourite list" });
    }

    req.user.favouriteList.push(postId);
    await req.user.save();

    res.json({
      message: "Post added to favourite list",
      favouriteList: req.user.favouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a post from user's favourite list
exports.removeFromFavouriteList = async (req, res, next) => {
  try {
    const { postId } = req.body;

    req.user.favouriteList = req.user.favouriteList.filter(
      (id) => id.toString() !== postId
    );
    await req.user.save();

    res.json({
      message: "Post removed from favourite list",
      favouriteList: req.user.favouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's favourite list
exports.getFavouriteList = async (req, res, next) => {
  try {
    const favouritePosts = await Post.find({
      _id: { $in: req.user.favouriteList },
    });
    res.json(favouritePosts);
  } catch (error) {
    next(error);
  }
};

// Add to static favourite list
exports.addToStaticFavouriteList = async (req, res, next) => {
  try {
    const { name, postID } = req.body;

    // Check if ID already exists
    const exists = req.user.staticFavouriteList.some(
      (item) => item.postID === postID // Compare as string
    );
    if (exists) {
      return res
        .status(400)
        .json({ message: "ID already exists in static favourite list" });
    }

    req.user.staticFavouriteList.push({
      userID: req.user._id,
      name,
      postID, // Store as string
    });
    await req.user.save();

    res.json({
      message: "Added to static favourite list",
      staticFavouriteList: req.user.staticFavouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Remove from static favourite list
exports.removeFromStaticFavouriteList = async (req, res, next) => {
  try {
    const { postID } = req.body;

    req.user.staticFavouriteList = req.user.staticFavouriteList.filter(
      (item) => item.postID !== postID
    );
    await req.user.save();

    res.json({
      message: "Removed from static favourite list",
      staticFavouriteList: req.user.staticFavouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Get static favourite list
exports.getStaticFavouriteList = async (req, res, next) => {
  try {
    res.json(req.user.staticFavouriteList);
  } catch (error) {
    next(error);
  }
};

// Add a user to friends list
exports.addFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ message: "User not found" });

    // Check if already friends
    if (req.user.friendsList.includes(friendId)) {
      return res.status(400).json({ message: "User already in friends list" });
    }

    req.user.friendsList.push(friendId);
    await req.user.save();

    res.json({
      message: "User added to friends list",
      friendsList: req.user.friendsList,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a user from friends list
exports.removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;

    req.user.friendsList = req.user.friendsList.filter(
      (id) => id.toString() !== friendId
    );
    await req.user.save();

    res.json({
      message: "User removed from friends list",
      friendsList: req.user.friendsList,
    });
  } catch (error) {
    next(error);
  }
};

// Get friends list
exports.getFriendsList = async (req, res, next) => {
  try {
    const friends = await User.find({
      _id: { $in: req.user.friendsList },
    }).select("username email");
    res.json(friends);
  } catch (error) {
    next(error);
  }
};

// Add a group to groups list
exports.addGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if already in group
    if (req.user.groupsList.includes(groupId)) {
      return res.status(400).json({ message: "Already a member of the group" });
    }

    req.user.groupsList.push(groupId);
    await req.user.save();

    res.json({ message: "Added to group", groupsList: req.user.groupsList });
  } catch (error) {
    next(error);
  }
};

// Remove a group from groups list
exports.removeGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;

    req.user.groupsList = req.user.groupsList.filter(
      (id) => id.toString() !== groupId
    );
    await req.user.save();

    res.json({
      message: "Removed from group",
      groupsList: req.user.groupsList,
    });
  } catch (error) {
    next(error);
  }
};

// Get groups list
exports.getGroupsList = async (req, res, next) => {
  try {
    const groups = await Group.find({
      _id: { $in: req.user.groupsList },
    }).select("name");
    res.json(groups);
  } catch (error) {
    next(error);
  }
};
