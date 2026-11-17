/* Меню, точки и ингредиенты. Всё вымышлено, цены условные. */
export const IMG = '/demos/chasha/assets/';

export const CATS = [
  { id: 'coffee', name: 'Кофе' },
  { id: 'tea', name: 'Чай' },
  { id: 'lemonade', name: 'Лимонады' },
  { id: 'tonic', name: 'Тоники' },
];

export const SIZES = [
  { id: 's', label: 'S', ml: 250, d: -40 },
  { id: 'm', label: 'M', ml: 350, d: 0 },
  { id: 'l', label: 'L', ml: 450, d: 50 },
];
export const SIZES_ESPRESSO = [
  { id: 's', label: 'Один шот', ml: 30, d: -60 },
  { id: 'm', label: 'Двойной', ml: 60, d: 0 },
];

export const MILK = [
  { id: 'none', label: 'Без молока', d: 0 },
  { id: 'oat', label: 'Овсяное', d: 40 },
  { id: 'almond', label: 'Миндальное', d: 50 },
  { id: 'coconut', label: 'Кокосовое', d: 50 },
];

export const ADDONS = [
  { id: 'shot', label: 'Ещё один шот', d: 60 },
  { id: 'spruce', label: 'Сироп из хвои', d: 30 },
  { id: 'honey', label: 'Лесной мёд', d: 30 },
];

export const DRINKS = [
  { id: 'cold-brew', c: '#3b2010', a: '#f0b27a', word: 'Колд-брю', pos: '50% 50%', z: 1.15, o: '50% 70%', name: 'Колд-брю «Чаща»', cat: 'coffee', temp: 'Холодный', price: 290, img: 'd-cold-brew', short: 'Кофе, 14 часов в холоде',
    desc: 'Арабику из Эфиопии настаиваем 14 часов в холоде и разбавляем водой с еловой хвоей. Тёмный и чистый, без горечи.',
    notes: ['14 ч в холоде', 'арабика', 'хвоя ели'], ingr: ['spruce'], milk: true, addons: ['shot', 'spruce', 'honey'] },
  { id: 'latte', c: '#2f2118', a: '#e3c3a0', word: 'Латте', pos: '50% 50%', z: 1.6, o: '50% 72%', name: 'Айс-латте с мёдом', cat: 'coffee', temp: 'Холодный', price: 310, img: 'd-latte', short: 'Эспрессо, молоко, лесной мёд',
    desc: 'Двойной эспрессо, холодное молоко и ложка лесного мёда. Подаём со льдом, пьётся медленно.',
    notes: ['двойной шот', 'лесной мёд', 'лёд'], ingr: [], milk: true, addons: ['shot', 'spruce', 'honey'] },
  { id: 'espresso', c: '#1b2a2e', a: '#ff8a6b', word: 'Эспрессо', pos: '50% 45%', name: 'Эспрессо', cat: 'coffee', temp: 'Горячий', price: 180, img: 'd-espresso', short: 'Плотный, с нотой шоколада', sizes: 'espresso',
    desc: 'Зёрна средней обжарки, 28 секунд экстракции. Плотный вкус с нотой тёмного шоколада и тонкой кислотой.',
    notes: ['28 с', 'средняя обжарка', 'шоколад'], ingr: [], milk: false, addons: ['honey'] },
  { id: 'americano', c: '#1d1b17', a: '#d6ccb4', word: 'Американо', pos: '50% 50%', z: 1.3, o: '50% 50%', f: 'brightness(2) contrast(1.15)', name: 'Американо с чабрецом', cat: 'coffee', temp: 'Горячий', price: 220, img: 'd-americano', short: 'Эспрессо и веточка чабреца',
    desc: 'Эспрессо, горячая вода и веточка чабреца, которую кладём в чашку на минуту. Пахнет нагретым лугом.',
    notes: ['чабрец', 'эспрессо', 'горячая вода'], ingr: ['thyme'], milk: true, addons: ['shot', 'honey'] },
  { id: 'black-tea', c: '#3a1810', a: '#f3b48a', word: 'Чай', pos: '50% 50%', z: 1.25, o: '50% 58%', name: 'Чёрный чай с бергамотом', cat: 'tea', temp: 'Горячий', price: 240, img: 'd-black-tea', short: 'Крупнолистовой, настаивается 4 минуты',
    desc: 'Крупнолистовой чёрный чай с маслом бергамота. Завариваем в чайнике, подаём в стеклянной чашке.',
    notes: ['4 минуты', 'бергамот', 'листовой'], ingr: ['bergamot'], milk: true, addons: ['honey', 'spruce'] },
  { id: 'peach-tea', c: '#4d1c1a', a: '#ffb19a', word: 'Персик', pos: '50% 50%', z: 1.5, o: '50% 58%', name: 'Холодный чай с персиком', cat: 'tea', temp: 'Холодный', price: 270, img: 'd-peach-tea', short: 'Чёрный чай, персик, мята',
    desc: 'Чёрный чай, настоянный на холоде с кусочками персика. Сверху веточка мяты и много льда.',
    notes: ['персик', 'мята', 'лёд'], ingr: ['mint'], milk: false, addons: ['honey', 'spruce'] },
  { id: 'buckthorn', c: '#5a3700', a: '#ffd36a', word: 'Облепиха', pos: '50% 50%', name: 'Облепиха и мята', cat: 'lemonade', temp: 'Холодный', price: 320, img: 'd-buckthorn', short: 'Ягода с Алтая, мята, газ',
    desc: 'Облепиха с Алтая, свежая мята и газированная вода. Кислый и яркий, как первый день осени.',
    notes: ['облепиха', 'мята', 'газ'], ingr: ['buckthorn', 'mint'], milk: false, sweet: true, addons: ['spruce'] },
  { id: 'orange', c: '#5c2a0c', a: '#ffb066', word: 'Апельсин', pos: '50% 50%', name: 'Апельсин и розмарин', cat: 'lemonade', temp: 'Холодный', price: 330, img: 'd-orange', short: 'Апельсин, розмарин, газ',
    desc: 'Свежий апельсин, веточка розмарина и дымная нота от прожарки травы. Подаём с хвойным льдом.',
    notes: ['апельсин', 'розмарин', 'дым'], ingr: ['spruce'], milk: false, sweet: true, addons: ['spruce'] },
  { id: 'turquoise', c: '#073d3b', a: '#6fe6d6', word: 'Бирюза', pos: '50% 50%', name: 'Бирюзовый лимонад', cat: 'lemonade', temp: 'Холодный', price: 340, img: 'd-turquoise', short: 'Синий чай, лимон, мята',
    desc: 'Синий чай анчан, лимон, мята и газированная вода. Цвет меняется от лимона: бирюзовый становится фиолетовым.',
    notes: ['анчан', 'лимон', 'мята'], ingr: ['butterfly', 'mint'], milk: false, sweet: true, addons: ['spruce'] },
  { id: 'fig', c: '#26400f', a: '#c6ef7a', word: 'Инжир', pos: '50% 50%', name: 'Инжир и лайм', cat: 'lemonade', temp: 'Холодный', price: 350, img: 'd-fig', short: 'Инжир, лайм, мята',
    desc: 'Печёный инжир, сок лайма и мята. Густой и мягкий, с лёгкой кислинкой в конце.',
    notes: ['инжир', 'лайм', 'мята'], ingr: ['mint'], milk: false, sweet: true, addons: ['honey'] },
  { id: 'matcha', c: '#0d3a1d', a: '#8fe87d', word: 'Матча', pos: '50% 50%', name: 'Матча-тоник', cat: 'tonic', temp: 'Холодный', price: 360, img: 'd-matcha', short: 'Матча, тоник, лайм',
    desc: 'Церемониальная матча взбиваем с водой и наливаем поверх льда и тоника. Горьковатый и свежий.',
    notes: ['матча', 'тоник', 'лайм'], ingr: [], milk: false, sweet: true, addons: ['honey'] },
  { id: 'mint', c: '#0b3a2e', a: '#86f0c6', word: 'Мята', pos: '50% 50%', name: 'Мятный тоник', cat: 'tonic', temp: 'Холодный', price: 300, img: 'd-mint', short: 'Мята, лайм, тоник',
    desc: 'Горсть мяты, размятой с лаймом, и тоник. Подаём в высоком стакане с большим количеством льда.',
    notes: ['мята', 'лайм', 'тоник'], ingr: ['mint'], milk: false, sweet: true, addons: ['spruce'] },
];

export const INGREDIENTS = [
  { id: 'spruce', name: 'Хвоя ели', origin: 'Карелия', text: 'Молодые побеги собирают в мае, пока они мягкие и светло-зелёные. Сутки сушат в тени и настаивают в холодной воде.', facts: [['Сбор', 'май'], ['Сушка', '24 часа в тени'], ['Вкус', 'смола и цитрус']] },
  { id: 'buckthorn', name: 'Облепиха', origin: 'Алтай', text: 'Ягоду замораживают сразу после сбора, поэтому она сохраняет кислоту и аромат. Давим в день заказа, без сиропа.', facts: [['Сбор', 'сентябрь'], ['Хранение', 'шоковая заморозка'], ['Вкус', 'кислый, яркий']] },
  { id: 'thyme', name: 'Чабрец', origin: 'Южный Урал', text: 'Растёт на сухих склонах и пахнет нагретым лугом. Кладём одну ветку на минуту: больше не нужно.', facts: [['Сбор', 'июль'], ['Заварка', '1 минута'], ['Вкус', 'луг и мёд']] },
  { id: 'mint', name: 'Мята', origin: 'Краснодарский край', text: 'Берём перечную мяту с утренней росой. Мнём руками, а не блендером, чтобы не появилась горечь.', facts: [['Сбор', 'июнь-август'], ['Подача', 'свежая'], ['Вкус', 'холод и сладость']] },
  { id: 'bergamot', name: 'Бергамот', origin: 'Калабрия', text: 'Масло цитруса из итальянской Калабрии добавляют в чёрный листовой чай. Аромат раскрывается в горячей воде.', facts: [['Сбор', 'зима'], ['Заварка', '4 минуты'], ['Вкус', 'цитрус и цветы']] },
  { id: 'butterfly', name: 'Анчан', origin: 'Таиланд', text: 'Цветы синей клитории настаивают в воде. Напиток получается бирюзовым и меняет цвет от лимонного сока.', facts: [['Цвет', 'синий'], ['Реакция', 'с лимоном'], ['Вкус', 'нейтральный']] },
];

export const POINTS = [
  { id: 'lesnaya', name: 'Лесная, 12', note: 'Основная точка и зал на 30 мест', open: 8, close: 22 },
  { id: 'park', name: 'Парк, павильон 3', note: 'Окно выдачи, без зала', open: 9, close: 21 },
  { id: 'vokzal', name: 'Вокзал, 1 этаж', note: 'У входа в кассовый зал', open: 6, close: 23 },
];

export const drinkById = (id) => DRINKS.find((d) => d.id === id);
export const catName = (id) => CATS.find((c) => c.id === id)?.name || '';
export const sizesOf = (d) => (d.sizes === 'espresso' ? SIZES_ESPRESSO : SIZES);

const nf = new Intl.NumberFormat('ru-RU');
export const rub = (n) => `${nf.format(Math.round(n))} ₽`;
export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Цена одной порции с выбранными параметрами. */
export function unitPrice(d, o) {
  const size = sizesOf(d).find((s) => s.id === o.size) || sizesOf(d)[1];
  const milk = MILK.find((m) => m.id === o.milk) || MILK[0];
  const add = (o.addons || []).reduce((s, id) => s + (ADDONS.find((a) => a.id === id)?.d || 0), 0);
  return d.price + size.d + (d.milk ? milk.d : 0) + add;
}

/** Короткое описание выбранных параметров для корзины. */
export function optionsText(d, o) {
  const size = sizesOf(d).find((s) => s.id === o.size) || sizesOf(d)[1];
  const parts = [`${size.label}, ${size.ml} мл`];
  if (d.milk && o.milk && o.milk !== 'none') parts.push(MILK.find((m) => m.id === o.milk).label.toLowerCase() + ' молоко');
  (o.addons || []).forEach((id) => parts.push(ADDONS.find((a) => a.id === id).label.toLowerCase()));
  if (d.sweet && typeof o.sweet === 'number') parts.push(`сладость ${o.sweet}%`);
  return parts.join(', ');
}
