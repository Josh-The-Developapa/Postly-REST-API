const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const User = require('./User');

const postSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter a title for the post'],
    maxLength: [50, 'Max length is 20 characters'],
    unique: true,
  },
  slug: String,
  caption: {
    type: String,
    maxLength: [50, 'Max length is 50 characters'],
    required: [true, 'Please enter a caption'],
  },
  likes: {
    type: Number,
  },
  dislikes: {
    type: Number,
  },
  dateCreated: {
    type: Date,
    default: new Date(),
  },
  photo: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Create post slug from the name
postSchema.post('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  console.log(this.slug);
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
