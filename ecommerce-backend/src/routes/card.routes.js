const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  getUserCards,
  createCard,
  updateCard,
  deleteCard,
  getCard,
  setDefaultCard
} = require('../controllers/card.controller');

// All routes require authentication
router.use(authMiddleware);

// Get all cards for a user
router.get('/user/:userId', getUserCards);

// Create a new card
router.post('/user/:userId', createCard);

// Get a specific card
router.get('/:cardId', getCard);

// Update a card
router.put('/:cardId', updateCard);

// Delete a card
router.delete('/:cardId', deleteCard);

// Set a card as default
router.patch('/:cardId/default', setDefaultCard);

module.exports = router;
