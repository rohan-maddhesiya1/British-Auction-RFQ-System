import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    eventType: {
      type: String,
      enum: ['BID_SUBMITTED', 'AUCTION_EXTENDED', 'AUCTION_CLOSED', 'FORCE_CLOSED'],
      required: true,
    },
    reason: { type: String },
    prevCloseAt: { type: Date, default: null },
    newCloseAt: { type: Date, default: null },
    timestamp: { type: Date, required: true, default: Date.now },
  }
);

// Fast lookup: all events for a given auction sorted by time
activityLogSchema.index({ rfqId: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;