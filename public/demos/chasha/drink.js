import './common.js';
import { IMG, DRINKS, MILK, ADDONS, drinkById, catName, sizesOf, unitPrice, optionsText, rub } from './data.js';
import { add } from './cart.js';
import { notify } from './common.js';

const root = document.getElementById('dp');
const id = new URLSearchParams(location.search).get('id');
const d = drinkById(id) || DRINKS[0];
document.title = `${d.name} - Чаща`;
root.style.setProperty('--c', d.c);
root.style.setProperty('--a', d.a);

const sizes = sizesOf(d);
const addons = d.addons.map((a) => ADDONS.find((x) => x.id === a));
const sign = (n) => (n === 0 ? 'без доплаты' : n < 0 ? `−${rub(-n)}` : `+${rub(n)}`);

root.innerHTML = `
  <p class="dp-word" id="word" aria-hidden="true">${d.word}</p>
  <div class="dp-grid">
    <div class="dp-art"><img src="${IMG}${d.img}.webp" width="1100" height="1375" alt="${d.name}" style="object-position:${d.pos};scale:${d.z || 1};transform-origin:${d.o || '50% 50%'};filter:${d.f || 'none'}"></div>
    <form class="dp-form" id="form" novalidate>
      <nav class="crumbs" aria-label="Навигационная цепочка"><a href="menu.html">Меню</a><span aria-hidden="true">/</span><a href="menu.html?d=${d.id}">${catName(d.cat)}</a><span aria-hidden="true">/</span><span>${d.temp}</span></nav>
      <div style="display:grid;gap:18px"><h1>${d.name}</h1><p class="lead">${d.desc}</p>
        <ul class="notes">${d.notes.map((n) => `<li>${n}</li>`).join('')}</ul></div>
      <fieldset><legend>Размер</legend><div class="pills">
        ${sizes.map((s) => `<label class="pill"><input type="radio" name="size" value="${s.id}"${s.id === 'm' ? ' checked' : ''}><span>${s.label}<small>${s.ml} мл, ${sign(s.d)}</small></span></label>`).join('')}
      </div></fieldset>
      ${d.milk ? `<fieldset><legend>Молоко</legend><div class="pills">
        ${MILK.map((m, i) => `<label class="pill"><input type="radio" name="milk" value="${m.id}"${i === 0 ? ' checked' : ''}><span>${m.label}<small>${sign(m.d)}</small></span></label>`).join('')}
      </div></fieldset>` : ''}
      ${d.sweet ? `<div class="sweet"><label class="lg" for="sweet-in">Сладость <output id="sweet-out">50%</output></label><input type="range" id="sweet-in" name="sweet" min="0" max="100" step="25" value="50"></div>` : ''}
      <fieldset><legend>Добавки</legend><div class="pills">
        ${addons.map((a) => `<label class="pill"><input type="checkbox" name="addon" value="${a.id}"><span>${a.label}<small>+${rub(a.d)}</small></span></label>`).join('')}
      </div></fieldset>
      <div class="buy-bar">
        <div class="qty" role="group" aria-label="Количество"><button type="button" data-q="-1" aria-label="Меньше">−</button><output id="qty" aria-live="polite">1</output><button type="button" data-q="1" aria-label="Больше">+</button></div>
        <button class="btn" type="submit">В корзину</button>
        <span class="total" id="total" aria-live="polite"></span>
      </div>
    </form>
  </div>`;

const form = document.getElementById('form');
const word = document.getElementById('word');
let qty = 1;

function fit() {
  word.style.fontSize = '100px';
  const w = word.getBoundingClientRect().width || 1;
  word.style.fontSize = `${Math.min((100 * innerWidth * 0.94) / w, innerHeight * 0.38)}px`;
}
addEventListener('resize', fit);
document.fonts?.ready.then(fit);
fit();

const read = () => ({
  size: form.elements.size.value,
  milk: d.milk ? form.elements.milk.value : 'none',
  addons: [...form.querySelectorAll('[name="addon"]:checked')].map((i) => i.value),
  sweet: d.sweet ? Number(form.elements.sweet.value) : undefined,
});
function paint() {
  const o = read();
  document.getElementById('total').textContent = rub(unitPrice(d, o) * qty);
  const out = document.getElementById('sweet-out');
  if (out) out.textContent = `${o.sweet}%`;
  document.getElementById('qty').textContent = String(qty);
}
form.addEventListener('input', paint);
form.addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]');
  if (!b) return;
  qty = Math.max(1, Math.min(9, qty + Number(b.dataset.q)));
  paint();
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const o = read();
  add({ id: d.id, ...o, qty });
  notify(`Добавлено: ${d.name}, ${optionsText(d, o)}`, 'order.html', 'Оформить');
});
paint();
