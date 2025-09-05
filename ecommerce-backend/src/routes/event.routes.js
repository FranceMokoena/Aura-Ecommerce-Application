const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createEvent,
  getMyEvents,
  getEvent,
  updateEvent,
  getAllEvents,
  getEventAnalytics,
  getEventAttendees,
  cancelEvent,
  deleteEvent
} = require('../controllers/event.controller');

// Public routes (no authentication required)
router.get('/', getAllEvents);
router.get('/:id', getEvent);

// Protected routes (require authentication)
router.use(authMiddleware);

// Club owner routes
router.post('/', createEvent);
router.get('/me/events', getMyEvents);
router.put('/:id', updateEvent);
router.get('/:id/analytics', getEventAnalytics);
router.get('/:id/attendees', getEventAttendees);
router.post('/:id/cancel', cancelEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
