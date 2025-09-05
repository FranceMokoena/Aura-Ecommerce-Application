const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE START ===');
    console.log('Auth middleware called for:', req.path);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.header("Authorization");
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('No Authorization header provided - returning 401');
      return res.status(401).json({ 
        message: "Access denied. No authorization header provided.",
        code: "NO_AUTH_HEADER"
      });
    }
    
    if (!authHeader.startsWith("Bearer ")) {
      console.log('Invalid Authorization header format - returning 401');
      return res.status(401).json({ 
        message: "Access denied. Invalid authorization header format.",
        code: "INVALID_AUTH_FORMAT"
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    console.log('Token extracted:', token ? 'Present' : 'Missing');
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      console.log('No token provided - returning 401');
      return res.status(401).json({ 
        message: "Access denied. No token provided.",
        code: "NO_TOKEN"
      });
    }

    // Validate token format (basic JWT structure check)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Invalid token format - returning 401');
      return res.status(401).json({ 
        message: "Access denied. Invalid token format.",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    
    if (!decoded.id) {
      console.log('Token missing user ID - returning 401');
      return res.status(401).json({ 
        message: "Access denied. Invalid token payload.",
        code: "INVALID_TOKEN_PAYLOAD"
      });
    }
    
    const user = await User.findById(decoded.id).select("-password");
    console.log('User found in DB:', user ? `Yes - ${user.name} (${user._id})` : 'No');
    
    if (!user) {
      console.log('User not found in database - returning 401');
      return res.status(401).json({ 
        message: "Access denied. User not found.",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if user account is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      console.log('User account is inactive/suspended - returning 401');
      return res.status(401).json({ 
        message: "Access denied. Account is inactive.",
        code: "ACCOUNT_INACTIVE"
      });
    }

    // Ensure user object has consistent ID field structure
    req.user = {
      ...user.toObject(),
      id: user._id.toString(),
      _id: user._id
    };
    console.log('User attached to request:', user._id);
    console.log('User object structure:', { id: req.user.id, _id: req.user._id, role: req.user.role });
    console.log('=== AUTH MIDDLEWARE END ===');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Access denied. Token has expired.",
        code: "TOKEN_EXPIRED"
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Access denied. Invalid token.",
        code: "INVALID_TOKEN"
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: "Access denied. Token not active yet.",
        code: "TOKEN_NOT_ACTIVE"
      });
    }
    
    res.status(401).json({ 
      message: "Access denied. Authentication failed.",
      code: "AUTH_FAILED"
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

// Specific role middlewares
const requireCustomer = requireRole(['customer']);
const requireSeller = requireRole(['seller']);
const requireSeeker = requireRole(['seeker']);
const requireAdmin = requireRole(['admin']);

module.exports = {
  authMiddleware,
  requireRole,
  requireCustomer,
  requireSeller,
  requireSeeker,
  requireAdmin
};
