import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Donation } from '../models/Donation.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { razorpay } from '../services/razorpay.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../utils/signature.js';
import { AppError } from '../utils/AppError.js';

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const publicView = (d) => ({
  status: d.status,
  orderId: d.orderId,
  paymentId: d.paymentId || null,
  amount: d.amount / 100,
  currency: d.currency,
  name: d.name,
});

/** Map a Razorpay payment status to our donation status. Never downgrades a paid donation. */
async function applyPaymentState(orderId, payment) {
  const map = { captured: 'paid', authorized: 'pending', created: 'pending', failed: 'failed' };
  const next = map[payment.status];
  if (!next) return Donation.findOne({ orderId });

  const update = { paymentId: payment.id, status: next };
  if (next === 'paid') update.paidAt = new Date();
  if (next === 'failed') update.failureReason = payment.error_description || payment.error_reason || 'Payment failed';

  // paid is terminal; anything else may only update a not-yet-paid donation.
  const filter = next === 'paid' ? { orderId } : { orderId, status: { $ne: 'paid' } };
  const doc = await Donation.findOneAndUpdate(filter, update, { new: true });
  return doc || Donation.findOne({ orderId });
}

const orderResponse = (d) => ({
  orderId: d.orderId,
  amount: d.amount, // paise, as Checkout expects
  currency: d.currency,
  keyId: env.razorpayKeyId, // public key only
  name: d.name,
  email: d.email,
  mode: d.mode,
});

export const createOrder = asyncH(async (req, res) => {
  const { name, email, amount } = req.body;
  const idempotencyKey = req.get('Idempotency-Key')?.slice(0, 80);

  if (idempotencyKey) {
    const existing = await Donation.findOne({ idempotencyKey });
    if (existing) {
      if (existing.status === 'paid') throw new AppError(409, 'This donation was already completed');
      return res.json(orderResponse(existing));
    }
  }

  const paise = amount * 100;
  const receipt = `don_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

  const order = await razorpay.orders.create({
    amount: paise,
    currency: 'INR',
    receipt,
    notes: { donor: name.slice(0, 40) },
  });

  const donation = await Donation.create({
    name, email, amount: paise, receipt, orderId: order.id, mode: env.mode,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  });

  res.status(201).json(orderResponse(donation));
});

export const verifyPayment = asyncH(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  const donation = await Donation.findOne({ orderId });
  if (!donation) throw new AppError(404, 'Order not found');

  if (!verifyPaymentSignature({ orderId, paymentId, signature }, env.razorpayKeySecret)) {
    throw new AppError(400, 'Invalid payment signature');
  }

  // Do not trust the client: confirm with Razorpay.
  const payment = await razorpay.payments.fetch(paymentId);
  if (payment.order_id !== orderId) throw new AppError(400, 'Payment does not belong to this order');
  if (Number(payment.amount) !== donation.amount) throw new AppError(400, 'Amount mismatch');

  const updated = await applyPaymentState(orderId, payment);
  res.json({ verified: updated.status === 'paid', ...publicView(updated) });
});

export const getStatus = asyncH(async (req, res) => {
  let donation = await Donation.findOne({ orderId: req.params.orderId });
  if (!donation) throw new AppError(404, 'Order not found');

  // For unresolved donations, ask Razorpay what happened.
  if (donation.status === 'created' || donation.status === 'pending') {
    const { items } = await razorpay.orders.fetchPayments(donation.orderId);
    const best = items.find((p) => p.status === 'captured') || items.find((p) => p.status === 'authorized') || items[0];
    if (best) donation = await applyPaymentState(donation.orderId, best);
  }
  res.json(publicView(donation));
});

/** Mounted with express.raw() so the signature is computed over the exact bytes Razorpay sent. */
export const webhook = asyncH(async (req, res) => {
  const signature = req.get('x-razorpay-signature');
  const raw = req.body; // Buffer
  if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, signature, env.webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const eventId = req.get('x-razorpay-event-id');
  if (!eventId) return res.status(400).json({ error: 'Missing event id' });

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

  // Duplicate protection via unique index.
  try {
    await WebhookEvent.create({ eventId, type: event.event });
  } catch (e) {
    if (e.code === 11000) return res.json({ received: true, duplicate: true });
    throw e;
  }

  try {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && ['payment.captured', 'payment.failed'].includes(event.event)) {
      const donation = await Donation.findOne({ orderId: payment.order_id });
      if (donation && Number(payment.amount) === donation.amount) {
        await applyPaymentState(payment.order_id, payment);
      }
    }
  } catch (e) {
    await WebhookEvent.deleteOne({ eventId }); // let Razorpay retry
    throw e;
  }
  res.json({ received: true });
});
