const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Format date to readable string
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate average rating
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
  return (sum / ratings.length).toFixed(1);
};

// Validate price
const isValidPrice = (price) => {
  return typeof price === 'number' && price > 0;
};

// Sanitize input string
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Generate booking number
const generateBookingNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BK-${timestamp}-${random}`;
};

// Check if date is in the future
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Check if time slot is available
const isTimeSlotAvailable = (startTime, endTime, existingBookings) => {
  for (const booking of existingBookings) {
    if (
      (startTime < booking.endTime && endTime > booking.startTime) ||
      (booking.startTime < endTime && booking.endTime > startTime)
    ) {
      return false;
    }
  }
  return true;
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  isValidEmail,
  isValidPhone,
  formatDate,
  generateRandomString,
  calculateAverageRating,
  isValidPrice,
  sanitizeString,
  generateOrderNumber,
  generateBookingNumber,
  isFutureDate,
  isTimeSlotAvailable
};
