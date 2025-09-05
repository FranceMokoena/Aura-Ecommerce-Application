const Shop = require("../models/Shop");
const ShopProduct = require("../models/ShopProduct");
const User = require("../models/User");

// Create shop profile
const createShop = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      images,
      contactInfo,
      businessHours,
      deliveryOptions,
      deliveryFee,
      deliveryRadius,
      category
    } = req.body;

    // Check if user already has a shop
    const existingShop = await Shop.findOne({ ownerId: req.user._id });
    if (existingShop) {
      return res.status(400).json({ message: "You already have a shop profile" });
    }

    // Prepare location data with GeoJSON format
    const locationData = {
      type: 'Point',
      coordinates: location.coordinates || [0, 0], // Default coordinates if not provided
      address: location.address,
      city: location.city,
      country: location.country
    };

    const shop = new Shop({
      ownerId: req.user._id,
      name,
      description,
      location: locationData,
      images: images || [],
      contactInfo,
      businessHours,
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      deliveryRadius: deliveryRadius || 10,
      category
    });

    await shop.save();

    // Update user role to shop_owner if not already
    if (req.user.role !== 'shop_owner') {
      await User.findByIdAndUpdate(req.user._id, { role: 'shop_owner' });
    }

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get shop owner's shop profile
const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id })
      .populate('ownerId', 'name email phone');

    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update shop profile
const updateShop = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      images,
      contactInfo,
      businessHours,
      deliveryOptions,
      deliveryFee,
      deliveryRadius,
      category,
      status
    } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Update fields
    if (name) shop.name = name;
    if (description) shop.description = description;
    if (location) shop.location = location;
    if (images) shop.images = images;
    if (contactInfo) shop.contactInfo = contactInfo;
    if (businessHours) shop.businessHours = businessHours;
    if (deliveryOptions) shop.deliveryOptions = deliveryOptions;
    if (deliveryFee !== undefined) shop.deliveryFee = deliveryFee;
    if (deliveryRadius !== undefined) shop.deliveryRadius = deliveryRadius;
    if (category) shop.category = category;
    if (status) shop.status = status;

    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all shops (for customers)
const getAllShops = async (req, res) => {
  try {
    const { category, search, location, featured, ownerId, latitude, longitude, radius = 25 } = req.query;
    let query = { status: 'active' };

    if (category) query.category = category;
    if (ownerId) query.ownerId = ownerId; // Add ownerId filter for tracking purposes
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    if (featured === 'true') query.featured = true;

    let shops = await Shop.find(query)
      .populate('ownerId', 'name')
      .sort({ featured: -1, createdAt: -1 });

    // If location coordinates provided, calculate distances and sort by proximity
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      // Calculate distance for each shop and filter by radius
      const shopsWithDistance = shops.map(shop => {
        let distance = Infinity;
        
        // Get coordinates from shop's location (already in GeoJSON format)
        if (shop.location && shop.location.coordinates) {
          const [shopLng, shopLat] = shop.location.coordinates;
          distance = calculateDistance(userLat, userLng, shopLat, shopLng);
        }
        
        return {
          ...shop.toObject(),
          distance: distance,
          isNearby: distance <= maxRadius
        };
      });

      // Filter by radius and sort by distance
      shops = shopsWithDistance
        .filter(shop => shop.isNearby)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${shops.length} shops within ${maxRadius}km radius`);
    }

    res.json(shops);
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

// Get single shop by ID
const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('ownerId', 'name email phone');

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get shop analytics
const getShopAnalytics = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Get product count
    const productCount = await ShopProduct.countDocuments({ shopId: shop._id });
    
    // Get active products
    const activeProducts = await ShopProduct.countDocuments({ 
      shopId: shop._id, 
      status: 'active' 
    });

    // Get low stock products
    const lowStockProducts = await ShopProduct.countDocuments({
      shopId: shop._id,
      quantity: { $lte: 5 }
    });

    // Get total revenue (you'll need to implement this with orders)
    const totalRevenue = 0; // TODO: Calculate from orders

    const analytics = {
      shopId: shop._id,
      totalProducts: productCount,
      activeProducts,
      lowStockProducts,
      totalRevenue,
      rating: shop.rating,
      featured: shop.featured,
      status: shop.status
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update shop rating
const updateShopRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const shopId = req.params.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Update rating (simplified - you might want to store individual ratings)
    const newAverage = (shop.rating.average + rating) / 2;
    const newCount = shop.rating.count + 1;

    shop.rating = {
      average: Math.round(newAverage * 10) / 10,
      count: newCount
    };

    await shop.save();
    res.json(shop.rating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete shop (soft delete)
const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Soft delete by setting status to inactive
    shop.status = 'inactive';
    await shop.save();

    res.json({ message: "Shop deactivated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createShop,
  getMyShop,
  updateShop,
  getAllShops,
  getShop,
  getShopAnalytics,
  updateShopRating,
  deleteShop
};
