import AuctionConfig from '../models/AuctionConfig.js';
import ActivityLog from '../models/ActivityLog.js';
import getRedisClient from '../config/redis.js';
import redisKeys from '../utils/redisKeys.js';
import { isWithinTriggerWindow, computeNewCloseAt } from '../utils/timeUtils.js';
import notificationService from './notificationService.js';

/**
 * Evaluate whether the auction should be extended after a bid is received.
 *
 * @param {string} rfqId
 * @param {object} bid - the newly submitted bid document
 * @param {number} receivedAt - server-stamped time of bid arrival (ms)
 * @param {string} previousL1Id - supplierId who was L1 before this bid
 * @param {string} currentL1Id - supplierId who is L1 after this bid
 * @param {boolean} anyRankChanged - whether any rank changed after recompute
 * @returns {{ extended: boolean, newCloseAt?: number }}
 */
const evaluate = async ({
  rfqId,
  bid,
  receivedAt,
  previousL1Id,
  currentL1Id,
  anyRankChanged,
}) => {
  const redis = getRedisClient();

  // Read current close time from Redis (fast path)
  const cachedCloseAt = await redis.get(redisKeys.auctionCloseAt(rfqId));
  if (!cachedCloseAt) return { extended: false };

  const currentCloseAt = parseInt(cachedCloseAt, 10);
  const config = await AuctionConfig.findOne({ rfqId });
  if (!config) return { extended: false };

  // Is this bid within the trigger window?
  const inWindow = isWithinTriggerWindow(
    receivedAt,
    currentCloseAt,
    config.triggerWindowMins
  );
  if (!inWindow) return { extended: false };

  // Does the trigger condition fire?
  const shouldExtend = checkTriggerCondition({
    triggerType: config.triggerType,
    previousL1Id,
    currentL1Id,
    anyRankChanged,
  });
  if (!shouldExtend) return { extended: false };

  // Acquire Redis lock to prevent concurrent extensions across instances
  const lockKey = redisKeys.auctionLock(rfqId);
  const lockAcquired = await redis.set(lockKey, '1', 'NX', 'PX', 5000);
  if (!lockAcquired) {
    // Another instance is already handling this extension
    return { extended: false };
  }

  try {
    // Re-read closeAt inside the lock (another instance may have just extended)
    const freshCloseAt = parseInt(await redis.get(redisKeys.auctionCloseAt(rfqId)), 10);

    // Fetch rfq for forcedCloseAt
    const { default: Rfq } = await import('../models/Rfq.js');
    const rfq = await Rfq.findById(rfqId).select('forcedCloseAt').lean();

    const newCloseAt = computeNewCloseAt(
      freshCloseAt,
      config.extensionDurationMins,
      rfq.forcedCloseAt.getTime()
    );

    if (!newCloseAt) {
      // No room to extend — already at forced close
      return { extended: false };
    }

    const reason = buildReason(config.triggerType, previousL1Id, currentL1Id);

    // Persist to Redis and MongoDB atomically-ish (Redis first for speed)
    await redis.set(redisKeys.auctionCloseAt(rfqId), newCloseAt.toString());

    await AuctionConfig.updateOne(
      { rfqId },
      { $set: { currentCloseAt: new Date(newCloseAt) }, $inc: { extensionCount: 1 } }
    );

    const updatedConfig = await AuctionConfig.findOne({ rfqId }).select('extensionCount').lean();

    await ActivityLog.create({
      rfqId,
      bidId: bid._id,
      eventType: 'AUCTION_EXTENDED',
      reason,
      prevCloseAt: new Date(freshCloseAt),
      newCloseAt: new Date(newCloseAt),
      timestamp: new Date(receivedAt),
    });

    notificationService.emitTimeExtended(
      rfqId,
      freshCloseAt,
      newCloseAt,
      reason,
      updatedConfig.extensionCount
    );

    return { extended: true, newCloseAt };
  } finally {
    // Always release lock
    await redis.del(lockKey);
  }
};

/**
 * Check whether the trigger condition is met based on triggerType.
 */
const checkTriggerCondition = ({ triggerType, previousL1Id, currentL1Id, anyRankChanged }) => {
  switch (triggerType) {
    case 'BID_RECEIVED':
      return true;
    case 'ANY_RANK_CHANGE':
      return anyRankChanged;
    case 'L1_RANK_CHANGE':
      return previousL1Id !== currentL1Id;
    default:
      return false;
  }
};

const buildReason = (triggerType, previousL1Id, currentL1Id) => {
  switch (triggerType) {
    case 'BID_RECEIVED':
      return 'New bid received within trigger window';
    case 'ANY_RANK_CHANGE':
      return 'Supplier rankings changed within trigger window';
    case 'L1_RANK_CHANGE':
      return `L1 position changed (new lowest bidder: ${currentL1Id})`;
    default:
      return 'Trigger condition met';
  }
};

export default { evaluate };