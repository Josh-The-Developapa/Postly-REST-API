const path = require('path');
const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
let ErrorResponse = require('../Utils/errorResponse');
const { requireAuth } = require('../middleware/auth');
const {
  getPosts,
  getPost,
  home,
  createPost,
  updatePost,
  deletePost,
  updatePost_Photo,
} = require('../controllers/controllers');

router.get('/posts', getPosts);

router.get('/posts/:id', getPost);

router.get('/', home);

router.post('/posts/create', requireAuth, createPost);

router.put('/posts/update/:id', requireAuth, updatePost);

router.delete('/posts/delete/:id', requireAuth, deletePost);

router.put('/posts/:id/photo', requireAuth, updatePost_Photo);

module.exports = router;
