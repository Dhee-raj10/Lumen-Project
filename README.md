# Lumen — 3D donation platform

React + Three.js frontend (Vercel) and Express + Razorpay + MongoDB backend (Render). Standalone project: it shares nothing with any other repository.

## Layout
```
frontend/  Vite, React, R3F, Drei, GSAP   (src/three = scene, src/sections, src/components/Donate.jsx)
backend/   Express API                     (routes, controllers, services, middleware, models)
```

## Local development
```bash
# backend
cd backend && cp .env.example .env   # fill in values
npm install && npm test && npm run dev

# frontend (new terminal)
cd frontend && cp .env.example .env
npm install && npm run dev            # http://localhost:5173
```
Use Razorpay **Test Mode** keys locally (`rzp_test_...`). Test cards/UPI: https://razorpay.com/docs/payments/payments/test-card-details/

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + Razorpay mode |
| POST | `/api/payments/create-order` | Validates `{name,email,amount}` (₹10–₹1,00,000), creates a Razorpay order, stores a `created` donation. Accepts an `Idempotency-Key` header. |
| POST | `/api/payments/verify` | Verifies HMAC-SHA256 signature, then fetches the payment from Razorpay and checks order + amount before marking `paid` |
| GET | `/api/payments/status/:orderId` | Authoritative status (re-checks Razorpay if unresolved) — used for pending payments |
| POST | `/api/payments/webhook` | Raw-body signature check, handles `payment.captured` / `payment.failed`, de-duplicates on `x-razorpay-event-id` |

Statuses: `created → pending → paid | failed`. `paid` is terminal and never downgraded. The UI shows success only when `/verify` returns `verified: true`.

## Deployment

### 1. New GitHub repository
Create an empty repo on github.com (no README), then:
```bash
cd donation-platform
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```
`.env` files are git-ignored; confirm with `git status` before pushing.

### 2. MongoDB Atlas
1. Create a free M0 cluster. 2. Database Access → add a user with a strong password (read/write on one database). 3. Network Access → allow `0.0.0.0/0` (Render free-tier IPs are not fixed). 4. Connect → Drivers → copy the SRV string, add a database name, e.g. `mongodb+srv://USER:PASS@cluster.mongodb.net/donations`.

### 3. Backend on Render
New → Web Service → connect the repo. Root Directory `backend`, Build `npm install`, Start `npm start`. Environment variables (secrets are entered only here):
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # you choose this string; reuse it in step 6
MONGODB_URI=...
CLIENT_ORIGIN=https://<your-app>.vercel.app   # set after step 4; comma-separate extra origins
```
Verify: `https://<service>.onrender.com/api/health`. (Free instances sleep; first request can take ~50s.)

### 4. Frontend on Vercel
Import the repo, Root Directory `frontend`, framework Vite. Add `VITE_API_BASE_URL=https://<service>.onrender.com` and deploy. Then put the Vercel URL into Render's `CLIENT_ORIGIN` (no trailing slash) and redeploy the backend.

### 5. Razorpay webhook
Dashboard → Settings → Webhooks → Add: URL `https://<service>.onrender.com/api/payments/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured` and `payment.failed`. Test and Live modes have separate webhooks — create one in each.

### 6. Test in Test Mode
Open the site, donate ₹100 with a test card/UPI, and confirm: success screen, a `paid` document in Atlas, and a successful delivery in the Razorpay webhook log. Also try closing the checkout (shows "cancelled") and a failing test card (shows "failed").

### 7. Go live
Complete Razorpay KYC/activation, generate **Live** keys, replace `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` on Render, create the Live-mode webhook, redeploy, and make one small real donation to confirm. `/api/health` reports `mode: "live"` when live keys are active.

## Before launch
- Replace the placeholder organisation name, copy and "impact" figures in `frontend/src/sections/content.js` and `Donate.jsx` with real, accurate ones. Indian donation receipts/80G are your responsibility.
- Frontend loads Google Fonts and Razorpay's checkout script; adjust if you add a CSP.
