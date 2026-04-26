import { Queue } from 'bullmq';
import getRedisClient from '../config/redis.js';

const QUEUE_NAME = 'auction-jobs';

let auctionQueue = null;

export const getAuctionQueue = () => {
  if (!auctionQueue) {
    auctionQueue = new Queue(QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for inspection
      },
    });
  }
  return auctionQueue;
};

/**
 * Schedule a forced close job for an auction.
 * The job fires at forcedCloseAt. If it's in the past, fire immediately.
 */
export const scheduleForcedClose = async (rfqId, forcedCloseAt) => {
  const queue = getAuctionQueue();
  const delay = Math.max(0, forcedCloseAt - Date.now());

  await queue.add(
    'forced-close',
    { rfqId },
    {
      delay,
      jobId: `forced-close-${rfqId}`, // idempotent — won't duplicate
    }
  );

  console.log(`Forced close job scheduled for auction ${rfqId} in ${delay}ms`);
};

/**
 * Remove a scheduled forced close job (e.g. if RFQ is cancelled).
 */
export const cancelForcedClose = async (rfqId) => {
  const queue = getAuctionQueue();
  const job = await queue.getJob(`forced-close-${rfqId}`);
  if (job) await job.remove();
};