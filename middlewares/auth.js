const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const { ErrorHandler } = require('../utils/errorHandler');

const isLoggedIn = async (req, res, next) => {
  try {
    // 1. check if token is present
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      throw new ErrorHandler(401, 'Unauthorized: You need to be logged in');
    }

    const tokenPart = token.replace('Bearer ', '');

    try {
      // 2. verify that token is valid
      const decoded = await jwt.verify(tokenPart, process.env.JWT_TOKEN);

      // 3. find the user with the token
      const user = await User.findById(decoded.sub);
      if (!user) throw new ErrorHandler(401, 'Unauthorized: Invalid token');

      // 4. store the user details in the request object
      req.user = user;

      next();
    } catch (error) {
      console.error('Error verifying token:', error.name, error.message);
      throw new ErrorHandler(401, `Unauthorized: ${error.message}`);
    }
  } catch (error) {
    next(new ErrorHandler(401, error.message));
  }
};

module.exports = {
  isLoggedIn,
};
