import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { runIntro } from './intro';

gsap.registerPlugin(ScrollTrigger);

type Cleanup = (() => void) | void;
const finePointer = () => matchMedia('(hover:hover) and (pointer:fine)').matches;

/** Имя собирается по буквам из-под маски, на прокрутке строки уходят вверх одна за другой. */
function heroScene(): Cleanup {
  const hero = document.querySelector<HTMLElement>('.hero');
  const chars = gsap.utils.toArray<HTMLElement>('.hero .ch');
  const lines = gsap.utils.toArray<HTMLElement>('.hero .line-in');
  if (!hero || chars.length === 0) return;
  // Вход анимирует буквы, выход на прокрутке анимирует строки: так два твина не спорят за один элемент.
  // Вход имени и всей первой страницы ведёт scripts/intro.ts, чтобы не было мигания «сначала видно, потом прячется».
  runIntro();
  gsap.to(lines, {
    yPercent: -115,
    ease: 'power2.in',
    stagger: 0.12,
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 35%', scrub: 0.4 },
  });
}

/** Карточка проекта отступает назад, когда следующая ложится на неё. */
function cardScene(): Cleanup {
  const cards = gsap.utils.toArray<HTMLElement>('.card.stacked');
  cards.forEach((card, index) => {
    const next = cards[index + 1];
    const body = card.querySelector<HTMLElement>('article');
    if (!next || !body) return;
    gsap.to(body, {
      scale: 0.93,
      filter: 'brightness(.72)',
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 20%', scrub: true },
    });
  });
}

/** Крупный текст «Обо мне» проявляется по словам, пока абзац проходит экран. */
function wordScene(): Cleanup {
  const root = document.querySelector<HTMLElement>('[data-words]');
  const paragraphs = root ? [...root.querySelectorAll<HTMLElement>('p')] : [];
  const originals = paragraphs.map(p => p.innerHTML);
  paragraphs.forEach(p => {
    const fragment = document.createDocumentFragment();
    (p.textContent ?? '').split(/(\s+)/).forEach(part => {
      if (part === '') return;
      if (/^\s+$/.test(part)) { fragment.append(part); return; }
      const word = document.createElement('span');
      word.textContent = part;
      fragment.append(word);
    });
    p.replaceChildren(fragment);
    gsap.fromTo(p.querySelectorAll('span'), { opacity: 0.2 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 55%', scrub: true },
    });
  });
  return () => paragraphs.forEach((p, i) => { p.innerHTML = originals[i] ?? p.innerHTML; });
}

/** Цены считаются от нуля при открытии строки. Итоговый текст всегда совпадает с исходным. */
function priceScene(): Cleanup {
  const prices = gsap.utils.toArray<HTMLElement>('.row .price');
  const originals = prices.map(el => el.textContent ?? '');
  prices.forEach((el, i) => {
    const text = originals[i] ?? '';
    const match = /\d+(?:[\s  ]\d{3})*/.exec(text);
    if (!match) return;
    const target = Number(match[0].replace(/\D/g, ''));
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    const counter = { value: 0 };
    el.textContent = `${before}0${after}`;
    gsap.to(counter, {
      value: target,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = `${before}${Math.round(counter.value).toLocaleString('ru-RU')}${after}`; },
      onComplete: () => { el.textContent = text; },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  return () => prices.forEach((el, i) => { el.textContent = originals[i] ?? el.textContent; });
}

/** Главные кнопки слегка тянутся к курсору. */
function magneticScene(): Cleanup {
  if (!finePointer()) return;
  const undo: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(button => {
    const moveX = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveY = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' });
    const onMove = (event: PointerEvent) => {
      const box = button.getBoundingClientRect();
      moveX((event.clientX - (box.left + box.width / 2)) * 0.3);
      moveY((event.clientY - (box.top + box.height / 2)) * 0.3);
    };
    const onLeave = () => { moveX(0); moveY(0); };
    button.addEventListener('pointermove', onMove);
    button.addEventListener('pointerleave', onLeave);
    undo.push(() => { button.removeEventListener('pointermove', onMove); button.removeEventListener('pointerleave', onLeave); });
  });
  return () => undo.forEach(fn => fn());
}

/** Пункты меню выезжают из-под маски по очереди. */
function menuScene(): Cleanup {
  const menu = document.querySelector<HTMLDialogElement>('#menu');
  if (!menu) return;
  const open = () => {
    gsap.fromTo(menu.querySelectorAll('[data-menu-link] > span'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, delay: 0.05 });
    gsap.fromTo(menu.querySelectorAll('.menu-foot > *'), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.5 });
  };
  menu.addEventListener('menu-open', open);
  return () => menu.removeEventListener('menu-open', open);
}

const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  const undo = [heroScene(), wordScene(), priceScene(), magneticScene(), menuScene()];
  return () => undo.forEach(fn => fn?.());
});
mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => cardScene());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
