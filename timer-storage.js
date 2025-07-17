// Timer Storage Module - Gestione salvataggio/caricamento timer
class TimerStorage {
    constructor(timeCalculator) {
        this.timeCalculator = timeCalculator;
        this.currentTimerName = null;
        this.storageKey = 'calcolo-orario-timers';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateLoadTimersCard();
    }

    bindEvents() {
        // Load timer
        const loadSelect = document.getElementById('loadTimerSelect');
        if (loadSelect) {
            loadSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadTimer(e.target.value);
                }
            });
        }

        // Save timer
        const saveBtn = document.getElementById('saveTimerBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveDialog());
        }

        // Update timer
        const updateBtn = document.getElementById('updateTimerBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateCurrentTimer());
        }

        // Delete timer
        const deleteBtn = document.getElementById('deleteTimerBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentTimer());
        }

        // Save timer modal events
        const closeSaveModal = document.getElementById('closeSaveModal');
        const cancelSaveTimer = document.getElementById('cancelSaveTimer');
        const confirmSaveTimer = document.getElementById('confirmSaveTimer');
        const timerNameInput = document.getElementById('timerNameInput');

        if (closeSaveModal) {
            closeSaveModal.addEventListener('click', () => this.hideSaveModal());
        }

        if (cancelSaveTimer) {
            cancelSaveTimer.addEventListener('click', () => this.hideSaveModal());
        }

        if (confirmSaveTimer) {
            confirmSaveTimer.addEventListener('click', () => this.confirmSave());
        }

        if (timerNameInput) {
            // Save on Enter key
            timerNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmSave();
                }
            });
            
            // Remove error styling when user starts typing
            timerNameInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    e.target.classList.remove('border-red-500', 'focus:ring-red-500');
                    e.target.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:ring-primary-500', 'dark:focus:ring-primary-400');
                }
            });
        }

        // Close modal when clicking outside
        const saveTimerModal = document.getElementById('saveTimerModal');
        if (saveTimerModal) {
            saveTimerModal.addEventListener('click', (e) => {
                if (e.target.id === 'saveTimerModal') {
                    this.hideSaveModal();
                }
            });
        }
    }

    // Get all saved timers from localStorage
    getSavedTimers() {
        try {
            const timers = localStorage.getItem(this.storageKey);
            return timers ? JSON.parse(timers) : {};
        } catch (error) {
            console.error('Error loading timers:', error);
            return {};
        }
    }

    // Save timers to localStorage
    saveTimers(timers) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(timers));
            return true;
        } catch (error) {
            console.error('Error saving timers:', error);
            return false;
        }
    }

    // Get current timer state from the form
    getCurrentTimerState() {
        const intervals = document.querySelectorAll('[data-interval]');
        const outputFormat = document.querySelector('input[name="outputFormat"]:checked')?.value || 'humanized';
        
        const timerData = {
            intervals: [],
            outputFormat: outputFormat
        };

        intervals.forEach(interval => {
            const differentDays = interval.querySelector('.different-days').checked;
            const showSeconds = interval.querySelector('.show-seconds').checked;
            
            const intervalData = {
                differentDays: differentDays,
                startDate: interval.querySelector('.start-date').value,
                endDate: interval.querySelector('.end-date').value,
                startHours: interval.querySelector('.start-hours').value,
                startMinutes: interval.querySelector('.start-minutes').value,
                startSeconds: interval.querySelector('.start-seconds').value,
                endHours: interval.querySelector('.end-hours').value,
                endMinutes: interval.querySelector('.end-minutes').value,
                endSeconds: interval.querySelector('.end-seconds').value,
                showSeconds: showSeconds
            };
            
            timerData.intervals.push(intervalData);
        });

        return timerData;
    }

    // Load timer state into the form
    loadTimerState(timerData) {
        // Reset form first
        this.timeCalculator.resetForm();
        
        // Set output format
        const formatRadio = document.querySelector(`input[name="outputFormat"][value="${timerData.outputFormat}"]`);
        if (formatRadio) {
            formatRadio.checked = true;
            this.timeCalculator.currentFormat = timerData.outputFormat;
        }

        // Load intervals
        timerData.intervals.forEach((intervalData, index) => {
            if (index > 0) {
                // Add additional intervals
                this.timeCalculator.addInterval();
            }
            
            const intervalElement = document.querySelector(`[data-interval="${index + 1}"]`);
            if (!intervalElement) return;

            // Set different days checkbox
            const differentDaysCheckbox = intervalElement.querySelector('.different-days');
            differentDaysCheckbox.checked = intervalData.differentDays;
            this.timeCalculator.toggleDateInputs(index + 1);

            // Set show seconds checkbox
            const showSecondsCheckbox = intervalElement.querySelector('.show-seconds');
            showSecondsCheckbox.checked = intervalData.showSeconds;
            this.timeCalculator.toggleSecondsInputs(index + 1);

            // Set dates
            if (intervalData.differentDays) {
                intervalElement.querySelector('.start-date').value = intervalData.startDate || '';
                intervalElement.querySelector('.end-date').value = intervalData.endDate || '';
            }

            // Set times
            intervalElement.querySelector('.start-hours').value = intervalData.startHours || '';
            intervalElement.querySelector('.start-minutes').value = intervalData.startMinutes || '';
            intervalElement.querySelector('.start-seconds').value = intervalData.startSeconds || '00';
            intervalElement.querySelector('.end-hours').value = intervalData.endHours || '';
            intervalElement.querySelector('.end-minutes').value = intervalData.endMinutes || '';
            intervalElement.querySelector('.end-seconds').value = intervalData.endSeconds || '00';
        });

        // Trigger calculation if form is complete
        setTimeout(() => {
            if (this.timeCalculator.hasValidCompleteIntervals()) {
                this.timeCalculator.calculate();
            }
        }, 100);
    }

    // Update load timers card visibility
    updateLoadTimersCard() {
        const savedTimers = this.getSavedTimers();
        const loadCard = document.getElementById('loadTimersCard');
        const loadSelect = document.getElementById('loadTimerSelect');
        
        if (!loadCard || !loadSelect) return;

        const timerNames = Object.keys(savedTimers);
        
        if (timerNames.length > 0) {
            // Show card and populate select
            loadCard.classList.remove('hidden');
            
            // Remember current selection
            const currentSelection = loadSelect.value;
            
            // Clear and populate select
            loadSelect.innerHTML = '<option value="">-- Carica un timer salvato --</option>';
            
            // Sort timers by updatedAt (most recent first)
            const sortedTimers = timerNames
                .map(name => ({ name, data: savedTimers[name] }))
                .sort((a, b) => {
                    const dateA = new Date(a.data.updatedAt || a.data.createdAt || 0);
                    const dateB = new Date(b.data.updatedAt || b.data.createdAt || 0);
                    return dateB - dateA;
                });

            sortedTimers.forEach(({ name, data }) => {
                const option = document.createElement('option');
                option.value = name;
                
                // Create display text with timestamp
                const timestamp = this.formatDate(data.updatedAt || data.createdAt);
                option.textContent = timestamp ? `${name} • ${timestamp}` : name;
                
                loadSelect.appendChild(option);
            });
            
            // Restore selection if the timer still exists
            if (currentSelection && timerNames.includes(currentSelection)) {
                loadSelect.value = currentSelection;
            } else if (this.currentTimerName && timerNames.includes(this.currentTimerName)) {
                // Or set to current timer name if it exists
                loadSelect.value = this.currentTimerName;
            }
        } else {
            // Hide card
            loadCard.classList.add('hidden');
        }
    }

    // Update save buttons visibility and state
    updateSaveButtons() {
        const intervals = document.querySelectorAll('[data-interval]');
        const hasIntervals = intervals.length > 0 && this.timeCalculator.hasValidCompleteIntervals();
        
        const saveCard = document.getElementById('saveTimersCard');
        const saveBtn = document.getElementById('saveTimerBtn');
        const updateBtn = document.getElementById('updateTimerBtn');
        const deleteBtn = document.getElementById('deleteTimerBtn');
        
        if (!saveCard) return;

        if (hasIntervals) {
            saveCard.classList.remove('hidden');
            
            // Show appropriate buttons based on current state
            if (this.currentTimerName) {
                const currentState = this.getCurrentTimerState();
                const savedTimers = this.getSavedTimers();
                const savedState = savedTimers[this.currentTimerName];
                
                const isModified = !this.compareTimerStates(currentState, savedState);
                
                if (isModified) {
                    updateBtn.classList.remove('hidden');
                    updateBtn.textContent = '💾 Modifica Timer';
                } else {
                    updateBtn.classList.add('hidden');
                }
                
                deleteBtn.classList.remove('hidden');
                saveBtn.textContent = '💾 Salva Come Nuovo';
                
                // Show timestamps for current timer
                this.updateTimestampDisplay(savedState);
            } else {
                updateBtn.classList.add('hidden');
                deleteBtn.classList.add('hidden');
                saveBtn.textContent = '💾 Salva Timer';
                
                // Hide timestamps when no timer is loaded
                this.hideTimestampDisplay();
            }
            
            saveBtn.classList.remove('hidden');
        } else {
            saveCard.classList.add('hidden');
        }
    }

    // Compare two timer states (excluding timestamps)
    compareTimerStates(state1, state2) {
        if (!state1 || !state2) return false;
        
        // Create copies without timestamps for comparison
        const cleanState1 = { ...state1 };
        const cleanState2 = { ...state2 };
        
        delete cleanState1.createdAt;
        delete cleanState1.updatedAt;
        delete cleanState2.createdAt;
        delete cleanState2.updatedAt;
        
        return JSON.stringify(cleanState1) === JSON.stringify(cleanState2);
    }

    // Show save dialog
    showSaveDialog() {
        const modal = document.getElementById('saveTimerModal');
        const input = document.getElementById('timerNameInput');
        
        if (modal && input) {
            // Pre-fill with current timer name if exists
            input.value = this.currentTimerName || '';
            
            // Reset input styling
            input.classList.remove('border-red-500', 'focus:ring-red-500');
            input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:ring-primary-500', 'dark:focus:ring-primary-400');
            
            // Show modal
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus input and select text
            setTimeout(() => {
                input.focus();
                if (input.value) {
                    input.select();
                }
            }, 100);
        }
    }

    // Hide save modal
    hideSaveModal() {
        const modal = document.getElementById('saveTimerModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    // Confirm save from modal
    confirmSave() {
        const input = document.getElementById('timerNameInput');
        if (input && input.value.trim()) {
            const name = input.value.trim();
            
            // Remove error styling if present
            input.classList.remove('border-red-500', 'focus:ring-red-500');
            input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:ring-primary-500', 'dark:focus:ring-primary-400');
            
            this.saveTimer(name);
            this.hideSaveModal();
        } else {
            // Add error styling
            input.classList.remove('border-gray-300', 'dark:border-gray-600', 'focus:ring-primary-500', 'dark:focus:ring-primary-400');
            input.classList.add('border-red-500', 'focus:ring-red-500');
            
            // Show error notification
            this.showNotification('Inserisci un nome per il timer', 'error');
            
            if (input) {
                input.focus();
            }
        }
    }

    // Save current timer
    saveTimer(name) {
        const timerData = this.getCurrentTimerState();
        const savedTimers = this.getSavedTimers();
        const now = new Date().toISOString();
        
        // Add timestamps - preserve createdAt if timer already exists
        const existingTimer = savedTimers[name];
        timerData.createdAt = existingTimer?.createdAt || now;
        timerData.updatedAt = now;
        
        savedTimers[name] = timerData;
        
        if (this.saveTimers(savedTimers)) {
            this.currentTimerName = name;
            this.updateLoadTimersCard();
            this.updateSaveButtons();
            this.showNotification(`Timer "${name}" salvato con successo!`, 'success');
        } else {
            this.showNotification('Errore durante il salvataggio del timer', 'error');
        }
    }

    // Load timer
    loadTimer(name) {
        const savedTimers = this.getSavedTimers();
        const timerData = savedTimers[name];
        
        if (timerData) {
            this.loadTimerState(timerData);
            this.currentTimerName = name;
            this.updateSaveButtons(); // This will also update timestamp display
            this.showNotification(`Timer "${name}" caricato!`, 'success');
            
            // Keep the loaded timer selected in the dropdown
            const loadSelect = document.getElementById('loadTimerSelect');
            if (loadSelect) {
                loadSelect.value = name;
            }
        } else {
            this.showNotification('Timer non trovato', 'error');
        }
    }

    // Update current timer
    updateCurrentTimer() {
        if (!this.currentTimerName) return;
        
        const timerData = this.getCurrentTimerState();
        const savedTimers = this.getSavedTimers();
        const existingTimer = savedTimers[this.currentTimerName];
        
        // Preserve createdAt and update updatedAt
        timerData.createdAt = existingTimer?.createdAt || new Date().toISOString();
        timerData.updatedAt = new Date().toISOString();
        
        savedTimers[this.currentTimerName] = timerData;
        
        if (this.saveTimers(savedTimers)) {
            this.updateSaveButtons();
            this.showNotification(`Timer "${this.currentTimerName}" aggiornato!`, 'success');
        } else {
            this.showNotification('Errore durante l\'aggiornamento del timer', 'error');
        }
    }

    // Delete current timer
    deleteCurrentTimer() {
        if (!this.currentTimerName) return;
        
        if (confirm(`Sei sicuro di voler cancellare il timer "${this.currentTimerName}"?`)) {
            const savedTimers = this.getSavedTimers();
            delete savedTimers[this.currentTimerName];
            
            if (this.saveTimers(savedTimers)) {
                this.currentTimerName = null;
                this.updateLoadTimersCard();
                this.updateSaveButtons();
                
                // Reset select dropdown since we deleted the current timer
                const loadSelect = document.getElementById('loadTimerSelect');
                if (loadSelect) {
                    loadSelect.value = '';
                }
                
                this.showNotification('Timer cancellato con successo!', 'success');
            } else {
                this.showNotification('Errore durante la cancellazione del timer', 'error');
            }
        }
    }

    // Update timestamp display in the card
    updateTimestampDisplay(timerData) {
        const timestampsDiv = document.getElementById('timerTimestamps');
        const createdAtSpan = document.getElementById('createdAt');
        const updatedAtSpan = document.getElementById('updatedAt');
        
        if (timestampsDiv && createdAtSpan && updatedAtSpan && timerData) {
            const createdAt = this.formatDateDetailed(timerData.createdAt);
            const updatedAt = this.formatDateDetailed(timerData.updatedAt);
            
            createdAtSpan.textContent = createdAt || '--';
            updatedAtSpan.textContent = updatedAt || '--';
            
            // Show timestamps if we have at least one date
            if (createdAt || updatedAt) {
                timestampsDiv.classList.remove('hidden');
            } else {
                timestampsDiv.classList.add('hidden');
            }
        }
    }

    // Hide timestamp display
    hideTimestampDisplay() {
        const timestampsDiv = document.getElementById('timerTimestamps');
        if (timestampsDiv) {
            timestampsDiv.classList.add('hidden');
        }
    }

    // Clear current timer reference (when form changes significantly)
    clearCurrentTimer() {
        this.currentTimerName = null;
        this.updateSaveButtons();
        
        // Reset select dropdown
        const loadSelect = document.getElementById('loadTimerSelect');
        if (loadSelect) {
            loadSelect.value = '';
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString('it-IT', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return 'ieri';
        } else if (diffDays < 7) {
            return `${diffDays} giorni fa`;
        } else {
            // Older - show date
            return date.toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: '2-digit',
                year: '2-digit'
            });
        }
    }

    // Format date for detailed view
    formatDateDetailed(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerStorage;
} 