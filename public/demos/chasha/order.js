import './common.js';
import { POINTS, drinkById, unitPrice, optionsText, rub, escapeHTML } from './data.js';
import { load, setQty, remove, clear, keyOf, total } from './cart.js';

const root = document.getElementById('order');
const head = document.querySelector('.page-head');
const params = new URLSearchParams(location.search);
let point = POINTS.some((p) => p.id === params.get('point')) ? params.get('point') : null;
let slot = null;
let pay = 'pickup';
const vals = { name: '', phone: '', note: '' };

const pad = (n) => String(n).padStart(2, '0');
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const isOpen = (p, d) => { const h = d.getHours() + d.getMinutes() / 60; return h >= p.open && h < p.close; };

/* Самое раннее время выдачи: через время приготовления, а если точка закрыта, то после открытия. */
function earliest(p, items) {
  const now = new Date();
  const prep = Math.min(40, 8 + items * 2);
  let t = new Date(now.getTime() + prep * 60000);
  if (!isOpen(p, t)) {
    t = new Date(now);
    if (now.getHours() + now.getMinutes() / 60 >= p.close) t.setDate(t.getDate() + 1);
    t.setHours(p.open, 10, 0, 0);
  }
  t.setMinutes(Math.ceil(t.getMinutes() / 5) * 5, 0, 0);
  return t;
}
const slotsFor = (p, items) => [0, 15, 30, 45].map((m) => new Date(earliest(p, items).getTime() + m * 60000)).filter((t) => isOpen(p, t));
const dayWord = (t) => (t.toDateString() === new Date().toDateString() ? '' : 'завтра, ');
const when = (t) => `${dayWord(t)}${hm(t)}`;

/* Чек. Для готового заказа без кнопок и со штампом. */
function ticketHTML(items, p, slotTime, { final = false, num = '' } = {}) {
  const now = new Date();
  const n = items.reduce((s, i) => s + i.qty, 0);
  return `<div class="ticket-wrap"><div class="ticket" id="ticket" aria-label="Чек заказа">
    <div class="tk-head"><b>Чаща</b><span>${final ? `Чек ${num}` : 'Чек-заказ'}, ${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${hm(now)}</span><span>${p.name}</span></div>
    <ul class="tk-lines">${items.map((i) => {
      const d = drinkById(i.id);
      const k = keyOf(i);
      return `<li class="tk-line"><b>${d.name}</b><span class="sum">${rub(unitPrice(d, i) * i.qty)}</span><small>${optionsText(d, i)}, ${rub(unitPrice(d, i))} × ${i.qty}</small>
        ${final ? '' : `<div class="tk-ctrl"><button type="button" data-k="${k}" data-q="-1" aria-label="Меньше: ${d.name}">−</button><output>${i.qty}</output><button type="button" data-k="${k}" data-q="1" aria-label="Больше: ${d.name}">+</button><button type="button" class="x" data-k="${k}" data-del>Убрать</button></div>`}</li>`;
    }).join('')}</ul>
    <dl class="tk-rows"><div><dt>Напитков</dt><dd>${n} шт.</dd></div><div><dt>Точка</dt><dd>${p.name}</dd></div><div><dt>Выдача</dt><dd>${slotTime ? when(slotTime) : 'не выбрана'}</dd></div></dl>
    <div class="tk-total"><span>Итого</span><b>${rub(items.reduce((s, i) => s + unitPrice(drinkById(i.id), i) * i.qty, 0))}</b></div>
    <div class="bars" aria-hidden="true"></div><span class="tk-stamp${final ? ' on' : ''}">Принят</span>
  </div></div>`;
}

function render() {
  const items = load();
  const n = items.reduce((s, i) => s + i.qty, 0);
  head.hidden = false;
  if (!items.length) {
    root.className = '';
    root.innerHTML = `<p class="empty">Корзина пуста. <a class="link" href="menu.html" style="text-underline-offset:4px">Выберите напиток в меню</a>.</p>`;
    return;
  }
  root.className = 'order';
  const now = new Date();
  const open = POINTS.filter((p) => isOpen(p, now));
  if (!point || !POINTS.some((p) => p.id === point)) point = (open[0] || POINTS[0]).id;
  const p = POINTS.find((x) => x.id === point);
  const slots = slotsFor(p, n);
  if (!slot || !slots.some((t) => t.getTime() === slot)) slot = slots[0]?.getTime() ?? null;

  root.innerHTML = `${ticketHTML(items, p, slot ? new Date(slot) : null)}
  <div class="checkout">
    <section aria-labelledby="b2"><h2 id="b2">Где забрать</h2>
      <fieldset class="picks"><legend class="sr">Точка выдачи</legend>${POINTS.map((x) => {
        const ok = isOpen(x, now) || slotsFor(x, n).length > 0;
        return `<label class="pick"><input type="radio" name="point" value="${x.id}"${x.id === point ? ' checked' : ''}${ok ? '' : ' disabled'}><span><b>${x.name}</b><small>${x.note}</small><em>${isOpen(x, now) ? 'открыто' : `с ${x.open}:00`}</em></span></label>`;
      }).join('')}</fieldset></section>
    <section aria-labelledby="b3"><h2 id="b3">Когда</h2>
      ${slots.length ? `<fieldset style="border:0;padding:0;margin:0"><legend class="sr">Время выдачи</legend><div class="pills">${slots.map((t, i) => `<label class="pill"><input type="radio" name="slot" value="${t.getTime()}"${t.getTime() === slot ? ' checked' : ''}><span>${when(t)}${i === 0 ? '<small>скорее всего</small>' : ''}</span></label>`).join('')}</div></fieldset>` : '<p class="note">В этой точке сегодня уже не успеем. Выберите другую.</p>'}
    </section>
    <form id="who" novalidate class="checkout" style="gap:clamp(32px,4vw,52px)">
      <section aria-labelledby="b4"><h2 id="b4">Кто заберёт</h2>
        <div class="fields">
          <div class="field"><label for="name">Имя</label><input class="input" id="name" name="name" value="${escapeHTML(vals.name)}" autocomplete="name" aria-describedby="name-err"><p class="err" id="name-err" hidden>Напишите, как к вам обращаться.</p></div>
          <div class="field"><label for="phone">Телефон</label><input class="input" id="phone" name="phone" value="${escapeHTML(vals.phone)}" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00…" aria-describedby="phone-err"><p class="err" id="phone-err" hidden>Нужен номер из 11 цифр, например +7 900 000-00-00.</p></div>
        </div>
        <div class="field"><label for="note">Комментарий, если нужен</label><textarea class="input" id="note" name="note" rows="2" autocomplete="off">${escapeHTML(vals.note)}</textarea></div>
      </section>
      <section aria-labelledby="b5"><h2 id="b5">Оплата</h2>
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr">Способ оплаты</legend><div class="pills">
          <label class="pill"><input type="radio" name="pay" value="pickup"${pay === 'pickup' ? ' checked' : ''}><span>В кофейне<small>картой или наличными</small></span></label>
          <label class="pill"><input type="radio" name="pay" value="sbp"${pay === 'sbp' ? ' checked' : ''}><span>СБП онлайн<small>тестовая оплата</small></span></label>
        </div></fieldset>
      </section>
      <div style="display:grid;gap:12px;justify-items:start"><button class="btn" type="submit"${slot ? '' : ' disabled'}>Оформить заказ, ${rub(total())}</button>
        <p class="note">Это демо: заказ никуда не отправляется, данные карты не нужны.</p></div>
    </form>
  </div>`;
}

const check = (input, ok) => {
  input.setAttribute('aria-invalid', String(!ok));
  document.getElementById(`${input.id}-err`).hidden = ok;
  return ok;
};

function done(items, p, slotTime, info) {
  head.hidden = true;
  root.className = 'order';
  const steps = [['Принят', 'Бариста видит ваш заказ'], ['Готовим', 'Собираем напитки и заливаем лёд'], ['Готов', `Ждём на точке «${p.name}»`]];
  root.innerHTML = `${ticketHTML(items, p, slotTime, { final: true, num: info.num })}
  <div class="done" style="padding-bottom:0">
    <span class="label">Заказ ${info.num}</span><h1>Спасибо, ${escapeHTML(info.name)}</h1>
    <p style="color:var(--mute);font-size:18px">Заберите заказ ${when(slotTime)} на точке «${p.name}». ${info.pay === 'sbp' ? 'Оплата прошла (тестовая).' : 'Оплатить можно на месте.'}</p>
    <ol class="track" id="track" aria-live="polite">${steps.map(([t, s]) => `<li><b>${t}</b><span>${s}</span></li>`).join('')}</ol>
    <p class="note">Это демо: статус меняется по таймеру, заказ никуда не отправлен.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="menu.html">Заказать ещё</a><a class="btn btn-line" href="index.html">На главную</a></div>
  </div>`;
  const lis = [...document.querySelectorAll('#track li')];
  const mark = (i) => lis.forEach((li, k) => { li.className = k < i ? 'on' : k === i ? (i === 2 ? 'on' : 'now') : ''; });
  mark(0);
  setTimeout(() => mark(1), 4500);
  setTimeout(() => mark(2), 9500);
  scrollTo({ top: 0 });
}

root.addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  if (b.hasAttribute('data-del')) { remove(b.dataset.k); render(); return; }
  const item = load().find((i) => keyOf(i) === b.dataset.k);
  if (item) { setQty(b.dataset.k, item.qty + Number(b.dataset.q)); render(); }
});
root.addEventListener('input', (e) => { if (e.target.name in vals) vals[e.target.name] = e.target.value; });
root.addEventListener('change', (e) => {
  if (e.target.name === 'point') { point = e.target.value; slot = null; render(); }
  else if (e.target.name === 'slot') { slot = Number(e.target.value); render(); }
  else if (e.target.name === 'pay') pay = e.target.value;
});
root.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.elements.name, phone = form.elements.phone;
  const okName = check(name, name.value.trim().length >= 2);
  const okPhone = check(phone, phone.value.replace(/\D/g, '').length === 11);
  if (!okName) { name.focus(); return; }
  if (!okPhone) { phone.focus(); return; }
  const items = load();
  if (!items.length || !slot) return;
  const p = POINTS.find((x) => x.id === point);
  const info = { num: `Ч-${100 + Math.floor(Math.random() * 900)}`, name: name.value.trim(), pay };
  const snapshot = items.map((i) => ({ ...i }));
  const slotTime = new Date(slot);
  clear();
  done(snapshot, p, slotTime, info);
});

render();
