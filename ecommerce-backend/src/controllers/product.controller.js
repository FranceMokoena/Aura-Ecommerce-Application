const Product = require("../models/Product");
const User = require("../models/User");

// Get all products (for customers)
const getAllProducts = async (req, res) => {
  try {
    console.log('=== GET ALL PRODUCTS START ===');
    console.log('Query params:', req.query);
    
    const { category, search, minPrice, maxPrice, location, latitude, longitude, radius = 25 } = req.query;
    let query = { status: 'active' };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (location) query.location = { $regex: location, $options: 'i' };

    console.log('Product query:', query);

    let products = await Product.find(query)
      .populate('sellerId', 'name location bio businessDescription businessHours')
      .sort({ createdAt: -1 });

    console.log(`Found ${products.length} products`);
    
    // If location coordinates provided, calculate distances and sort by proximity
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      // Calculate distance for each product and filter by radius
      const productsWithDistance = products.map(product => {
        let distance = Infinity;
        
        // Try to get coordinates from seller's location
        if (product.sellerId && product.sellerId.location && product.sellerId.location.coordinates) {
          const [sellerLng, sellerLat] = product.sellerId.location.coordinates;
          distance = calculateDistance(userLat, userLng, sellerLat, sellerLng);
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

      console.log(`Found ${products.length} products within ${maxRadius}km radius`);
    }
    
    // Log seller location data for debugging
    products.forEach((product, index) => {
      if (index < 3) { // Log first 3 products for debugging
        console.log(`Product ${index + 1}:`, {
          name: product.name,
          location: product.location,
          sellerId: product.sellerId?._id,
          sellerName: product.sellerId?.name,
          sellerLocation: product.sellerId?.location,
          distance: product.distance ? `${product.distance.toFixed(1)}km` : 'Unknown'
        });
      }
    });
    
    console.log('=== GET ALL PRODUCTS END ===');
    res.json(products);
  } catch (error) {
    console.error('Error getting all products:', error);
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

// Get seller's products
const getSellerProducts = async (req, res) => {
  try {
    console.log('🔄 Fetching seller products for:', req.user._id);
    
    const products = await Product.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log(`📦 Found ${products.length} products for seller`);
    
    // Convert to objects and include virtual fields
    const productsWithRatings = products.map(product => {
      const productObj = product.toObject({ virtuals: true }); // Include virtual fields
      
      // Log rating info for debugging
      if (productObj.ratings && productObj.ratings.length > 0) {
        console.log(`⭐ Product "${productObj.name}" - Average: ${productObj.averageRating}, Reviews: ${productObj.reviewCount}`);
      } else {
        console.log(`📦 Product "${productObj.name}" - No ratings yet`);
      }
      
      return productObj;
    });
    
    console.log(`✅ Processed ${productsWithRatings.length} products with rating data`);
    
    // Log summary of products with ratings
    const productsWithActualRatings = productsWithRatings.filter(p => p.averageRating > 0);
    console.log(`📊 Products with ratings: ${productsWithActualRatings.length}/${productsWithRatings.length}`);
    
    res.json(productsWithRatings);
  } catch (error) {
    console.error('❌ Error fetching seller products:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name location');
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product (seller only)
const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT START ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    
    const { 
      name, 
      description, 
      price, 
      quantity, 
      category, 
      images, 
      location,
      deliveryOptions,
      deliveryFee,
      stockStatus,
      useProfileLocation
    } = req.body;

    // Get seller's profile location if requested
    let finalLocation = location || 'Not specified';
    
    if (useProfileLocation) {
      console.log('Using profile location for product');
      const seller = await User.findById(req.user._id);
      console.log('Seller found:', seller ? 'Yes' : 'No');
      console.log('Seller location:', seller?.location);
      
      if (seller && seller.location) {
        if (seller.location.city) {
          finalLocation = seller.location.country 
            ? `${seller.location.city}, ${seller.location.country}`.trim()
            : seller.location.city;
          console.log('Using seller profile location:', finalLocation);
        } else {
          console.log('Seller has location object but no city');
          finalLocation = 'Location not set in profile';
        }
      } else {
        console.log('Seller has no location set in profile');
        finalLocation = 'Location not set in profile';
      }
    }
    
    console.log('Final product location:', finalLocation);

    const product = new Product({
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
      stockStatus: stockStatus || 'in_stock'
    });

    await product.save();
    console.log('Product created successfully:', product._id);
    console.log('Product location saved as:', product.location);
    console.log('=== CREATE PRODUCT END ===');
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Update product (seller only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product (seller only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add product rating/review
const addProductRating = async (req, res) => {
  try {
    const { stars, review } = req.body;
    const product = await Product.findById(req.params.id);
    
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

    product.ratings.push({
      customerId: req.user._id,
      stars,
      review
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getSellerProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductRating
};
