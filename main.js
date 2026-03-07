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
const TOTAL_STEPS = 3;
let currentStep = 1;
let onResultsScreen = false;

// ── JOURNEY INDICATOR ──────────────────────────────────
function updateJourneyIndicator(step) {
  const j1 = document.getElementById('jStep1');
  const j2 = document.getElementById('jStep2');
  const j3 = document.getElementById('jStep3');
  if (!j1 || !j2 || !j3) return;

  [j1, j2, j3].forEach(el => el.classList.remove('active', 'done'));

  if (step === 'booking') {
    j1.classList.add('done');
    j2.classList.add('active');
  } else if (step >= 1 && step <= 3) {
    j1.classList.add('active');
  }
}

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

// ── BUTTON STATE ──────────────────────────────────────
function setNextButtonState(stepNum, enabled) {
  const stepEl = document.getElementById('step' + stepNum);
  if (stepEl) {
    const btn = stepEl.querySelector('.btn-primary');
    if (btn) {
      btn.disabled = !enabled;
      if (enabled) {
        btn.classList.remove('btn-disabled');
      } else {
        btn.classList.add('btn-disabled');
      }
    }
  }
  updateMobileFooter();
}

function checkStepReady(stepNum) {
  if (stepNum === 1) {
    // Step 1 is now checkboxes — at least one must be checked
    return document.querySelectorAll('input[name="marketingChannels"]:checked').length > 0;
  }
  if (stepNum === 2) {
    // Step 2 is now radio — one must be selected
    return !!document.querySelector('input[name="homesPerYear"]:checked');
  }
  if (stepNum === 3) {
    const name = document.getElementById('userName')?.value.trim();
    const phone = document.getElementById('userPhone')?.value.trim();
    return !!(name && phone);
  }
  return false;
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

    // Set initial button state for the step
    if (n !== 2) {
      setNextButtonState(n, checkStepReady(n));
    }
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
  // Only scroll when advancing steps (not on initial load)
  if (n !== 1) {
    const container = document.querySelector('.question-container');
    if (container) window.scrollTo({ top: container.offsetTop - 16, behavior: 'smooth' });
  }

  // ── GA4 STEP TRACKING ──
  if (typeof gtag !== 'undefined') {
    if (n === 1) gtag('event', 'quiz_step_1', { event_category: 'Quiz', event_label: 'Marketing Channels' });
    if (n === 2) gtag('event', 'quiz_step_2', { event_category: 'Quiz', event_label: 'Building Status' });
    if (n === 3) gtag('event', 'quiz_step_3', { event_category: 'Quiz', event_label: 'Contact Details' });
    if (n === 'booking') gtag('event', 'quiz_complete', { event_category: 'Quiz', event_label: 'Qualified' });
  }
}

function validateStep(step) {
  if (step === 2) return true;
  if (step === 3) {
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
  if (!validateStep(3)) return;
  buildSummary();
  showStep('booking');
  launchConfetti();
  if (typeof fbq !== 'undefined') fbq('track', 'Lead');

  const surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
  const channels = Array.isArray(surveyData.channels) ? surveyData.channels : (surveyData.channels ? [surveyData.channels] : []);

  const payload = {
    type: "survey",
    name: surveyData.userName || "",
    phone: surveyData.userPhone || "",
    buildStatus: surveyData.buildStatus || "",
    channels: channels
  };

  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));

  fetch(GOOGLE_SHEET_URL, { method: 'POST', body: formData })
    .catch(err => console.error('Survey save failed:', err));
}

function buildSummary() {
  const homesPerYear = document.querySelector('input[name="homesPerYear"]:checked')?.value || '';
  const channels = [...document.querySelectorAll('input[name="marketingChannels"]:checked')].map(c => c.value);

  const channelMap = {
    'mls': 'MLS',
    'social-media': 'Social media',
    'photos-video': 'Photos or video',
    'referrals': 'Referrals',
    'yard-signs': 'Yard signs',
    'none': 'No real marketing system'
  };

  const userName = document.getElementById('userName') ? document.getElementById('userName').value.trim() : '';
  const userPhone = document.getElementById('userPhone') ? document.getElementById('userPhone').value.trim() : '';

  try {
    localStorage.setItem('surveyData', JSON.stringify({
      buildStatus: homesPerYear, channels, userName, userPhone
    }));
  } catch (e) {}
}

// =====================
// EVENT LISTENERS
// =====================

// Step 1 — enable Next when any checkbox is checked (marketing channels)
document.addEventListener('change', function (e) {
  if (e.target.name === 'marketingChannels') {
    const anyChecked = document.querySelectorAll('input[name="marketingChannels"]:checked').length > 0;
    setNextButtonState(1, anyChecked);
    updateMobileFooter();
  }
  // Step 2 — enable Next when radio selected (build status)
  if (e.target.name === 'homesPerYear') {
    setNextButtonState(2, true);
    updateMobileFooter();
  }
});

// Step 3 — enable "See My Results" as user types name/phone
document.addEventListener('input', function (e) {
  if (e.target.id === 'userName' || e.target.id === 'userPhone') {
    setNextButtonState(3, checkStepReady(3));
  }
});

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
  action.style.flex = '2';

  const isReady = checkStepReady(currentStep);
  action.className = 'btn btn-primary' + (isReady ? '' : ' btn-disabled');
  action.disabled = !isReady;

  if (currentStep < TOTAL_STEPS) {
    action.textContent = 'Next Question';
    action.onclick = () => { if (!action.disabled) nextStep(currentStep); };
  } else {
    action.textContent = 'See My Results \u2192';
    action.onclick = () => { if (!action.disabled) showBooking(); };
  }

  footer.appendChild(action);
}

window.addEventListener('resize', updateMobileFooter);

// Init
showStep(1);
