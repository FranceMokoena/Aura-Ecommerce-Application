const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const Service = require("../models/Service");

// Get user's favorites with populated product/service details
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({ userId })
      .populate('serviceId')
      .sort({ addedAt: -1 });

    // Handle products (both regular and shop products)
    const ShopProduct = require('../models/ShopProduct');
    const favoriteProducts = [];
    
    for (const fav of favorites) {
      if (fav.type === 'product' && fav.productId) {
        // Try to find as regular product first
        let product = await Product.findById(fav.productId);
        if (!product) {
          // Try to find as shop product
          product = await ShopProduct.findById(fav.productId);
        }
        
        if (product) {
          favoriteProducts.push({
            _id: fav._id,
            type: 'product',
            item: product,
            addedAt: fav.addedAt
          });
        }
      }
    }

    const favoriteServices = favorites
      .filter(fav => fav.type === 'service' && fav.serviceId)
      .map(fav => ({
        _id: fav._id,
        type: 'service',
        item: fav.serviceId,
        addedAt: fav.addedAt
      }));

    res.json({
      products: favoriteProducts,
      services: favoriteServices,
      totalCount: favorites.length
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add product to favorites
const addProductToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists (try regular products first, then shop products)
    let product = await Product.findById(productId);
    if (!product) {
      // Try to find as shop product
      const ShopProduct = require('../models/ShopProduct');
      product = await ShopProduct.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      userId,
      productId,
      type: 'product'
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    // Add to favorites
    const favorite = new Favorite({
      userId,
      productId,
      type: 'product'
    });

    await favorite.save();

    // Populate the product details
    await favorite.populate('productId');

    res.status(201).json({
      message: "Product added to favorites successfully",
      favorite: {
        _id: favorite._id,
        type: 'product',
        item: favorite.productId,
        addedAt: favorite.addedAt
      }
    });
  } catch (error) {
    console.error("Error adding product to favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add service to favorites
const addServiceToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      userId,
      serviceId,
      type: 'service'
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Service already in favorites" });
    }

    // Add to favorites
    const favorite = new Favorite({
      userId,
      serviceId,
      type: 'service'
    });

    await favorite.save();

    // Populate the service details
    await favorite.populate('serviceId');

    res.status(201).json({
      message: "Service added to favorites successfully",
      favorite: {
        _id: favorite._id,
        type: 'service',
        item: favorite.serviceId,
        addedAt: favorite.addedAt
      }
    });
  } catch (error) {
    console.error("Error adding service to favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove product from favorites
const removeProductFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId,
      productId,
      type: 'product'
    });

    if (!favorite) {
      return res.status(404).json({ message: "Product not found in favorites" });
    }

    res.json({ message: "Product removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing product from favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove service from favorites
const removeServiceFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId,
      serviceId,
      type: 'service'
    });

    if (!favorite) {
      return res.status(404).json({ message: "Service not found in favorites" });
    }

    res.json({ message: "Service removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing service from favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove favorite by ID
const removeFavoriteById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { favoriteId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      _id: favoriteId,
      userId
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Item removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if item is in favorites
const checkIfInFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, serviceId } = req.query;

    let favorite = null;

    if (productId) {
      favorite = await Favorite.findOne({
        userId,
        productId,
        type: 'product'
      });
    } else if (serviceId) {
      favorite = await Favorite.findOne({
        userId,
        serviceId,
        type: 'service'
      });
    }

    res.json({
      isFavorite: !!favorite,
      favoriteId: favorite ? favorite._id : null
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Clear all favorites
const clearAllFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    await Favorite.deleteMany({ userId });

    res.json({ message: "All favorites cleared successfully" });
  } catch (error) {
    console.error("Error clearing favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserFavorites,
  addProductToFavorites,
  addServiceToFavorites,
  removeProductFromFavorites,
  removeServiceFromFavorites,
  removeFavoriteById,
  checkIfInFavorites,
  clearAllFavorites
};
