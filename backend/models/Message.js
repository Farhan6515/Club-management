const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    club:    { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ club: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
