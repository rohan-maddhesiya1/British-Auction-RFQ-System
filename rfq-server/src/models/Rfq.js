import mongoose from 'mongoose';

const rfqSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidStartAt: { type: Date, required: true },
    bidCloseAt: { type: Date, required: true },
    forcedCloseAt: { type: Date, required: true },
    pickupDate: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'force_closed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Ensure forcedCloseAt > bidCloseAt at schema level
rfqSchema.pre('save', function (next) {
  if (this.forcedCloseAt <= this.bidCloseAt) {
    return next(new Error('forcedCloseAt must be after bidCloseAt'));
  }
  next();
});

const Rfq = mongoose.model('Rfq', rfqSchema);
export default Rfq;