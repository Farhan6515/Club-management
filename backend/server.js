require('dotenv').config({ path: __dirname + '/.env' });
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Club = require('./models/Club');
const User = require('./models/User');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Socket.io auth + chat ──────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name _id');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join-club', async (clubId) => {
    try {
      const club = await Club.findById(clubId);
      if (!club) return;
      const isMember = club.members.some(
        (m) => m.toString() === socket.user._id.toString()
      );
      if (!isMember) return;
      socket.join(clubId);
    } catch { /* ignore */ }
  });

  socket.on('send-message', async ({ clubId, content }) => {
    try {
      if (!content?.trim()) return;
      const club = await Club.findById(clubId);
      if (!club) return;
      const isMember = club.members.some(
        (m) => m.toString() === socket.user._id.toString()
      );
      if (!isMember) return;

      const message = await Message.create({
        club: clubId,
        author: socket.user._id,
        content: content.trim(),
      });

      const populated = await Message.findById(message._id).populate('author', 'name');

      io.to(clubId).emit('new-message', populated);
    } catch { /* ignore */ }
  });

  socket.on('leave-club', (clubId) => socket.leave(clubId));

  // ── Direct messages ──────────────────────────────────────────────────────
  socket.on('join-dm', (roomId) => socket.join(roomId));

  socket.on('send-dm', async ({ toUserId, content }) => {
    try {
      if (!content?.trim()) return;
      const me = await User.findById(socket.user._id).select('friends');
      const isFriend = me.friends.some(f => f.toString() === toUserId);
      if (!isFriend) return;

      const roomId = [socket.user._id.toString(), toUserId].sort().join('-');

      let conv = await Conversation.findOne({
        participants: { $all: [socket.user._id, toUserId], $size: 2 },
      });
      if (!conv) conv = await Conversation.create({ participants: [socket.user._id, toUserId], messages: [] });

      conv.messages.push({ sender: socket.user._id, content: content.trim() });
      conv.updatedAt = new Date();
      await conv.save();

      const newMsg = conv.messages[conv.messages.length - 1];
      io.to(roomId).emit('new-dm', {
        _id: newMsg._id,
        sender: { _id: socket.user._id, name: socket.user.name },
        content: newMsg.content,
        createdAt: newMsg.createdAt,
        read: false,
      });
    } catch { /* ignore */ }
  });
});

// ── Express middleware ─────────────────────────────────────────────────────
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Club Management API is running' })
);

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/clubs',     require('./routes/clubRoutes'));
app.use('/api/activities',require('./routes/activityRoutes'));
app.use('/api/messages',  require('./routes/messageRoutes'));
app.use('/api/friends',   require('./routes/friendRoutes'));
app.use('/api/dm',        require('./routes/dmRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5100;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
