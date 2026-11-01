import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  razorpayKeyId: required('RAZORPAY_KEY_ID'),
  razorpayKeySecret: required('RAZORPAY_KEY_SECRET'),
  webhookSecret: required('RAZORPAY_WEBHOOK_SECRET'),
  clientOrigins: required('CLIENT_ORIGIN').split(',').map((s) => s.trim().replace(/\/$/, '')),
  mongoUri: required('MONGODB_URI'),
  get mode() {
    return this.razorpayKeyId.startsWith('rzp_live_') ? 'live' : 'test';
  },
};
