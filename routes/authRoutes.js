const express = require('express');
const router = express.Router();
const {
  dashBoard_Get,
  getMyPosts,
  login_post,
  logout,
  signup_post,
  updateProfile_Photo,
  forgotPassword,
  resetPassword 
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

//Signup user
router.post('/signup', signup_post);

router.post('/login', login_post);

router.get('/dashboard', requireAuth, dashBoard_Get);

router.get('/myposts', requireAuth, getMyPosts);

router.get('/logout', requireAuth, logout);

router.post('/profile-photo', requireAuth, updateProfile_Photo);

router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;
