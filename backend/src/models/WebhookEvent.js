import mongoose from 'mongoose';

// Unique eventId gives us duplicate-delivery protection.
const schema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

export const WebhookEvent = mongoose.model('WebhookEvent', schema);
