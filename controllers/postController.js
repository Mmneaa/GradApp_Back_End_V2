// controllers/postController.js

const Post = require("../models/Post");
const User = require("../models/User");

// Create a new post: Allows a user to create a post with specific category restrictions based on their role.
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, category, image, url } = req.body;
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
      content: content || "", // Allow content to be empty
      category,
      image,
      url,
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// Edit an existing post: Allows a user to edit their post or, if an admin/moderator, any post.
exports.editPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, image, url } = req.body;
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
    post.url = url || post.url;

    await post.save();
    res.json(post);
  } catch (error) {
    next(error);
  }
};

// Delete a post: Allows a user to delete their post or, if an admin/moderator, any post.
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

// Get all posts: Retrieves all posts with optional filtering and pagination.
exports.getPosts = async (req, res, next) => {
  try {
    const { category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Build query object
    let query = {};
    if (category) {
      query.category = category;
    }

    // Count total documents for pagination
    const total = await Post.countDocuments(query);

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .populate("user", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    let response;
    if (category === "Courses" || category === "Research") {
      // Group posts by subCategory
      const groupedPosts = posts.reduce((acc, post) => {
        const subCategory = post.subCategory || "Uncategorized";
        if (!acc[subCategory]) {
          acc[subCategory] = [];
        }
        acc[subCategory].push({
          id: post._id,
          title: post.title,
          image: post.image,
          url: post.url,
          favouritesCount: post.likes.length,
        });
        return acc;
      }, {});

      response = {
        groupedPosts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalPosts: total,
      };
    } else {
      response = {
        posts: posts.map((post) => ({
          ...post.toObject(),
          favouritesCount: post.likes.length,
        })),
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalPosts: total,
      };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Add a post to favourites: Adds a post to the authenticated user's favourites list.
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

// Remove a post from favourites: Removes a post from the authenticated user's favourites list.
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

// Get a single post by ID: Retrieves a specific post by its ID.
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

// Get posts created by the authenticated user: Retrieves all posts created by the authenticated user.
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

// Get posts by subCategory for Research: Retrieves research posts filtered by subCategory.
exports.getResearchPostsBySubCategory = async (req, res, next) => {
  try {
    const { subCategory } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = {
      category: "Research",
      subCategory,
    };

    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate("user", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPosts: total,
    });
  } catch (error) {
    next(error);
  }
};

// Get posts by subCategory for Courses: Retrieves course posts filtered by subCategory.
exports.getCoursesPostsBySubCategory = async (req, res, next) => {
  try {
    const { subCategory } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = {
      category: "Courses",
      subCategory,
    };

    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate("user", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPosts: total,
    });
  } catch (error) {
    next(error);
  }
};

// Get all Research posts grouped by subCategory: Groups all research posts by their subCategory.
exports.getAllResearchPostsGroupedBySubCategory = async (req, res, next) => {
  try {
    const posts = await Post.find({ category: "Research" })
      .populate("user", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 });

    // Group posts by subCategory
    const groupedPosts = posts.reduce((acc, post) => {
      const subCategory = post.subCategory || "Uncategorized";
      if (!acc[subCategory]) {
        acc[subCategory] = [];
      }
      acc[subCategory].push(post);
      return acc;
    }, {});

    console.log(`Found ${posts.length} research posts in total`);
    res.json(groupedPosts);
  } catch (error) {
    console.error("Error in getResearchPosts:", error);
    next(error);
  }
};

// Get all Courses posts grouped by subCategory: Groups all course posts by their subCategory.
exports.getAllCoursesPostsGroupedBySubCategory = async (req, res, next) => {
  try {
    const posts = await Post.find({ category: "Courses" })
      .populate("user", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 });

    // Group posts by subCategory
    const groupedPosts = posts.reduce((acc, post) => {
      const subCategory = post.subCategory || "Uncategorized";
      if (!acc[subCategory]) {
        acc[subCategory] = [];
      }
      acc[subCategory].push(post);
      return acc;
    }, {});

    console.log(`Found ${posts.length} courses posts in total`);
    res.json(groupedPosts);
  } catch (error) {
    console.error("Error in getCoursesPosts:", error);
    next(error);
  }
};
