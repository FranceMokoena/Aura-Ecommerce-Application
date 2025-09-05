const express = require("express");
const { 
  getCustomerBookings, 
  getSeekerBookings, 
  getBooking, 
  createBooking, 
  updateBookingStatus, 
  cancelBooking,
  deleteBooking,
  deleteBookingPermanently,
  getSeekerSchedule
} = require("../controllers/booking.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Test route to verify routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Booking routes are working!", timestamp: new Date().toISOString() });
});

// Debug route to show all registered routes
router.get("/debug-routes", (req, res) => {
  const routes = [];
  router.stack.forEach(function(r){
    if (r.route && r.route.path){
      routes.push({
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path
      });
    }
  });
  res.json({ routes, message: "All booking routes" });
});

// Customer routes
router.get("/customer", getCustomerBookings);
router.post("/", createBooking);

// Seeker routes
router.get("/seeker", getSeekerBookings);
router.get("/schedule", getSeekerSchedule);

// Specific routes (must come before general :id routes)
router.delete("/:id/permanent", deleteBookingPermanently);  // Allow customers to permanently delete completed bookings
router.patch("/:id/status", updateBookingStatus);
router.patch("/:id/cancel", cancelBooking);
router.delete("/:id", deleteBooking);  // Allow seekers to delete bookings - MOVED UP

// General routes (must come after specific routes)
router.get("/:id", getBooking);

module.exports = router;
