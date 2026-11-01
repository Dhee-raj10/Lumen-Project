import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: 'INR' },
    receipt: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, index: true, sparse: true },
    status: { type: String, enum: ['created', 'pending', 'paid', 'failed'], default: 'created', index: true },
    failureReason: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    mode: { type: String, enum: ['test', 'live'], required: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Donation = mongoose.model('Donation', donationSchema);
