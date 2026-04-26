import Rfq from '../models/Rfq.js';
import AuctionConfig from '../models/AuctionConfig.js';
import getRedisClient from '../config/redis.js';
import redisKeys from '../utils/redisKeys.js';
import { scheduleForcedClose } from '../jobs/jobQueue.js';

export const createRfq = async (req, res, next) => {
  try {
    const {
      refId, name, bidStartAt, bidCloseAt, forcedCloseAt, pickupDate,
      triggerWindowMins, extensionDurationMins, triggerType,
    } = req.body;

    const rfq = await Rfq.create({
      refId,
      name,
      buyerId: req.user._id,
      bidStartAt: new Date(bidStartAt),
      bidCloseAt: new Date(bidCloseAt),
      forcedCloseAt: new Date(forcedCloseAt),
      pickupDate: pickupDate ? new Date(pickupDate) : undefined,
      status: 'draft',
    });

    await AuctionConfig.create({
      rfqId: rfq._id,
      triggerWindowMins,
      extensionDurationMins,
      triggerType,
      currentCloseAt: new Date(bidCloseAt), // starts equal to bidCloseAt
    });

    res.status(201).json({ rfq });
  } catch (err) {
    next(err);
  }
};

export const listRfqs = async (req, res, next) => {
  try {
    const rfqs = await Rfq.find()
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name email')
      .lean();

    res.json({ rfqs });
  } catch (err) {
    next(err);
  }
};

export const getRfq = async (req, res, next) => {
  try {
    const rfq = await Rfq.findById(req.params.id).populate('buyerId', 'name email').lean();
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    const config = await AuctionConfig.findOne({ rfqId: rfq._id }).lean();
    res.json({ rfq, config });
  } catch (err) {
    next(err);
  }
};

// activates the RFQ and pushes it to Redis so bidding is fast.
// also schedules the BullMQ job for forced close.
export const activateRfq = async (req, res, next) => {
  try {
    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    if (rfq.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can activate this RFQ' });
    }
    if (rfq.status !== 'draft') {
      return res.status(400).json({ error: `RFQ is already ${rfq.status}` });
    }

    await Rfq.updateOne({ _id: rfq._id }, { $set: { status: 'active' } });

    const config = await AuctionConfig.findOne({ rfqId: rfq._id });

    // cache this in redis so the bidding engine doesn't have to query mongo constantly
    const redis = getRedisClient();
    await redis.set(redisKeys.auctionCloseAt(rfq._id), config.currentCloseAt.getTime().toString());
    await redis.set(redisKeys.auctionStatus(rfq._id), 'active');

    // Schedule fallback job
    await scheduleForcedClose(rfq._id.toString(), rfq.forcedCloseAt.getTime());

    res.json({ message: 'RFQ activated', rfqId: rfq._id });
  } catch (err) {
    next(err);
  }
};