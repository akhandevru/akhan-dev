import { count } from './cart.js';

/* Счётчик корзины в шапке. */
const badges = document.querySelectorAll('[data-cart-count]');
const link = document.querySelector('.cart-link');
let last = count();
const paint = () => {
  const n = count();
  badges.forEach((b) => { b.textContent = String(n); });
  if (n > last && link) { link.classList.remove('bump'); void link.offsetWidth; link.classList.add('bump'); }
  last = n;
};
paint();
document.addEventListener('cart:change', paint);
addEventListener('storage', paint);

/* Плашка-уведомление. */
let toast, timer;
export function notify(text, href, label) {
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = text;
  toast.append(span);
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    toast.append(a);
  }
  toast.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('on'), 3600);
}

/* Меню на телефоне. */
const dlg = document.getElementById('menu');
const open = document.querySelector('.menu-btn');
if (dlg && open) {
  open.addEventListener('click', () => dlg.showModal());
  dlg.querySelector('.close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });
}

/* Шапка получает плотный фон, когда страница уехала вверх. */
const bar = document.querySelector('.bar');
if (bar && 'IntersectionObserver' in window) {
  const probe = document.createElement('i');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none';
  document.body.prepend(probe);
  new IntersectionObserver(([e]) => bar.classList.toggle('solid', !e.isIntersecting)).observe(probe);
}
