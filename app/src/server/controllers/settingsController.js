const Settings = require("../models/settingsModel");
const User = require("../models/userModel");
const { getStatus } = require("../../../script/backupStatus");

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      restaurantName: settings.restaurantName,
      address: settings.address,
      phone: settings.phone,
      tagline: settings.tagline,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings" });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      restaurantName,
      address,
      phone,
      billPrefix,
      taxPercent,
      tagline,
      footerNote,
      serviceChargePercent,
      defaultDeliveryCharge,
      printerPaperSize,
    } = req.body;
    const settings = await getOrCreateSettings();

    settings.restaurantName = restaurantName ?? settings.restaurantName;
    settings.address = address ?? settings.address;
    settings.phone = phone ?? settings.phone;
    settings.billPrefix = billPrefix ?? settings.billPrefix;
    settings.taxPercent =
      taxPercent !== undefined ? Number(taxPercent) : settings.taxPercent;
    settings.tagline = tagline ?? settings.tagline;
    settings.footerNote = footerNote ?? settings.footerNote;
    settings.serviceChargePercent =
      serviceChargePercent !== undefined
        ? Number(serviceChargePercent)
        : settings.serviceChargePercent;
    settings.defaultDeliveryCharge =
      defaultDeliveryCharge !== undefined
        ? Number(defaultDeliveryCharge)
        : settings.defaultDeliveryCharge;
    settings.printerPaperSize = printerPaperSize ?? settings.printerPaperSize;

    await settings.save();
    res.status(200).json({ message: "Settings saved", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBackupStatus = async (req, res) => {
  try {
    const status = getStatus();
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: "Error fetching backup status" });
  }
};

exports.restoreFromCloud = async (req, res) => {
  try {
    const {
      runRestoreFromCloud,
    } = require("../../../script/restore-from-cloud");
    const result = await runRestoreFromCloud();

    if (result.ok) {
      return res.status(200).json({
        message: `Local database restored from Atlas backup (database: ${result.localDb}).`,
      });
    }

    const reasonMessages = {
      "not-configured": "CLOUD_BACKUP_URI is not set in .env.local.",
      "invalid-cloud-db-name":
        "Could not detect the database name from CLOUD_BACKUP_URI.",
      "tools-missing":
        "MongoDB Database Tools are not installed on this computer.",
      "restore-failed": `Restore failed: ${result.detail || "unknown error"}`,
    };
    return res.status(500).json({
      message: reasonMessages[result.reason] || "Restore failed.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while restoring from cloud." });
  }
};

exports.bootstrapRestoreFromCloud = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(403).json({
        message:
          "Users already exist on this computer — bootstrap restore is disabled for security.",
      });
    }

    const {
      runRestoreFromCloud,
    } = require("../../../script/restore-from-cloud");
    const result = await runRestoreFromCloud();

    if (result.ok) {
      return res.status(200).json({
        message: `Data restored from Atlas backup (database: ${result.localDb}). Please reload this page.`,
      });
    }

    const reasonMessages = {
      "not-configured": "CLOUD_BACKUP_URI is not set in .env.local.",
      "invalid-cloud-db-name":
        "Could not detect the database name from CLOUD_BACKUP_URI.",
      "tools-missing":
        "MongoDB Database Tools are not installed on this computer.",
      "restore-failed": `Restore failed: ${result.detail || "unknown error"}`,
    };
    return res.status(500).json({
      message: reasonMessages[result.reason] || "Restore failed.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while restoring from cloud." });
  }
};
