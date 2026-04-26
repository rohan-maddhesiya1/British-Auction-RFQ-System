import { body, validationResult } from 'express-validator';
import Rfq from '../models/Rfq.js';
import getRedisClient from '../config/redis.js';
import redisKeys from '../utils/redisKeys.js';

export const validateSubmitBid = [
  body('rfqId').notEmpty().withMessage('rfqId is required'),
  body('freightCharges')
    .isFloat({ min: 0 })
    .withMessage('Freight charges must be a non-negative number'),
  body('originCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Origin charges must be non-negative'),
  body('destinationCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Destination charges must be non-negative'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a non-negative number'),

  // Server-side time validation — the core guard
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rfqId } = req.body;
    const now = Date.now(); // server time — never trust client

    try {
      const rfq = await Rfq.findById(rfqId);
      if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

      if (rfq.status !== 'active') {
        return res.status(400).json({ error: `Auction is ${rfq.status}` });
      }

      // Hard ceiling check
      if (now >= rfq.forcedCloseAt.getTime()) {
        return res.status(400).json({ error: 'Auction has reached forced close time' });
      }

      // Live close time from Redis (fast path)
      const redis = getRedisClient();
      const cachedCloseAt = await redis.get(redisKeys.auctionCloseAt(rfqId));
      const currentCloseAt = cachedCloseAt
        ? parseInt(cachedCloseAt, 10)
        : rfq.bidCloseAt.getTime();

      if (now >= currentCloseAt) {
        return res.status(400).json({ error: 'Auction bidding window has closed' });
      }

      // Attach to req for downstream use (avoids re-fetching)
      req.rfq = rfq;
      req.currentCloseAt = currentCloseAt;
      req.serverReceivedAt = now;

      next();
    } catch (err) {
      next(err);
    }
  },
];