export {};
// Меню на весь экран: диалог с фокусом внутри, закрывается Esc, кнопкой и выбором пункта.
const menu = document.querySelector<HTMLDialogElement>('#menu');
let menuOpener: HTMLElement | null = null;

function openMenu() {
  if (!menu || menu.open) return;
  menuOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  menu.showModal();
  document.body.style.overflow = 'hidden';
  menu.dispatchEvent(new CustomEvent('menu-open'));
}

if (menu && typeof menu.showModal === 'function') {
  document.querySelectorAll<HTMLElement>('[data-menu-open]').forEach(button => button.addEventListener('click', openMenu));
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => menu.close());
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach(link => link.addEventListener('click', () => menu.close()));
  menu.addEventListener('close', () => {
    document.body.style.overflow = '';
    menuOpener?.focus({ preventScroll: true });
  });
}

const dialog = document.querySelector<HTMLDialogElement>('#command-palette');
const search = document.querySelector<HTMLInputElement>('#command-search');
const empty = document.querySelector<HTMLElement>('.command-empty');
const commandItems = Array.from(document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('[data-command-item]'));
let previousFocus: HTMLElement | null = null;

function filterCommands() {
  const query = search?.value.trim().toLocaleLowerCase('ru') ?? '';
  let count = 0;
  commandItems.forEach(item => {
    const visible = item.textContent?.toLocaleLowerCase('ru').includes(query) ?? false;
    if (item.parentElement) item.parentElement.hidden = !visible;
    if (visible) count += 1;
  });
  if (empty) empty.hidden = count > 0;
}

function openCommands() {
  if (!dialog || !search || dialog.open) return;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  search.value = '';
  filterCommands();
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  search.focus();
}

document.querySelectorAll<HTMLButtonElement>('[data-command-open]').forEach(button => {
  if (!dialog || typeof dialog.showModal !== 'function') return;
  button.hidden = false;
  const shortcut = button.querySelector('kbd');
  if (shortcut) shortcut.textContent = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';
  button.addEventListener('click', openCommands);
});
document.querySelector('[data-command-close]')?.addEventListener('click', () => dialog?.close());
search?.addEventListener('input', filterCommands);
commandItems.forEach(item => item.addEventListener('click', () => {
  dialog?.close();
  if (item instanceof HTMLAnchorElement && item.hash) {
    const target = document.getElementById(item.hash.slice(1));
    if (target) {
      target.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  }
}));
dialog?.addEventListener('close', () => {
  document.body.style.overflow = '';
  previousFocus?.focus({ preventScroll: true });
});
dialog?.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog?.addEventListener('keydown', event => {
  const visible = commandItems.filter(item => !item.parentElement?.hidden);
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (visible.length === 0) return;
    const index = visible.findIndex(item => item === document.activeElement);
    const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : visible.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
    visible[next]?.focus();
  }
  if (event.key === 'Enter' && document.activeElement === search) {
    event.preventDefault();
    visible[0]?.click();
  }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK' && !event.altKey) {
    event.preventDefault();
    if (dialog?.open) dialog.close(); else openCommands();
  }
});

// Размеры считаются только при загрузке и изменении ширины. Прокрутка выполняется CSS-transform.
document.querySelectorAll<HTMLAnchorElement>('[data-project-preview]').forEach(preview => {
  const viewport = preview.querySelector<HTMLElement>('[data-preview-window]');
  const image = preview.querySelector<HTMLImageElement>('[data-preview-image]');
  if (!viewport || !image) return;
  const measure = () => {
    const travel = Math.max(0, image.getBoundingClientRect().height - viewport.clientHeight);
    preview.style.setProperty('--preview-travel', `${-travel}px`);
    preview.style.setProperty('--preview-duration', `${Math.min(12, Math.max(3, travel / 150))}s`);
  };
  image.addEventListener('load', measure);
  if (image.complete) measure();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(image);
  }
});
document.querySelectorAll<HTMLButtonElement>('[data-preview-toggle]').forEach(button => {
  const preview = document.getElementById(button.dataset['previewTarget'] ?? '')?.querySelector('[data-project-preview]');
  if (!preview) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    const active = preview.classList.toggle('is-scrolling');
    button.setAttribute('aria-pressed', String(active));
    button.textContent = (active ? button.dataset['resetLabel'] : button.dataset['scrollLabel']) ?? '';
  });
});
