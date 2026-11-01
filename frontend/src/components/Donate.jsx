import { useRef, useState } from 'react';
import { createOrder, verifyPayment, getStatus } from '../services/api';
import { loadRazorpay } from '../hooks/useRazorpayScript';

const PRESETS = [100, 250, 500, 1000];
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Donate() {
  const [preset, setPreset] = useState(500);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | checkout | verifying | success | failed | pending | cancelled
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const idemKey = useRef(crypto.randomUUID());
  const orderRef = useRef(null);

  const amount = custom !== '' ? Number(custom) : preset;
  const amountOk = Number.isInteger(amount) && amount >= 10 && amount <= 100000;
  const formOk = amountOk && name.trim().length >= 2 && EMAIL.test(email.trim());
  const busy = ['loading', 'checkout', 'verifying'].includes(phase);

  const reset = () => { idemKey.current = crypto.randomUUID(); orderRef.current = null; setPhase('idle'); setError(''); setResult(null); };

  async function confirm(response) {
    setPhase('verifying');
    try {
      const data = await verifyPayment(response);
      setResult(data);
      setPhase(data.verified ? 'success' : data.status === 'failed' ? 'failed' : 'pending');
    } catch (e) {
      // Verification could not be completed; ask the server for the authoritative status before giving up.
      try {
        const s = await getStatus(response.razorpay_order_id);
        setResult(s);
        setPhase(s.status === 'paid' ? 'success' : s.status === 'failed' ? 'failed' : 'pending');
      } catch { setError(e.message); setPhase('pending'); }
    }
  }

  async function checkStatus() {
    if (!orderRef.current) return;
    setPhase('verifying');
    try {
      const s = await getStatus(orderRef.current);
      setResult(s);
      setPhase(s.status === 'paid' ? 'success' : s.status === 'failed' ? 'failed' : 'pending');
    } catch (e) { setError(e.message); setPhase('pending'); }
  }

  async function donate(e) {
    e.preventDefault();
    if (!formOk || busy) return;
    setError(''); setPhase('loading');
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment window. Check your connection and try again.');
      const order = await createOrder({ name: name.trim(), email: email.trim(), amount }, idemKey.current);
      orderRef.current = order.orderId;

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Lumen Foundation',
        description: 'Donation',
        prefill: { name: order.name, email: order.email },
        theme: { color: '#7c5cf0' },
        handler: confirm,
        modal: { ondismiss: () => setPhase((p) => (p === 'checkout' ? 'cancelled' : p)) },
      });
      rzp.on('payment.failed', (r) => { setError(r.error?.description || 'The payment failed.'); setPhase('failed'); });
      setPhase('checkout');
      rzp.open();
    } catch (err) { setError(err.message); setPhase('idle'); }
  }

  if (phase === 'success') {
    return (
      <div className="card result" role="status">
        <h3>Thank you, {result?.name?.split(' ')[0] || 'friend'}.</h3>
        <p>Your {inr(result.amount)} donation is verified and recorded.</p>
        <p className="muted">Payment ID {result.paymentId}</p>
        <button className="btn ghost" onClick={reset}>Give again</button>
      </div>
    );
  }
  if (phase === 'failed' || phase === 'cancelled' || phase === 'pending') {
    const copy = {
      failed: ['Payment didn’t go through', error || 'Your bank declined the payment. You haven’t been charged. Try another method.'],
      cancelled: ['Payment cancelled', 'You closed the payment window. Nothing was charged.'],
      pending: ['Payment is still processing', error || 'Your bank hasn’t confirmed yet. If money was debited it will be matched automatically — check again in a minute.'],
    }[phase];
    return (
      <div className="card result" role="alert">
        <h3>{copy[0]}</h3>
        <p>{copy[1]}</p>
        <div className="row">
          {phase === 'pending' && <button className="btn" onClick={checkStatus}>Check status</button>}
          <button className="btn ghost" onClick={() => { setPhase('idle'); setError(''); }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={donate} noValidate>
      <fieldset disabled={busy}>
        <legend>Choose an amount</legend>
        <div className="amounts">
          {PRESETS.map((v) => (
            <button type="button" key={v} className={`chip ${custom === '' && preset === v ? 'on' : ''}`} aria-pressed={custom === '' && preset === v} onClick={() => { setPreset(v); setCustom(''); }}>{inr(v)}</button>
          ))}
        </div>
        <label>Or enter your own (₹10 – ₹1,00,000)
          <input inputMode="numeric" value={custom} placeholder="Custom amount" onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        </label>
        <label>Full name
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
        </label>
        <label>Email for your receipt
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} required />
        </label>
      </fieldset>
      <dl className="summary">
        <div><dt>Donation</dt><dd>{amountOk ? inr(amount) : '—'}</dd></div>
        <div><dt>Pay with</dt><dd>UPI, cards, net banking, wallets</dd></div>
      </dl>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn big" disabled={!formOk || busy}>
        {phase === 'loading' ? 'Preparing secure checkout…' : phase === 'checkout' ? 'Complete payment in the window…' : phase === 'verifying' ? 'Verifying payment…' : `Donate ${amountOk ? inr(amount) : ''}`.trim()}
      </button>
    </form>
  );
}
