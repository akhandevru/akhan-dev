// Лёгкое состояние вступительной анимации главной (без GSAP), чтобы им могли пользоваться плашка cookie и 3D-сцена на любых страницах.
// introActive: вступление идёт (класс intro поставлен скриптом в head); introBang: звезда взорвалась (можно запускать тяжёлую 3D-сцену);
// holeBorn: сцена нарисовала первый кадр чёрной дыры (после этого дыра растёт, потом появляется текст); introDone: вступление закончилось.
// Если вступления нет, все обещания уже выполнены. Страховка: через 11 секунд они выполняются в любом случае.
const root = document.documentElement;
export const introActive = root.classList.contains('intro');
export let finishBang!: () => void;
export let finishDone!: () => void;
export let markHoleBorn!: () => void;
export const introBang = new Promise<void>(resolve => { finishBang = resolve; });
export const holeBorn = new Promise<void>(resolve => { markHoleBorn = resolve; });
export const introDone = new Promise<void>(resolve => { finishDone = resolve; });
if (!introActive) { finishBang(); markHoleBorn(); finishDone(); }
else setTimeout(() => { finishBang(); markHoleBorn(); finishDone(); }, 11000);
