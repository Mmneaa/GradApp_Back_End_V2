// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: String,
    category: {
      type: String,
      enum: ["Community", "Research", "Courses"],
      required: true,
    },
    subCategory: String,
    image: String,
    url: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
