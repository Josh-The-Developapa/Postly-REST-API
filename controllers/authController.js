const jwt = require('jsonwebtoken');
const ErrorResponse = require('../Utils/errorResponse');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Posts');
const { sendEmail } = require('../Utils/email');
const crypto = require('crypto');

module.exports.dashBoard_Get = async function (req, res, next) {
  const usersDashboard = await User.findById(req.user.id).select('+password');

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

  await user.save({ validateBeforeSave: false });

  //Create Reset URL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/reset-password/${resetToken}`;

  const message = `You are recieving this email because you requested to reset your password reset your password using this link: \n\n ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset magic link',
      message,
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    return next(new ErrorResponse('Email could not be sent', 500));
  }
  await user.save({ validateBeforeSave: false });
};

module.exports.resetPassword = async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendTokenResponse(user, 200, res);

  res.status(200).json({
    success: true,
    data: user,
  });
};

module.exports.updateUserDetails = async (req, res, next) => {
  const updateFields = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
};

module.exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(
      new ErrorResponse(
        'Your current password entered doesnt match the one in the database'
      )
    );
  }

  await user.findByIdAndUpdate(req.user.id, req.body.password, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: user,
  });
};
