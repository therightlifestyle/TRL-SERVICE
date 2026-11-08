const root = document.documentElement;
root.classList.add('js');
const themeButton = document.querySelector('[data-theme-toggle]');
const savedTheme = (() => { try { return localStorage.getItem('trl-v4-theme'); } catch { return null; } })();
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('trl-v4-theme', next); } catch { /* theme preference is optional */ }
  themeButton.setAttribute('aria-label', `Switch to ${next === 'light' ? 'dark' : 'light'} theme`);
  themeButton.title = `Switch to ${next === 'light' ? 'dark' : 'light'} theme`;
});

const menuButton = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-main-nav]');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const currentPage = document.body.dataset.page;
document.querySelectorAll('[data-nav]').forEach((link) => {
  if (link.dataset.nav === currentPage) link.setAttribute('aria-current', 'page');
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
} else {
  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
