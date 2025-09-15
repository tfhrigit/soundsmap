const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const soundRoutes = require('./routes/sounds');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');
const { initializeStorage } = require('./utils/storage');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

initializeStorage();

app.use('/api/auth', authRoutes);
app.use('/api/sounds', soundRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('new-sound', (data) => {
    io.to(data.room).emit('sound-added', data);
  });

  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});