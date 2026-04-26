import Bid from '../models/Bid.js';
import auctionEngine from '../services/auctionEngine.js';

export const submitBid = async (req, res, next) => {
  try {
    const { rfqId } = req.body;

    // req.serverReceivedAt and req.currentCloseAt are set by bid.validator.js
    const receivedAt = req.serverReceivedAt;

    // Fetch existing bids before saving the new one (needed for rank diff)
    const previousBids = await Bid.find({ rfqId }).sort({ totalAmount: 1 }).lean();

    const bid = await auctionEngine.processBid({
      bidData: req.body,
      supplierId: req.user._id.toString(),
      receivedAt,
      previousBids,
    });

    res.status(201).json({ bid });
  } catch (err) {
    next(err);
  }
};

export const getBidsForRfq = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const bids = await Bid.find({ rfqId })
      .sort({ totalAmount: 1 })
      .populate('supplierId', 'name')
      .lean();

    res.json({ bids });
  } catch (err) {
    next(err);
  }
};