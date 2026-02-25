// =====================
// CONFETTI
// =====================
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#0062fe', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const pieces = [];

  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      speed: Math.random() * 4 + 2,
      rotSpeed: (Math.random() - 0.5) * 4
    });
  }

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDone = true;
    pieces.forEach(p => {
      p.y += p.speed;
      p.rotation += p.rotSpeed;
      if (p.y < canvas.height + 20) allDone = false;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (!allDone) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  if (frame) cancelAnimationFrame(frame);
  draw();
  setTimeout(() => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 3500);
}

// =====================
// GOOGLE SHEET URL
// =====================
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyQn65Ow5YEMMY4kNN2PNK5FzdysBV3igm5a69EAN-QeZgBgFJz2khkIhkrl3ljDYX6/exec';

// =====================
// FORM LOGIC
// =====================
const TOTAL_STEPS = 5;
let currentStep = 1;
let onResultsScreen = false;

// ── JOURNEY INDICATOR ──────────────────────────────────
function updateJourneyIndicator(step) {
  const j1 = document.getElementById('jStep1');
  const j2 = document.getElementById('jStep2');
  const j3 = document.getElementById('jStep3');
  if (!j1 || !j2 || !j3) return;

  // Reset all
  [j1, j2, j3].forEach(el => {
    el.classList.remove('active', 'done');
  });

  if (step === 'booking') {
    // Results screen — step 2 active, step 1 done
    j1.classList.add('done');
    j2.classList.add('active');
  } else if (step >= 1 && step <= 5) {
    // Answering questions — step 1 active
    j1.classList.add('active');
  }
}

// ── BOOKING PAGE — step 3 active (called from booking.html if needed)
function setJourneyBooking() {
  const j1 = document.getElementById('jStep1');
  const j2 = document.getElementById('jStep2');
  const j3 = document.getElementById('jStep3');
  if (!j1 || !j2 || !j3) return;
  j1.classList.add('done');
  j2.classList.add('done');
  j3.classList.add('active');
}

function updateProgress(step) {
  const pct = step === 'booking' ? 100 : ((step - 1) / TOTAL_STEPS) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('currentStep').textContent = step === 'booking' ? TOTAL_STEPS : step;
  document.getElementById('totalSteps').textContent = TOTAL_STEPS;
}

function showStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const el = n === 'booking'
    ? document.getElementById('stepBooking')
    : document.getElementById('step' + n);
  if (el) el.classList.add('active');

  if (n !== 'booking') {
    currentStep = n;
    onResultsScreen = false;
    const qualifyHeader = document.getElementById('qualifyHeader');
    if (qualifyHeader) qualifyHeader.style.display = '';
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) progressContainer.style.marginTop = '';
  } else {
    onResultsScreen = true;
    const qualifyHeader = document.getElementById('qualifyHeader');
    if (qualifyHeader) qualifyHeader.style.display = 'none';
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) progressContainer.style.marginTop = '0';
  }

  updateProgress(n);
  updateJourneyIndicator(n);
  updateMobileFooter();
  const container = document.querySelector('.question-container');
  if (container) window.scrollTo({ top: container.offsetTop - 16, behavior: 'smooth' });
}

function validateStep(step) {
  if (step === 4) return true;
  if (step === 5) {
    const nameInput = document.getElementById('userName');
    const phoneInput = document.getElementById('userPhone');
    if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
      alert('Please enter your name and phone number.');
      return false;
    }
    return true;
  }
  const stepEl = document.getElementById('step' + step);
  const radios = stepEl.querySelectorAll('input[type="radio"]');
  const names = new Set([...radios].map(r => r.name));
  for (let name of names) {
    if (!stepEl.querySelector(`input[name="${name}"]:checked`)) {
      alert('Please select an option to continue.');
      return false;
    }
  }
  return true;
}

function nextStep(from) {
  if (!validateStep(from)) return;
  showStep(from + 1);
}

function goBack(from) {
  showStep(from - 1);
}

function showBooking() {
  if (!validateStep(5)) return;
  buildSummary();
  showStep('booking');
  launchConfetti();
  if (typeof fbq !== 'undefined') fbq('track', 'Lead');

  // ─── SAVE SURVEY TO GOOGLE SHEETS ───────────────────────
  const surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
  const channels = Array.isArray(surveyData.channels) ? surveyData.channels : (surveyData.channels ? [surveyData.channels] : []);

  const payload = {
    type: "survey",
    name: surveyData.userName || "",
    phone: surveyData.userPhone || "",
    homesPerYear: surveyData.homesPerYear || "",
    currentTours: surveyData.currentTours || "",
    marketingStart: surveyData.marketingStart || "",
    channels: channels
  };

  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));

  fetch(GOOGLE_SHEET_URL, { method: 'POST', body: formData })
    .catch(err => console.error('Survey save failed:', err));
}

function buildSummary() {
  const homesPerYear = document.querySelector('input[name="homesPerYear"]:checked')?.value || '';
  const currentTours = document.querySelector('input[name="currentTours"]:checked')?.value || '';
  const marketingStart = document.querySelector('input[name="marketingStart"]:checked')?.value || '';
  const channels = [...document.querySelectorAll('input[name="marketingChannels"]:checked')].map(c => c.value);

  const startMap = {
    'early-construction': 'Early construction',
    'mid-construction': 'Mid construction',
    'after-completion': 'After completion',
    'varies': 'It varies'
  };
  const toursMap = { 'Yes': 'Yes', 'Interested': 'Interested', 'No': 'No' };
  const channelMap = {
    'mls': 'MLS',
    'social-media': 'Social media',
    'photos-video': 'Photos or video',
    'referrals': 'Referrals',
    'yard-signs': 'Yard signs',
    'none': 'No real marketing system'
  };

  const rows = [];
  if (homesPerYear) rows.push({ label: 'Homes per year', val: homesPerYear });
  if (currentTours) rows.push({ label: 'Virtual tours', val: toursMap[currentTours] || currentTours });
  if (marketingStart) rows.push({ label: 'Marketing start', val: startMap[marketingStart] || marketingStart });
  if (channels.length) rows.push({ label: 'Current marketing', val: channels.map(c => channelMap[c] || c).join(', ') });

  const userName = document.getElementById('userName') ? document.getElementById('userName').value.trim() : '';
  const userPhone = document.getElementById('userPhone') ? document.getElementById('userPhone').value.trim() : '';

  try {
    localStorage.setItem('surveyData', JSON.stringify({
      homesPerYear, currentTours, marketingStart, channels, userName, userPhone
    }));
  } catch (e) {}

  const box = document.getElementById('bookingSummary');
  box.innerHTML = '<p class="booking-summary-label">Your Profile</p>';
  rows.forEach(r => {
    box.innerHTML += `<div class="booking-summary-row">
      <span class="booking-summary-check">✓</span>
      <span class="booking-summary-key">${r.label}:</span>
      <span class="booking-summary-val">${r.val}</span>
    </div>`;
  });
}

// =====================
// MOBILE STICKY FOOTER
// =====================
function updateMobileFooter() {
  const footer = document.getElementById('mobileStickyFooter');
  if (!footer) return;

  if (window.innerWidth > 768 || onResultsScreen) {
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';
  footer.innerHTML = '';

  if (currentStep > 1) {
    const back = document.createElement('button');
    back.className = 'btn btn-secondary';
    back.style.flex = '1';
    back.textContent = 'Back';
    back.onclick = () => goBack(currentStep);
    footer.appendChild(back);
  }

  const action = document.createElement('button');
  action.className = 'btn btn-primary';
  action.style.flex = '2';

  if (currentStep < TOTAL_STEPS) {
    action.textContent = 'Next Question';
    action.onclick = () => nextStep(currentStep);
  } else {
    action.textContent = 'See My Results \u2192';
    action.onclick = () => showBooking();
  }

  footer.appendChild(action);
}

window.addEventListener('resize', updateMobileFooter);

// Init
showStep(1);
