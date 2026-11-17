import './common.js';
import { DRINKS, INGREDIENTS, POINTS, drinkById } from './data.js';
import { tileHTML, bindQuick } from './cards.js';

/* Напитки дня: цветные плитки на полке. */
const feat = document.getElementById('featured');
if (feat) {
  feat.innerHTML = ['cold-brew', 'turquoise', 'buckthorn', 'matcha', 'fig', 'black-tea'].map((id) => tileHTML(drinkById(id))).join('');
  bindQuick(feat);
}

/* Ингредиенты: список слева, описание на стекле справа. */
const list = document.getElementById('ingr-list');
const panel = document.getElementById('ingr-panel');
if (list && panel) {
  list.innerHTML = INGREDIENTS.map((g, i) => `<li role="presentation"><button type="button" role="tab" id="tab-${g.id}" aria-controls="ingr-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-id="${g.id}">${g.name}<small>${g.origin}</small></button></li>`).join('');
  const show = (id) => {
    const g = INGREDIENTS.find((x) => x.id === id);
    const used = DRINKS.filter((d) => d.ingr.includes(id));
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.innerHTML = `<span class="label">${g.origin}</span><h3>${g.name}</h3><p>${g.text}</p>
      <dl class="facts">${g.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${used.length ? `<div class="chips">${used.map((d) => `<a class="chip-link" href="drink.html?id=${d.id}">${d.name}</a>`).join('')}</div>` : ''}`;
    list.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  };
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.id); });
  list.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...list.querySelectorAll('button')];
    const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const next = tabs[(i + (e.key === 'ArrowDown' ? 1 : tabs.length - 1)) % tabs.length];
    show(next.dataset.id);
    next.focus();
  });
  show(INGREDIENTS[0].id);
}

/* Точки: открыто или закрыто считается по времени на устройстве. */
const places = document.getElementById('places-list');
if (places) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  places.innerHTML = POINTS.map((p) => {
    const open = h >= p.open && h < p.close;
    return `<li><h3>${p.name}</h3><p class="addr">${p.note}</p>
      <span class="state${open ? '' : ' off'}">${open ? `Открыто до ${p.close}:00` : `Откроемся в ${p.open}:00`}</span>
      <a class="btn btn-line btn-sm" href="order.html?point=${p.id}">Заказать сюда</a></li>`;
  }).join('');
}

/* Мягкое движение слоёв первого экрана за курсором. */
const hero = document.querySelector('.hero');
if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0, last = 0, raf = 0;
  const step = (now) => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const k = 1 - Math.exp(-dt * 4);
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
