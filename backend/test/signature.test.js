import test from 'node:test';
import assert from 'node:assert/strict';
import { hmacSha256, verifyPaymentSignature, verifyWebhookSignature } from '../src/utils/signature.js';

test('accepts a valid checkout signature', () => {
  const sig = hmacSha256('order_ABC|pay_XYZ', 'secret');
  assert.equal(verifyPaymentSignature({ orderId: 'order_ABC', paymentId: 'pay_XYZ', signature: sig }, 'secret'), true);
});
test('rejects a tampered checkout signature', () => {
  const sig = hmacSha256('order_ABC|pay_XYZ', 'secret');
  assert.equal(verifyPaymentSignature({ orderId: 'order_ABC', paymentId: 'pay_OTHER', signature: sig }, 'secret'), false);
  assert.equal(verifyPaymentSignature({ orderId: 'order_ABC', paymentId: 'pay_XYZ', signature: 'abc' }, 'secret'), false);
});
test('validates webhook signature over raw bytes', () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const sig = hmacSha256(body, 'whsec');
  assert.equal(verifyWebhookSignature(body, sig, 'whsec'), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"x"}'), sig, 'whsec'), false);
  assert.equal(verifyWebhookSignature(body, undefined, 'whsec'), false);
});
