import { FLATS, mln, m2, bedsText } from './data.js';

/* Цифры в тексте считаются из тех же данных, что шахматка. */
const pent = FLATS.filter((f) => f.pent);
const fromPent = document.querySelector('[data-from="pent"]');
if (fromPent) fromPent.textContent = `от ${mln(Math.min(...pent.map((f) => f.price)))}`;
const types = document.getElementById('types');
if (types) {
  types.innerHTML = [1, 2, 3, 4].map((b) => {
    const list = FLATS.filter((f) => f.beds === b && !f.pent);
    return `<li><b>${bedsText(b)}</b><span>от ${m2(Math.min(...list.map((f) => f.area)))}</span><span>от ${mln(Math.min(...list.map((f) => f.price)))}</span></li>`;
  }).join('');
}

/* Указатель этажа справа: показывает этаж блока, который сейчас в центре экрана. */
const meter = document.getElementById('meter');
const num = document.getElementById('meter-num');
const blocks = [...document.querySelectorAll('[data-floor], .hero')];
if (meter && num && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const floor = Number(e.target.dataset.floor || 0);
      meter.classList.toggle('on', floor > 0);
      if (floor > 0) num.textContent = String(floor);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  blocks.forEach((b) => io.observe(b));
}

/* Лёгкий параллакс первого экрана за курсором: слои едут с разной скоростью, догоняют курсор плавно и останавливаются сами. */
const hero = document.querySelector('.hero');
if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0, last = 0, raf = 0;
  const step = (now) => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const k = 1 - Math.exp(-dt * 5);
    x += (tx - x) * k;
    y += (ty - y) * k;
    hero.style.setProperty('--px', x.toFixed(3));
    hero.style.setProperty('--py', y.toFixed(3));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
    if (!raf) last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    kick();
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
}
