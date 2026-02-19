document.addEventListener('DOMContentLoaded', () => {
    // First, verify that all required constants are available
    const requiredConfigs = ['ACTIVE_START', 'ACTIVE_END', 'WORK_START', 'WORK_END', 'FADE_IN_DURATION', 'VISIBLE_DURATION', 'FADE_OUT_DURATION'];
    const missingConfigs = [];
    
    requiredConfigs.forEach(config => {
        if (typeof window[config] === 'undefined') {
            missingConfigs.push(config);
            console.error(`[Time] Missing required configuration: ${config}`);
        }
    });
    
    if (missingConfigs.length > 0) {
        console.error(`[Time] Missing ${missingConfigs.length} required configurations. Please check config.js file.`);
    }

    // Get DOM elements
    const elements = {
        year: {
            value: document.getElementById('year-value'),
            progress: document.getElementById('year-progress'),
            percentage: document.getElementById('year-percentage')
        },
        month: {
            value: document.getElementById('month-value'),
            progress: document.getElementById('month-progress'),
            percentage: document.getElementById('month-percentage')
        },
        week: {
            value: document.getElementById('week-value'),
            progress: document.getElementById('week-progress'),
            percentage: document.getElementById('week-percentage')
        },
        day: {
            value: document.getElementById('day-value'),
            progress: document.getElementById('day-progress'),
            percentage: document.getElementById('day-percentage')
        },
        hour: {
            value: document.getElementById('hour-value'),
            progress: document.getElementById('hour-progress'),
            percentage: document.getElementById('hour-percentage')
        },
        life: {
            unit: document.getElementById('life-unit'),
            value: document.getElementById('life-value'),
            progress: document.getElementById('life-progress'),
            percentage: document.getElementById('life-percentage')
        },
        lifeDaysCanvas: document.getElementById('life-days-canvas'),
        quote: document.getElementById('time-quote'),
        modeOverlay: document.getElementById('mode-overlay'),
        devControls: document.getElementById('dev-controls'),
        devDate: document.getElementById('dev-date'),
        devTime: document.getElementById('dev-time'),
        devApply: document.getElementById('dev-apply'),
        devReset: document.getElementById('dev-reset'),
        devDebug: null,
        dobControls: document.getElementById('dob-controls'),
        dobMonth: document.getElementById('dob-month'),
        dobDay: document.getElementById('dob-day'),
        dobYear: document.getElementById('dob-year'),
        dobModal: document.getElementById('dob-modal'),
        dobConfirm: document.getElementById('dob-confirm'),
        nonLifeUnits: document.querySelectorAll('.container > .time-unit:not(.life-unit)'),
        quoteWrap: document.querySelector('.quote')
    };

    // Development mode variables
    let usingCustomTime = false;
    let customTime = null;
    let customTimeStartedAt = null;
    let debugModeActive = false;

    // Initialize development mode
    if (typeof DEV_MODE_ENABLED !== 'undefined' && DEV_MODE_ENABLED) {
        log("Development mode is enabled");
        initDevMode();
    }
    
    // Log time window configurations
    log(`Active window: ${ACTIVE_START} to ${ACTIVE_END}`);
    log(`Work window: ${WORK_START} to ${WORK_END}`);

    // Time quotes to display randomly
    const timeQuotes = [
        "Time flies like an arrow",
        "The future is something which everyone reaches at the rate of sixty minutes an hour",
        "Time is the most valuable thing a person can spend",
        "Time is a created thing. To say 'I don't have time' is to say 'I don't want to'",
        "Time is the wisest counselor of all",
        "The two most powerful warriors are patience and time",
        "Yesterday is history, today is a gift, tomorrow is a mystery",
        "Lost time is never found again",
        "Better three hours too soon than a minute too late",
        "Time waits for no one",
        "The trouble is, you think you have time",
        "Time you enjoy wasting is not wasted time",
        "They always say time changes things, but you actually have to change them yourself",
        "The key is in not spending time, but in investing it",
        "Time is what we want most, but what we use worst",
        "Time heals all wounds",
        "Time is a great teacher, but unfortunately it kills all its students",
        "Time is a valuable commodity, but it's also a valuable commodity",  
    ];

    // Current mode
    let currentModeIndex = 0;
    const LIFE_MODE_INDEX = 3;
    const LIFE_EXPECTANCY_YEARS = 80;
    const LIFE_TOTAL_DAYS = 29220;
    const LIFE_DOB_STORAGE_KEY = 'timeProgressDob';
    const LIFE_HOLD_DURATION_MS = 3000;
    const LIFE_CANVAS_CSS_HYSTERESIS_PX = 2;
    const LIFE_RESIZE_DEBOUNCE_MS = 200;
    const LIFE_RESIZE_DEFERRED_MS = 500;
    const LIFE_RESIZE_GUARD_WINDOW_MS = 1200;
    const LIFE_RESIZE_GUARD_MIN_EVENTS = 12;
    const LIFE_RESIZE_GUARD_COOLDOWN_MS = 1200;
    const LIFE_RESIZE_STORM_WINDOW_MS = 1500;
    const LIFE_RESIZE_STORM_MIN_EVENTS = 6;
    const LIFE_STAGE_PALETTE = [
        { active: '#7eb8da', inactive: 'rgba(126, 184, 218, 0.25)' },
        { active: '#6bcb9c', inactive: 'rgba(107, 203, 156, 0.25)' },
        { active: '#5dd4c4', inactive: 'rgba(93, 212, 196, 0.25)' },
        { active: '#e8d46a', inactive: 'rgba(232, 212, 106, 0.25)' },
        { active: '#e89a5a', inactive: 'rgba(232, 154, 90, 0.25)' },
        { active: '#e86a6a', inactive: 'rgba(232, 106, 106, 0.25)' },
        { active: '#b87ee0', inactive: 'rgba(184, 126, 224, 0.25)' },
        { active: '#8a9bb0', inactive: 'rgba(138, 155, 176, 0.25)' }
    ];
    const LIFE_STAGE_BOUNDARIES_YEARS = [1, 3, 8, 12, 18, 40, 60];

    let lifeHoldTimer = null;
    let lifeHoldTriggered = false;
    let lifeHoldCompletedAt = 0;
    let isLifeModeApplied = null;
    const lifeCanvasState = {
        context: null,
        width: 0,
        height: 0,
        columns: 0,
        rows: 0,
        cellWidth: 0,
        cellHeight: 0,
        gap: 0,
        offsetX: 0,
        offsetY: 0,
        dpr: 1,
        cssWidth: 0,
        cssHeight: 0,
        resizeObserver: null,
        resizeEvents: [],
        resizeAppliedEvents: [],
        resizeGuardUntil: 0,
        resizeDebounceTimer: null,
        resizeDeferredTimer: null,
        lastLivedDays: null,
        lastCurrentDayIndex: null,
        lastCurrentDayAlpha: null,
        animationFrame: null
    };


    // Simple console logger
    function log(msg) {
        console.log(`[Time] ${msg}`);
    }

    // Development mode initialization
    function initDevMode() {
        // Show dev controls
        elements.devControls.style.display = 'flex';
        
        // Add debug checkbox
        const debugRow = document.createElement('div');
        debugRow.className = 'dev-control-row';
        
        const debugLabel = document.createElement('label');
        debugLabel.htmlFor = 'dev-debug';
        debugLabel.textContent = 'Debug Mode:';
        
        const debugCheckbox = document.createElement('input');
        debugCheckbox.type = 'checkbox';
        debugCheckbox.id = 'dev-debug';
        
        debugRow.appendChild(debugLabel);
        debugRow.appendChild(debugCheckbox);
        elements.devControls.insertBefore(debugRow, elements.devApply);
        
        elements.devDebug = debugCheckbox;
        
        // Set default values to current date/time
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = now.toTimeString().slice(0, 5);  // HH:MM
        
        elements.devDate.value = dateString;
        elements.devTime.value = timeString;
        
        // Debug mode toggling
        elements.devDebug.addEventListener('change', (e) => {
            debugModeActive = e.target.checked;
            log(`Debug mode ${debugModeActive ? 'enabled' : 'disabled'}`);
            updateTime();
        });
        
        // Add event listeners
        elements.devApply.addEventListener('click', () => {
            const dateVal = elements.devDate.value;
            const timeVal = elements.devTime.value;
            
            if (dateVal && timeVal) {
                const [hours, minutes] = timeVal.split(':').map(Number);
                const date = new Date(dateVal);
                date.setHours(hours, minutes, 0, 0);
                
                usingCustomTime = true;
                customTime = date;
                customTimeStartedAt = null; // Will be set on first getCurrentTime call
                log(`Custom time set to: ${customTime}`);
                
                // Force immediate update
                updateTime();
            }
        });
        
        elements.devReset.addEventListener('click', () => {
            usingCustomTime = false;
            customTime = null;
            customTimeStartedAt = null;
            log("Reset to system time");
            
            // Reset input values to current time
            const now = new Date();
            elements.devDate.value = now.toISOString().split('T')[0];
            elements.devTime.value = now.toTimeString().slice(0, 5);
            
            // Force immediate update
            updateTime();
        });
    }

    // Calculate progress for ABSOLUTE mode - original algorithm
    function calculateAbsoluteProgress(now, startDate, endDate) {
        return (now - startDate) / (endDate - startDate);
    }

    // Helper function to get seconds within a day
    function getTimeInSeconds(date) {
        return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    }

    // Helper function to get window bounds today
    function getTodayWindow(windowStartStr, windowEndStr) {
        const now = getCurrentTime();
        
        // Parse start time
        const [startHour, startMin] = windowStartStr.split(':').map(Number);
        const windowStart = new Date(now);
        windowStart.setHours(startHour, startMin, 0, 0);
        
        // Parse end time
        const [endHour, endMin] = windowEndStr.split(':').map(Number);
        const windowEnd = new Date(now);
        windowEnd.setHours(endHour, endMin, 0, 0);
        
        return { windowStart, windowEnd };
    }
    
    // Calculate active day progress with better debugging
    function calculateActiveDay(now, startDate, endDate, windowStartStr, windowEndStr) {
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Day: now=${now.toTimeString()}, windowStart=${windowStart.toTimeString()}, windowEnd=${windowEnd.toTimeString()}`);
        }
        
        // Before window start
        if (now < windowStart) return 0;
        
        // After window end
        if (now > windowEnd) return 1;
        
        // Within window
        return (now - windowStart) / (windowEnd - windowStart);
    }
    
    // Calculate active month progress with better debugging
    function calculateActiveMonth(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Calculate total days in month
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Current day of month
        const dayOfMonth = now.getDate();
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Count effective working days for WORK mode (skip weekends)
        let effectiveDaysInMonth = daysInMonth;
        let effectiveDaysPassed = dayOfMonth - 1;
        
        if (currentModeIndex === 2) {
            // For WORK mode, only count weekdays (we need to count the actual weekdays in month)
            effectiveDaysInMonth = 0;
            effectiveDaysPassed = 0;
            
            // Count working days in the month
            const tempDate = new Date(year, month, 1);
            while (tempDate.getMonth() === month) {
                const dayOfWeek = tempDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                    effectiveDaysInMonth++;
                    
                    // Count days passed before today
                    if (tempDate.getDate() < dayOfMonth) {
                        effectiveDaysPassed++;
                    }
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }
        }
        
        // Total active time (ms)
        const totalActiveTime = effectiveDaysInMonth * windowDuration;
        
        // Calculate active time passed from previous days
        let activeTimePassed = effectiveDaysPassed * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const isToday = true; // Always add today's contribution
        const dayOfWeek = now.getDay();
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek !== 0 && dayOfWeek !== 6);
        
        // Add today's contribution if it's a workday
        if (isTodayWorkday && isToday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = (totalActiveTime > 0) ? activeTimePassed / totalActiveTime : 0;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Month: day=${dayOfMonth}/${daysInMonth}, effective=${effectiveDaysPassed}/${effectiveDaysInMonth}, workday=${isTodayWorkday}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate active year progress with better debugging
    function calculateActiveYear(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Calculate total days in year
        const year = now.getFullYear();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        
        // Calculate day of year (1-based)
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Count effective working days for WORK mode (skip weekends)
        let effectiveDaysInYear = daysInYear;
        let effectiveDaysPassed = dayOfYear - 1;
        
        if (currentModeIndex === 2) {
            // For WORK mode, estimate weekdays (approx 5/7 of total days)
            effectiveDaysInYear = Math.floor(daysInYear * 5 / 7);
            
            // Calculate working days passed so far (more precise)
            effectiveDaysPassed = 0;
            const tempDate = new Date(year, 0, 1);
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            
            while (tempDate < today) {
                const dayOfWeek = tempDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                    effectiveDaysPassed++;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }
        }
        
        // Total active time in the year (ms)
        const totalActiveTime = effectiveDaysInYear * windowDuration;
        
        // Calculate active time passed from previous days
        let activeTimePassed = effectiveDaysPassed * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const dayOfWeek = now.getDay();
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek !== 0 && dayOfWeek !== 6);
        
        // Add today's contribution if it's a workday
        if (isTodayWorkday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = activeTimePassed / totalActiveTime;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Year: day=${dayOfYear}/${daysInYear}, effective=${effectiveDaysPassed}/${effectiveDaysInYear}, workday=${isTodayWorkday}, window=${windowStart.toTimeString()}-${windowEnd.toTimeString()}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate active week progress with better debugging
    function calculateActiveWeek(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Get day of week (0=Sunday, 1=Monday, etc.)
        let dayOfWeek = now.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday to 7 for easier calculation
        
        // For WORK mode, only count weekdays (1-5)
        const daysToCount = currentModeIndex === 2 ? 5 : 7;
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Total active time in the week (ms)
        const totalActiveTime = daysToCount * windowDuration;
        
        // Calculate active time passed
        // For WORK mode: Only count weekdays (1-5)
        // For other modes: Count all days
        const effectiveDayOfWeek = currentModeIndex === 2 ? Math.min(dayOfWeek, 5) : dayOfWeek;
        let activeTimePassed = (effectiveDayOfWeek - 1) * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek <= 5);
        
        // Add today's contribution (if it's a counted day)
        if (isTodayWorkday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = activeTimePassed / totalActiveTime;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Week: dayOfWeek=${dayOfWeek}, effectiveDay=${effectiveDayOfWeek}, workday=${isTodayWorkday}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate progress for a time unit based on the current mode
    function calculateProgress(unit, now, startDate, endDate) {
        if (debugModeActive) {
            const modeNames = ["ABSOLUTE", "ACTIVE", "WORK", "LIFE"];
            log(`Calculating progress for ${unit}, mode=${modeNames[currentModeIndex]}, day=${getDayName(now.getDay())}`);
        }
    
        // ABSOLUTE mode - original calculation
        if (currentModeIndex === 0 || currentModeIndex === LIFE_MODE_INDEX) {
            return calculateAbsoluteProgress(now, startDate, endDate);
        }
        
        // Check if it's weekend and in WORK mode
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
        
        // For WORK mode on weekends, return 100% for day and week units only
        if (currentModeIndex === 2 && isWeekend && (unit === 'day' || unit === 'week')) {
            if (debugModeActive) {
                log(`Weekend detected (${getDayName(dayOfWeek)}), returning 100% for ${unit}`);
            }
            return 1;
        }
        
        // Get time window based on the mode
        const windowStartStr = currentModeIndex === 1 ? ACTIVE_START : WORK_START;
        const windowEndStr = currentModeIndex === 1 ? ACTIVE_END : WORK_END;
        
        // Hour is always ABSOLUTE
        if (unit === 'hour') {
            return calculateAbsoluteProgress(now, startDate, endDate);
        }
        
        // For day unit
        if (unit === 'day') {
            return calculateActiveDay(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For week unit
        if (unit === 'week') {
            return calculateActiveWeek(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For month unit
        if (unit === 'month') {
            return calculateActiveMonth(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For year unit
        if (unit === 'year') {
            return calculateActiveYear(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // Fallback
        return 0;
    }
    
    // Mode switching function
    function cycleMode() {
        // Move to next mode in cycle
        currentModeIndex = (currentModeIndex + 1) % 4; // Cycle through 0, 1, 2, 3
        
        const modeNames = ["ABSOLUTE", "ACTIVE", "WORK", "LIFE"];
        log(`Switched to ${modeNames[currentModeIndex]} mode`);

        applyLifeModeState();
        
        // Show mode overlay
        elements.modeOverlay.textContent = modeNames[currentModeIndex];
        elements.modeOverlay.style.opacity = '1';
        elements.modeOverlay.style.visibility = 'visible';
        
        // Force immediate update
        updateTime();
        
        // Hide overlay after delay
        setTimeout(() => {
            elements.modeOverlay.style.opacity = '0';
            setTimeout(() => {
                elements.modeOverlay.style.visibility = 'hidden';
            }, FADE_OUT_DURATION);
        }, VISIBLE_DURATION + FADE_IN_DURATION);
    }
    
    // Get current time - either system time or simulated time
    function getCurrentTime() {
        if (usingCustomTime && customTime) {
            const now = new Date();
            
            // If we have a custom time, calculate how much real time has passed since it was set
            // and add that delta to the custom time
            if (!customTimeStartedAt) {
                customTimeStartedAt = now;
                return new Date(customTime);
            }
            
            const realTimeDeltaMs = now - customTimeStartedAt;
            const simulatedTime = new Date(customTime.getTime() + realTimeDeltaMs);
            
            return simulatedTime;
        }
        return new Date();
    }
    
    function createSelectOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
    }

    function updateDayOptions(selectedMonth, selectedYear) {
        const month = Number(selectedMonth);
        const year = Number(selectedYear);
        const previousDay = elements.dobDay.value;
        elements.dobDay.innerHTML = '';

        const isValidMonth = Number.isInteger(month) && month >= 0 && month <= 11;
        const isValidYear = Number.isInteger(year) && year > 0;

        if (!isValidMonth || !isValidYear) {
            elements.dobDay.appendChild(createSelectOption('', 'Day'));
            return;
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        elements.dobDay.appendChild(createSelectOption('', 'Day'));
        for (let day = 1; day <= daysInMonth; day++) {
            elements.dobDay.appendChild(createSelectOption(String(day), String(day)));
        }

        if (previousDay && Number(previousDay) <= daysInMonth) {
            elements.dobDay.value = previousDay;
        }
    }

    function saveDobIfComplete() {
        const month = elements.dobMonth.value;
        const day = elements.dobDay.value;
        const year = elements.dobYear.value;

        if (!month || !day || !year) {
            localStorage.removeItem(LIFE_DOB_STORAGE_KEY);
            resetLifeCanvasRenderCache();
            return;
        }

        const dob = new Date(Number(year), Number(month), Number(day));
        const isValidDate = dob.getFullYear() === Number(year) && dob.getMonth() === Number(month) && dob.getDate() === Number(day);

        if (!isValidDate || dob > new Date()) {
            localStorage.removeItem(LIFE_DOB_STORAGE_KEY);
            resetLifeCanvasRenderCache();
            return;
        }

        localStorage.setItem(LIFE_DOB_STORAGE_KEY, JSON.stringify({
            year: Number(year),
            month: Number(month),
            day: Number(day)
        }));
        resetLifeCanvasRenderCache();
    }

    function setupDobControls() {
        const monthNames = ['Month', 'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];

        monthNames.forEach((name, index) => {
            const value = index === 0 ? '' : String(index - 1);
            elements.dobMonth.appendChild(createSelectOption(value, name));
        });

        const currentYear = new Date().getFullYear();
        elements.dobYear.appendChild(createSelectOption('', 'Year'));
        for (let year = currentYear; year >= currentYear - 120; year--) {
            elements.dobYear.appendChild(createSelectOption(String(year), String(year)));
        }

        updateDayOptions(elements.dobMonth.value, elements.dobYear.value);

        const savedDobRaw = localStorage.getItem(LIFE_DOB_STORAGE_KEY);
        if (savedDobRaw) {
            try {
                const savedDob = JSON.parse(savedDobRaw);
                elements.dobMonth.value = String(savedDob.month);
                elements.dobYear.value = String(savedDob.year);
                updateDayOptions(savedDob.month, savedDob.year);
                elements.dobDay.value = String(savedDob.day);
            } catch (error) {
                localStorage.removeItem(LIFE_DOB_STORAGE_KEY);
            }
        }

        const onDobChange = () => {
            updateDayOptions(elements.dobMonth.value, elements.dobYear.value);
            saveDobIfComplete();
            updateTime();
        };

        elements.dobMonth.addEventListener('change', onDobChange);
        elements.dobYear.addEventListener('change', onDobChange);
        elements.dobDay.addEventListener('change', () => {
            saveDobIfComplete();
            updateTime();
        });

        elements.dobConfirm.addEventListener('click', () => {
            saveDobIfComplete();
            closeDobModal();
            updateTime();
        });
    }

    function resetLifeCanvasRenderCache() {
        lifeCanvasState.lastLivedDays = null;
        lifeCanvasState.lastCurrentDayIndex = null;
        lifeCanvasState.lastCurrentDayAlpha = null;
    }

    function getCurrentDayAlpha() {
        const blinkPhase = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        return Number((0.4 + blinkPhase * 0.6).toFixed(3));
    }

    function triggerLifeResizeGuard(now, reason) {
        lifeCanvasState.resizeGuardUntil = now + LIFE_RESIZE_GUARD_COOLDOWN_MS;
        lifeCanvasState.resizeEvents = [];
        lifeCanvasState.resizeAppliedEvents = [];

        clearTimeout(lifeCanvasState.resizeDebounceTimer);
        clearTimeout(lifeCanvasState.resizeDeferredTimer);

        lifeCanvasState.resizeDeferredTimer = setTimeout(() => {
            const resized = resizeLifeCanvas();
            if (!resized) {
                return;
            }
            renderLifeDayGrid(getLifeStats(getCurrentTime()));
        }, LIFE_RESIZE_GUARD_COOLDOWN_MS + LIFE_RESIZE_DEFERRED_MS);

        if (debugModeActive) {
            log(`ResizeObserver guard triggered (${reason}) for ${LIFE_RESIZE_GUARD_COOLDOWN_MS}ms`);
        }
    }

    function processLifeCanvasResizeRequest() {
        const now = Date.now();
        if (now < lifeCanvasState.resizeGuardUntil) {
            if (debugModeActive) {
                log(`ResizeObserver guard active; suppressed until ${new Date(lifeCanvasState.resizeGuardUntil).toISOString()}`);
            }
            return;
        }

        const hasResized = resizeLifeCanvas();
        lifeCanvasState.resizeEvents.push(now);
        lifeCanvasState.resizeEvents = lifeCanvasState.resizeEvents.filter((timestamp) => now - timestamp <= LIFE_RESIZE_GUARD_WINDOW_MS);

        if (!hasResized && lifeCanvasState.resizeEvents.length >= LIFE_RESIZE_GUARD_MIN_EVENTS) {
            triggerLifeResizeGuard(now, 'noop-storm');
            return;
        }

        if (hasResized) {
            lifeCanvasState.resizeAppliedEvents.push(now);
            lifeCanvasState.resizeAppliedEvents = lifeCanvasState.resizeAppliedEvents.filter((timestamp) => now - timestamp <= LIFE_RESIZE_STORM_WINDOW_MS);

            if (lifeCanvasState.resizeAppliedEvents.length >= LIFE_RESIZE_STORM_MIN_EVENTS) {
                triggerLifeResizeGuard(now, 'resize-storm');
                return;
            }

            renderLifeDayGrid(getLifeStats(getCurrentTime()));
        }
    }

    function getBestCanvasGridLayout(width, height) {
        const gap = 0;
        let best = null;

        for (let columns = 1; columns <= width; columns++) {
            const rows = Math.ceil(LIFE_TOTAL_DAYS / columns);
            if (rows > height) {
                continue;
            }
            const cellWidth = (width - (columns - 1) * gap) / columns;
            const cellHeight = (height - (rows - 1) * gap) / rows;
            if (cellWidth < 1 || cellHeight < 1) {
                continue;
            }
            const minCell = Math.min(cellWidth, cellHeight);
            if (!best || minCell > Math.min(best.cellWidth, best.cellHeight)) {
                best = { columns, rows, cellWidth, cellHeight, gap, offsetX: 0, offsetY: 0 };
            }
        }

        if (best) {
            return best;
        }
        const minColumns = 20;
        const columns = Math.max(minColumns, Math.min(width, Math.ceil(LIFE_TOTAL_DAYS / height)));
        const rows = Math.ceil(LIFE_TOTAL_DAYS / columns);
        const cellWidth = (width - (columns - 1) * gap) / columns;
        const cellHeight = (height - (rows - 1) * gap) / rows;
        return { columns, rows, cellWidth, cellHeight, gap, offsetX: 0, offsetY: 0 };
    }

    function resizeLifeCanvas(force = false) {
        const canvas = elements.lifeDaysCanvas;
        if (!canvas) {
            return false;
        }

        const rect = canvas.getBoundingClientRect();
        let measuredCssWidth = Math.max(1, rect.width);
        let measuredCssHeight = Math.max(1, rect.height);

        if (measuredCssWidth < 50 || measuredCssHeight < 50) {
            const vv = window.visualViewport;
            const fallbackWidth = (canvas.offsetWidth > 0 ? canvas.offsetWidth : (vv ? vv.width : window.innerWidth));
            const fallbackHeight = (canvas.offsetHeight > 0 ? canvas.offsetHeight : (vv ? vv.height : window.innerHeight));
            if (measuredCssWidth < 50 && fallbackWidth > 0) {
                measuredCssWidth = fallbackWidth;
            }
            if (measuredCssHeight < 50 && fallbackHeight > 0) {
                measuredCssHeight = fallbackHeight;
            }
        }

        const previousCssWidth = lifeCanvasState.cssWidth || measuredCssWidth;
        const previousCssHeight = lifeCanvasState.cssHeight || measuredCssHeight;
        const trustPrevious = (w, h) => w >= 50 && h >= 50;
        const effectiveCssWidth = trustPrevious(previousCssWidth, previousCssHeight) && Math.abs(measuredCssWidth - previousCssWidth) <= LIFE_CANVAS_CSS_HYSTERESIS_PX
            ? previousCssWidth
            : measuredCssWidth;
        const effectiveCssHeight = trustPrevious(previousCssWidth, previousCssHeight) && Math.abs(measuredCssHeight - previousCssHeight) <= LIFE_CANVAS_CSS_HYSTERESIS_PX
            ? previousCssHeight
            : measuredCssHeight;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(effectiveCssWidth * dpr));
        const height = Math.max(1, Math.round(effectiveCssHeight * dpr));

        if (debugModeActive) {
            const visualViewport = window.visualViewport;
            const vvMetrics = visualViewport
                ? `vv=${visualViewport.width.toFixed(2)}x${visualViewport.height.toFixed(2)} scale=${visualViewport.scale.toFixed(3)} offsetTop=${visualViewport.offsetTop.toFixed(2)}`
                : 'vv=unavailable';
            log(`LifeCanvas resize probe ts=${new Date().toISOString()} rect=${rect.width.toFixed(2)}x${rect.height.toFixed(2)} css=${effectiveCssWidth.toFixed(2)}x${effectiveCssHeight.toFixed(2)} inner=${window.innerWidth}x${window.innerHeight} dpr=${dpr.toFixed(3)} px=${width}x${height} ${vvMetrics}`);
        }

        if (!force && lifeCanvasState.width === width && lifeCanvasState.height === height && lifeCanvasState.dpr === dpr) {
            return false;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { alpha: false });
        context.imageSmoothingEnabled = false;

        const layout = getBestCanvasGridLayout(width, height);

        lifeCanvasState.context = context;
        lifeCanvasState.width = width;
        lifeCanvasState.height = height;
        lifeCanvasState.cssWidth = effectiveCssWidth;
        lifeCanvasState.cssHeight = effectiveCssHeight;
        lifeCanvasState.dpr = dpr;
        lifeCanvasState.columns = layout.columns;
        lifeCanvasState.rows = layout.rows;
        lifeCanvasState.cellWidth = layout.cellWidth;
        lifeCanvasState.cellHeight = layout.cellHeight;
        lifeCanvasState.gap = layout.gap;
        lifeCanvasState.offsetX = layout.offsetX;
        lifeCanvasState.offsetY = layout.offsetY;

        resetLifeCanvasRenderCache();
        return true;
    }

    function drawLifeDay(index, fillStyle) {
        const { context, columns, cellWidth, cellHeight, gap, offsetX, offsetY } = lifeCanvasState;
        if (!context) {
            return;
        }

        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = offsetX + column * (cellWidth + gap);
        const y = offsetY + row * (cellHeight + gap);
        context.fillStyle = fillStyle;
        context.fillRect(x, y, cellWidth, cellHeight);
    }

    function getStageForDayIndex(index) {
        const ageInYears = index / 365.25;
        for (let stageIndex = 0; stageIndex < LIFE_STAGE_BOUNDARIES_YEARS.length; stageIndex++) {
            if (ageInYears < LIFE_STAGE_BOUNDARIES_YEARS[stageIndex]) {
                return stageIndex;
            }
        }
        return LIFE_STAGE_PALETTE.length - 1;
    }

    function getColorForDay(index, livedDays, currentDayIndex, currentDayAlpha = null) {
        const stageIndex = getStageForDayIndex(index);
        const stageColors = LIFE_STAGE_PALETTE[stageIndex];

        if (index === currentDayIndex && index < LIFE_TOTAL_DAYS && currentDayAlpha !== null) {
            const rgb = hexToRgb(stageColors.active);
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentDayAlpha})`;
        }

        return index < livedDays ? stageColors.active : stageColors.inactive;
    }

    function hexToRgb(hexColor) {
        const normalized = hexColor.replace('#', '');
        const value = normalized.length === 3
            ? normalized.split('').map((char) => `${char}${char}`).join('')
            : normalized;

        return {
            r: Number.parseInt(value.slice(0, 2), 16),
            g: Number.parseInt(value.slice(2, 4), 16),
            b: Number.parseInt(value.slice(4, 6), 16)
        };
    }

    function redrawCurrentLifeDay(lifeStats) {
        const { livedDays, currentDayIndex } = lifeStats;
        if (livedDays >= LIFE_TOTAL_DAYS) {
            return;
        }

        const previousCurrentDayIndex = lifeCanvasState.lastCurrentDayIndex;
        if (typeof previousCurrentDayIndex === 'number' && previousCurrentDayIndex !== currentDayIndex && previousCurrentDayIndex < LIFE_TOTAL_DAYS) {
            drawLifeDay(previousCurrentDayIndex, getColorForDay(previousCurrentDayIndex, livedDays, currentDayIndex, null));
        }

        const currentDayAlpha = getCurrentDayAlpha();
        drawLifeDay(currentDayIndex, getColorForDay(currentDayIndex, livedDays, currentDayIndex, currentDayAlpha));
        lifeCanvasState.lastCurrentDayAlpha = currentDayAlpha;
        lifeCanvasState.lastCurrentDayIndex = currentDayIndex;
    }

    function stopLifeAnimationLoop() {
        if (lifeCanvasState.animationFrame) {
            cancelAnimationFrame(lifeCanvasState.animationFrame);
            lifeCanvasState.animationFrame = null;
        }
    }

    function startLifeAnimationLoop() {
        if (lifeCanvasState.animationFrame) {
            return;
        }

        const animate = () => {
            if (currentModeIndex !== LIFE_MODE_INDEX || !lifeCanvasState.context) {
                lifeCanvasState.animationFrame = null;
                return;
            }

            redrawCurrentLifeDay(getLifeStats(getCurrentTime()));
            lifeCanvasState.animationFrame = requestAnimationFrame(animate);
        };

        lifeCanvasState.animationFrame = requestAnimationFrame(animate);
    }

    function clearLifeCanvas() {
        const { context, width, height } = lifeCanvasState;
        if (!context) {
            return;
        }

        context.fillStyle = '#05070d';
        context.fillRect(0, 0, width, height);
    }

    function createLifeDayGrid() {
        resizeLifeCanvas(true);

        if (typeof ResizeObserver !== 'undefined' && elements.lifeDaysCanvas) {
            lifeCanvasState.resizeObserver = new ResizeObserver(() => {
                if (debugModeActive) {
                    const now = Date.now();
                    const rect = elements.lifeDaysCanvas.getBoundingClientRect();
                    const visualViewport = window.visualViewport;
                    const vvMetrics = visualViewport
                        ? `vv=${visualViewport.width.toFixed(2)}x${visualViewport.height.toFixed(2)} scale=${visualViewport.scale.toFixed(3)} offsetTop=${visualViewport.offsetTop.toFixed(2)}`
                        : 'vv=unavailable';
                    log(`ResizeObserver ts=${new Date(now).toISOString()} rect=${rect.width.toFixed(2)}x${rect.height.toFixed(2)} inner=${window.innerWidth}x${window.innerHeight} dpr=${(window.devicePixelRatio || 1).toFixed(3)} ${vvMetrics}`);
                }

                clearTimeout(lifeCanvasState.resizeDebounceTimer);
                lifeCanvasState.resizeDebounceTimer = setTimeout(() => {
                    processLifeCanvasResizeRequest();
                }, LIFE_RESIZE_DEBOUNCE_MS);
            });
            lifeCanvasState.resizeObserver.observe(elements.lifeDaysCanvas);
        }
    }

    function openDobModal() {
        elements.dobModal.classList.remove('hidden');
        lifeHoldCompletedAt = Date.now();
    }

    function closeDobModal() {
        elements.dobModal.classList.add('hidden');
    }

    function getLifeStats(now) {
        const dob = getDobFromSelection();
        if (!dob) {
            return { progress: 0, livedDays: 0, currentDayIndex: 0 };
        }

        const endOfLife = new Date(dob);
        endOfLife.setFullYear(endOfLife.getFullYear() + LIFE_EXPECTANCY_YEARS);

        let progress = 0;
        if (now > dob) {
            progress = (now - dob) / (endOfLife - dob);
        }
        progress = Math.max(0, Math.min(1, progress));

        const livedDays = Math.floor(progress * LIFE_TOTAL_DAYS);
        const currentDayIndex = Math.min(LIFE_TOTAL_DAYS - 1, livedDays);
        return { progress, livedDays, currentDayIndex };
    }

    function renderLifeDayGrid(lifeStats) {
        const { livedDays, currentDayIndex } = lifeStats;
        if (!lifeCanvasState.context) {
            resizeLifeCanvas(true);
        }

        if (!lifeCanvasState.context) {
            return;
        }

        const currentDayAlpha = getCurrentDayAlpha();

        if (lifeCanvasState.lastLivedDays === livedDays
            && lifeCanvasState.lastCurrentDayIndex === currentDayIndex
            && lifeCanvasState.lastCurrentDayAlpha === currentDayAlpha) {
            return;
        }

        if (lifeCanvasState.lastLivedDays === null) {
            clearLifeCanvas();
            for (let index = 0; index < LIFE_TOTAL_DAYS; index++) {
                drawLifeDay(index, getColorForDay(index, livedDays, currentDayIndex));
            }
        } else if (lifeCanvasState.lastLivedDays !== livedDays) {
            const previousLivedDays = lifeCanvasState.lastLivedDays;
            if (previousLivedDays < livedDays) {
                for (let index = previousLivedDays; index < livedDays; index++) {
                    drawLifeDay(index, getColorForDay(index, livedDays, currentDayIndex));
                }
            } else {
                for (let index = livedDays; index < previousLivedDays; index++) {
                    drawLifeDay(index, getColorForDay(index, livedDays, currentDayIndex));
                }
            }
        }

        const previousCurrentDayIndex = lifeCanvasState.lastCurrentDayIndex;
        if (typeof previousCurrentDayIndex === 'number' && previousCurrentDayIndex < LIFE_TOTAL_DAYS) {
            drawLifeDay(previousCurrentDayIndex, getColorForDay(previousCurrentDayIndex, livedDays, currentDayIndex));
        }

        if (livedDays < LIFE_TOTAL_DAYS) {
            drawLifeDay(currentDayIndex, getColorForDay(currentDayIndex, livedDays, currentDayIndex, currentDayAlpha));
        }

        lifeCanvasState.lastLivedDays = livedDays;
        lifeCanvasState.lastCurrentDayIndex = currentDayIndex;
        lifeCanvasState.lastCurrentDayAlpha = currentDayAlpha;
    }

    function getDobFromSelection() {
        const month = elements.dobMonth.value;
        const day = elements.dobDay.value;
        const year = elements.dobYear.value;

        if (!month || !day || !year) {
            return null;
        }

        const dob = new Date(Number(year), Number(month), Number(day));
        const isValidDate = dob.getFullYear() === Number(year) && dob.getMonth() === Number(month) && dob.getDate() === Number(day);

        if (!isValidDate || dob > getCurrentTime()) {
            return null;
        }

        return dob;
    }

    function applyLifeModeState() {
        const isLifeMode = currentModeIndex === LIFE_MODE_INDEX;

        if (isLifeModeApplied === isLifeMode) {
            return;
        }

        isLifeModeApplied = isLifeMode;
        document.body.classList.toggle('life-mode', isLifeMode);
        elements.life.unit.classList.toggle('hidden', !isLifeMode);
        elements.nonLifeUnits.forEach(unit => unit.classList.toggle('hidden', isLifeMode));
        if (elements.quoteWrap) {
            elements.quoteWrap.classList.toggle('hidden', isLifeMode);
        }
        if (!isLifeMode) {
            closeDobModal();
            stopLifeAnimationLoop();
            return;
        }

        startLifeAnimationLoop();

        requestAnimationFrame(() => {
            if (currentModeIndex !== LIFE_MODE_INDEX) return;
            const resized = resizeLifeCanvas(true);
            if (resized) {
                renderLifeDayGrid(getLifeStats(getCurrentTime()));
            }
        });
        setTimeout(() => {
            if (currentModeIndex !== LIFE_MODE_INDEX) return;
            const resized = resizeLifeCanvas(true);
            if (resized) {
                renderLifeDayGrid(getLifeStats(getCurrentTime()));
            }
        }, 400);
    }

    function startLifeHold() {
        if (currentModeIndex !== LIFE_MODE_INDEX) {
            return;
        }
        lifeHoldTriggered = false;
        clearTimeout(lifeHoldTimer);
        lifeHoldTimer = setTimeout(() => {
            lifeHoldTriggered = true;
            openDobModal();
        }, LIFE_HOLD_DURATION_MS);
    }

    function stopLifeHold() {
        clearTimeout(lifeHoldTimer);
    }

    function cancelLifeHoldAndFlag(event) {
        stopLifeHold();
        if (lifeHoldTriggered && event) {
            lifeHoldCompletedAt = Date.now();
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // Click anywhere to cycle modes
    document.addEventListener('click', (event) => {
        const holdCooldownActive = Date.now() - lifeHoldCompletedAt < 1200;
        // Don't cycle mode if clicking on dev controls
        if ((elements.devControls && elements.devControls.contains(event.target)) ||
            (elements.dobModal && elements.dobModal.contains(event.target)) ||
            holdCooldownActive ||
            (currentModeIndex === LIFE_MODE_INDEX && elements.life.value.contains(event.target) && lifeHoldTriggered)) {
            return;
        }
        cycleMode();
    });

    elements.life.value.addEventListener('pointerdown', startLifeHold);
    elements.life.value.addEventListener('pointerup', cancelLifeHoldAndFlag);
    elements.life.value.addEventListener('pointerleave', stopLifeHold);
    elements.life.value.addEventListener('pointercancel', stopLifeHold);
    elements.life.value.addEventListener('touchstart', startLifeHold, { passive: true });
    elements.life.value.addEventListener('touchend', cancelLifeHoldAndFlag);
    elements.life.value.addEventListener('mousedown', startLifeHold);
    elements.life.value.addEventListener('mouseup', cancelLifeHoldAndFlag);
    elements.life.value.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Change quote periodically
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * timeQuotes.length);
        elements.quote.textContent = timeQuotes[randomIndex];
        elements.quote.style.opacity = 0;
        setTimeout(() => {
            elements.quote.style.opacity = 0.7;
        }, 500);
    }, 100000);

    // Update time function
    function updateTime() {
        const now = getCurrentTime();
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Year calculations
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        const yearProgress = calculateProgress('year', now, startOfYear, endOfYear);
        
        // Month calculations
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month, daysInMonth, 23, 59, 59, 999);
        const monthProgress = calculateProgress('month', now, startOfMonth, endOfMonth);
        
        // Week calculations (according to requirement, week starts on Monday)
        const dayOfWeek = day || 7; // Convert Sunday (0) to 7
        const mondayOffset = dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(date - mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const weekProgress = calculateProgress('week', now, startOfWeek, endOfWeek);
        
        // Day calculations
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const dayProgress = calculateProgress('day', now, startOfDay, endOfDay);
        
        // Hour calculations (always absolute)
        const startOfHour = new Date(now);
        startOfHour.setMinutes(0, 0, 0);
        const endOfHour = new Date(now);
        endOfHour.setMinutes(59, 59, 999);
        const hourProgress = calculateProgress('hour', now, startOfHour, endOfHour);

        // Update DOM
        updateElement(elements.year, year, yearProgress);
        updateElement(elements.month, getMonthName(month), monthProgress);
        updateElement(elements.week, `Week ${getWeekNumber(now)}`, weekProgress);
        updateElement(elements.day, getDayName(day), dayProgress);
        updateElement(elements.hour, `${hours}:${minutes.toString().padStart(2, '0')}`, hourProgress);

        if (currentModeIndex === LIFE_MODE_INDEX) {
            const lifeStats = getLifeStats(now);
            updateElement(elements.life, 'Life', lifeStats.progress);
            renderLifeDayGrid(lifeStats);
        }

        // Pulse effect on active progress bars
        addPulseEffect();
    }

    // Helper function to update DOM elements
    function updateElement(element, value, progress) {
        element.value.textContent = value;
        element.progress.style.width = `${progress * 100}%`;
        element.percentage.textContent = `${(progress * 100).toFixed(8)}%`;
        
        // For debugging
        if (debugModeActive) {
            element.percentage.textContent += ` [${progress.toFixed(8)}]`;
        }
    }

    // Helper function to get month name
    function getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    // Helper function to get day name
    function getDayName(day) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[day];
    }

    // Helper function to get week number
    function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Add pulse effect to fastest moving progress bar
    function addPulseEffect() {
        const hourBar = elements.hour.progress;
        hourBar.classList.add('pulse');
        setTimeout(() => {
            hourBar.classList.remove('pulse');
        }, 500);
    }

    setupDobControls();
    createLifeDayGrid();
    applyLifeModeState();

    // Initialize and update every 100ms for smooth animations
    updateTime();
    setInterval(updateTime, 100);

    // Add animation to stylesheet for pulse effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        
        .pulse {
            animation: pulse 1s infinite;
        }
        
        .progress-bar {
            transition: width 0.1s linear;
        }
    `;
    document.head.appendChild(style);
    
    // Log initialization
    log("Time Progress Visualization initialized");
}); 
