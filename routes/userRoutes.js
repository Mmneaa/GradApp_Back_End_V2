// User routes: Handles user-related operations such as profile management, role changes, and favorites.
const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  banUser,
  unbanUser,
  addToFavouriteList,
  removeFromFavouriteList,
  getFavouriteList,
  addToStaticFavouriteList,
  removeFromStaticFavouriteList,
  getStaticFavouriteList,
  addFriend,
  removeFriend,
  getFriendsList,
  addGroup,
  removeGroup,
  getGroupsList,
  changeUserRole,
  verifyEmail,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  validatePostId,
  validateFriendId,
  validateProfileUpdate,
  validatePasswordChange,
  validateChangeUserRole,
  validateVerifyEmail,
} = require("../utils/validators");

router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, validateProfileUpdate, updateUserProfile);
router.post("/verify-email", validateVerifyEmail, verifyEmail);
router.put("/change-password", protect, validatePasswordChange, changePassword);
router.put(
  "/change-role",
  protect,
  authorize("admin"),
  validateChangeUserRole,
  changeUserRole
);
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/ban/:id", protect, authorize("admin"), banUser);
router.put("/unban/:id", protect, authorize("admin"), unbanUser);

router.get("/favourites", protect, getFavouriteList);
router.post("/favourites/add", protect, validatePostId, addToFavouriteList);
router.post(
  "/favourites/remove",
  protect,
  validatePostId,
  removeFromFavouriteList
);

router.get("/static-favourites", protect, getStaticFavouriteList);
router.post("/static-favourites/add", protect, addToStaticFavouriteList);
router.post(
  "/static-favourites/remove",
  protect,
  removeFromStaticFavouriteList
);

router.get("/friends", protect, getFriendsList);
router.post("/friends/add", protect, validateFriendId, addFriend);
router.post("/friends/remove", protect, validateFriendId, removeFriend);

router.get("/groups", protect, getGroupsList);
router.post("/groups/add", protect, addGroup);
router.post("/groups/remove", protect, removeGroup);

router.get("/doctors", protect, async (req, res, next) => {
  try {
    const doctors = await require("../models/User")
      .find({ accountType: "doctor" })
      .select("username email");
    res.json(doctors);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
