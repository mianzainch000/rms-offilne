const User = require("../models/userModel");

const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id || req.user.id);

      if (!user) {
        return res
          .status(401)
          .json({ logout: true, message: "User not found." });
      }

      if (user.status === "inactive") {
        return res
          .status(403)
          .json({ logout: true, message: "Account inactive." });
      }

      if (req.user.role !== user.role) {
        return res
          .status(403)
          .json({ logout: true, message: "Role updated. Please login again." });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ logout: true, message: "Access denied." });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error." });
    }
  };
};

module.exports = authorize;
