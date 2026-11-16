// Признак «страница у самого конца или тянется за него» (резиновая прокрутка на телефоне). Пока это так, фоновые холсты не обновляются:
// иначе их перерисовка спорит с браузером, который двигает страницу за край, и прокрутка подёргивается. Картинка фона просто стоит на месте.
let height = document.documentElement.scrollHeight;
const refresh = () => { height = document.documentElement.scrollHeight; };
if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(document.body);
addEventListener('load', refresh);
addEventListener('resize', refresh, { passive: true });

export const nearEnd = () => scrollY + innerHeight >= height - 3;
