const express = require("express");
const {
  getUserFavorites,
  addProductToFavorites,
  addServiceToFavorites,
  removeProductFromFavorites,
  removeServiceFromFavorites,
  removeFavoriteById,
  checkIfInFavorites,
  clearAllFavorites
} = require("../controllers/favorite.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's favorites
router.get("/", getUserFavorites);

// Add product to favorites
router.post("/products", addProductToFavorites);

// Add service to favorites
router.post("/services", addServiceToFavorites);

// Remove product from favorites
router.delete("/products/:productId", removeProductFromFavorites);

// Remove service from favorites
router.delete("/services/:serviceId", removeServiceFromFavorites);

// Remove favorite by ID
router.delete("/:favoriteId", removeFavoriteById);

// Check if item is in favorites
router.get("/check", checkIfInFavorites);

// Clear all favorites
router.delete("/", clearAllFavorites);

module.exports = router;
