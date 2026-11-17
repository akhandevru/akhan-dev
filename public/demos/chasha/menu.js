import './common.js';
import { DRINKS, CATS, IMG, catName, rub } from './data.js';
import { rowHTML, bindQuick, quickAdd } from './cards.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.getElementById('stage');
const tabs = document.getElementById('tabs');
const word = document.getElementById('word');
const img = document.getElementById('img');
const info = document.getElementById('info');
const count = document.getElementById('count');
const dots = document.getElementById('dots');
const rows = document.getElementById('rows');
const temp = document.getElementById('temp');
const sort = document.getElementById('sort');
const found = document.getElementById('found');

const params = new URLSearchParams(location.search);
const startId = params.get('d');
let cat = 'all';
let list = DRINKS.slice();
let idx = Math.max(0, DRINKS.findIndex((d) => d.id === startId));
let busy = false, pending = null;

const all = [{ id: 'all', name: 'Все' }, ...CATS];
tabs.innerHTML = all.map((c) => `<label class="pill"><input type="radio" name="cat" value="${c.id}"${c.id === 'all' ? ' checked' : ''}><span>${c.name}<small>${c.id === 'all' ? DRINKS.length : DRINKS.filter((d) => d.cat === c.id).length}</small></span></label>`).join('');

/* Название на весь экран: подбираем размер так, чтобы слово занимало почти всю ширину. */
function fit() {
  word.style.fontSize = '100px';
  const w = word.getBoundingClientRect().width || 1;
  word.style.fontSize = `${Math.min((100 * innerWidth * 0.94) / w, innerHeight * 0.4)}px`;
}

const anim = (el, kf, ms) => (still ? Promise.resolve() : el.animate(kf, { duration: ms, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'both' }).finished.catch(() => {}));
const preload = (src) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = src; });

function paintInfo(d) {
  info.innerHTML = `<span class="mono" style="color:var(--a)">${catName(d.cat)}, ${d.temp.toLowerCase()}</span>
    <h1>${d.name}</h1><p>${d.desc}</p>
    <div class="buy"><span class="price">${rub(d.price)}</span><button class="btn" type="button" data-add="${d.id}">В корзину</button><a class="btn btn-line" href="drink.html?id=${d.id}">Параметры</a></div>`;
}

async function show(i, dir = 1) {
  if (!list.length) return;
  if (busy) { pending = [i, dir]; return; }
  busy = true;
  idx = ((i % list.length) + list.length) % list.length;
  const d = list[idx];
  stage.style.setProperty('--c', d.c);
  stage.style.setProperty('--a', d.a);
  const shift = `${dir * 40}px`;
  await Promise.all([
    anim(word, [{ opacity: 1 }, { opacity: 0, transform: `translateX(${-dir * 40}px)` }], 160),
    anim(img, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], 160),
    anim(info, [{ opacity: 1 }, { opacity: 0 }], 120),
  ]);
  await preload(`${IMG}${d.img}.webp`);
  word.textContent = d.word;
  fit();
  img.src = `${IMG}${d.img}.webp`;
  img.style.objectPosition = d.pos;
  img.style.scale = String(d.z || 1);
  img.style.filter = d.f || '';
  img.style.transformOrigin = d.o || '50% 50%';
  img.alt = `${d.name}`;
  paintInfo(d);
  count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  dots.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', String(k === idx)));
  const url = new URL(location.href);
  url.searchParams.set('d', d.id);
  history.replaceState(null, '', url);
  await Promise.all([
    anim(word, [{ opacity: 0, transform: `translateX(${shift})` }, { opacity: 1, transform: 'none' }], 520),
    anim(img, [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'none' }], 560),
    anim(info, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 420),
  ]);
  busy = false;
  if (pending) { const [pi, pd] = pending; pending = null; show(pi, pd); }
}

function buildDots() {
  dots.innerHTML = list.map((d, k) => `<button type="button" aria-label="${d.name}" data-i="${k}"></button>`).join('');
}

/* Полный список под сценой. */
const SORTS = { def: () => 0, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name, 'ru') };
function renderRows() {
  const items = DRINKS.filter((d) => (cat === 'all' || d.cat === cat) && (!temp.value || d.temp === temp.value)).sort(SORTS[sort.value]);
  found.textContent = `Найдено: ${items.length}`;
  rows.innerHTML = items.map(rowHTML).join('');
}

function setCat(next) {
  cat = next;
  const current = list[idx]?.id;
  list = DRINKS.filter((d) => cat === 'all' || d.cat === cat);
  buildDots();
  const keep = list.findIndex((d) => d.id === current);
  show(keep >= 0 ? keep : 0, 1);
  renderRows();
}

tabs.addEventListener('change', (e) => setCat(e.target.value));
temp.addEventListener('change', renderRows);
sort.addEventListener('change', renderRows);
document.getElementById('prev').addEventListener('click', () => show(idx - 1, -1));
document.getElementById('next').addEventListener('click', () => show(idx + 1, 1));
dots.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { const k = Number(b.dataset.i); show(k, k > idx ? 1 : -1); } });
stage.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) quickAdd(b.dataset.add); });
bindQuick(rows);

addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') show(idx + 1, 1);
  if (e.key === 'ArrowLeft') show(idx - 1, -1);
});

/* Свайп по сцене. */
let sx = 0, sy = 0, sid = null;
stage.addEventListener('pointerdown', (e) => { if (e.target.closest('a, button, label, input')) return; sx = e.clientX; sy = e.clientY; sid = e.pointerId; });
stage.addEventListener('pointerup', (e) => {
  if (sid !== e.pointerId) return;
  sid = null;
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});
stage.addEventListener('pointercancel', () => { sid = null; });
addEventListener('resize', fit);
document.fonts?.ready.then(fit);

buildDots();
renderRows();
show(idx, 1);
