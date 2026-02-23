document.addEventListener('DOMContentLoaded', function () {

    // Only run on booking page
    const calendarGrid = document.getElementById('calendarGrid');
    const timeGrid = document.getElementById('timeGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const displayDateTime = document.getElementById('displayDateTime');
    const bookingForm = document.getElementById('bookingForm');

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
            const maxSelectableDay = today + 14;

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

                        // Mobile: auto-advance to time step
                        if (window.innerWidth <= 768) {
                            document.body.classList.remove('mobile-booking-step-calendar');
                            document.body.classList.add('mobile-booking-step-time');
                            updateMobileBookingFooter();
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

                    // Mobile: auto-advance to form step
                    if (window.innerWidth <= 768) {
                        document.body.classList.remove('mobile-booking-step-time');
                        document.body.classList.add('mobile-booking-step-form');
                        updateMobileBookingFooter();
                    }
                });
                timeGrid.appendChild(timeBtn);
            });
        }

        function updateDisplay() {
            if (selectedDate && selectedTime) {
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                displayDateTime.textContent = `${selectedDate.toLocaleDateString(undefined, options)} at ${selectedTime}`;
            } else if (selectedDate) {
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                displayDateTime.textContent = `${selectedDate.toLocaleDateString(undefined, options)} — select a time`;
            } else {
                displayDateTime.textContent = 'Please select a date and time';
            }
        }

        initCalendar();

        // Mobile booking step flow
        function initMobileBookingFlow() {
            if (window.innerWidth > 768) return;
            document.body.classList.add('mobile-booking-flow', 'mobile-booking-step-calendar');
            updateMobileBookingFooter();
        }

        function updateMobileBookingFooter() {
            let footer = document.getElementById('mobileBookingFooter');
            if (!footer) {
                footer = document.createElement('div');
                footer.id = 'mobileBookingFooter';
                footer.className = 'mobile-booking-sticky';
                document.body.appendChild(footer);
            }

            if (window.innerWidth > 768) {
                footer.style.display = 'none';
                return;
            }

            footer.style.display = 'flex';
            footer.innerHTML = '';

            const isCalStep = document.body.classList.contains('mobile-booking-step-calendar');
            const isTimeStep = document.body.classList.contains('mobile-booking-step-time');
            const isFormStep = document.body.classList.contains('mobile-booking-step-form');

            if (isCalStep) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary';
                btn.style.flex = '1';
                btn.textContent = selectedDate ? 'Choose a Time →' : 'Select a Date First';
                btn.disabled = !selectedDate;
                btn.onclick = () => {
                    document.body.classList.remove('mobile-booking-step-calendar');
                    document.body.classList.add('mobile-booking-step-time');
                    generateTimeSlots();
                    updateMobileBookingFooter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                footer.appendChild(btn);
            } else if (isTimeStep) {
                const back = document.createElement('button');
                back.className = 'btn btn-secondary';
                back.style.flex = '1';
                back.textContent = 'Back';
                back.onclick = () => {
                    document.body.classList.remove('mobile-booking-step-time');
                    document.body.classList.add('mobile-booking-step-calendar');
                    updateMobileBookingFooter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                footer.appendChild(back);

                const btn = document.createElement('button');
                btn.className = 'btn btn-primary';
                btn.style.flex = '2';
                btn.textContent = selectedTime ? 'Enter Your Info →' : 'Select a Time First';
                btn.disabled = !selectedTime;
                btn.onclick = () => {
                    document.body.classList.remove('mobile-booking-step-time');
                    document.body.classList.add('mobile-booking-step-form');
                    updateMobileBookingFooter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                footer.appendChild(btn);
            } else if (isFormStep) {
                const back = document.createElement('button');
                back.className = 'btn btn-secondary';
                back.style.flex = '1';
                back.textContent = 'Back';
                back.onclick = () => {
                    document.body.classList.remove('mobile-booking-step-form');
                    document.body.classList.add('mobile-booking-step-time');
                    updateMobileBookingFooter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                footer.appendChild(back);
                // Form step uses its own submit button
            }
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                const footer = document.getElementById('mobileBookingFooter');
                if (footer) footer.style.display = 'none';
                document.body.classList.remove('mobile-booking-flow','mobile-booking-step-calendar','mobile-booking-step-time','mobile-booking-step-form');
            }
        });

        initMobileBookingFlow();
    }

    // ------------------ FORM SUBMIT ------------------
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const selectedDateTimeText = document.getElementById('displayDateTime')?.textContent;
            const name = document.getElementById('userName')?.value?.trim();
            const phone = document.getElementById('userPhone')?.value?.trim();

            if (!name || !phone) {
                alert('Please enter your name and phone number.');
                return;
            }
            if (!selectedDateTimeText || selectedDateTimeText === 'Please select a date and time') {
                alert('Please select a date and time.');
                return;
            }

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            const surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
            const finalData = { name, phone, dateTime: selectedDateTimeText, ...surveyData };

            const formData = new FormData();
            formData.append('data', JSON.stringify(finalData));

            fetch(GOOGLE_SHEET_URL, { method: 'POST', body: formData })
                .then(() => {
                    localStorage.setItem('lastBooking', JSON.stringify(finalData));
                    window.location.href = 'success.html';
                })
                .catch(error => {
                    alert('There was an error submitting. Please try again.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Confirm Booking';
                    }
                    console.error(error);
                });
        });
    }
});
