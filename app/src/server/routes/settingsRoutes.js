const express = require("express");
const router = express.Router();
const {
  getSettings,
  getPublicSettings,
  updateSettings,
  restoreFromCloud,
  bootstrapRestoreFromCloud,
  getBackupStatus,
} = require("../controllers/settingsController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/publicSettings", getPublicSettings);
router.get("/getSettings", authenticate, authorize([]), getSettings);
router.put(
  "/updateSettings",
  authenticate,
  authorize(["admin"]),
  updateSettings,
);
router.get(
  "/backupStatus",
  authenticate,
  authorize(["admin"]),
  getBackupStatus,
);
router.post(
  "/restoreFromCloud",
  authenticate,
  authorize(["admin"]),
  restoreFromCloud,
);

router.post("/bootstrapRestoreFromCloud", bootstrapRestoreFromCloud);

module.exports = router;
