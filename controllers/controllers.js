const path = require('path');
const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
let ErrorResponse = require('../Utils/errorResponse');
const { requireAuth } = require('../middleware/auth');

module.exports.getPosts = async (req, res, next) => {
  try {
    let query;

    //Copy req.query
    let reqQuery = { ...req.query };

    let removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach((param) => delete reqQuery[param]);

    console.log(reqQuery);

    //Create query string
    let queryStr = JSON.stringify(reqQuery);

    query = Post.find(JSON.parse(queryStr));

    //Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-dateCreated');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Post.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const posts = await query;

    // Pagination resukt

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.json({
      success: true,
      count: posts.length,
      pagination: pagination,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to update this bootcamp`
        )
      );
    }

    if (!post) {
      return next(
        new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
      );
    } else {
      res.json({ success: true, data: post });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.home = (req, res) => {
  res.redirect('/posts');
};

module.exports.createPost = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const post = await Post.create(req.body);
    await res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

module.exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      const Id = req.params.id;
      return next(new ErrorResponse(`Post not found with id of ${Id}`, 404));
    }

    if (post.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to update this post`,
          401
        )
      );
    }

    post = await Post.findByOneAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: post });
    post.save();
  } catch (err) {
    next(err);
  }
};

module.exports.deletePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      const Id = req.params.id;
      return next(new ErrorResponse(`Post not found with id of ${Id}`, 404));
    }
    if (post.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to delete this post`,
          401
        )
      );
    }

    post = await Post.findByIdAndDelete(req.params.id);
    post.remove();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.updatePost_Photo = async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    const Id = req.params.id;
    return next(new ErrorResponse(`Post not found with id of ${Id}`, 404));
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  if (post.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to upload a photo to this post`,
        401
      )
    );
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

  file.name = `photo_${post.id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    await Post.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
  console.log(file.name);
};
