const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');
const jwt = require('jsonwebtoken');
const Posts = require('./Posts');

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    validate: [isEmail, 'Please enter a valid email'],
    lowercase: true,
  },
  password: {
    type: String,
    minLength: [8, 'Minimum password length is 8 characters'],
    required: [true, 'Please enter a password'],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profilePhoto: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
});

//encrypt the password using bcrypt

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);

  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, salt);
});

//Sign JWT and return
userSchema.methods.getSignedjwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Match user entered password to hashed pssword
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  //Hash the token and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10*60*1000

  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
