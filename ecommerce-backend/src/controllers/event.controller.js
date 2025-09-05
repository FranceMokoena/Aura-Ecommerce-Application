const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Create event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      images,
      ticketPricing,
      capacity,
      category,
      ageRestriction,
      tags,
      organizerInfo,
      refundPolicy,
      terms
    } = req.body;

    const event = new Event({
      clubOwnerId: req.user._id,
      title,
      description,
      date: new Date(date),
      time,
      location,
      images: images || [],
      ticketPricing,
      capacity,
      category,
      ageRestriction: ageRestriction || 'all_ages',
      tags: tags || [],
      organizerInfo,
      refundPolicy,
      terms
    });

    await event.save();

    // Update user role to club_owner if not already
    if (req.user.role !== 'club_owner') {
      await User.findByIdAndUpdate(req.user._id, { role: 'club_owner' });
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get club owner's events
const getMyEvents = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { clubOwnerId: req.user._id };

    if (status) query.status = status;

    const events = await Event.find(query)
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clubOwnerId', 'name email phone');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      images,
      ticketPricing,
      capacity,
      category,
      ageRestriction,
      status,
      tags,
      organizerInfo,
      refundPolicy,
      terms
    } = req.body;

    const event = await Event.findOne({ 
      _id: req.params.id, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (time) event.time = time;
    if (location) event.location = location;
    if (images) event.images = images;
    if (ticketPricing) event.ticketPricing = ticketPricing;
    if (capacity) event.capacity = capacity;
    if (category) event.category = category;
    if (ageRestriction) event.ageRestriction = ageRestriction;
    if (status) event.status = status;
    if (tags) event.tags = tags;
    if (organizerInfo) event.organizerInfo = organizerInfo;
    if (refundPolicy) event.refundPolicy = refundPolicy;
    if (terms) event.terms = terms;

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all events (for customers)
const getAllEvents = async (req, res) => {
  try {
    const { category, search, location, date, featured, latitude, longitude, radius = 25 } = req.query;
    let query = { status: { $in: ['upcoming', 'active'] } };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: searchDate,
        $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }
    if (featured === 'true') query.featured = true;

    let events = await Event.find(query)
      .populate('clubOwnerId', 'name')
      .sort({ date: 1 });

    // If location coordinates provided, calculate distances and sort by proximity
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      // Calculate distance for each event and filter by radius
      const eventsWithDistance = events.map(event => {
        let distance = Infinity;
        
        // Get coordinates from event's location (already in GeoJSON format)
        if (event.location && event.location.coordinates) {
          const [eventLng, eventLat] = event.location.coordinates;
          distance = calculateDistance(userLat, userLng, eventLat, eventLng);
        }
        
        return {
          ...event.toObject(),
          distance: distance,
          isNearby: distance <= maxRadius
        };
      });

      // Filter by radius and sort by distance
      events = eventsWithDistance
        .filter(event => event.isNearby)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${events.length} events within ${maxRadius}km radius`);
    }

    res.json(events);
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

// Get event analytics
const getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findOne({ 
      _id: eventId, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments({ eventId });
    const soldTickets = await Ticket.countDocuments({ 
      eventId, 
      status: { $in: ['paid', 'confirmed'] } 
    });
    const reservedTickets = await Ticket.countDocuments({ 
      eventId, 
      status: 'reserved' 
    });

    // Calculate revenue
    const tickets = await Ticket.find({ 
      eventId, 
      status: { $in: ['paid', 'confirmed'] } 
    });
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    const analytics = {
      eventId: event._id,
      eventTitle: event.title,
      totalCapacity: event.capacity.maxTickets,
      availableTickets: event.capacity.availableTickets,
      totalTickets,
      soldTickets,
      reservedTickets,
      totalRevenue,
      soldOut: event.capacity.availableTickets === 0,
      eventDate: event.date,
      status: event.status
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event attendees
const getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findOne({ 
      _id: eventId, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const tickets = await Ticket.find({ 
      eventId, 
      status: { $in: ['paid', 'confirmed'] } 
    }).populate('customerId', 'name email phone');

    const attendees = tickets.map(ticket => ({
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.attendeeInfo.name,
      customerEmail: ticket.attendeeInfo.email,
      customerPhone: ticket.attendeeInfo.phone,
      ticketType: ticket.ticketType,
      price: ticket.price,
      purchaseDate: ticket.purchaseDate,
      status: ticket.status
    }));

    res.json(attendees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel event
const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = 'cancelled';
    await event.save();

    // TODO: Handle refunds for sold tickets
    // TODO: Send notifications to attendees

    res.json({ message: "Event cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event has sold tickets
    const soldTickets = await Ticket.countDocuments({ 
      eventId: event._id, 
      status: { $in: ['paid', 'confirmed'] } 
    });

    if (soldTickets > 0) {
      return res.status(400).json({ 
        message: "Cannot delete event with sold tickets. Cancel the event instead." 
      });
    }

    await Event.findByIdAndDelete(event._id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getMyEvents,
  getEvent,
  updateEvent,
  getAllEvents,
  getEventAnalytics,
  getEventAttendees,
  cancelEvent,
  deleteEvent
};
