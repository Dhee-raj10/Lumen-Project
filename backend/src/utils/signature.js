import crypto from 'node:crypto';

export function hmacSha256(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyPaymentSignature({ orderId, paymentId, signature }, keySecret) {
  return safeEqualHex(hmacSha256(`${orderId}|${paymentId}`, keySecret), signature);
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret) */
export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  return safeEqualHex(hmacSha256(rawBody, webhookSecret), signature);
}
