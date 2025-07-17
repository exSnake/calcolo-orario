// Calcolo Orario - Logic
class TimeCalculator {
    constructor() {
        this.intervals = [];
        this.intervalCount = 0;
        this.autoCalculateTimeout = null;
        this.countdownTimer = null;
        this.currentFormat = 'humanized'; // Default format
        this.init();
    }

    init() {
        this.bindEvents();
        this.addInterval(); // Add first interval by default
        
        // Initialize timer storage after DOM is ready
        setTimeout(() => {
            this.timerStorage = new TimerStorage(this);
        }, 100);
    }

    bindEvents() {
        document.getElementById('addInterval').addEventListener('click', () => this.addInterval());
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        document.getElementById('helpBtn').addEventListener('click', () => this.showModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Close modal when clicking outside
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideModal();
            }
        });

        // Initialize dark mode from localStorage
        this.initializeDarkMode();
        
        // Auto-calculate when format changes (with debounce)
        document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const intervals = document.querySelectorAll('[data-interval]');
                if (intervals.length > 0) {
                    // Update current format for countdown
                    this.currentFormat = radio.value;
                    
                    // Clear any existing timeout
                    if (this.autoCalculateTimeout) {
                        clearTimeout(this.autoCalculateTimeout);
                    }
                    
                    // Re-calculate with current data (shorter debounce for format changes)
                    this.autoCalculateTimeout = setTimeout(() => {
                        if (this.hasValidCompleteIntervals()) {
                            this.calculate();
                        }
                    }, 200);
                    
                    // Update timer storage buttons when format changes
                    if (this.timerStorage && this.timerStorage.currentTimerName) {
                        setTimeout(() => {
                            if (this.timerStorage) {
                                this.timerStorage.updateSaveButtons();
                            }
                        }, 250);
                    }
                }
            });
        });
    }

    showModal() {
        document.getElementById('helpModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        document.getElementById('helpModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    initializeDarkMode() {
        // Check if user has a preference stored
        const darkMode = localStorage.getItem('darkMode');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use stored preference or system preference
        if (darkMode === 'true' || (darkMode === null && systemDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleDarkMode() {
        const htmlElement = document.documentElement;
        const isDark = htmlElement.classList.contains('dark');
        
        if (isDark) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }
    }

    resetForm() {
        // Clear all intervals
        document.getElementById('timeIntervals').innerHTML = '';
        
        // Reset counters
        this.intervalCount = 0;
        this.intervals = [];
        
        // Clear countdown timer
        this.clearCountdownTimer();
        
        // Hide results and reset button
        document.getElementById('results').classList.add('hidden');
        document.getElementById('resetBtn').classList.add('hidden');
        
        // Add initial interval
        this.addInterval();
        
        // Clear current timer and update buttons
        if (this.timerStorage) {
            this.timerStorage.clearCurrentTimer();
        }
    }

    generateTimeOptions(type) {
        let max = type === 'hours' ? 23 : 59;
        let options = '';
        for (let i = 0; i <= max; i++) {
            const value = i.toString().padStart(2, '0');
            options += `<option value="${value}">${value}</option>`;
        }
        return options;
    }

    addInterval() {
        this.intervalCount++;
        const intervalDiv = document.createElement('div');
        intervalDiv.className = 'border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700';
        intervalDiv.setAttribute('data-interval', this.intervalCount);

        intervalDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium text-gray-700 dark:text-gray-300">Intervallo ${this.intervalCount}</h4>
                ${this.intervalCount > 1 ? `
                    <button class="remove-interval text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm">
                        🗑️ Rimuovi
                    </button>
                ` : ''}
            </div>
            
            <!-- Options Checkboxes -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" class="different-days text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400" 
                           onchange="timeCalculator.toggleDateInputs(${this.intervalCount})">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">📅 Giorni diversi</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" class="show-seconds text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400" 
                           onchange="timeCalculator.toggleSecondsInputs(${this.intervalCount})">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">⏱️ Mostra secondi</span>
                </label>
            </div>

            <!-- Date inputs (hidden by default) -->
            <div class="date-inputs hidden grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inizio</label>
                    <input type="date" class="start-date w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fine</label>
                    <input type="date" class="end-date w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent">
                </div>
            </div>

            <!-- Time inputs with dropdowns -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ora Inizio</label>
                    <div class="time-inputs-container">
                        <div class="grid gap-2 time-grid-cols">
                            <div>
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ore</label>
                                <select class="start-hours w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="">--</option>
                                    ${this.generateTimeOptions('hours')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min</label>
                                <select class="start-minutes w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="">--</option>
                                    ${this.generateTimeOptions('minutes')}
                                </select>
                            </div>
                            <div class="seconds-column hidden">
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sec</label>
                                <select class="start-seconds w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="00" selected>00</option>
                                    ${this.generateTimeOptions('seconds')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ora Fine</label>
                    <div class="time-inputs-container">
                        <div class="grid gap-2 time-grid-cols">
                            <div>
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ore</label>
                                <select class="end-hours w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="">--</option>
                                    ${this.generateTimeOptions('hours')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min</label>
                                <select class="end-minutes w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="">--</option>
                                    ${this.generateTimeOptions('minutes')}
                                </select>
                            </div>
                            <div class="seconds-column hidden">
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sec</label>
                                <select class="end-seconds w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm">
                                    <option value="00" selected>00</option>
                                    ${this.generateTimeOptions('seconds')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('timeIntervals').appendChild(intervalDiv);

        // Bind remove event if not first interval
        if (this.intervalCount > 1) {
            intervalDiv.querySelector('.remove-interval').addEventListener('click', () => {
                this.removeInterval(intervalDiv);
            });
        }

        // Set current date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        intervalDiv.querySelector('.start-date').value = today;
        intervalDiv.querySelector('.end-date').value = today;

        // Add auto-calculate listeners to the new dropdowns
        this.addAutoCalculateListeners(intervalDiv);
        
        // Add smart typing listeners to time dropdowns
        this.addSmartTypingListeners(intervalDiv);
        
        // Update timer storage buttons when new interval is added
        if (this.timerStorage) {
            this.timerStorage.clearCurrentTimer();
        }
    }

    addAutoCalculateListeners(intervalDiv) {
        const selects = intervalDiv.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                // Clear any existing timeout
                if (this.autoCalculateTimeout) {
                    clearTimeout(this.autoCalculateTimeout);
                }
                
                // Only auto-calculate after user stops interacting for a bit
                this.autoCalculateTimeout = setTimeout(() => {
                    if (this.hasValidCompleteIntervals()) {
                        this.calculate();
                    }
                }, 800); // 800ms debounce
            });
            
            // Clear current timer when user modifies inputs
            select.addEventListener('change', () => {
                if (this.timerStorage && this.timerStorage.currentTimerName) {
                    // Check if this change makes the timer different from saved state
                    setTimeout(() => {
                        if (this.timerStorage) {
                            this.timerStorage.updateSaveButtons();
                        }
                    }, 100);
                }
            });
        });
        
        // Also add listeners to date inputs and checkboxes
        const dateInputs = intervalDiv.querySelectorAll('input[type="date"]');
        const checkboxes = intervalDiv.querySelectorAll('input[type="checkbox"]');
        
        [...dateInputs, ...checkboxes].forEach(input => {
            input.addEventListener('change', () => {
                if (this.autoCalculateTimeout) {
                    clearTimeout(this.autoCalculateTimeout);
                }
                
                // Special handling for show-seconds checkbox
                if (input.classList.contains('show-seconds')) {
                    // Immediate recalculation for seconds toggle since it affects the time format
                    this.autoCalculateTimeout = setTimeout(() => {
                        if (this.hasValidCompleteIntervals()) {
                            this.calculate();
                        }
                    }, 100);
                } else {
                    this.autoCalculateTimeout = setTimeout(() => {
                        if (this.hasValidCompleteIntervals()) {
                            this.calculate();
                        }
                    }, 800);
                }
            });
            
            // Update timer storage buttons when inputs change
            input.addEventListener('change', () => {
                if (this.timerStorage && this.timerStorage.currentTimerName) {
                    setTimeout(() => {
                        if (this.timerStorage) {
                            this.timerStorage.updateSaveButtons();
                        }
                    }, 100);
                }
            });
        });
    }

    addSmartTypingListeners(intervalDiv) {
        const timeSelects = intervalDiv.querySelectorAll('select[class*="hours"], select[class*="minutes"], select[class*="seconds"]');
        
        timeSelects.forEach(select => {
            let typingTimer;
            let typedChars = '';
            
            select.addEventListener('keydown', (e) => {
                // Only handle number keys and backspace
                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    
                    // Clear previous typing timer
                    clearTimeout(typingTimer);
                    
                    // Add typed character
                    typedChars += e.key;
                    
                    // Limit to 2 characters for time
                    if (typedChars.length > 2) {
                        typedChars = typedChars.slice(-2);
                    }
                    
                    // Try to find matching option
                    this.findAndSelectTimeOption(select, typedChars);
                    
                    // Clear typed chars after delay
                    typingTimer = setTimeout(() => {
                        typedChars = '';
                    }, 1000);
                    
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    typedChars = typedChars.slice(0, -1);
                    if (typedChars) {
                        this.findAndSelectTimeOption(select, typedChars);
                    }
                } else if (e.key === 'Escape') {
                    typedChars = '';
                    clearTimeout(typingTimer);
                }
            });
        });
    }

    findAndSelectTimeOption(select, typedValue) {
        // Convert single digit to double digit for time
        let searchValue = typedValue;
        if (typedValue.length === 1) {
            searchValue = '0' + typedValue;
        }
        
        // Find option with matching value
        const option = select.querySelector(`option[value="${searchValue}"]`);
        if (option) {
            select.value = searchValue;
            // Trigger change event for auto-calculation
            select.dispatchEvent(new Event('change'));
        } else if (typedValue.length === 2) {
            // If two digits don't match, try just the second digit
            const singleDigit = '0' + typedValue.charAt(1);
            const fallbackOption = select.querySelector(`option[value="${singleDigit}"]`);
            if (fallbackOption) {
                select.value = singleDigit;
                select.dispatchEvent(new Event('change'));
            }
        }
    }

    hasValidCompleteIntervals() {
        const intervals = document.querySelectorAll('[data-interval]');
        
        for (let interval of intervals) {
            const startHours = interval.querySelector('.start-hours').value;
            const startMinutes = interval.querySelector('.start-minutes').value;
            const endHours = interval.querySelector('.end-hours').value;
            const endMinutes = interval.querySelector('.end-minutes').value;
            
            // If any required field is empty, return false
            if (!startHours || !startMinutes || !endHours || !endMinutes) {
                return false;
            }

            // If different days is checked, also check dates
            const differentDays = interval.querySelector('.different-days').checked;
            if (differentDays) {
                const startDate = interval.querySelector('.start-date').value;
                const endDate = interval.querySelector('.end-date').value;
                if (!startDate || !endDate) {
                    return false;
                }
            }
        }
        
        return true;
    }

    removeInterval(intervalDiv) {
        intervalDiv.remove();
        this.renumberIntervals();
        
        // Auto-calculate if we still have valid intervals
        if (this.hasValidCompleteIntervals()) {
            this.calculate();
        }
        
        // Update timer storage buttons when interval is removed
        if (this.timerStorage) {
            this.timerStorage.clearCurrentTimer();
        }
    }

    renumberIntervals() {
        const intervals = document.querySelectorAll('[data-interval]');
        intervals.forEach((interval, index) => {
            const newNumber = index + 1;
            interval.setAttribute('data-interval', newNumber);
            interval.querySelector('h4').textContent = `Intervallo ${newNumber}`;
            
            // Update the onchange attributes for checkboxes
            const daysCheckbox = interval.querySelector('.different-days');
            const secondsCheckbox = interval.querySelector('.show-seconds');
            
            daysCheckbox.setAttribute('onchange', `timeCalculator.toggleDateInputs(${newNumber})`);
            secondsCheckbox.setAttribute('onchange', `timeCalculator.toggleSecondsInputs(${newNumber})`);
        });
        this.intervalCount = intervals.length;
    }

    toggleDateInputs(intervalNumber) {
        const interval = document.querySelector(`[data-interval="${intervalNumber}"]`);
        const checkbox = interval.querySelector('.different-days');
        const dateInputs = interval.querySelector('.date-inputs');
        
        if (checkbox.checked) {
            dateInputs.classList.remove('hidden');
        } else {
            dateInputs.classList.add('hidden');
        }
    }

    toggleSecondsInputs(intervalNumber) {
        const interval = document.querySelector(`[data-interval="${intervalNumber}"]`);
        const checkbox = interval.querySelector('.show-seconds');
        const secondsColumns = interval.querySelectorAll('.seconds-column');
        const timeGrids = interval.querySelectorAll('.time-grid-cols');
        
        if (checkbox.checked) {
            // Show seconds
            secondsColumns.forEach(col => col.classList.remove('hidden'));
            timeGrids.forEach(grid => grid.classList.add('show-seconds'));
        } else {
            // Hide seconds and set to 00
            secondsColumns.forEach(col => col.classList.add('hidden'));
            timeGrids.forEach(grid => grid.classList.remove('show-seconds'));
            
            // Reset seconds to 00
            const startSeconds = interval.querySelector('.start-seconds');
            const endSeconds = interval.querySelector('.end-seconds');
            startSeconds.value = '00';
            endSeconds.value = '00';
            
            // Trigger auto-calculation
            if (this.hasValidCompleteIntervals()) {
                // Clear any existing timeout
                if (this.autoCalculateTimeout) {
                    clearTimeout(this.autoCalculateTimeout);
                }
                
                this.autoCalculateTimeout = setTimeout(() => {
                    if (this.hasValidCompleteIntervals()) {
                        this.calculate();
                    }
                }, 800);
            }
        }
    }

    getTimeFromDropdowns(interval, type) {
        const hours = interval.querySelector(`.${type}-hours`).value;
        const minutes = interval.querySelector(`.${type}-minutes`).value;
        
        if (!hours || !minutes) {
            return null;
        }
        
        // Check if seconds are shown or hidden
        const showSecondsCheckbox = interval.querySelector('.show-seconds');
        let seconds = '00';
        
        if (showSecondsCheckbox && showSecondsCheckbox.checked) {
            seconds = interval.querySelector(`.${type}-seconds`).value || '00';
        }
        
        return `${hours}:${minutes}:${seconds}`;
    }

    calculate() {
        // Clear any existing countdown timer
        this.clearCountdownTimer();
        
        const intervals = document.querySelectorAll('[data-interval]');
        const results = [];
        let totalSeconds = 0;
        let hasError = false;

        intervals.forEach((interval, index) => {
            const differentDays = interval.querySelector('.different-days').checked;
            const startTime = this.getTimeFromDropdowns(interval, 'start');
            const endTime = this.getTimeFromDropdowns(interval, 'end');
            const startDate = interval.querySelector('.start-date').value;
            const endDate = interval.querySelector('.end-date').value;

            if (!startTime || !endTime) {
                this.showError('Inserisci tutti gli orari richiesti (ore e minuti)');
                hasError = true;
                return;
            }

            if (differentDays && (!startDate || !endDate)) {
                this.showError('Inserisci tutte le date quando "Giorni diversi" è selezionato');
                hasError = true;
                return;
            }

            let startDateTime, endDateTime;

            if (differentDays) {
                startDateTime = new Date(`${startDate}T${startTime}`);
                endDateTime = new Date(`${endDate}T${endTime}`);
            } else {
                const today = new Date().toISOString().split('T')[0];
                startDateTime = new Date(`${today}T${startTime}`);
                endDateTime = new Date(`${today}T${endTime}`);
                
                // If end time is before start time on same day, assume it's next day
                if (endDateTime < startDateTime) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }
            }

            const diffInMs = endDateTime - startDateTime;
            const diffInSeconds = Math.floor(diffInMs / 1000);
            
            results.push({
                index: index + 1,
                description: `Intervallo ${index + 1}`,
                startDateTime,
                endDateTime,
                seconds: diffInSeconds,
                isCountdown: endDateTime > new Date()
            });

            totalSeconds += diffInSeconds;
        });

        if (hasError) return;

        this.displayResults(results, totalSeconds);
        
        // Show reset button after first calculation
        document.getElementById('resetBtn').classList.remove('hidden');
        
        // Update timer storage buttons
        if (this.timerStorage) {
            this.timerStorage.updateSaveButtons();
        }
    }

    displayResults(intervals, totalSeconds) {
        const resultsDiv = document.getElementById('results');
        const resultDisplay = document.getElementById('resultDisplay');
        const breakdown = document.getElementById('breakdown');
        const format = document.querySelector('input[name="outputFormat"]:checked').value;

        // Clear any existing countdown timer
        this.clearCountdownTimer();

        // Show results section
        resultsDiv.classList.remove('hidden');

        // Format total time
        const totalFormatted = this.formatTime(totalSeconds, format);

        // Check for future times and find the latest end time
        const futureIntervals = intervals.filter(interval => interval.endDateTime > new Date());
        const latestEndTime = futureIntervals.length > 0 ? 
            Math.max(...futureIntervals.map(interval => interval.endDateTime.getTime())) : null;

        resultDisplay.innerHTML = `
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-4">
                <h3 class="text-lg font-semibold mb-2">📊 Tempo calcolato</h3>
                <div class="text-3xl font-bold mb-2">${totalFormatted}</div>
                ${
                  latestEndTime
                    ? `
                    <div class="mt-4 pt-4 border-t border-blue-400">
                        <h4 class="text-sm font-medium mb-1">⏰ Conto alla Rovescia</h4>
                        <div id="countdownDisplay" class="text-lg">
                            Calcolo in corso...
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `;

        // Start countdown if there are future times
        if (latestEndTime) {
            this.startCountdownTimer(new Date(latestEndTime), format);
        }

        // Show breakdown
        if (intervals.length > 1) {
            let breakdownHTML = `
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">📋 Dettaglio Intervalli</h4>
                <div class="space-y-2">
            `;

            intervals.forEach(interval => {
                const formatted = this.formatTime(interval.seconds, format);
                const icon = interval.isCountdown ? '⏰' : '✅';
                const status = interval.isCountdown ? 'futuro' : 'completato';
                
                breakdownHTML += `
                    <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <div class="flex items-center space-x-2">
                            <span>${icon}</span>
                            <span class="font-medium text-gray-800 dark:text-gray-200">${interval.description}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">(${status})</span>
                        </div>
                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">${formatted}</span>
                    </div>
                `;
            });

            breakdownHTML += '</div>';
            breakdown.innerHTML = breakdownHTML;
        } else {
            breakdown.innerHTML = '';
        }

        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    startCountdownTimer(targetDateTime, format) {
        this.currentFormat = format;
        this.updateCountdown(targetDateTime);
        
        // Update every second
        this.countdownTimer = setInterval(() => {
            this.updateCountdown(targetDateTime);
        }, 1000);
    }

    updateCountdown(targetDateTime) {
        const now = new Date();
        const timeLeft = targetDateTime - now;
        
        const countdownElement = document.getElementById('countdownDisplay');
        if (!countdownElement) return;

        if (timeLeft <= 0) {
            countdownElement.innerHTML = `
                <span class="text-green-300 font-semibold">⏰ Scaduto!</span>
            `;
            this.clearCountdownTimer();
            return;
        }

        // Calculate time components
        const totalSecondsLeft = Math.floor(timeLeft / 1000);
        
        // Format countdown display using selected format
        const formattedCountdown = this.formatTime(totalSecondsLeft, this.currentFormat);

        countdownElement.innerHTML = `
            <div class="text-yellow-300 font-semibold">${formattedCountdown}</div>
        `;
    }

    clearCountdownTimer() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    formatTime(seconds, format) {
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;
        const sign = isNegative ? '-' : '';

        switch (format) {
            case 'humanized':
                return this.formatTimeHuman(seconds);

            case 'sexagesimal':
                const days = Math.floor(absSeconds / 86400);
                const hours = Math.floor((absSeconds % 86400) / 3600);
                const minutes = Math.floor((absSeconds % 3600) / 60);
                const secs = absSeconds % 60;

                if (days > 0) {
                    return `${sign}${days}g ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                } else {
                    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }

            case 'hours':
                return `${sign}${(absSeconds / 3600).toFixed(2)} ore`;

            case 'minutes':
                return `${sign}${(absSeconds / 60).toFixed(2)} minuti`;

            case 'seconds':
                return `${sign}${absSeconds} secondi`;

            default:
                return `${sign}${absSeconds}s`;
        }
    }

    formatTimeHuman(seconds) {
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;
        const sign = isNegative ? '-' : '';

        const days = Math.floor(absSeconds / 86400);
        const hours = Math.floor((absSeconds % 86400) / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const secs = absSeconds % 60;

        const parts = [];

        if (days > 0) {
            parts.push(`${days} ${days === 1 ? 'giorno' : 'giorni'}`);
        }
        
        if (hours > 0) {
            parts.push(`${hours} ${hours === 1 ? 'ora' : 'ore'}`);
        }
        
        if (minutes > 0) {
            parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`);
        }
        
        if (secs > 0) {
            parts.push(`${secs} ${secs === 1 ? 'secondo' : 'secondi'}`);
        }

        // Se tutto è zero, mostra "0 secondi"
        if (parts.length === 0) {
            parts.push('0 secondi');
        }

        // Unisci le parti con virgole e "e" prima dell'ultima
        let result = '';
        if (parts.length === 1) {
            result = parts[0];
        } else if (parts.length === 2) {
            result = parts.join(' e ');
        } else {
            const lastPart = parts.pop();
            result = parts.join(', ') + ' e ' + lastPart;
        }

        return `${sign}${result}`;
    }

    showError(message) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultsDiv = document.getElementById('results');
        
        resultsDiv.classList.remove('hidden');
        resultDisplay.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4">
                <h3 class="font-semibold mb-2">❌ Errore</h3>
                <p>${message}</p>
            </div>
        `;
        
        document.getElementById('breakdown').innerHTML = '';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.timeCalculator = new TimeCalculator();
});

// Clean up timer when page unloads
window.addEventListener('beforeunload', () => {
    if (window.timeCalculator && window.timeCalculator.countdownTimer) {
        window.timeCalculator.clearCountdownTimer();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (window.timeCalculator && window.timeCalculator.hasValidCompleteIntervals()) {
            window.timeCalculator.calculate();
        }
    }
    
    // Ctrl/Cmd + Plus to add interval
    if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        if (window.timeCalculator) {
            window.timeCalculator.addInterval();
        }
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        if (window.timeCalculator) {
            window.timeCalculator.hideModal();
            
            // Also close save timer modal if open
            if (window.timeCalculator.timerStorage) {
                window.timeCalculator.timerStorage.hideSaveModal();
            }
        }
    }
}); 