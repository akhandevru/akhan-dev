import { FLATS, CORPUS, STATUS, mln, m2, bedsText, corpusById } from './data.js';
import { cardHTML } from './cards.js';

const PAGE = 12;
const params = new URLSearchParams(location.search);
let corpus = corpusById(params.get('corpus')) ? params.get('corpus') : 'all';
let shown = PAGE;

const tabs = document.getElementById('tabs');
const form = document.getElementById('filters');
const found = document.getElementById('found');
const cards = document.getElementById('cards');
const moreWrap = document.querySelector('.more');
const more = document.getElementById('more');
const boardWrap = document.getElementById('boardwrap');
const board = document.getElementById('board');
const preview = document.getElementById('preview');
const sort = document.getElementById('sort');
const mode = document.getElementById('mode');
const price = form.elements.price;
const area = form.elements.area;

const maxPrice = Math.ceil(Math.max(...FLATS.map((f) => f.price)) / 5e6) * 5;
const minPrice = Math.floor(Math.min(...FLATS.map((f) => f.price)) / 5e6) * 5;
price.min = String(minPrice);
price.max = String(maxPrice);
price.value = String(maxPrice);
price.defaultValue = String(maxPrice);

const tabList = [{ id: 'all', name: 'Все башни' }, ...CORPUS];
tabs.innerHTML = tabList.map((c) => {
  const n = FLATS.filter((f) => (c.id === 'all' || f.corpus === c.id) && f.status === 'free').length;
  return `<label><input type="radio" name="corpus" value="${c.id}"${c.id === corpus ? ' checked' : ''}><span>${c.name}<small>${n}</small></span></label>`;
}).join('');

const read = () => {
  const beds = [...form.querySelectorAll('[name="beds"]:checked')].map((i) => i.value);
  return { beds, price: Number(price.value) * 1e6, area: Number(area.value), view: form.elements.view.value, free: form.elements.free.checked };
};
const fits = (f, q) => {
  if (q.beds.length && !q.beds.includes(f.pent ? 'pent' : String(f.beds))) return false;
  if (f.price > q.price || f.area < q.area) return false;
  if (q.view && !f.view.includes(q.view)) return false;
  if (q.free && f.status !== 'free') return false;
  return true;
};
const matches = (f, q) => (corpus === 'all' || f.corpus === corpus) && fits(f, q);
const SORTS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'area-desc': (a, b) => b.area - a.area,
  'floor-desc': (a, b) => b.floor - a.floor || a.price - b.price,
};

function renderCards(q) {
  const list = FLATS.filter((f) => f.status !== 'sold' && matches(f, q)).sort(SORTS[sort.value]);
  found.innerHTML = list.length ? `Найдено <b>${list.length}</b>, свободно <b>${list.filter((f) => f.status === 'free').length}</b>` : '';
  cards.innerHTML = list.length ? list.slice(0, shown).map(cardHTML).join('') : '<p class="empty">Под фильтры ничего не подошло. Увеличьте цену или снимите часть условий.</p>';
  moreWrap.hidden = list.length <= shown;
  more.textContent = `Показать ещё ${Math.min(PAGE, list.length - shown)}`;
}

function renderBoard(q) {
  const key = corpus === 'all' ? 'A' : corpus;
  const c = corpusById(key);
  const flats = FLATS.filter((f) => f.corpus === key);
  const cols = { A: 6, B: 5, C: 4 }[key];
  let hits = 0, freeHits = 0;
  const rows = [];
  for (let floor = c.floors; floor >= 2; floor--) {
    const cells = flats.filter((f) => f.floor === floor).map((f) => {
      const ok = fits(f, q);
      if (ok) { hits++; if (f.status === 'free') freeHits++; }
      const label = `${bedsText(f.beds, f.pent)}, ${m2(f.area)}, ${floor} этаж, ${STATUS[f.status].toLowerCase()}${f.status === 'sold' ? '' : `, ${mln(f.price)}`}`;
      return `<a class="cell ${f.status}${ok ? '' : ' off'}${f.pent ? ' span2' : ''}" href="flat.html?id=${f.id}" data-id="${f.id}" aria-label="${label}">${Math.round(f.area)}</a>`;
    });
    rows.push(`<div class="floor-row" data-floor="${floor}" style="--cols:${cols}"><span class="fl">${floor}</span>${cells.join('')}</div>`);
  }
  board.innerHTML = rows.join('');
  found.innerHTML = `${c.name}: подходит <b>${hits}</b>, свободно <b>${freeHits}</b>`;
}

function render() {
  const q = read();
  document.getElementById('price-out').textContent = `${price.value} млн ₽`;
  document.getElementById('area-out').textContent = `${area.value} м²`;
  const asBoard = mode.querySelector('input:checked').value === 'board';
  cards.hidden = asBoard;
  moreWrap.hidden = asBoard || moreWrap.hidden;
  boardWrap.hidden = !asBoard;
  sort.hidden = asBoard;
  if (asBoard) { moreWrap.hidden = true; renderBoard(q); } else renderCards(q);
}

const reset = () => { shown = PAGE; render(); };
more.addEventListener('click', () => { shown += PAGE; render(); });
tabs.addEventListener('change', (e) => {
  corpus = e.target.value;
  const url = new URL(location.href);
  if (corpus === 'all') url.searchParams.delete('corpus'); else url.searchParams.set('corpus', corpus);
  history.replaceState(null, '', url);
  reset();
});
form.addEventListener('input', reset);
form.addEventListener('reset', () => setTimeout(reset));
form.addEventListener('submit', (e) => e.preventDefault());
sort.addEventListener('change', reset);
mode.addEventListener('change', reset);

const show = (id) => {
  const f = FLATS.find((x) => x.id === id);
  if (!f) return;
  preview.innerHTML = `<b>${bedsText(f.beds, f.pent)}, ${m2(f.area)}</b><span>${corpusById(f.corpus).name}, ${f.floor} этаж</span><span>Вид: ${f.view.toLowerCase()}</span><b>${f.status === 'sold' ? 'Продана' : mln(f.price)}</b>${f.status === 'hold' ? '<span>Бронь</span>' : ''}`;
  board.querySelectorAll('.floor-row.lit').forEach((r) => r.classList.remove('lit'));
  board.querySelector(`[data-floor="${f.floor}"]`)?.classList.add('lit');
};
const clear = () => board.querySelectorAll('.floor-row.lit').forEach((r) => r.classList.remove('lit'));
board.addEventListener('pointerover', (e) => { const cell = e.target.closest('.cell'); if (cell) show(cell.dataset.id); });
board.addEventListener('pointerleave', clear);
board.addEventListener('focusin', (e) => { const cell = e.target.closest('.cell'); if (cell) show(cell.dataset.id); });
board.addEventListener('focusout', (e) => { if (!board.contains(e.relatedTarget)) clear(); });

render();
