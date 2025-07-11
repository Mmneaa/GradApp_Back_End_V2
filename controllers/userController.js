const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Post = require("../models/Post");
const Group = require("../models/Group");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");

// Get user profile: Fetches the authenticated user's profile.
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

// Update user profile: Updates the user's profile, including email, username, phone number, and preferred language. Sends a verification code if the email is changed.
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

// Verify email: Verifies the user's email using a verification code.
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

// Change user role: Changes a user's role (admin, moderator, doctor, etc.) with restrictions.
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

// Change password: Allows a user to change their password after verifying the old password.
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await user.matchPassword(oldPassword))) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    // Generate a new token
    const token = generateToken(user._id, user.accountType);

    res.json({ message: "Password changed successfully", token });
  } catch (error) {
    next(error);
  }
};

// Get all users: Fetches all users (admin-only access).
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Ban user: Bans a user (admin-only access).
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

// Unban user: Unbans a user (admin-only access).
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

// Add to favourite list: Adds a post to the user's favorite list.
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

// Remove from favourite list: Removes a post from the user's favorite list.
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

// Get favourite list: Retrieves the user's favorite posts.
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

// Add to static favourite list: Adds a post to the user's static favorite list.
exports.addToStaticFavouriteList = async (req, res, next) => {
  try {
    const { name, postID } = req.body;

    // Check if ID already exists
    const exists = req.user.staticFavouriteList.some(
      (item) => item.postID.toString() === postID
    );
    if (exists) {
      return res
        .status(400)
        .json({ message: "ID already exists in static favourite list" });
    }

    req.user.staticFavouriteList.push({
      userID: req.user._id,
      name,
      postID,
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

// Remove from static favourite list: Removes a post from the user's static favorite list.
exports.removeFromStaticFavouriteList = async (req, res, next) => {
  try {
    const { postID } = req.body;

    req.user.staticFavouriteList = req.user.staticFavouriteList.filter(
      (item) => item.postID.toString() !== postID
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

// Get static favourite list: Retrieves the user's static favorite posts.
exports.getStaticFavouriteList = async (req, res, next) => {
  try {
    res.json(req.user.staticFavouriteList);
  } catch (error) {
    next(error);
  }
};

// Add friend: Adds a user to the authenticated user's friends list.
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

// Remove friend: Removes a user from the authenticated user's friends list.
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

// Get friends list: Retrieves the authenticated user's friends list.
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

// Add group: Adds a group to the authenticated user's groups list.
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

// Remove group: Removes a group from the authenticated user's groups list.
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

// Get groups list: Retrieves the authenticated user's groups list.
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

// Get doctors list: Retrieves all users with the doctor role.
exports.getDoctorsList = async (req, res, next) => {
  try {
    const doctors = await User.find({ accountType: "doctor" }).select(
      "username email _id image"
    );
    const response = doctors.map((doc) => ({
      id: doc._id,
      name: doc.username,
      image: doc.image || null,
    }));
    res.json(response);
  } catch (error) {
    next(error);
  }
};
