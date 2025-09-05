const express = require("express");
const { 
  getAllProducts, 
  getSellerProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  addProductRating 
} = require("../controllers/product.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public routes (for customers)
router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.post("/:id/rating", authMiddleware, addProductRating);

// Protected routes (for sellers)
router.get("/seller/products", authMiddleware, getSellerProducts);
router.post("/", authMiddleware, createProduct);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
