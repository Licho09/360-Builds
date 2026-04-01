document.addEventListener('DOMContentLoaded', function () {
    // ------------------ ELEMENT REFS ------------------
    var bookingForm = document.getElementById('bookingForm');
    var calendarGrid = document.getElementById('calendarGrid');
    var timeGrid = document.getElementById('timeGrid');
    var currentMonthYear = document.getElementById('currentMonthYear');
    var displayDateTime = document.getElementById('displayDateTime');
    var displayName = document.getElementById('displayName');
    var displayPhone = document.getElementById('displayPhone');
    var timeSlotsContainer = document.getElementById('timeSlotsContainer');
    var confirmBtn = document.getElementById('confirmBtn');
    var smsOptInChk = document.getElementById('smsOptIn');

    var GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyQn65Ow5YEMMY4kNN2PNK5FzdysBV3igm5a69EAN-QeZgBgFJz2khkIhkrl3ljDYX6/exec';

    // State
    var selectedDate = null;
    var selectedTime = null;

    // Load survey data (name + phone collected in survey)
    var surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
    var userName = surveyData.userName || '';
    var userPhone = surveyData.userPhone || '';
    var smsOptIn = surveyData.smsOptIn || false;

    // Pre-fill name and phone if available
    var nameInput = document.getElementById('userName');
    var phoneInput = document.getElementById('userPhone');
    if (nameInput && userName) nameInput.value = userName;
    if (phoneInput && userPhone) phoneInput.value = userPhone;
    if (smsOptInChk && smsOptIn) smsOptInChk.checked = smsOptIn;

    // Display name and phone from survey
    if (displayName) displayName.textContent = userName || '---';
    if (displayPhone) displayPhone.textContent = userPhone || '---';

    // Mobile step flow state
    var isMobile = window.innerWidth <= 768;
    var mobileStep = 'calendar'; // 'calendar' | 'time' | 'form'

    // Mobile elements
    var mobileStepIndicator = document.getElementById('mobileStepIndicator');
    var mobileStepLabel = document.getElementById('mobileStepLabel');
    var dot1 = document.getElementById('dot1');
    var dot2 = document.getElementById('dot2');
    var dot3 = document.getElementById('dot3');
    var mobileStickyFooter = document.getElementById('mobileBookingStickyFooter');
    var mobileBackBtn = document.getElementById('mobileBackBtn');
    var mobileContinueBtn = document.getElementById('mobileContinueBtn');

    // ------------------ MOBILE DETECTION ------------------
    function checkMobile() {
        isMobile = window.innerWidth <= 768;
        if (isMobile) {
            enterMobileFlow();
        } else {
            exitMobileFlow();
        }
    }

    function enterMobileFlow() {
        document.body.classList.add('mobile-booking-flow');
        setMobileStep(mobileStep);
        if (mobileStickyFooter) mobileStickyFooter.style.display = 'flex';
    }

    function exitMobileFlow() {
        document.body.classList.remove(
            'mobile-booking-flow',
            'mobile-booking-step-calendar',
            'mobile-booking-step-time',
            'mobile-booking-step-form'
        );
        if (mobileStickyFooter) mobileStickyFooter.style.display = 'none';
    }

    // ------------------ MOBILE STEP MANAGEMENT ------------------
    function setMobileStep(step) {
        mobileStep = step;

        // Remove all step classes
        document.body.classList.remove(
            'mobile-booking-step-calendar',
            'mobile-booking-step-time',
            'mobile-booking-step-form'
        );

        // Add current step class
        document.body.classList.add('mobile-booking-step-' + step);

        // Update step dots
        if (dot1 && dot2 && dot3) {
            dot1.className = 'mobile-step-dot';
            dot2.className = 'mobile-step-dot';
            dot3.className = 'mobile-step-dot';

            if (step === 'calendar') {
                dot1.classList.add('active');
                if (mobileStepLabel) mobileStepLabel.textContent = 'Select a Date';
            } else if (step === 'time') {
                dot1.classList.add('done');
                dot2.classList.add('active');
                if (mobileStepLabel) mobileStepLabel.textContent = 'Pick a Time';
            } else if (step === 'form') {
                dot1.classList.add('done');
                dot2.classList.add('done');
                dot3.classList.add('active');
                if (mobileStepLabel) mobileStepLabel.textContent = 'Confirm';
            }
        }

        // Update sticky footer buttons
        updateMobileStickyButtons();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateMobileStickyButtons() {
        if (!mobileStickyFooter || !isMobile) return;

        if (mobileStep === 'calendar') {
            mobileBackBtn.style.display = 'none';
            mobileContinueBtn.style.display = selectedDate ? 'block' : 'none';
            mobileContinueBtn.textContent = 'Next: Pick a Time';
            mobileContinueBtn.style.flex = '1';
        } else if (mobileStep === 'time') {
            mobileBackBtn.style.display = 'block';
            mobileBackBtn.style.flex = '1';
            mobileContinueBtn.style.display = selectedTime ? 'block' : 'none';
            mobileContinueBtn.textContent = 'Next: Confirm';
            mobileContinueBtn.style.flex = '2';
        } else if (mobileStep === 'form') {
            // Hide sticky footer on form step - the form has its own submit button
            mobileStickyFooter.style.display = 'none';
            return;
        }

        mobileStickyFooter.style.display = 'flex';
    }

    // Mobile button handlers
    if (mobileContinueBtn) {
        mobileContinueBtn.addEventListener('click', function () {
            if (mobileStep === 'calendar' && selectedDate) {
                setMobileStep('time');
            } else if (mobileStep === 'time' && selectedTime) {
                setMobileStep('form');
            }
        });
    }

    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', function () {
            if (mobileStep === 'time') {
                setMobileStep('calendar');
            } else if (mobileStep === 'form') {
                setMobileStep('time');
            }
        });
    }

    // ------------------ CALENDAR & TIME ------------------
    if (calendarGrid && timeGrid && currentMonthYear && displayDateTime) {
        var now = new Date();
        var currentYear = now.getFullYear();
        var currentMonth = now.getMonth();
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        function initCalendar() {
            currentMonthYear.textContent = months[currentMonth] + ' ' + currentYear;
            var firstDay = new Date(currentYear, currentMonth, 1).getDay();
            var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            calendarGrid.innerHTML = '';

            for (var i = 0; i < firstDay; i++) {
                var empty = document.createElement('div');
                empty.className = 'calendar-day';
                calendarGrid.appendChild(empty);
            }

            var today = now.getDate();
            var maxSelectableDay = today + 2;

            for (var day = 1; day <= daysInMonth; day++) {
                var dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                dayEl.textContent = day;

                if (day >= today && day <= maxSelectableDay) {
                    dayEl.classList.add('available');
                    (function(d, el) {
                        el.addEventListener('click', function() {
                            var allDays = document.querySelectorAll('.calendar-day');
                            for (var j = 0; j < allDays.length; j++) {
                                allDays[j].classList.remove('selected');
                            }
                            el.classList.add('selected');
                            selectedDate = new Date(currentYear, currentMonth, d);
                            updateDisplay();
                            generateTimeSlots();

                            if (isMobile) {
                                updateMobileStickyButtons();
                            }
                        });
                    })(day, dayEl);
                }
                calendarGrid.appendChild(dayEl);
            }
        }

        function generateTimeSlots() {
            timeGrid.innerHTML = '';
            var times = ['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
            times.forEach(function(time) {
                var timeBtn = document.createElement('div');
                timeBtn.className = 'time-btn';
                timeBtn.textContent = time;
                timeBtn.addEventListener('click', function() {
                    var allBtns = document.querySelectorAll('.time-btn');
                    for (var j = 0; j < allBtns.length; j++) {
                        allBtns[j].classList.remove('active');
                    }
                    timeBtn.classList.add('active');
                    selectedTime = time;
                    updateDisplay();

                    if (isMobile) {
                        updateMobileStickyButtons();
                    }
                });
                timeGrid.appendChild(timeBtn);
            });
        }

        function updateDisplay() {
            if (selectedDate && selectedTime) {
                var options = { weekday:'short', month:'short', day:'numeric' };
                displayDateTime.textContent = selectedDate.toLocaleDateString(undefined, options) + ' at ' + selectedTime;
            } else if (selectedDate) {
                var options2 = { weekday:'short', month:'short', day:'numeric' };
                displayDateTime.textContent = selectedDate.toLocaleDateString(undefined, options2) + ' (Select a time)';
            } else {
                displayDateTime.textContent = 'Please select a date and time';
            }

            validateForm();
        }

        initCalendar();
    }

    function validateForm() {
        var name = nameInput ? nameInput.value.trim() : '';
        var phone = phoneInput ? phoneInput.value.trim() : '';
        var optIn = smsOptInChk ? smsOptInChk.checked : false;
        var hasDateTime = selectedDate && selectedTime;

        if (confirmBtn) {
            if (name && phone && optIn && hasDateTime) {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('btn-disabled');
            } else {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('btn-disabled');
            }
        }
    }

    if (nameInput) nameInput.addEventListener('input', validateForm);
    if (phoneInput) phoneInput.addEventListener('input', validateForm);
    if (smsOptInChk) smsOptInChk.addEventListener('change', validateForm);

    // ------------------ FORM SUBMIT ------------------
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = nameInput ? nameInput.value.trim() : userName;
            var phone = phoneInput ? phoneInput.value.trim() : userPhone;
            var optIn = smsOptInChk ? smsOptInChk.checked : smsOptIn;
            var selectedDateTimeText = displayDateTime ? displayDateTime.textContent : '';

            if (!name || !phone || !optIn) {
                alert('Please fill in all fields and agree to receive SMS messages.');
                return;
            }
            if (!selectedDate || !selectedTime) {
                alert('Please select a date and time.');
                return;
            }

            var submitBtn = bookingForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            var finalData = {
                name: name,
                phone: phone,
                smsOptIn: optIn ? "Yes" : "No",
                dateTime: selectedDateTimeText,
                homesPerYear: surveyData.homesPerYear || '',
                currentTours: surveyData.currentTours || ''
            };

            var formData = new FormData();
            formData.append('data', JSON.stringify(finalData));

            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                body: formData
            })
            .then(function() {
                localStorage.setItem('lastBooking', JSON.stringify(finalData));
                window.location.href = 'success.html';
            })
            .catch(function(error) {
                alert('There was an error submitting the form.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm My Free Call';
                }
                console.error(error);
            });
        });
    }

    // ------------------ INIT ------------------
    checkMobile();
    window.addEventListener('resize', checkMobile);
});
