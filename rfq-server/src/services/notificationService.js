import { getIO } from '../config/socket.js';

/**
 * Emit a new_bid event to all clients in the auction room.
 */
const emitNewBid = (rfqId, bid, rankedBids) => {
  const io = getIO();
  const rankings = rankedBids.map((b) => ({
    bidId: b._id,
    supplierId: b.supplierId,
    carrierName: b.carrierName,
    totalAmount: b.totalAmount,
    rank: b.rank,
  }));
  io.to(`auction:${rfqId}`).emit('new_bid', { bid, rankings });
};

/**
 * Emit a time_extended event when auction close time is pushed out.
 */
const emitTimeExtended = (rfqId, prevCloseAt, newCloseAt, reason, extensionCount) => {
  const io = getIO();
  io.to(`auction:${rfqId}`).emit('time_extended', {
    prevCloseAt,
    newCloseAt,
    reason,
    extensionCount,
  });
};

/**
 * Emit auction_closed when natural or forced close happens.
 */
const emitAuctionClosed = (rfqId, reason) => {
  const io = getIO();
  io.to(`auction:${rfqId}`).emit('auction_closed', { reason });
};

export default { emitNewBid, emitTimeExtended, emitAuctionClosed };