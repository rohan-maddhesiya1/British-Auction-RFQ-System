import { Worker } from 'bullmq';
import Rfq from '../models/Rfq.js';
import AuctionConfig from '../models/AuctionConfig.js';
import ActivityLog from '../models/ActivityLog.js';
import getRedisClient from '../config/redis.js';
import redisKeys from '../utils/redisKeys.js';
import notificationService from '../services/notificationService.js';

const QUEUE_NAME = 'auction-jobs';

// worker for closing an auction forcefully
// this is idempotent so we can safely retry if it fails
const processForcedClose = async (job) => {
  const { rfqId } = job.data;
  console.log(`Processing forced close for auction: ${rfqId}`);

  const rfq = await Rfq.findById(rfqId);
  if (!rfq) {
    console.warn(`Forced close: RFQ ${rfqId} not found`);
    return;
  }

  // Already closed — idempotent guard
  if (['closed', 'force_closed'].includes(rfq.status)) {
    console.log(`Auction ${rfqId} already closed (${rfq.status}). Skipping.`);
    return;
  }

  const now = Date.now();

  // Mark RFQ as force_closed
  await Rfq.updateOne({ _id: rfqId }, { $set: { status: 'force_closed' } });

  // Update Redis status
  const redis = getRedisClient();
  await redis.set(redisKeys.auctionStatus(rfqId), 'force_closed');

  // Update AuctionConfig currentCloseAt to now (auction is over)
  await AuctionConfig.updateOne(
    { rfqId },
    { $set: { currentCloseAt: new Date(now) } }
  );

  // Log the event
  await ActivityLog.create({
    rfqId,
    bidId: null,
    eventType: 'FORCE_CLOSED',
    reason: 'Forced close time reached',
    timestamp: new Date(now),
  });

  // Notify all connected clients
  notificationService.emitAuctionClosed(rfqId, 'forced_close');

  console.log(`Auction ${rfqId} force closed at ${new Date(now).toISOString()}`);
};

// initialize the worker (call this in index.js/app.js)
export const startAuctionCloseWorker = () => {
  const worker = new Worker(QUEUE_NAME, processForcedClose, {
    connection: getRedisClient(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log('Auction close worker started');
  return worker;
};