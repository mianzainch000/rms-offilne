require("dotenv").config();
const User = require("../models/userModel");
const Settings = require("../models/settingsModel");
const { check, validationResult } = require("express-validator");
const {
  verifyToken,
  generateToken,
  comparePassword,
  generateHashPassword,
} = require("../helper/authFunction");
const { clearRateLimit } = require("../middleware/rateLimiter");
const { sendPasswordResetEmail, isEmailConfigured } = require("../helper/mailer");

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      return res.status(403).json({
        message:
          "Public signup is closed. Please ask your admin to create your account from Staff & Users.",
      });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await generateHashPassword(password);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    let result = await user.save();
    result = result.toObject();
    delete result.password;

    res.status(201).json({ message: "Account created as admin", user: result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.getSignupStatus = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    return res.status(200).json({ open: userCount === 0 });
  } catch (error) {
    return res.status(500).json({ open: false });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ message: "No account found with this email." });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact Admin." });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    clearRateLimit(req);

    const userResponse = user.toObject();
    delete userResponse.password;

    const token = generateToken(
      { _id: userResponse._id, role: userResponse.role },
      process.env.SECRET_KEY,
      process.env.JWT_EXPIRATION || "1d",
    );

    return res
      .status(200)
      .json({ message: "Login successful", user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    const tokenEmail = generateToken(
      { email: user.email },
      process.env.SECRET_KEY,
      process.env.JWT_EXPIRATION_EMAIL || "15m",
    );

    if (!isEmailConfigured()) {
      return res.status(503).json({
        message:
          "Email service is not configured. Please ask your admin to set it up, or reset your password from the Staff & Users panel.",
      });
    }

    const appUrl = process.env.APP_URL || "https://localhost:9000";
    const resetLink = `${appUrl}/resetpassword?token=${encodeURIComponent(tokenEmail)}`;

    let restaurantName = "";
    try {
      const settings = await Settings.findOne();
      restaurantName = settings?.restaurantName || "";
    } catch (e) {
      restaurantName = "";
    }

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetLink,
        restaurantName,
      });
    } catch (emailErr) {
      return res.status(502).json({
        message:
          "Could not send reset email. Please check your internet connection and try again.",
      });
    }

    return res.status(200).json({
      message: "A password reset link has been sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { token, newPassword } = req.body;
    const decoded = verifyToken(token, process.env.SECRET_KEY);
    const { email } = decoded;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await generateHashPassword(newPassword);
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired reset link" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    const owner = await User.findOne().sort({ createdAt: 1 }).select("_id");

    const usersWithOwnerFlag = users.map((u) => {
      const obj = u.toObject();
      obj.isOwner = owner ? String(owner._id) === String(u._id) : false;
      return obj;
    });

    return res.status(200).json(usersWithOwnerFlag);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select(
      "-password",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ logout: true, message: "Account inactive." });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });

    const hashedPassword = await generateHashPassword(password);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });
    let result = await user.save();
    result = result.toObject();
    delete result.password;

    res.status(201).json({ message: "Staff added successfully", user: result });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, password } = req.body;

    const update = { name, email: email?.toLowerCase(), role, status };
    if (password) {
      update.password = await generateHashPassword(password);
    }

    const updatedUser = await User.findByIdAndUpdate(id, update, {
      new: true,
    }).select("-password");
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res
      .status(200)
      .json({ message: "Staff updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await User.findOne().sort({ createdAt: 1 }).select("_id");
    if (owner && String(owner._id) === String(id)) {
      return res
        .status(403)
        .json({ message: "The main owner account cannot be deleted." });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Staff removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.validate = (method) => {
  switch (method) {
    case "signup":
      return [
        check("name").notEmpty().withMessage("Full name is required"),
        check("email").isEmail().withMessage("A valid email is required"),
        check("password")
          .isLength({ min: 4 })
          .withMessage("Password must be at least 4 characters"),
      ];
    case "login":
      return [
        check("email").isEmail().withMessage("A valid email is required"),
        check("password").notEmpty().withMessage("Password is required"),
      ];
    case "forgotPassword":
      return [
        check("email").isEmail().withMessage("A valid email is required"),
      ];
    case "resetPassword":
      return [
        check("newPassword")
          .isLength({ min: 4 })
          .withMessage("Password must be at least 4 characters"),
        check("token").notEmpty().withMessage("Reset token is required"),
      ];
    default:
      return [];
  }
};