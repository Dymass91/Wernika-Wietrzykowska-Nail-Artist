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
  const datesEl   = document.getElementById('bookingDates');
  const slotsEl   = document.getElementById('bookingSlots');
  const selectedEl= document.getElementById('bookingSelected');
  const form      = document.getElementById('bookingForm');
  const errorEl   = document.getElementById('bookingError');
  const confirmEl = document.getElementById('bookingConfirm');
  const confirmMsg= document.getElementById('bookingConfirmMsg');
  if (!datesEl) return;

  // Generuj najbliższe 12 dni roboczych
  const dates = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 1; dates.length < 12; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push(d);
  }

  // Renderuj daty
  datesEl.innerHTML = dates.map(d => {
    const key = toKey(d);
    const free = freeCount(key, d.getDay());
    return `<button class="booking__date-btn" data-key="${key}" data-dow="${d.getDay()}" type="button">
      <span class="booking__date-day">${DAY_PL[d.getDay()]}</span>
      <span class="booking__date-num">${d.getDate()}</span>
      <span class="booking__date-month">${MONTH_PL[d.getMonth()]}</span>
      <span class="booking__date-avail">${free} wolnych</span>
    </button>`;
  }).join('');

  // Klik w datę
  datesEl.querySelectorAll('.booking__date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      datesEl.querySelectorAll('.booking__date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selDate = btn.dataset.key;
      selTime = null;
      updateSelected();
      renderSlots(selDate, parseInt(btn.dataset.dow));
    });
  });

  // Renderuj sloty
  function renderSlots(key, dow) {
    const slots = slotsForDay(dow);
    if (!slots.length) {
      slotsEl.innerHTML = '<p class="booking__closed">Gabinet nieczynny w niedzielę.</p>';
      return;
    }
    const available = slots.filter(t => !isBooked(key, t));
    if (!available.length) {
      slotsEl.innerHTML = '<p class="booking__closed">Brak wolnych terminów w tym dniu.</p>';
      return;
    }
    slotsEl.innerHTML = available.map(t =>
      `<button class="booking__slot-btn" data-time="${t}" type="button">${t}</button>`
    ).join('');

    slotsEl.querySelectorAll('.booking__slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsEl.querySelectorAll('.booking__slot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selTime = btn.dataset.time;
        updateSelected();
      });
    });
  }

  // Pokaż wybrany termin
  function updateSelected() {
    if (selDate && selTime) {
      const d = new Date(selDate + 'T12:00:00');
      selectedEl.textContent = `Wybrany termin: ${DAY_PL[d.getDay()]} ${d.getDate()} ${MONTH_PL[d.getMonth()]} o godz. ${selTime}`;
      selectedEl.classList.add('visible');
    } else if (selDate) {
      selectedEl.textContent = 'Wybierz godzinę →';
      selectedEl.classList.add('visible');
    } else {
      selectedEl.classList.remove('visible');
    }
  }

  // Zapis rezerwacji
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('bName').value.trim();
    const phone = document.getElementById('bPhone').value.trim();
    if (!selDate || !selTime) {
      errorEl.textContent = 'Wybierz dzień i godzinę przed rezerwacją.';
      return;
    }
    if (!name || !phone) {
      errorEl.textContent = 'Wypełnij imię i telefon.';
      return;
    }
    errorEl.textContent = '';

    // Zapisz rezerwację (zastąp fetch() dla prawdziwego API)
    saveBooking(selDate, selTime);

    // Usuń zablokowany slot z widoku
    const slotBtn = slotsEl.querySelector(`[data-time="${selTime}"]`);
    if (slotBtn) slotBtn.remove();

    // Zaktualizuj licznik wolnych miejsc na datach
    const activeDateBtn = datesEl.querySelector(`[data-key="${selDate}"]`);
    if (activeDateBtn) {
      const free = freeCount(selDate, parseInt(activeDateBtn.dataset.dow));
      activeDateBtn.querySelector('.booking__date-avail').textContent = `${free} wolnych`;
    }

    // Potwierdzenie
    const d = new Date(selDate + 'T12:00:00');
    confirmMsg.textContent = `Wizyta w ${DAY_PL[d.getDay()]} ${d.getDate()} ${MONTH_PL[d.getMonth()]} o ${selTime} — do zobaczenia! Potwierdzenie SMS zostanie wysłane wkrótce.`;
    confirmEl.classList.add('visible');
    form.reset();
    selDate = null; selTime = null;
    selectedEl.classList.remove('visible');
    setTimeout(() => confirmEl.classList.remove('visible'), 8000);
  });
}

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
