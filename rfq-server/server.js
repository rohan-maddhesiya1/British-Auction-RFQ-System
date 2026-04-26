import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import validateEnv, { env } from './src/config/env.js';
import { initSocket } from './src/config/socket.js';
import { startAuctionCloseWorker } from './src/jobs/auctionClose.job.js';

const start = async () => {
  // Validate env vars before anything else
  validateEnv();

  // Connect to MongoDB
  await connectDB();

  // Create HTTP server and attach Socket.io
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  // Start BullMQ worker for forced close jobs
  startAuctionCloseWorker();

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});