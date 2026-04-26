import Bid from '../models/Bid.js';

/**
 * Recomputes rankings for all bids of an RFQ sorted by totalAmount ASC.
 * Writes rank back to each Bid document.
 * Returns { rankedBids, previousL1Id, currentL1Id }
 */
const recomputeRankings = async (rfqId, previousBids = null) => {
  // Fetch all bids for this RFQ sorted cheapest first
  const bids = await Bid.find({ rfqId }).sort({ totalAmount: 1 }).lean();

  if (bids.length === 0) return { rankedBids: [], previousL1Id: null, currentL1Id: null };

  const previousL1Id = previousBids?.[0]?.supplierId?.toString() ?? null;

  // Bulk write ranks back
  const bulkOps = bids.map((bid, index) => ({
    updateOne: {
      filter: { _id: bid._id },
      update: { $set: { rank: index + 1 } },
    },
  }));

  await Bid.bulkWrite(bulkOps);

  const rankedBids = bids.map((bid, index) => ({ ...bid, rank: index + 1 }));
  const currentL1Id = rankedBids[0]?.supplierId?.toString() ?? null;

  return { rankedBids, previousL1Id, currentL1Id };
};

export default { recomputeRankings };