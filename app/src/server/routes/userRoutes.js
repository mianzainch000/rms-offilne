const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { loginRateLimiter } = require("../middleware/rateLimiter");

router.get("/signupStatus", userController.getSignupStatus);
router.post(
  "/signup",
  userController.validate("signup"),
  userController.signup,
);
router.post(
  "/login",
  loginRateLimiter,
  userController.validate("login"),
  userController.login,
);
router.post(
  "/forgotPassword",
  loginRateLimiter,
  userController.validate("forgotPassword"),
  userController.forgotPassword,
);
router.post(
  "/resetPassword",
  userController.validate("resetPassword"),
  userController.resetPassword,
);

router.get("/me", authenticate, userController.getMe);
router.get(
  "/allUsers",
  authenticate,
  authorize(["admin", "manager"]),
  userController.getAllUsers,
);
router.post(
  "/addUser",
  authenticate,
  authorize(["admin"]),
  userController.addUser,
);
router.put(
  "/updateUser/:id",
  authenticate,
  authorize(["admin"]),
  userController.updateUser,
);
router.delete(
  "/deleteUser/:id",
  authenticate,
  authorize(["admin"]),
  userController.deleteUser,
);

module.exports = router;
