const Service = require('../models/Service');
const User = require('../models/User');

// Get all services with optional filters
const getServices = async (req, res) => {
  try {
    const { category, search, minRate, maxRate, location, availability, latitude, longitude, radius = 25 } = req.query;
    
    let query = {};
    
    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minRate || maxRate) {
      query.rate = {};
      if (minRate) query.rate.$gte = parseFloat(minRate);
      if (maxRate) query.rate.$lte = parseFloat(maxRate);
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (availability !== undefined) {
      query.availability = availability === 'true';
    }
    
    let services = await Service.find(query)
      .populate('provider', 'name location')
      .sort({ createdAt: -1 });
    
    // If location coordinates provided, calculate distances and sort by proximity
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      // Calculate distance for each service and filter by radius
      const servicesWithDistance = services.map(service => {
        let distance = Infinity;
        
        // Try to get coordinates from provider's location
        if (service.provider && service.provider.location && service.provider.location.coordinates) {
          const [providerLng, providerLat] = service.provider.location.coordinates;
          distance = calculateDistance(userLat, userLng, providerLat, providerLng);
        }
        
        return {
          ...service.toObject(),
          distance: distance,
          isNearby: distance <= maxRadius
        };
      });

      // Filter by radius and sort by distance
      services = servicesWithDistance
        .filter(service => service.isNearby)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${services.length} services within ${maxRadius}km radius`);
    }
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
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

// Get a single service by ID
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name')
      .populate('ratings.customerId', 'name');
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Error fetching service' });
  }
};

// Create a new service
const createService = async (req, res) => {
  try {
    const { title, description, category, rate, rateType, location, skills, availability, images, requiresUpfrontPayment, upfrontPaymentAmount } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !rate || !rateType || !location || !skills) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate upfront payment fields
    if (requiresUpfrontPayment && (!upfrontPaymentAmount || upfrontPaymentAmount <= 0)) {
      return res.status(400).json({ message: 'Upfront payment amount must be greater than 0 when upfront payment is required' });
    }
    
    const service = new Service({
      title,
      description,
      category,
      rate,
      rateType,
      location,
      skills,
      availability: availability !== undefined ? availability : true,
      images: images || [],
      provider: req.user.id,
      requiresUpfrontPayment: requiresUpfrontPayment || false,
      upfrontPaymentAmount: requiresUpfrontPayment ? upfrontPaymentAmount : 0
    });
    
    const savedService = await service.save();
    const populatedService = await Service.findById(savedService._id)
      .populate('provider', 'name');
    
    res.status(201).json(populatedService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error creating service' });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }
    
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('provider', 'name');
    
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error updating service' });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }
    
    await Service.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
};

// Get services by provider
const getProviderServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.providerId })
      .populate('provider', 'name')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ message: 'Error fetching provider services' });
  }
};

// Toggle service availability
const toggleServiceAvailability = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }
    
    service.availability = !service.availability;
    const updatedService = await service.save();
    
    const populatedService = await Service.findById(updatedService._id)
      .populate('provider', 'name');
    
    res.json(populatedService);
  } catch (error) {
    console.error('Error toggling service availability:', error);
    res.status(500).json({ message: 'Error toggling service availability' });
  }
};

// Add rating to a service
const addServiceRating = async (req, res) => {
  try {
    const { stars, review } = req.body;
    
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5 stars) is required' });
    }
    
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user has already rated this service
    const existingRating = service.ratings.find(
      rating => rating.customerId.toString() === req.user.id
    );
    
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this service' });
    }
    
    // Add new rating
    service.ratings.push({
      customerId: req.user.id,
      stars,
      review: review || ''
    });
    
    await service.save();
    
    const updatedService = await Service.findById(service._id)
      .populate('provider', 'name')
      .populate('ratings.customerId', 'name');
    
    res.json(updatedService);
  } catch (error) {
    console.error('Error adding service rating:', error);
    res.status(500).json({ message: 'Error adding service rating' });
  }
};

// Get seeker analytics
const getSeekerAnalytics = async (req, res) => {
  try {
    const seekerId = req.user._id;
    
    // Get all services by this seeker
    const services = await Service.find({ provider: seekerId });
    const serviceIds = services.map(service => service._id);
    
    // Get all bookings for this seeker's services
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ seekerId })
      .populate('customerId', 'name email')
      .populate('serviceId', 'title rate');
    
    // Calculate analytics
    const totalServices = services.length;
    const activeServices = services.filter(service => service.availability).length;
    const totalBookings = bookings.length;
    
    // Booking status breakdown
    const completedBookings = bookings.filter(booking => booking.status === 'completed').length;
    const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
    const inProgressBookings = bookings.filter(booking => booking.status === 'in-progress').length;
    const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled').length;
    
    // Financial analytics
    const totalEarnings = bookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const pendingEarnings = bookings
      .filter(booking => ['pending', 'confirmed', 'in-progress'].includes(booking.status))
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const averageBookingValue = totalBookings > 0 ? totalEarnings / completedBookings : 0;
    
    // Calculate completion rate
    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
    
    // Recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBookings = bookings.filter(booking => 
      new Date(booking.createdAt) > thirtyDaysAgo
    ).length;
    
    // Rating analytics
    const servicesWithRatings = services.filter(service => service.ratings && service.ratings.length > 0);
    const totalRatings = servicesWithRatings.reduce((sum, service) => sum + service.ratings.length, 0);
    
    let averageRating = 0;
    if (totalRatings > 0) {
      const totalStars = servicesWithRatings.reduce((sum, service) => {
        return sum + service.ratings.reduce((serviceSum, rating) => serviceSum + rating.stars, 0);
      }, 0);
      averageRating = Number((totalStars / totalRatings).toFixed(1));
    }
    
    // Recent ratings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRatings = servicesWithRatings.flatMap(service => 
      service.ratings.filter(rating => new Date(rating.createdAt) > sevenDaysAgo)
    ).length;
    
    // Top performing service
    let topService = null;
    if (services.length > 0) {
      const serviceBookingCounts = services.map(service => ({
        service,
        bookingCount: bookings.filter(booking => 
          booking.serviceId && booking.serviceId._id.toString() === service._id.toString()
        ).length
      }));
      
      const topPerformer = serviceBookingCounts.reduce((prev, current) => 
        current.bookingCount > prev.bookingCount ? current : prev
      );
      
      if (topPerformer.bookingCount > 0) {
        topService = {
          id: topPerformer.service._id,
          title: topPerformer.service.title,
          bookingCount: topPerformer.bookingCount,
          earnings: bookings
            .filter(booking => 
              booking.serviceId && 
              booking.serviceId._id.toString() === topPerformer.service._id.toString() &&
              booking.status === 'completed'
            )
            .reduce((sum, booking) => sum + booking.totalAmount, 0)
        };
      }
    }
    
    const analytics = {
      // Service stats
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      
      // Booking stats
      totalBookings,
      completedBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      cancelledBookings,
      recentBookings,
      
      // Financial stats
      totalEarnings,
      pendingEarnings,
      averageBookingValue: Number(averageBookingValue.toFixed(2)),
      
      // Performance stats
      completionRate,
      averageRating,
      totalRatings,
      recentRatings,
      
      // Top performer
      topService,
      
      // Additional metrics
      conversionRate: totalServices > 0 ? Math.round((totalBookings / totalServices) * 100) / 100 : 0,
      repeatCustomerRate: 0, // TODO: Calculate based on customer booking frequency
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching seeker analytics:', error);
    res.status(500).json({ message: 'Error fetching seeker analytics' });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getProviderServices,
  toggleServiceAvailability,
  addServiceRating,
  getSeekerAnalytics
};
