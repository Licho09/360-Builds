document.addEventListener('DOMContentLoaded', function() {
    const steps = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const progressBar = document.getElementById('progressBar');
    const currentStepText = document.getElementById('currentStep');
    const totalStepsText = document.getElementById('totalSteps');
    const bookCallBtn = document.getElementById('bookCallBtn');

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
            var backBtn = document.createElement('button');
            backBtn.className = 'btn btn-secondary';
            backBtn.textContent = 'Back';
            backBtn.style.flex = '1';
            backBtn.onclick = function() {
                currentStep--;
                showStep(currentStep);
                updateProgress();
            };
            stickyFooter.appendChild(backBtn);
        }

        var actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-primary';
        actionBtn.style.flex = '2';

        if (currentStep === 1) {
            actionBtn.textContent = 'Next Question';
            actionBtn.onclick = function() {
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

    nextBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                updateProgress();
            }
        });
    });

    prevBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            currentStep--;
            showStep(currentStep);
            updateProgress();
        });
    });

    if (bookCallBtn) {
        bookCallBtn.addEventListener('click', handleBookingRedirect);
    }

    function handleBookingRedirect() {
        if (!validateStep(currentStep)) return;

        var homesPerYear = document.querySelector('input[name="homesPerYear"]:checked');
        var currentTours = document.querySelector('input[name="currentTours"]:checked');

        localStorage.setItem('surveyData', JSON.stringify({
            homesPerYear: homesPerYear ? homesPerYear.value : '',
            currentTours: currentTours ? currentTours.value : ''
        }));

        window.location.href = 'booking.html';
    }

    function showStep(step) {
        steps.forEach(function(s, index) {
            if (index === step - 1) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });

        updateStickyButtons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateProgress() {
        var progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = progress + '%';
        currentStepText.textContent = currentStep;
        totalStepsText.textContent = totalSteps;
    }

    function validateStep(step) {
        var currentStepEl = document.getElementById('step' + step);
        var inputs = currentStepEl.querySelectorAll('input[required]');
        var isValid = true;

        inputs.forEach(function(input) {
            var group = currentStepEl.querySelectorAll('input[name="' + input.name + '"]:checked');
            if (group.length === 0) isValid = false;
        });

        if (!isValid) {
            alert('Please select an option to continue.');
        }

        return isValid;
    }
});
