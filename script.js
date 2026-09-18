// ============================================================
// BOOKING SYSTEM
// Dane trzymane w localStorage.
// TODO: zamień saveBooking() / getBookings() na wywołania API
//       np. fetch('/api/bookings', { method:'POST', body: JSON.stringify({date,time,name,phone,service}) })
// ============================================================
const BOOKING_KEY = 'ww_bookings_v1';
const DAY_PL   = ['Ndz','Pon','Wt','Śr','Czw','Pt','Sob'];
const MONTH_PL = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

function getBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKING_KEY) || '{}'); }
  catch { return {}; }
}
function saveBooking(dateKey, time) {
  const b = getBookings();
  if (!b[dateKey]) b[dateKey] = [];
  b[dateKey].push(time);
  localStorage.setItem(BOOKING_KEY, JSON.stringify(b));
}
function isBooked(dateKey, time) {
  return (getBookings()[dateKey] || []).includes(time);
}
function toKey(d) {
  return d.toISOString().split('T')[0];
}
function slotsForDay(dow) {
  if (dow === 0) return [];
  if (dow === 6) return ['9:00','10:00','11:00','12:00','13:00','14:00'];
  return ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
}

let selDate = null;
let selTime = null;

function initBooking() {
  const calEl     = document.getElementById('bookingCalendar');
  const selectedEl= document.getElementById('bookingSelected');
  const form      = document.getElementById('bookingForm');
  const errorEl   = document.getElementById('bookingError');
  const confirmEl = document.getElementById('bookingConfirm');
  const confirmMsg= document.getElementById('bookingConfirmMsg');
  if (!calEl) return;

  // 6 najbliższych dni roboczych (bez niedzieli)
  const today = new Date(); today.setHours(0,0,0,0);
  const dates = [];
  for (let i = 1; dates.length < 6; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push(d);
  }

  let viewedKey = toKey(dates[0]);

  function renderDays() {
    let html = '<div class="bday-row" role="tablist" aria-label="Wybierz dzień">';
    dates.forEach(d => {
      const key = toKey(d);
      const isActive = key === viewedKey;
      html += `<button type="button" class="bday${isActive ? ' active' : ''}" data-key="${key}" role="tab" aria-selected="${isActive}">
        <span class="bday__dow">${DAY_PL[d.getDay()]}</span>
        <span class="bday__num">${d.getDate()}</span>
        <span class="bday__mon">${MONTH_PL[d.getMonth()]}</span>
      </button>`;
    });
    html += '</div><div class="btime-row" id="btimeRow"></div>';
    calEl.innerHTML = html;

    calEl.querySelectorAll('.bday').forEach(btn => {
      btn.addEventListener('click', () => {
        viewedKey = btn.dataset.key;
        calEl.querySelectorAll('.bday').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        renderTimes();
      });
    });

    renderTimes();
  }

  function renderTimes() {
    const timeRow = document.getElementById('btimeRow');
    const d = dates.find(dd => toKey(dd) === viewedKey);
    const slots = slotsForDay(d.getDay());
    if (!slots.length) {
      timeRow.innerHTML = '<p class="btime-empty">Ten dzień jest niedostępny do rezerwacji.</p>';
      return;
    }
    timeRow.innerHTML = slots.map(slot => {
      const booked = isBooked(viewedKey, slot);
      const isSel = selDate === viewedKey && selTime === slot;
      if (booked) return `<span class="btime btime--booked">${slot}</span>`;
      return `<button type="button" class="btime btime--free${isSel ? ' active' : ''}" data-time="${slot}">${slot}</button>`;
    }).join('');

    timeRow.querySelectorAll('.btime--free').forEach(btn => {
      btn.addEventListener('click', () => {
        timeRow.querySelectorAll('.btime--free').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selDate = viewedKey;
        selTime = btn.dataset.time;
        updateSelected();
      });
    });
  }

  function updateSelected() {
    if (selDate && selTime) {
      const d = new Date(selDate + 'T12:00:00');
      selectedEl.textContent = `Wybrany termin: ${DAY_PL[d.getDay()]} ${d.getDate()} ${MONTH_PL[d.getMonth()]} o godz. ${selTime}`;
      selectedEl.classList.add('visible');
    } else {
      selectedEl.classList.remove('visible');
    }
  }

  renderDays();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('bName').value.trim();
    const phone = document.getElementById('bPhone').value.trim();
    if (!selDate || !selTime) {
      errorEl.textContent = 'Wybierz wolny termin powyżej.';
      return;
    }
    if (!name || !phone) {
      errorEl.textContent = 'Wypełnij imię i telefon.';
      return;
    }
    errorEl.textContent = '';
    saveBooking(selDate, selTime);

    const d = new Date(selDate + 'T12:00:00');
    confirmMsg.textContent = `Wizyta ${DAY_PL[d.getDay()]} ${d.getDate()} ${MONTH_PL[d.getMonth()]} o ${selTime} — do zobaczenia!`;
    confirmEl.classList.add('visible');
    form.reset();
    selDate = null; selTime = null;
    selectedEl.classList.remove('visible');
    renderTimes();
    setTimeout(() => confirmEl.classList.remove('visible'), 8000);
  });
}

initBooking();

// ============================================================
// NAV — sticky shadow, mobile fullscreen menu
// ============================================================
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

const stickyCtaEl = document.querySelector('.sticky-cta');
burger.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (stickyCtaEl) stickyCtaEl.classList.toggle('menu-open', isOpen);
});
menu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (stickyCtaEl) stickyCtaEl.classList.remove('menu-open');
  });
});

// ============================================================
// PRICING — accordion
// ============================================================
function setAccBody(item, open) {
  const body = item.querySelector('.acc-item__body');
  const head = item.querySelector('.acc-item__head');
  item.classList.toggle('active', open);
  head.setAttribute('aria-expanded', String(open));
  body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
}

const accItems = document.querySelectorAll('.acc-item');
accItems.forEach(item => {
  const head = item.querySelector('.acc-item__head');
  head.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    accItems.forEach(i => setAccBody(i, false));
    if (!isActive) setAccBody(item, true);
  });
});
// Initialize the default-open item (marked with .active in markup) after layout.
window.addEventListener('load', () => {
  accItems.forEach(item => {
    if (item.classList.contains('active')) setAccBody(item, true);
  });
});
// Recalculate open panel height on resize (text reflow changes scrollHeight).
window.addEventListener('resize', () => {
  accItems.forEach(item => {
    if (item.classList.contains('active')) {
      item.querySelector('.acc-item__body').style.maxHeight = 'none';
      const h = item.querySelector('.acc-item__body').scrollHeight;
      item.querySelector('.acc-item__body').style.maxHeight = h + 'px';
    }
  });
});

// ============================================================
// SCROLL REVEAL
// ============================================================
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets = document.querySelectorAll('.result, .service-row, .stat, .acc-item');

if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach(el => {
    const rect = el.getBoundingClientRect();
    // Elements already in (or above) the viewport on load don't need to animate in.
    if (rect.top > window.innerHeight * 0.92) {
      el.classList.add('pre-reveal');
      io.observe(el);
    }
  });
}

// ============================================================
// TESTIMONIAL CAROUSEL
// ============================================================
(function initProofCarousel() {
  const slides = document.querySelectorAll('.proof__slide');
  const counter = document.getElementById('proofCurrent');
  const prevBtn = document.getElementById('proofPrev');
  const nextBtn = document.getElementById('proofNext');
  if (!slides.length) return;
  let index = 0;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('active', n === index));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
  }

  prevBtn?.addEventListener('click', () => show(index - 1));
  nextBtn?.addEventListener('click', () => show(index + 1));

  if (!reduceMotion) {
    setInterval(() => show(index + 1), 7000);
  }
})();

// ============================================================
// STICKY MOBILE CTA — hidden while hero (with its own CTA) is in view
// ============================================================
const stickyCta = document.querySelector('.sticky-cta');
const heroSection = document.getElementById('hero');
if (stickyCta && heroSection && 'IntersectionObserver' in window) {
  const heroIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      stickyCta.classList.toggle('visible', !entry.isIntersecting);
    });
  }, { threshold: 0 });
  heroIo.observe(heroSection);
} else if (stickyCta) {
  stickyCta.classList.add('visible');
}

