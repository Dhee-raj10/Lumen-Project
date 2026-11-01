import { useCallback } from 'react';

let pending;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  pending ??= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => { pending = undefined; resolve(false); };
    document.body.appendChild(s);
  });
  return pending;
}

export const useRazorpayScript = () => useCallback(loadRazorpay, []);
