document.addEventListener('DOMContentLoaded', function() {
    const steps = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const progressBar = document.getElementById('progressBar');
    const currentStepText = document.getElementById('currentStep');
    const totalStepsText = document.getElementById('totalSteps');
    const form = document.getElementById('applicationForm');

    let currentStep = 1;
    const totalSteps = steps.length;

    // --- MOBILE STICKY BUTTON ---
    const stickyFooter = document.createElement('div');
    stickyFooter.className = 'mobile-sticky-footer';
    document.body.appendChild(stickyFooter);

    function updateStickyButtons() {
        stickyFooter.innerHTML = '';

        if (window.innerWidth > 768) {
            stickyFooter.style.display = 'none';
            return;
        }

        stickyFooter.style.display = 'flex';

        if (currentStep > 1) {
            const backBtn = document.createElement('button');
            backBtn.className = 'btn btn-secondary';
            backBtn.textContent = 'Back';
            backBtn.style.flex = '1';
            backBtn.onclick = () => {
                currentStep--;
                showStep(currentStep);
                updateProgress();
            };
            stickyFooter.appendChild(backBtn);
        }

        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-primary';
        actionBtn.style.flex = '2';

        if (currentStep === 1) {
            actionBtn.textContent = 'Next Question';
            actionBtn.onclick = () => {
                if (validateStep(currentStep)) {
                    currentStep++;
                    showStep(currentStep);
                    updateProgress();
                }
            };
        } else {
            actionBtn.textContent = 'Continue';
            actionBtn.onclick = handleBookingRedirect;
        }

        stickyFooter.appendChild(actionBtn);
    }

    window.addEventListener('resize', updateStickyButtons);

    updateProgress();
    updateStickyButtons();

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                updateProgress();
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
            updateProgress();
        });
    });

    function handleBookingRedirect() {
        if (!validateStep(currentStep)) return;

        const homesPerYear = document.querySelector('input[name="homesPerYear"]:checked')?.value;
        const currentTours = document.querySelector('input[name="currentTours"]:checked')?.value;

        localStorage.setItem('surveyData', JSON.stringify({
            homesPerYear: homesPerYear,
            currentTours: currentTours
        }));

        window.location.href = 'booking.html';
    }

    function showStep(step) {
        steps.forEach((s, index) => {
            s.classList.toggle('active', index === step - 1);
        });

        updateStickyButtons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateProgress() {
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        currentStepText.textContent = currentStep;
        totalStepsText.textContent = totalSteps;
    }

    function validateStep(step) {
        const currentStepEl = document.getElementById(`step${step}`);
        const inputs = currentStepEl.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            const group = currentStepEl.querySelectorAll(`input[name="${input.name}"]:checked`);
            if (group.length === 0) isValid = false;
        });

        if (!isValid) {
            alert('Please select an option to continue.');
        }

        return isValid;
    }
});
