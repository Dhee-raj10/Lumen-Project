import { z } from 'zod';

export const createOrderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  // Whole rupees. Min ₹10, max ₹1,00,000 per donation.
  amount: z.number().int().min(10).max(100000),
});

export const verifySchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(Object.assign(new Error('Invalid request'), {
      status: 400,
      details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    }));
  }
  req.body = result.data;
  next();
};
