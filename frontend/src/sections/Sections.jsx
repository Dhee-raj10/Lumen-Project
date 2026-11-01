import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Donate from '../components/Donate';
import { chapters, impact } from './content';
import { prefersReducedMotion } from '../hooks/useScrollProgress';

gsap.registerPlugin(ScrollTrigger);

export default function Sections() {
  const root = useRef(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero h1 span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12 });
      gsap.utils.toArray('.panel').forEach((el) => {
        gsap.from(el, { opacity: 0, x: el.classList.contains('right') ? 60 : -60, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={root}>
      <header className="nav"><a href="#top" className="logo">Lumen</a><a href="#donate" className="btn small">Donate</a></header>

      <section className="hero" id="top">
        <h1><span>Make</span> <span>an</span> <span>impact.</span></h1>
        <p>Give once. See exactly where it goes.</p>
        <a href="#donate" className="btn big">Donate now</a>
      </section>

      {chapters.map((c, i) => (
        <section key={c.id} id={c.id} className="chapter">
          <article className={`panel ${i % 2 ? 'right' : ''}`}>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
          </article>
        </section>
      ))}

      <section id="impact" className="chapter">
        <article className="panel wide">
          <h2>What your gift does</h2>
          <ul className="impact">
            {impact.map((i) => (<li key={i.amount}><strong>₹{i.amount.toLocaleString('en-IN')}</strong><span>{i.text}</span></li>))}
          </ul>
        </article>
      </section>

      <section id="donate" className="chapter donate-sec">
        <div className="panel wide"><h2>Give today</h2><p>Secure checkout by Razorpay. Your donation shows as complete only after the bank confirms it.</p></div>
        <Donate />
      </section>

      <section className="chapter finale">
        <h2>Someone is waiting on this.</h2>
        <a href="#donate" className="btn big">Donate now</a>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Lumen Foundation</span>
        <span>We never see or store your card or UPI details.</span>
      </footer>
    </main>
  );
}
