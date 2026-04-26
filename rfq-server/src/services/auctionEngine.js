import Bid from '../models/Bid.js';
import ActivityLog from '../models/ActivityLog.js';
import rankingService from './rankingService.js';
import extensionService from './extensionService.js';
import notificationService from './notificationService.js';

// Core logic for processing an incoming bid.
// We strictly use the server's receivedAt timestamp so clients can't spoof times.
const processBid = async ({ bidData, supplierId, receivedAt, previousBids }) => {
  const { rfqId, carrierName, freightCharges, originCharges = 0, destinationCharges = 0, totalAmount, transitDays, validityDate } = bidData;

  // 1. save bid
  const bid = await Bid.create({
    rfqId,
    supplierId,
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    totalAmount,
    transitDays,
    validityDate,
    receivedAt: new Date(receivedAt),
  });

  // 2. recalculate rank for everyone (TODO: this might be a bottleneck if we have 1000s of bids)
  const { rankedBids, previousL1Id, currentL1Id } = await rankingService.recomputeRankings(
    rfqId,
    previousBids
  );

  // see if rank changed (we need this if trigger type is ANY_RANK_CHANGE)
  const anyRankChanged = didAnyRankChange(previousBids, rankedBids);

  // 3. Check if we need to extend the clock
  await extensionService.evaluate({
    rfqId,
    bid,
    receivedAt,
    previousL1Id,
    currentL1Id,
    anyRankChanged,
  });

  // 4. log it
  await ActivityLog.create({
    rfqId,
    bidId: bid._id,
    eventType: 'BID_SUBMITTED',
    reason: `Bid of ${totalAmount} submitted by supplier`,
    timestamp: new Date(receivedAt),
  });

  // 5. notify clients
  notificationService.emitNewBid(rfqId, bid, rankedBids);

  // Return bid with its computed rank
  const savedBid = rankedBids.find((b) => b._id.toString() === bid._id.toString());
  return { ...bid.toObject(), rank: savedBid?.rank ?? null };
};

// checks if any supplier moved to a different rank position
const didAnyRankChange = (previousBids, currentBids) => {
  if (!previousBids || previousBids.length === 0) return true;

  const previousRankMap = new Map(
    previousBids.map((b) => [b._id.toString(), b.rank])
  );

  return currentBids.some(
    (b) => previousRankMap.get(b._id.toString()) !== b.rank
  );
};

export default { processBid };