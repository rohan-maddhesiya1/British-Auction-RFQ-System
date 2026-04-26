import Rfq from '../models/Rfq.js';
import Bid from '../models/Bid.js';
import AuctionConfig from '../models/AuctionConfig.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Listing page — all auctions with L1 bid, close times, status.
 */
export const listAuctions = async (req, res, next) => {
  try {
    const rfqs = await Rfq.find()
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name')
      .lean();

    // Attach L1 bid and auction config for each RFQ
    const auctions = await Promise.all(
      rfqs.map(async (rfq) => {
        const [l1Bid, config] = await Promise.all([
          Bid.findOne({ rfqId: rfq._id, rank: 1 })
            .populate('supplierId', 'name')
            .lean(),
          AuctionConfig.findOne({ rfqId: rfq._id })
            .select('currentCloseAt extensionCount triggerWindowMins')
            .lean(),
        ]);

        return {
          ...rfq,
          l1Bid: l1Bid
            ? { totalAmount: l1Bid.totalAmount, carrierName: l1Bid.carrierName, rank: 1 }
            : null,
          currentCloseAt: config?.currentCloseAt ?? rfq.bidCloseAt,
          extensionCount: config?.extensionCount ?? 0,
          triggerWindowMins: config?.triggerWindowMins ?? null,
        };
      })
    );

    res.json({ auctions });
  } catch (err) {
    next(err);
  }
};

/**
 * Details page — full bid rankings, auction config, activity log.
 */
export const getAuctionDetails = async (req, res, next) => {
  try {
    const { rfqId } = req.params;

    const [rfq, bids, config, log] = await Promise.all([
      Rfq.findById(rfqId).populate('buyerId', 'name email').lean(),
      Bid.find({ rfqId })
        .sort({ totalAmount: 1 })
        .populate('supplierId', 'name')
        .lean(),
      AuctionConfig.findOne({ rfqId }).lean(),
      ActivityLog.find({ rfqId })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean(),
    ]);

    if (!rfq) return res.status(404).json({ error: 'Auction not found' });

    res.json({ rfq, bids, config, log });
  } catch (err) {
    next(err);
  }
};

/**
 * Activity log only — paginated.
 */
export const getActivityLog = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [log, total] = await Promise.all([
      ActivityLog.find({ rfqId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ rfqId }),
    ]);

    res.json({ log, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};