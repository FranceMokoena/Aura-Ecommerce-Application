const express = require("express");
const { 
  getUserPreferences, 
  updateUserPreferences, 
  resetUserPreferences, 
  getPreferenceOptions,
  updatePrivacySettings,
  updateSecuritySettings,
  exportUserData,
  requestAccountDeletion
} = require("../controllers/preferences.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user preferences
router.get("/", getUserPreferences);

// Update user preferences
router.put("/", updateUserPreferences);

// Reset user preferences to default
router.delete("/", resetUserPreferences);

// Get available options for preferences
router.get("/options", getPreferenceOptions);

// Privacy & Security specific routes
router.put("/privacy", updatePrivacySettings);
router.put("/security", updateSecuritySettings);
router.post("/export-data", exportUserData);
router.post("/delete-account", requestAccountDeletion);

module.exports = router;
