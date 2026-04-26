import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carrierName: { type: String, trim: true },
    freightCharges: { type: Number, required: true, min: 0 },
    originCharges: { type: Number, default: 0, min: 0 },
    destinationCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    transitDays: { type: Number, min: 0 },
    validityDate: { type: Date },
    // Always server-stamped on arrival — never from client
    receivedAt: { type: Date, required: true },
    rank: { type: Number },
  },
  { timestamps: true }
);


bidSchema.index({ rfqId: 1, totalAmount: 1 });
bidSchema.index({ rfqId: 1, supplierId: 1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;