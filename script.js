// Calcolo Orario - Logic
class TimeCalculator {
    constructor() {
        this.intervals = [];
        this.intervalCount = 0;
        this.autoCalculateTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.addInterval(); // Add first interval by default
    }

    bindEvents() {
        document.getElementById('addInterval').addEventListener('click', () => this.addInterval());
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        document.getElementById('helpBtn').addEventListener('click', () => this.showModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideModal();
            }
        });
        
        // Auto-calculate when format changes (with debounce)
        document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const intervals = document.querySelectorAll('[data-interval]');
                if (intervals.length > 0) {
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

    resetForm() {
        // Clear all intervals
        document.getElementById('timeIntervals').innerHTML = '';
        
        // Reset counters
        this.intervalCount = 0;
        this.intervals = [];
        
        // Hide results and reset button
        document.getElementById('results').classList.add('hidden');
        document.getElementById('resetBtn').classList.add('hidden');
        
        // Add initial interval
        this.addInterval();
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
        intervalDiv.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
        intervalDiv.setAttribute('data-interval', this.intervalCount);

        intervalDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium text-gray-700">Intervallo ${this.intervalCount}</h4>
                ${this.intervalCount > 1 ? `
                    <button class="remove-interval text-red-500 hover:text-red-700 font-medium text-sm">
                        🗑️ Rimuovi
                    </button>
                ` : ''}
            </div>
            
            <!-- Different Days Checkbox -->
            <div class="mb-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" class="different-days text-primary focus:ring-primary" 
                           onchange="timeCalculator.toggleDateInputs(${this.intervalCount})">
                    <span class="text-sm font-medium text-gray-700">📅 Giorni diversi</span>
                </label>
            </div>

            <!-- Date inputs (hidden by default) -->
            <div class="date-inputs hidden grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                    <input type="date" class="start-date w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                    <input type="date" class="end-date w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            </div>

            <!-- Time inputs with dropdowns -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ora Inizio</label>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Ore</label>
                            <select class="start-hours w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="">--</option>
                                ${this.generateTimeOptions('hours')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Min</label>
                            <select class="start-minutes w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="">--</option>
                                ${this.generateTimeOptions('minutes')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Sec</label>
                            <select class="start-seconds w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="00">00</option>
                                ${this.generateTimeOptions('seconds')}
                            </select>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ora Fine</label>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Ore</label>
                            <select class="end-hours w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="">--</option>
                                ${this.generateTimeOptions('hours')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Min</label>
                            <select class="end-minutes w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="">--</option>
                                ${this.generateTimeOptions('minutes')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Sec</label>
                            <select class="end-seconds w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                <option value="00">00</option>
                                ${this.generateTimeOptions('seconds')}
                            </select>
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
        });
        
        // Also add listeners to date inputs and checkboxes
        const dateInputs = intervalDiv.querySelectorAll('input[type="date"]');
        const checkboxes = intervalDiv.querySelectorAll('input[type="checkbox"]');
        
        [...dateInputs, ...checkboxes].forEach(input => {
            input.addEventListener('change', () => {
                if (this.autoCalculateTimeout) {
                    clearTimeout(this.autoCalculateTimeout);
                }
                
                this.autoCalculateTimeout = setTimeout(() => {
                    if (this.hasValidCompleteIntervals()) {
                        this.calculate();
                    }
                }, 800);
            });
        });
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
    }

    renumberIntervals() {
        const intervals = document.querySelectorAll('[data-interval]');
        intervals.forEach((interval, index) => {
            const newNumber = index + 1;
            interval.setAttribute('data-interval', newNumber);
            interval.querySelector('h4').textContent = `Intervallo ${newNumber}`;
            
            // Update the onchange attribute for the checkbox
            const checkbox = interval.querySelector('.different-days');
            checkbox.setAttribute('onchange', `timeCalculator.toggleDateInputs(${newNumber})`);
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

    getTimeFromDropdowns(interval, type) {
        const hours = interval.querySelector(`.${type}-hours`).value;
        const minutes = interval.querySelector(`.${type}-minutes`).value;
        const seconds = interval.querySelector(`.${type}-seconds`).value || '00';
        
        if (!hours || !minutes) {
            return null;
        }
        
        return `${hours}:${minutes}:${seconds}`;
    }

    calculate() {
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
    }

    displayResults(intervals, totalSeconds) {
        const resultsDiv = document.getElementById('results');
        const resultDisplay = document.getElementById('resultDisplay');
        const breakdown = document.getElementById('breakdown');
        const format = document.querySelector('input[name="outputFormat"]:checked').value;

        // Show results section
        resultsDiv.classList.remove('hidden');

        // Format total time
        const totalFormatted = this.formatTime(totalSeconds, format);

        resultDisplay.innerHTML = `
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-4">
                <h3 class="text-lg font-semibold mb-2">📊 Risultato</h3>
                <div class="text-3xl font-bold mb-2">${totalFormatted}</div>
                <p class="text-blue-100">Tempo calcolato</p>
            </div>
        `;

        // Show breakdown
        if (intervals.length > 1) {
            let breakdownHTML = `
                <h4 class="font-semibold text-gray-800 mb-3">📋 Dettaglio Intervalli</h4>
                <div class="space-y-2">
            `;

            intervals.forEach(interval => {
                const formatted = this.formatTime(interval.seconds, format);
                const icon = interval.isCountdown ? '⏰' : '✅';
                const status = interval.isCountdown ? 'futuro' : 'completato';
                
                breakdownHTML += `
                    <div class="flex justify-between items-center bg-gray-50 rounded p-3">
                        <div class="flex items-center space-x-2">
                            <span>${icon}</span>
                            <span class="font-medium">${interval.description}</span>
                            <span class="text-xs text-gray-500">(${status})</span>
                        </div>
                        <span class="font-mono text-sm">${formatted}</span>
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

    formatTime(seconds, format) {
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;
        const sign = isNegative ? '-' : '';

        switch (format) {
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

    showError(message) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultsDiv = document.getElementById('results');
        
        resultsDiv.classList.remove('hidden');
        resultDisplay.innerHTML = `
            <div class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4">
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

    // Escape to close modal
    if (e.key === 'Escape') {
        if (window.timeCalculator) {
            window.timeCalculator.hideModal();
        }
    }
}); 