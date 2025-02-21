// controllers/postController.js

const Post = require("../models/Post");
const User = require("../models/User");

// Create a new post
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, category, image } = req.body;
    const { accountType } = req.user;

    // Enforce category restrictions based on user role
    let allowedCategories = ["Community"];
    if (accountType === "admin" || accountType === "moderator") {
      allowedCategories = ["Community", "Research", "Courses"];
    }

    if (!allowedCategories.includes(category)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to post in this category." });
    }

    const post = await Post.create({
      user: req.user._id,
      title,
      content,
      category,
      image,
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// Edit an existing post
exports.editPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, image } = req.body;
    const { accountType } = req.user;

    const post = await Post.findById(id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Allow only if user is admin, moderator, or owner of the post
    if (
      post.user.toString() !== req.user._id.toString() &&
      accountType !== "admin" &&
      accountType !== "moderator"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this post." });
    }

    // Enforce category restrictions based on user role during edit
    let allowedCategories = ["Community"];
    if (accountType === "admin" || accountType === "moderator") {
      allowedCategories = ["Community", "Research", "Courses"];
    }

    if (category && !allowedCategories.includes(category)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to post in this category." });
    }

    // Update the post fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.image = image || post.image;

    await post.save();
    res.json(post);
  } catch (error) {
    next(error);
  }
};

// Delete a post
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountType } = req.user;

    const post = await Post.findById(id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Allow only if user is admin, moderator, or owner of the post
    if (
      post.user.toString() !== req.user._id.toString() &&
      accountType !== "admin" &&
      accountType !== "moderator"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post." });
    }

    await post.remove();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all posts with optional filtering and pagination
exports.getPosts = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    // Build query object
    let query = {};
    if (category) {
      query.category = category;
    }

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// Add a post to favourites
exports.addToFavourites = async (req, res, next) => {
  try {
    const { postId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if post is already in user's favourite list
    if (req.user.favouriteList.includes(postId)) {
      return res
        .status(400)
        .json({ message: "Post already in favourite list" });
    }

    req.user.favouriteList.push(postId);
    await req.user.save();

    // Increase like count on the post
    post.likes.push(req.user._id);
    await post.save();

    res.json({
      message: "Post added to favourites",
      favouriteList: req.user.favouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a post from favourites
exports.removeFromFavourites = async (req, res, next) => {
  try {
    const { postId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Remove post from user's favourite list
    req.user.favouriteList = req.user.favouriteList.filter(
      (id) => id.toString() !== postId
    );
    await req.user.save();

    // Decrease like count on the post
    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({
      message: "Post removed from favourites",
      favouriteList: req.user.favouriteList,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single post by ID
exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate("user", "username");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// Get posts created by the authenticated user
exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};
