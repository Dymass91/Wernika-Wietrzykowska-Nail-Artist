// Nav scroll shadow
const nav = document.getElementById('nav');
const topbar = document.querySelector('.topbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile burger toggle
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
burger.addEventListener('click', () => {
  drawer.classList.toggle('open');
});
drawer.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => drawer.classList.remove('open'));
});

// Close drawer on outside click
document.addEventListener('click', (e) => {
  if (!nav.contains(e.target) && !drawer.contains(e.target)) {
    drawer.classList.remove('open');
  }
});

// Contact form
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  note.textContent = 'Dziękuję! Odezwę się wkrótce. ✦';
  form.reset();
  setTimeout(() => { note.textContent = ''; }, 5000);
});
