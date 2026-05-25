const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Club = require('../models/Club');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { awardPoints } = require('../services/gamificationService');

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/covers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `club-${req.params.id}-${Date.now()}${ext}`);
  },
});
exports.uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed'));
  },
});

// @desc    Upload club cover image
// @route   POST /api/clubs/:id/cover
// @access  Private (club admin only)
exports.uploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    if (club.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the club admin can change the cover' });

    // Delete old cover file if stored locally
    if (club.coverImage && !club.coverImage.startsWith('http')) {
      const old = path.join(__dirname, '..', club.coverImage);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    const base = `${req.protocol}://${req.get('host')}`;
    club.coverImage = `${base}/uploads/covers/${req.file.filename}`;
    await club.save();

    res.json({ success: true, coverImage: club.coverImage });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all clubs (with optional search & filters)
// @route   GET /api/clubs
// @access  Private
exports.getClubs = async (req, res, next) => {
  try {
    const { search, department, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (category) query.category = category;

    const clubs = await Club.find(query)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: clubs.length, clubs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended clubs for the current user (department + interests)
// @route   GET /api/clubs/recommended
// @access  Private
exports.getRecommendedClubs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const joinedIds = user.joinedClubs || [];

    // Match by department or by interest tags, excluding already joined
    const query = {
      _id: { $nin: joinedIds },
      $or: [
        { department: user.department },
        ...(user.interests && user.interests.length
          ? [{ tags: { $in: user.interests.map((i) => i.toLowerCase()) } }]
          : []),
      ],
    };

    const clubs = await Club.find(query)
      .populate('admin', 'name')
      .limit(8)
      .sort({ createdAt: -1 });

    res.json({ success: true, clubs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single club by id
// @route   GET /api/clubs/:id
// @access  Private
exports.getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('admin', 'name email department')
      .populate('coAdmins', 'name email')
      .populate('members', 'name email department avatar')
      .populate('positions.user', 'name avatar');

    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    res.json({ success: true, club });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new club (admin only, requires valid Department ID)
// @route   POST /api/clubs
// @access  Private/Admin
exports.createClub = async (req, res, next) => {
  try {
    const { name, description, department, category, tags, coverImage } =
      req.body;

    if (!name || !description || !department || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, department, and category are required',
      });
    }

    const exists = await Club.findOne({ name });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: 'A club with this name exists' });
    }

    const club = await Club.create({
      name,
      description,
      department,
      category,
      tags: tags || [],
      coverImage: coverImage || '',
      admin: req.user._id,
      members: [req.user._id], // Admin is automatically a member
    });

    // Add club to creator's joined clubs
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedClubs: club._id },
    });

    res.status(201).json({ success: true, club });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a club (only club admin)
// @route   PUT /api/clubs/:id
// @access  Private/Admin
exports.updateClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    if (club.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club admin can update this club',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'department',
      'category',
      'tags',
      'coverImage',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) club[field] = req.body[field];
    });

    await club.save();
    res.json({ success: true, club });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a club (only club admin)
// @route   DELETE /api/clubs/:id
// @access  Private/Admin
exports.deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    if (club.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club admin can delete this club',
      });
    }

    // Remove club from all members' joinedClubs
    await User.updateMany(
      { _id: { $in: club.members } },
      { $pull: { joinedClubs: club._id } }
    );

    // Delete all activities of this club
    await Activity.deleteMany({ club: club._id });

    await club.deleteOne();
    res.json({ success: true, message: 'Club deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a club
// @route   POST /api/clubs/:id/join
// @access  Private
exports.joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    if (club.members.includes(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Already a member' });
    }

    const isEarlyBird = club.members.length < 10;
    club.members.push(req.user._id);
    await club.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedClubs: club._id },
    });

    const pointsInfo = await awardPoints(req.user._id, 'JOIN_CLUB', { earlyBird: isEarlyBird }).catch(() => null);

    res.json({ success: true, message: 'Joined club successfully', pointsInfo });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a club
// @route   POST /api/clubs/:id/leave
// @access  Private
exports.leaveClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    if (club.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave the club. Transfer ownership or delete it.',
      });
    }

    club.members = club.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await club.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedClubs: club._id },
    });

    res.json({ success: true, message: 'Left club successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member (only club admin)
// @route   DELETE /api/clubs/:id/members/:userId
// @access  Private/Admin
exports.removeMember = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    if (club.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club admin can remove members',
      });
    }

    if (req.params.userId === club.admin.toString()) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot remove the admin' });
    }

    club.members = club.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await club.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { joinedClubs: club._id },
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get clubs the user administers
// @route   GET /api/clubs/admin/my-clubs
// @access  Private/Admin
exports.getMyAdminClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ admin: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, clubs });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign or update a position for a member
// @route   PUT /api/clubs/:id/positions/:userId
// @access  Private (club admin only)
exports.assignPosition = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Position title is required' });

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    if (club.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the club admin can assign positions' });

    const isMember = club.members.some(m => m.toString() === req.params.userId);
    if (!isMember) return res.status(400).json({ success: false, message: 'User is not a member' });

    const existing = club.positions.find(p => p.user.toString() === req.params.userId);
    if (existing) {
      existing.title = title.trim();
    } else {
      club.positions.push({ user: req.params.userId, title: title.trim() });
    }
    await club.save();
    await club.populate('positions.user', 'name avatar');

    res.json({ success: true, positions: club.positions });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a position from a member
// @route   DELETE /api/clubs/:id/positions/:userId
// @access  Private (club admin only)
exports.removePosition = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    if (club.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the club admin can remove positions' });

    club.positions = club.positions.filter(p => p.user.toString() !== req.params.userId);
    await club.save();

    res.json({ success: true, positions: club.positions });
  } catch (error) {
    next(error);
  }
};
