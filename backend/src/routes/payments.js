import { Router } from 'express';
import { createOrder, verifyPayment, getStatus } from '../controllers/payments.js';
import { validate, createOrderSchema, verifySchema } from '../middleware/validate.js';

const router = Router();
router.post('/create-order', validate(createOrderSchema), createOrder);
router.post('/verify', validate(verifySchema), verifyPayment);
router.get('/status/:orderId', getStatus);
export default router;
