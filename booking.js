document.addEventListener('DOMContentLoaded', function () {
    // ------------------ ELEMENT CHECKS ------------------
    const bookingForm = document.getElementById('bookingForm');
    const calendarGrid = document.getElementById('calendarGrid');
    const timeGrid = document.getElementById('timeGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const displayDateTime = document.getElementById('displayDateTime');
    const continueToFormBtn = document.getElementById('continueToFormBtn');

    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyQn65Ow5YEMMY4kNN2PNK5FzdysBV3igm5a69EAN-QeZgBgFJz2khkIhkrl3ljDYX6/exec';

    // ------------------ MOBILE STEP MANAGEMENT ------------------
    let mobileCurrentStep = 1;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function showMobileStep(step) {
        if (!isMobile()) return;

        // Hide all mobile steps
        document.querySelectorAll('.booking-step-mobile').forEach(el => {
            el.classList.remove('active');
        });

        // Show appropriate step
        if (step === 1) {
            document.getElementById('bookingStepCalendar').classList.add('active');
        } else if (step === 2) {
            document.getElementById('bookingStepTime').classList.add('active');
        } else if (step === 3) {
            document.getElementById('bookingStepContinue').classList.add('active');
        } else if (step === 4) {
            document.getElementById('bookingStepForm').classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Initialize mobile view
    if (isMobile()) {
        showMobileStep(1);
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            // Show all steps on desktop
            document.querySelectorAll('.booking-step-mobile').forEach(el => {
                el.classList.add('active');
            });
        } else {
            // Restore mobile step view
            showMobileStep(mobileCurrentStep);
        }
    });

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

                        // On mobile, move to time selection step
                        if (isMobile()) {
                            mobileCurrentStep = 2;
                            showMobileStep(2);
                        }
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

                    // On mobile, show continue button
                    if (isMobile()) {
                        mobileCurrentStep = 3;
                        showMobileStep(3);
                    }
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
                displayDateTime.textContent = 'Please select a date and time';
            }
        }

        initCalendar();
    }

    // Continue button handler (mobile only)
    if (continueToFormBtn) {
        continueToFormBtn.addEventListener('click', function() {
            if (isMobile()) {
                mobileCurrentStep = 4;
                showMobileStep(4);
            }
        });
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
            if (!selectedDate || selectedDate === 'Please select a date and time') {
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
});
