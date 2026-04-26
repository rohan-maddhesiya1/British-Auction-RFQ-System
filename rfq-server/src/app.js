import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import rfqRoutes from './routes/rfq.routes.js';
import bidRoutes from './routes/bid.routes.js';
import auctionRoutes from './routes/auction.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/auctions', auctionRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler — must be last
app.use(errorHandler);

export default app;