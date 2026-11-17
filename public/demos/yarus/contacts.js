import { flatById, corpusById, bedsText, m2, escapeHTML } from './data.js';

const form = document.getElementById('visit');
const flat = flatById(new URLSearchParams(location.search).get('flat'));

/* Ближайшие 7 дней и слоты по полтора часа. */
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const wd = (d) => d.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '');
const SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];

form.innerHTML = `
  <h2>Выберите время</h2>
  <p class="summary" aria-live="polite" id="summary"></p>
  ${flat ? `<p class="flat-meta">Квартира: ${bedsText(flat.beds, flat.pent).toLowerCase()}, ${m2(flat.area)}, ${corpusById(flat.corpus).name.replace('Башня', 'башня')}, ${flat.floor} этаж</p><input type="hidden" name="flat" value="${flat.id}">` : ''}
  <fieldset><legend>Формат</legend>
    <div class="seg">
      <label><input type="radio" name="format" value="showroom" checked><span>В шоуруме</span></label>
      <label><input type="radio" name="format" value="video"><span>Видеопоказ</span></label>
    </div>
  </fieldset>
  <fieldset><legend>День</legend><div class="days">
    ${days.map((d, i) => `<label class="day"><input type="radio" name="day" value="${iso(d)}"${i === 0 ? ' checked' : ''}><span><small>${wd(d)}</small><b>${d.getDate()}</b></span></label>`).join('')}
  </div></fieldset>
  <fieldset><legend>Время</legend><div class="slots">
    ${SLOTS.map((s, i) => `<label class="slot"><input type="radio" name="time" value="${s}"${i === 3 ? ' checked' : ''}><span>${s}</span></label>`).join('')}
  </div></fieldset>
  <div class="field">
    <label for="name">Имя</label>
    <input class="input" id="name" name="name" autocomplete="name" aria-describedby="name-err">
    <p class="err" id="name-err" hidden>Напишите, как к вам обращаться.</p>
  </div>
  <div class="field">
    <label for="phone">Телефон</label>
    <input class="input" id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00…" aria-describedby="phone-err">
    <p class="err" id="phone-err" hidden>Нужен номер из 11 цифр, например +7 900 000-00-00.</p>
  </div>
  <div class="field">
    <label for="note">Комментарий, если нужен</label>
    <textarea class="input" id="note" name="note" rows="3" autocomplete="off"></textarea>
  </div>
  <button class="btn btn-ink" type="submit">Записаться на показ</button>
`;

const summary = document.getElementById('summary');
const dayOf = () => days.find((d) => iso(d) === form.elements.day.value);
const longDay = (d) => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
function updateSummary() {
  const video = form.elements.format.value === 'video';
  summary.innerHTML = `<b>${longDay(dayOf())}, ${form.elements.time.value}</b><span>${video ? 'Видеопоказ' : 'Шоурум, Ярусная набережная, 7'}</span>`;
}
form.addEventListener('change', updateSummary);
updateSummary();

const check = (input, ok) => {
  input.setAttribute('aria-invalid', String(!ok));
  document.getElementById(`${input.id}-err`).hidden = ok;
  return ok;
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name;
  const phone = form.elements.phone;
  const okName = check(name, name.value.trim().length >= 2);
  const okPhone = check(phone, phone.value.replace(/\D/g, '').length === 11);
  if (!okName) { name.focus(); return; }
  if (!okPhone) { phone.focus(); return; }
  const video = form.elements.format.value === 'video';
  form.innerHTML = `<div class="done" tabindex="-1">
    <h2>Показ записан</h2>
    <p>${escapeHTML(name.value.trim())}, ждём вас ${longDay(dayOf())} в ${form.elements.time.value}${video ? '. Ссылку на видеопоказ пришлём в мессенджер' : ' по адресу Ярусная набережная, 7'}.</p>
    <p>Это демо: заявка никуда не отправлена.</p>
    <p><a class="link" href="apartments.html">Вернуться к каталогу</a></p>
  </div>`;
  form.querySelector('.done').focus();
});
