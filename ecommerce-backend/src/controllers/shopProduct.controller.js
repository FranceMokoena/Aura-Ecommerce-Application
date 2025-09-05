const ShopProduct = require("../models/ShopProduct");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const User = require("../models/User");

// Create shop product
const createShopProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images,
      brand,
      weight,
      dimensions,
      specifications,
      tags,
      deliveryOptions,
      deliveryFee,
      estimatedDeliveryDays,
      returnPolicy,
      warranty,
      stockAlert
    } = req.body;

    // Verify user has a shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const product = new ShopProduct({
      shopId: shop._id,
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images: images || [],
      brand,
      weight,
      dimensions,
      specifications,
      tags: tags || [],
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      estimatedDeliveryDays: estimatedDeliveryDays || 3,
      returnPolicy,
      warranty,
      stockAlert
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get shop owner's products
const getMyShopProducts = async (req, res) => {
  try {
    const { status, category, search, onSale, featured } = req.query;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    let query = { shopId: shop._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (onSale === 'true') query.onSale = true;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await ShopProduct.find(query)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single shop product
const getShopProduct = async (req, res) => {
  try {
    const product = await ShopProduct.findById(req.params.id)
      .populate('shopId', 'name location contactInfo');

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update shop product
const updateShopProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images,
      brand,
      weight,
      dimensions,
      specifications,
      tags,
      status,
      featured,
      onSale,
      salePercentage,
      deliveryOptions,
      deliveryFee,
      estimatedDeliveryDays,
      returnPolicy,
      warranty,
      stockAlert
    } = req.body;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const product = await ShopProduct.findOne({
      _id: req.params.id,
      shopId: shop._id
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (quantity !== undefined) product.quantity = quantity;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (images) product.images = images;
    if (brand) product.brand = brand;
    if (weight !== undefined) product.weight = weight;
    if (dimensions) product.dimensions = dimensions;
    if (specifications) product.specifications = specifications;
    if (tags) product.tags = tags;
    if (status) product.status = status;
    if (featured !== undefined) product.featured = featured;
    if (onSale !== undefined) product.onSale = onSale;
    if (salePercentage !== undefined) product.salePercentage = salePercentage;
    if (deliveryOptions) product.deliveryOptions = deliveryOptions;
    if (deliveryFee !== undefined) product.deliveryFee = deliveryFee;
    if (estimatedDeliveryDays !== undefined) product.estimatedDeliveryDays = estimatedDeliveryDays;
    if (returnPolicy) product.returnPolicy = returnPolicy;
    if (warranty) product.warranty = warranty;
    if (stockAlert) product.stockAlert = stockAlert;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all shop products (for customers)
const getAllShopProducts = async (req, res) => {
  try {
    const { 
      shopId, 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      onSale, 
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude,
      longitude,
      radius = 25
    } = req.query;

    let query = { status: 'active' };

    if (shopId) query.shopId = shopId;
    if (category) query.category = category;
    if (onSale === 'true') query.onSale = true;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let products = await ShopProduct.find(query)
      .populate('shopId', 'name location')
      .sort(sortOptions);

    // If location coordinates provided, calculate distances and sort by proximity
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      // Calculate distance for each product and filter by radius
      const productsWithDistance = products.map(product => {
        let distance = Infinity;
        
        // Get coordinates from shop's location
        if (product.shopId && product.shopId.location && product.shopId.location.coordinates) {
          const [shopLng, shopLat] = product.shopId.location.coordinates;
          distance = calculateDistance(userLat, userLng, shopLat, shopLng);
        }
        
        return {
          ...product.toObject(),
          distance: distance,
          isNearby: distance <= maxRadius
        };
      });

      // Filter by radius and sort by distance
      products = productsWithDistance
        .filter(product => product.isNearby)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${products.length} shop products within ${maxRadius}km radius`);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Add product rating
const addProductRating = async (req, res) => {
  try {
    const { stars, review } = req.body;
    const productId = req.params.id;

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await ShopProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already rated this product
    const existingRating = product.ratings.find(
      rating => rating.customerId.toString() === req.user._id.toString()
    );

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this product" });
    }

    // Add new rating
    product.ratings.push({
      customerId: req.user._id,
      stars,
      review,
      createdAt: new Date()
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk update products
const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const result = await ShopProduct.updateMany(
      {
        _id: { $in: productIds },
        shopId: shop._id
      },
      { $set: updates }
    );

    res.json({ 
      message: `${result.modifiedCount} products updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete shop product
const deleteShopProduct = async (req, res) => {
  try {
    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const product = await ShopProduct.findOne({
      _id: req.params.id,
      shopId: shop._id
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await ShopProduct.findByIdAndDelete(product._id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const totalProducts = await ShopProduct.countDocuments({ shopId: shop._id });
    const activeProducts = await ShopProduct.countDocuments({ 
      shopId: shop._id, 
      status: 'active' 
    });
    const onSaleProducts = await ShopProduct.countDocuments({ 
      shopId: shop._id, 
      onSale: true 
    });
    const lowStockProducts = await ShopProduct.countDocuments({
      shopId: shop._id,
      quantity: { $lte: 5 }
    });

    // Get category breakdown
    const categoryStats = await ShopProduct.aggregate([
      { $match: { shopId: shop._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    const analytics = {
      shopId: shop._id,
      totalProducts,
      activeProducts,
      onSaleProducts,
      lowStockProducts,
      categoryBreakdown: categoryStats
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: Create product in both systems
const createDualProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images,
      brand,
      weight,
      dimensions,
      specifications,
      tags,
      deliveryOptions,
      deliveryFee,
      estimatedDeliveryDays,
      returnPolicy,
      warranty,
      stockAlert,
      // NEW: Regular product fields
      location,
      useProfileLocation
    } = req.body;

    // Verify user has a shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Get seller's profile location if requested
    let finalLocation = location || 'Not specified';
    if (useProfileLocation) {
      const seller = await User.findById(req.user._id);
      if (seller && seller.location && seller.location.city) {
        finalLocation = `${seller.location.city}, ${seller.location.country || ''}`.trim();
      }
    }

    // 1. Create Shop Product (Advanced features)
    const shopProduct = new ShopProduct({
      shopId: shop._id,
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images: images || [],
      brand,
      weight,
      dimensions,
      specifications,
      tags: tags || [],
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      estimatedDeliveryDays: estimatedDeliveryDays || 3,
      returnPolicy,
      warranty,
      stockAlert
    });

    await shopProduct.save();

    // 2. Create Regular Product (Mobile app visibility)
    const regularProduct = new Product({
      sellerId: req.user._id,
      name,
      description,
      price,
      quantity,
      category,
      images: images || [],
      location: finalLocation,
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      stockStatus: 'in_stock'
    });

    await regularProduct.save();

    // 3. Link the products (optional)
    shopProduct.regularProductId = regularProduct._id;
    regularProduct.shopProductId = shopProduct._id;
    
    await shopProduct.save();
    await regularProduct.save();

    res.status(201).json({
      message: "Product created successfully in both systems",
      shopProduct,
      regularProduct
    });

  } catch (error) {
    console.error('Dual product creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createShopProduct,
  getMyShopProducts,
  getShopProduct,
  updateShopProduct,
  getAllShopProducts,
  addProductRating,
  bulkUpdateProducts,
  deleteShopProduct,
  getProductAnalytics,
  createDualProduct
};
