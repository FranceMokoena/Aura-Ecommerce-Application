const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");

// Role-based notification service for comprehensive notifications
const {
  sendCustomerBookingNotification,
  sendSeekerNewBookingNotification,
  sendSeekerBookingCancellationNotification
} = require("../services/roleBasedNotification.service");

// Get customer's bookings
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .populate('seekerId', 'name')
      .populate('serviceId', 'title rate')
      .sort({ date: -1 });
    
    // Filter out bookings with null serviceId or add placeholder data
    const validBookings = bookings.map(booking => {
      if (!booking.serviceId) {
        // If service was deleted, add placeholder data
        booking.serviceId = {
          _id: null,
          title: 'Service Unavailable',
          rate: booking.totalAmount || 0
        };
      }
      return booking;
    });
    
    res.json(validBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seeker's bookings
const getSeekerBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { seekerId: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'name')
      .populate('serviceId', 'title rate')
      .sort({ date: -1 });
    
    // Handle deleted services
    const validBookings = bookings.map(booking => {
      if (!booking.serviceId) {
        booking.serviceId = {
          _id: null,
          title: 'Service Unavailable',
          rate: booking.totalAmount || 0
        };
      }
      return booking;
    });
    
    res.json(validBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name')
      .populate('seekerId', 'name')
      .populate('serviceId', 'title rate description')
      .populate('paymentId');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized to view this booking
    if (booking.customerId._id.toString() !== req.user.id && 
        booking.seekerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create booking with payment (EXACT COPY of product payment flow)
const createBooking = async (req, res) => {
  console.log('=== BOOKING PAYMENT CONTROLLER START ===');
  console.log('createBooking called with:', JSON.stringify(req.body, null, 2));
  console.log('User object:', req.user ? JSON.stringify(req.user, null, 2) : 'No user');
  console.log('User ID:', req.user?.id);
  
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { serviceId, date, startTime, endTime, duration, location, notes, paymentMethod, paymentIntentId, serviceAddress, customerCoordinates, customerAddress } = req.body;

    // Validate service
    const service = await Service.findById(serviceId).populate('provider', 'name location');
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (!service.availability) {
      return res.status(400).json({ message: "Service is not available" });
    }
    
    console.log('=== SERVICE DEBUG ===');
    console.log('Service found:', { 
      id: service._id, 
      title: service.title, 
      provider: service.provider,
      availability: service.availability,
      requiresUpfrontPayment: service.requiresUpfrontPayment,
      upfrontPaymentAmount: service.upfrontPaymentAmount
    });
    console.log('=== SERVICE DEBUG END ===');

    // Check if seeker is available at the requested time
    const existingBooking = await Booking.findOne({
      seekerId: service.provider._id,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingBooking) {
      console.log('=== AVAILABILITY CHECK DEBUG ===');
      console.log('Requested time:', { date, startTime, endTime });
      console.log('Existing booking:', existingBooking);
      console.log('=== AVAILABILITY CHECK END ===');
      return res.status(400).json({ message: "Seeker is not available at this time" });
    }

    // Calculate total amount based on service requirements
    let totalAmount;
    if (service.requiresUpfrontPayment) {
      totalAmount = service.upfrontPaymentAmount;
    } else {
      totalAmount = service.rate * duration;
    }

    console.log('=== PAYMENT CALCULATION ===');
    console.log('Service rate:', service.rate);
    console.log('Duration:', duration);
    console.log('Requires upfront payment:', service.requiresUpfrontPayment);
    console.log('Upfront amount:', service.upfrontPaymentAmount);
    console.log('Total amount:', totalAmount);
    console.log('=== PAYMENT CALCULATION END ===');

    // Verify payment intent (if provided)
    if (paymentIntentId) {
      try {
        // Note: In a real app, you would verify with Stripe here
        console.log('Payment intent provided:', paymentIntentId);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid payment intent' });
      }
    }

    // Create payment record (EXACT COPY from product payment)
    const payment = new Payment({
      userId: req.user.id,
      amount: totalAmount,
      method: paymentMethod || 'stripe',
      status: service.requiresUpfrontPayment ? 'completed' : 'pending',
      description: `Booking payment for ${service.title}`,
      transactionId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stripePaymentIntentId: paymentIntentId
    });
    await payment.save();

    // Get customer and seeker location data (EXACT COPY from order tracking)
    const User = require('../models/User');
    const customer = await User.findById(req.user.id).select('name email phone location');
    const seeker = await User.findById(service.provider._id).select('name email phone location businessName businessDescription');

    // Create booking with enhanced location tracking (EXACT COPY from orders)
    const booking = new Booking({
      customerId: req.user.id,
      seekerId: service.provider._id,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      totalAmount,
      paymentId: payment._id,
      location,
      notes,
      status: service.requiresUpfrontPayment ? 'confirmed' : 'pending',
      requiresUpfrontPayment: service.requiresUpfrontPayment || false,
      upfrontPaymentAmount: service.requiresUpfrontPayment ? service.upfrontPaymentAmount : 0,
      // Enhanced location tracking (EXACT COPY from Order model)
      serviceAddress,
      trackingData: {
        customerCoordinates: customerCoordinates || (customer.location?.coordinates || []),
        customerAddress: customerAddress || `${customer.location?.city || ''}, ${customer.location?.country || ''}`.trim(),
        seekerCoordinates: seeker.location?.coordinates || [],
        seekerAddress: `${seeker.location?.city || ''}, ${seeker.location?.country || ''}`.trim(),
        locationAccuracy: customerCoordinates ? 'high' : 'low',
        locationSource: customerCoordinates ? 'gps' : 'profile',
        gpsEnabled: !!customerCoordinates,
        locationPermission: !!customerCoordinates,
        timestamp: new Date()
      }
    });

    console.log('Booking object created:', booking);
    
    try {
      await booking.save();
      console.log('Booking saved successfully');
      
      // Populate booking with details (EXACT COPY from order population)
      const populatedBooking = await Booking.findById(booking._id)
        .populate('customerId', 'name email phone location')
        .populate('seekerId', 'name email phone location businessName businessDescription')
        .populate('serviceId', 'title rate description requiresUpfrontPayment upfrontPaymentAmount')
        .populate('paymentId');

      console.log('Booking populated and ready to return');
      
      // 📱 SEEKER NOTIFICATION - Notify seeker about new booking
      try {
        const bookingData = {
          bookingId: populatedBooking._id.toString(),
          serviceName: populatedBooking.serviceId?.title || 'Service',
          customerName: populatedBooking.customerId?.name || 'Customer',
          scheduledDate: populatedBooking.date.toISOString().split('T')[0],
          serviceId: populatedBooking.serviceId?._id.toString()
        };
        
        await sendSeekerNewBookingNotification(
          populatedBooking.seekerId._id.toString(),
          bookingData
        );
        console.log('✅ New booking notification sent to seeker successfully');
      } catch (seekerNotificationError) {
        console.error('⚠️ Seeker notification error (non-critical):', seekerNotificationError);
        // Don't fail the main booking creation if notification fails
      }

      // 📱 CUSTOMER NOTIFICATION - Notify customer about booking confirmation
      try {
        const bookingData = {
          bookingId: populatedBooking._id.toString(),
          serviceName: populatedBooking.serviceId?.title || 'Service',
          serviceId: populatedBooking.serviceId?._id.toString(),
          scheduledDate: populatedBooking.date.toISOString().split('T')[0]
        };
        
        await sendCustomerBookingNotification(
          req.user.id,
          populatedBooking.status,
          bookingData
        );
        console.log('✅ Booking confirmation notification sent to customer successfully');
      } catch (customerNotificationError) {
        console.error('⚠️ Customer notification error (non-critical):', customerNotificationError);
        // Don't fail the main booking creation if notification fails
      }
      
      res.status(201).json({
        message: 'Booking created successfully',
        booking: populatedBooking,
        payment: payment
      });
    } catch (saveError) {
      console.error('Error saving booking:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('createBooking error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update booking status (seeker only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.seekerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateData = { status };
    if (cancellationReason) updateData.cancellationReason = cancellationReason;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customerId', 'name')
     .populate('serviceId', 'title rate');

    // 📱 CUSTOMER NOTIFICATION - Notify customer about booking status update
    try {
      const bookingData = {
        bookingId: updatedBooking._id.toString(),
        serviceName: updatedBooking.serviceId?.title || 'Service',
        serviceId: updatedBooking.serviceId?._id.toString(),
        scheduledDate: updatedBooking.date.toISOString().split('T')[0]
      };
      
      await sendCustomerBookingNotification(
        updatedBooking.customerId._id.toString(),
        status,
        bookingData
      );
      console.log('✅ Booking status update notification sent to customer successfully');
    } catch (customerNotificationError) {
      console.error('⚠️ Customer notification error (non-critical):', customerNotificationError);
      // Don't fail the main status update if notification fails
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel booking (customer only)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'title')
      .populate('customerId', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: "Booking cannot be cancelled" });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = 'Cancelled by customer';
    await booking.save();

          // 📱 SEEKER NOTIFICATION - Notify seeker about booking cancellation
      try {
        const bookingData = {
          bookingId: booking._id.toString(),
          serviceName: booking.serviceId?.title || 'Service',
          customerName: booking.customerId?.name || 'Customer',
          cancellationReason: 'Cancelled by customer'
        };
        
        await sendSeekerBookingCancellationNotification(
          booking.seekerId.toString(),
          bookingData
        );
        console.log('✅ Booking cancellation notification sent to seeker successfully');
      } catch (seekerNotificationError) {
        console.error('⚠️ Seeker notification error (non-critical):', seekerNotificationError);
        // Don't fail the main cancellation if notification fails
      }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete booking (seeker only) - Allow seekers to delete active bookings
const deleteBooking = async (req, res) => {
  console.log('=== DELETE BOOKING START ===');
  console.log('Delete booking called for ID:', req.params.id);
  console.log('User ID:', req.user?.id);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Full request URL:', req.originalUrl);
  
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('serviceId', 'title');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the seeker (service provider)
    if (booking.seekerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the service provider can delete this booking" });
    }

    console.log('=== BOOKING DELETE DEBUG ===');
    console.log('Booking found:', { 
      id: booking._id, 
      status: booking.status,
      customer: booking.customerId.name,
      service: booking.serviceId ? booking.serviceId.title : 'Service Unavailable'
    });
    console.log('=== BOOKING DELETE DEBUG END ===');

    // Delete the booking (this will remove it from customer's side as well)
    await Booking.findByIdAndDelete(req.params.id);

    console.log('Booking deleted successfully');
    res.json({ 
      message: "Booking deleted successfully. Customer will be notified.",
      deletedBooking: {
        id: booking._id,
        customer: booking.customerId.name,
        service: booking.serviceId ? booking.serviceId.title : 'Service Unavailable',
        date: booking.date,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('deleteBooking error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete booking permanently (customer only) - For completed bookings
const deleteBookingPermanently = async (req, res) => {
  console.log('=== PERMANENT DELETE BOOKING START ===');
  console.log('Permanent delete booking called for ID:', req.params.id);
  console.log('User ID:', req.user?.id);
  
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('serviceId', 'title');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the customer
    if (booking.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the customer can permanently delete this booking" });
    }

    // Only allow deletion of completed or cancelled bookings
    if (!['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: "Only completed or cancelled bookings can be permanently deleted" });
    }

    console.log('=== PERMANENT BOOKING DELETE DEBUG ===');
    console.log('Booking found:', { 
      id: booking._id, 
      status: booking.status,
      customer: booking.customerId.name,
      service: booking.serviceId ? booking.serviceId.title : 'Service Unavailable'
    });
    console.log('=== PERMANENT BOOKING DELETE DEBUG END ===');

    // Permanently delete the booking from database
    await Booking.findByIdAndDelete(req.params.id);

    console.log('Booking permanently deleted successfully');
    res.json({ 
      message: "Booking permanently deleted successfully. This booking will no longer appear in your history.",
      deletedBooking: {
        id: booking._id,
        service: booking.serviceId ? booking.serviceId.title : 'Service Unavailable',
        date: booking.date,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('deleteBookingPermanently error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get seeker's schedule for a specific date
const getSeekerSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const seekerId = req.params.seekerId || req.user.id;

    const bookings = await Booking.find({
      seekerId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    }).populate('customerId', 'name')
      .populate('serviceId', 'title');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCustomerBookings,
  getSeekerBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  deleteBookingPermanently,
  getSeekerSchedule
};
