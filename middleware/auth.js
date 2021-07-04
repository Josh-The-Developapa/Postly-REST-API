//requireAuth file
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../Utils/errorResponse');
const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return next(
      new ErrorResponse('You are not authorized to access this route', 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    req.user = await User.findById(decoded.id);
  } catch (err) {
    return next(
      new ErrorResponse('You are not authorized to access this route', 401)
    );
  }

  next();
};
