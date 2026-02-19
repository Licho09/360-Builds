document.addEventListener('DOMContentLoaded', function () {
    // ------------------ ELEMENT CHECKS ------------------
    const bookingForm = document.getElementById('bookingForm');
    const calendarGrid = document.getElementById('calendarGrid');
    const timeGrid = document.getElementById('timeGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const displayDateTime = document.getElementById('displayDateTime');

    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyQn65Ow5YEMMY4kNN2PNK5FzdysBV3igm5a69EAN-QeZgBgFJz2khkIhkrl3ljDYX6/exec';

    // ------------------ CALENDAR & TIME ------------------
    if (calendarGrid && timeGrid && currentMonthYear && displayDateTime) {
        let selectedDate = null;
        let selectedTime = null;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        function initCalendar() {
            currentMonthYear.textContent = `${months[currentMonth]} ${currentYear}`;
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            calendarGrid.innerHTML = '';

            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day';
                calendarGrid.appendChild(empty);
            }

            const today = now.getDate();
            const maxSelectableDay = today + 2;

            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                dayEl.textContent = day;

                if (day >= today && day <= maxSelectableDay) {
                    dayEl.classList.add('available');
                    dayEl.addEventListener('click', () => {
                        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                        dayEl.classList.add('selected');
                        selectedDate = new Date(currentYear, currentMonth, day);
                        updateDisplay();
                        generateTimeSlots();
                    });
                }
                calendarGrid.appendChild(dayEl);
            }
        }

        function generateTimeSlots() {
            timeGrid.innerHTML = '';
            const times = ['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
            times.forEach(time => {
                const timeBtn = document.createElement('div');
                timeBtn.className = 'time-btn';
                timeBtn.textContent = time;
                timeBtn.addEventListener('click', () => {
                    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
                    timeBtn.classList.add('active');
                    selectedTime = time;
                    updateDisplay();
                });
                timeGrid.appendChild(timeBtn);
            });
        }

        function updateDisplay() {
            if (selectedDate && selectedTime) {
                const options = { weekday:'short', month:'short', day:'numeric' };
                displayDateTime.textContent = `${selectedDate.toLocaleDateString(undefined, options)} at ${selectedTime}`;
            } else if (selectedDate) {
                const options = { weekday:'short', month:'short', day:'numeric' };
                displayDateTime.textContent = `${selectedDate.toLocaleDateString(undefined, options)} (Select a time)`;
            } else {
                displayDateTime.textContent = '';
            }
        }

        initCalendar();
    }

    // ------------------ FORM SUBMIT ------------------
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Grab calendar values if exist
            const selectedDate = document.getElementById('displayDateTime')?.textContent;
            const name = document.getElementById('userName')?.value;
            const phone = document.getElementById('userPhone')?.value;

            if (!name || !phone) {
                alert('Please enter your name and phone.');
                return;
            }
            if (!selectedDate) {
                alert('Please select a date and time.');
                return;
            }

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            // Get survey data stored in localStorage
            const surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
            const finalData = {
                name,
                phone,
                dateTime: selectedDate,
                ...surveyData
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(finalData));

            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                body: formData
            })
            .then(() => {
                // Save last booking to display on success page
                localStorage.setItem('lastBooking', JSON.stringify(finalData));
                window.location.href = 'success.html';
            })
            .catch(error => {
                alert('There was an error submitting the form.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm Booking';
                }
                console.error(error);
            });
        });
    }

    // ------------------ MULTI-STEP SURVEY LOGIC ------------------
    const steps = document.querySelectorAll('.form-step');
    if (steps.length) {
        const nextBtns = document.querySelectorAll('.next-btn');
        const prevBtns = document.querySelectorAll('.prev-btn');
        const progressBar = document.getElementById('progressBar');
        const currentStepText = document.getElementById('currentStep');
        const totalStepsText = document.getElementById('totalSteps');
        const bookCallBtn = document.getElementById('bookCallBtn');

        let currentStep = 1;
        const totalSteps = steps.length;

        function showStep(step) {
            steps.forEach((s, index) => s.classList.toggle('active', index === step - 1));
            updateProgress();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function updateProgress() {
            const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (currentStepText) currentStepText.textContent = currentStep;
            if (totalStepsText) totalStepsText.textContent = totalSteps;
        }

        function validateStep(step) {
            const stepEl = document.getElementById(`step${step}`);
            const inputs = stepEl?.querySelectorAll('input[required]') || [];
            let isValid = true;
            inputs.forEach(input => {
                const checked = stepEl.querySelectorAll(`input[name="${input.name}"]:checked`);
                if (!checked.length) isValid = false;
            });
            if (!isValid) alert('Please select an option to continue.');
            return isValid;
        }

        nextBtns.forEach(btn => btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        }));

        prevBtns.forEach(btn => btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        }));

        if (bookCallBtn) {
            bookCallBtn.addEventListener('click', () => {
                const homesPerYear = document.querySelector('input[name="homesPerYear"]:checked')?.value;
                const currentTours = document.querySelector('input[name="currentTours"]:checked')?.value;
                localStorage.setItem('surveyData', JSON.stringify({ homesPerYear, currentTours }));
                window.location.href = 'booking.html';
            });
        }

        showStep(currentStep);
    }
});
