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
function freeCount(dateKey, dow) {
  return slotsForDay(dow).filter(t => !isBooked(dateKey, t)).length;
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

  const ALL_TIMES = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  function renderGrid() {
    let html = '<div class="bcal__corner"></div>';
    dates.forEach(d => {
      html += `<div class="bcal__col-head">
        <span class="bcal__dow">${DAY_PL[d.getDay()]}</span>
        <span class="bcal__day">${d.getDate()}</span>
        <span class="bcal__mon">${MONTH_PL[d.getMonth()]}</span>
      </div>`;
    });
    ALL_TIMES.forEach(slot => {
      html += `<div class="bcal__time">${slot}</div>`;
      dates.forEach(d => {
        const key = toKey(d);
        if (!slotsForDay(d.getDay()).includes(slot)) {
          html += `<div class="bcal__cell bcal__cell--off"></div>`;
        } else if (isBooked(key, slot)) {
          html += `<div class="bcal__cell bcal__cell--booked"></div>`;
        } else {
          html += `<button class="bcal__cell bcal__cell--free" data-key="${key}" data-time="${slot}" type="button"></button>`;
        }
      });
    });
    calEl.innerHTML = html;

    calEl.querySelectorAll('.bcal__cell--free').forEach(btn => {
      btn.addEventListener('click', () => {
        calEl.querySelectorAll('.bcal__cell--free').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selDate = btn.dataset.key;
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

  renderGrid();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('bName').value.trim();
    const phone = document.getElementById('bPhone').value.trim();
    if (!selDate || !selTime) {
      errorEl.textContent = 'Kliknij wybrany termin w kalendarzu.';
      return;
    }
    if (!name || !phone) {
      errorEl.textContent = 'Wypełnij imię i telefon.';
      return;
    }
    errorEl.textContent = '';
    saveBooking(selDate, selTime);

    // Zamień wolną komórkę na zarezerwowaną
    const cell = calEl.querySelector(`[data-key="${selDate}"][data-time="${selTime}"]`);
    if (cell) {
      const div = document.createElement('div');
      div.className = 'bcal__cell bcal__cell--booked';
      cell.replaceWith(div);
    }

    const d = new Date(selDate + 'T12:00:00');
    confirmMsg.textContent = `Wizyta ${DAY_PL[d.getDay()]} ${d.getDate()} ${MONTH_PL[d.getMonth()]} o ${selTime} — do zobaczenia! Potwierdzenie SMS zostanie wysłane wkrótce.`;
    confirmEl.classList.add('visible');
    form.reset();
    selDate = null; selTime = null;
    selectedEl.classList.remove('visible');
    setTimeout(() => confirmEl.classList.remove('visible'), 8000);
  });
}

initBooking();

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
