// Post routes: Manages post-related operations such as creation, editing, deletion, and favorites.
const express = require("express");
const router = express.Router();
const {
  createPost,
  editPost,
  deletePost,
  getPosts,
  addToFavourites,
  removeFromFavourites,
  getPostById,
  getMyPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validateCreatePost, validatePostId } = require("../utils/validators");

// Get all posts
router.get("/", getPosts);

// Create a new post
router.post("/", protect, validateCreatePost, createPost);

// Get my posts
router.get("/my-posts", protect, getMyPosts);

// Get a single post by ID
router.get("/:id", validatePostId, getPostById);

// Edit a post
router.put(
  "/:id",
  protect,
  authorize("admin", "moderator", "user"),
  validatePostId,
  editPost
);

// Delete a post
router.delete(
  "/:id",
  protect,
  authorize("admin", "moderator", "user"),
  validatePostId,
  deletePost
);

// Add to favourites
router.post("/favourites/add", protect, addToFavourites);

// Remove from favourites
router.post("/favourites/remove", protect, removeFromFavourites);

module.exports = router;
