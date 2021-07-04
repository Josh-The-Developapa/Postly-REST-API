const jwt = require('jsonwebtoken');
const ErrorResponse = require('../Utils/errorResponse');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Posts');

module.exports.dashBoard_Get = async function (req, res, next) {
  const usersDashboard = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: usersDashboard,
  });
};

module.exports.getMyPosts = async function (req, res, next) {
  try {
    req.body.user = req.user.id;

    const usersPosts = await Post.find({ user: req.user.id });

    res.status(200).json({ success: true, data: usersPosts });
  } catch (err) {
    next(err);
  }
};

module.exports.signup_post = async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 200, res);
};

module.exports.login_post = async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email && !password) {
    return next(new ErrorResponse('Please enter an email and password', 400));
  }

  if (!email) {
    return next(new ErrorResponse('Please enter an email', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Uhh-Ohh, user not found'));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Uhh-Ohh, Invalid password'));
  }
  //Get token from model, create cookie and send ErrorResponse
  const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedjwtToken();

    let options = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(statusCode)
      .cookie('jwt', token, options)
      .json({ success: true, token });
  };

  sendTokenResponse(user, 200, res);
};

module.exports.logout = async (req, res, next) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now()),
  });

  res.status(200).json({
    success: true,
    data: 'successfully logged out',
  });
};

module.exports.updateProfile_Photo = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  let file = req.files.file;

  //If these hooligans try to upload a none image lol
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `That Image is too big to upload, the maximum upload is ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  file.name = `photo_${user.id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    await User.findByIdAndUpdate(req.user.id, { profilePhoto: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
  console.log(file.name);
};

module.exports.forgotPassword = async (req, res, next) => {
  //1. Get user based on the POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ErrorResponse(
        `No user with email address of ${req.body.email} found`,
        404
      )
    );
  }
  //2. Generate random reset token
  const resetToken = user.getResetPasswordToken();
  console.log(resetToken);
  //Add the the resetToken to the database as a value of the resetPasswordToken field
await user.save({validateBeforeSave: false})
  res.status(200).json({
    success: true,
    data: user,
  });
};

module.exports.resetPassword = (req, res, next) => {
  
}

