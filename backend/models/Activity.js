const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['post', 'event', 'announcement'],
      required: true,
      default: 'post',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: 5000,
    },
    eventDate: {
      type: Date,
      // Required only when type === 'event' (validated in controller)
    },
    eventLocation: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 1000, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for sorting latest first
activitySchema.index({ createdAt: -1 });
activitySchema.index({ club: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
