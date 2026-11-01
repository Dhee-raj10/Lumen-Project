import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

await connectDb();
createApp().listen(env.port, () => console.log(`API on :${env.port} (Razorpay ${env.mode} mode)`));
