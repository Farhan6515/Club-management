const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Technical',
        'Cultural',
        'Sports',
        'Literary',
        'Social',
        'Academic',
        'Other',
      ],
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    coverImage: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    positions: [
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, trim: true, maxlength: 50, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Virtual for member count
clubSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

// Index for search
clubSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Club', clubSchema);
