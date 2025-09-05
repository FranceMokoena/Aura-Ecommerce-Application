const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

// Purchase ticket (customer)
const purchaseTicket = async (req, res) => {
  try {
    const { eventId, quantity, attendeeInfo, paymentMethod } = req.body;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== 'upcoming' && event.status !== 'active') {
      return res.status(400).json({ message: "Event is not available for ticket purchase" });
    }

    if (event.capacity.availableTickets < quantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    // Calculate total price
    const ticketPrice = event.currentPrice || event.ticketPricing.regularPrice;
    const totalAmount = ticketPrice * quantity;

    // Create order
    const order = new Order({
      customerId: req.user._id,
      sellerId: event.clubOwnerId,
      orderType: 'ticket',
      tickets: [{
        eventId: event._id,
        quantity,
        price: ticketPrice
      }],
      totalAmount,
      attendeeInfo,
      status: 'pending'
    });

    await order.save();

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = new Ticket({
        eventId: event._id,
        customerId: req.user._id,
        orderId: order._id,
        price: ticketPrice,
        attendeeInfo: {
          name: attendeeInfo.name,
          email: attendeeInfo.email,
          phone: attendeeInfo.phone || ''
        },
        status: 'reserved'
      });
      tickets.push(ticket);
    }

    await Ticket.insertMany(tickets);

    // Update event capacity
    event.capacity.availableTickets -= quantity;
    event.capacity.reservedTickets += quantity;
    await event.save();

    res.status(201).json({
      orderId: order._id,
      tickets: tickets.map(t => ({
        id: t._id,
        ticketNumber: t.ticketNumber,
        price: t.price
      })),
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Confirm ticket purchase (after payment)
const confirmTicketPurchase = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      customerId: req.user._id,
      orderType: 'ticket'
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: "Order is not pending" });
    }

    // Update order status
    order.status = 'paid';
    order.paymentId = paymentId;
    await order.save();

    // Update tickets status
    await Ticket.updateMany(
      { orderId: order._id },
      { status: 'confirmed' }
    );

    // Update event capacity
    const event = await Event.findById(order.tickets[0].eventId);
    if (event) {
      event.capacity.reservedTickets -= order.tickets[0].quantity;
      await event.save();
    }

    res.json({ message: "Ticket purchase confirmed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get customer's tickets
const getMyTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { customerId: req.user._id };

    if (status) query.status = status;

    const tickets = await Ticket.find(query)
      .populate('eventId', 'title date time location')
      .sort({ purchaseDate: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single ticket
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title date time location organizerInfo')
      .populate('customerId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user owns this ticket or is the event organizer
    if (ticket.customerId._id.toString() !== req.user._id.toString()) {
      const event = await Event.findById(ticket.eventId._id);
      if (!event || event.clubOwnerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Validate ticket (for event entry)
const validateTicket = async (req, res) => {
  try {
    const { ticketNumber, qrCode } = req.body;

    let query = {};
    if (ticketNumber) query.ticketNumber = ticketNumber;
    if (qrCode) query.qrCode = qrCode;

    const ticket = await Ticket.findOne(query)
      .populate('eventId', 'title date time location');

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== 'confirmed') {
      return res.status(400).json({ message: "Ticket is not valid for entry" });
    }

    if (ticket.usedAt) {
      return res.status(400).json({ message: "Ticket has already been used" });
    }

    // Mark ticket as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user.name;
    await ticket.save();

    res.json({
      message: "Ticket validated successfully",
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.eventId.title,
        attendeeName: ticket.attendeeInfo.name,
        validatedAt: ticket.usedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refund ticket
const refundTicket = async (req, res) => {
  try {
    const { ticketId, reason } = req.body;

    const ticket = await Ticket.findById(ticketId)
      .populate('eventId', 'date refundPolicy');

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user owns this ticket
    if (ticket.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (ticket.status !== 'confirmed') {
      return res.status(400).json({ message: "Ticket cannot be refunded" });
    }

    if (ticket.usedAt) {
      return res.status(400).json({ message: "Used tickets cannot be refunded" });
    }

    // Check if event has passed
    if (new Date() > ticket.eventId.date) {
      return res.status(400).json({ message: "Cannot refund tickets for past events" });
    }

    // Check refund policy (24 hours before event)
    const eventDate = new Date(ticket.eventId.date);
    const refundDeadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    
    if (new Date() > refundDeadline) {
      return res.status(400).json({ message: "Refund deadline has passed" });
    }

    // Process refund
    ticket.status = 'refunded';
    ticket.refundReason = reason;
    ticket.refundDate = new Date();
    await ticket.save();

    // TODO: Process actual payment refund
    // TODO: Update event capacity
    // TODO: Send notification to event organizer

    res.json({ message: "Ticket refunded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ticket statistics (for event organizers)
const getTicketStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify user is the event organizer
    const event = await Event.findOne({ 
      _id: eventId, 
      clubOwnerId: req.user._id 
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const stats = await Ticket.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const totalTickets = await Ticket.countDocuments({ eventId: event._id });
    const confirmedTickets = await Ticket.countDocuments({ 
      eventId: event._id, 
      status: 'confirmed' 
    });
    const usedTickets = await Ticket.countDocuments({ 
      eventId: event._id, 
      status: 'used' 
    });

    const totalRevenue = await Ticket.aggregate([
      { $match: { eventId: event._id, status: { $in: ['confirmed', 'used'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      totalTickets,
      confirmedTickets,
      usedTickets,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  purchaseTicket,
  confirmTicketPurchase,
  getMyTickets,
  getTicket,
  validateTicket,
  refundTicket,
  getTicketStats
};
