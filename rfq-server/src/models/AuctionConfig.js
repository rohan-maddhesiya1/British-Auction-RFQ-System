import mongoose from 'mongoose';

const auctionConfigSchema = new mongoose.Schema(
  {
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true, unique: true },
    triggerWindowMins: { type: Number, required: true, min: 1 },
    extensionDurationMins: { type: Number, required: true, min: 1 },
    triggerType: {
      type: String,
      enum: ['BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_RANK_CHANGE'],
      required: true,
    },
    extensionCount: { type: Number, default: 0 },
    currentCloseAt: { type: Date, required: true }, // starts = rfq.bidCloseAt, updated on each extension
  },
  { timestamps: true }
);

const AuctionConfig = mongoose.model('AuctionConfig', auctionConfigSchema);
export default AuctionConfig;