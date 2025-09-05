const Card = require('../models/Card');

// Get all cards for a user
const getUserCards = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify the user is requesting their own cards
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own cards.' });
    }

    const cards = await Card.find({ 
      userId: userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json(cards);
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({ message: 'Failed to fetch cards' });
  }
};

// Create a new card
const createCard = async (req, res) => {
  try {
    const { userId } = req.params;
    const cardData = req.body;

    // Verify the user is creating their own card
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only create cards for yourself.' });
    }

    // Add userId to card data
    cardData.userId = userId;

    // If this card is set as default, ensure it's the only default for its type
    if (cardData.isDefault) {
      await Card.updateMany(
        { 
          userId: userId, 
          type: cardData.type,
          isActive: true
        },
        { isDefault: false }
      );
    }

    const newCard = new Card(cardData);
    const savedCard = await newCard.save();

    res.status(201).json(savedCard);
  } catch (error) {
    console.error('Error creating card:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid card data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create card' });
  }
};

// Update a card
const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const updateData = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Verify the user owns this card
    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own cards.' });
    }

    // If this card is being set as default, ensure it's the only default for its type
    if (updateData.isDefault) {
      await Card.updateMany(
        { 
          userId: card.userId, 
          type: card.type,
          _id: { $ne: cardId },
          isActive: true
        },
        { isDefault: false }
      );
    }

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid card data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update card' });
  }
};

// Delete a card (soft delete)
const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Verify the user owns this card
    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own cards.' });
    }

    // Soft delete by setting isActive to false
    await Card.findByIdAndUpdate(cardId, { isActive: false });

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ message: 'Failed to delete card' });
  }
};

// Get a specific card
const getCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card || !card.isActive) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Verify the user owns this card
    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view your own cards.' });
    }

    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ message: 'Failed to fetch card' });
  }
};

// Set a card as default
const setDefaultCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card || !card.isActive) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Verify the user owns this card
    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own cards.' });
    }

    // Set all other cards of the same type to not default
    await Card.updateMany(
      { 
        userId: card.userId, 
        type: card.type,
        _id: { $ne: cardId },
        isActive: true
      },
      { isDefault: false }
    );

    // Set this card as default
    card.isDefault = true;
    await card.save();

    res.json(card);
  } catch (error) {
    console.error('Error setting default card:', error);
    res.status(500).json({ message: 'Failed to set default card' });
  }
};

module.exports = {
  getUserCards,
  createCard,
  updateCard,
  deleteCard,
  getCard,
  setDefaultCard
};
