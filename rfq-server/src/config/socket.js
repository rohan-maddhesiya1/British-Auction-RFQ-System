import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Verify JWT before allowing socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user?.id})`);

    // Client joins a specific auction room
    socket.on('join_auction', ({ rfqId }) => {
      if (!rfqId) return;
      socket.join(`auction:${rfqId}`);
      console.log(`Socket ${socket.id} joined auction:${rfqId}`);
    });

    socket.on('leave_auction', ({ rfqId }) => {
      socket.leave(`auction:${rfqId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised. Call initSocket first.');
  return io;
};