// ============================================
// CALENDAR MODULE
// ============================================

const CALENDAR_KEY = 'forgetmenot_calendar';

// Get calendar data
function getCalendarData() {
    const data = localStorage.getItem(CALENDAR_KEY);
    return data ? JSON.parse(data) : {
        checkedDates: [],
        streak: 0,
        studyStats: {}
    };
}

// Save calendar data
function saveCalendarData(data) {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(data));
}

// Check if a date is today
function isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

// Format date as YYYY-MM-DD
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Render calendar
function renderCalendar() {
    const grid = document.getElementById('calendarGridDates');
    const header = document.getElementById('calendarHeaderTitle');
    if (!grid) return;
    
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const data = getCalendarData();
    
    // Set header
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    if (header) header.textContent = `${monthNames[month]} ${year}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Day names
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    dayNames.forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar-day-name';
        el.textContent = day;
        grid.appendChild(el);
    });
    
    // First day of month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-empty';
        grid.appendChild(el);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = day;
        
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (data.checkedDates.includes(dateKey)) {
            el.classList.add('checked');
        }
        
        if (isToday(new Date(year, month, day))) {
            el.classList.add('today');
        }
        
        el.dataset.date = dateKey;
        el.addEventListener('click', () => showDayDetail(dateKey));
        
        grid.appendChild(el);
    }
    
    updateStreakDisplay();
}

// Show day detail
function showDayDetail(dateKey) {
    const data = getCalendarData();
    const stats = data.studyStats[dateKey] || { decks: 0, cards: 0, time: 0 };
    
    const detailDate = document.getElementById('detailDate');
    const detailCheckin = document.getElementById('detailCheckin');
    const detailDecks = document.getElementById('detailDecks');
    const detailCards = document.getElementById('detailCards');
    const detailTime = document.getElementById('detailTime');
    
    if (detailDate) detailDate.textContent = formatDate(new Date(dateKey));
    if (detailCheckin) {
        detailCheckin.textContent = data.checkedDates.includes(dateKey) ? '✅ Đã điểm danh' : '⏳ Chưa điểm danh';
        detailCheckin.style.color = data.checkedDates.includes(dateKey) ? 'var(--success)' : 'var(--text-gray)';
    }
    if (detailDecks) detailDecks.textContent = stats.decks || 0;
    if (detailCards) detailCards.textContent = stats.cards || 0;
    if (detailTime) detailTime.textContent = stats.time || '0 phút';
}

// Update streak display
function updateStreakDisplay() {
    const data = getCalendarData();
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = data.streak || 0;
}

// Check-in today
function triggerStreakCheckin() {
    const today = new Date();
    const dateKey = formatDateKey(today);
    const data = getCalendarData();
    
    if (data.checkedDates.includes(dateKey)) {
        showToast('Hôm nay bạn đã điểm danh rồi! 🔥', 'warning');
        return;
    }
    
    // Check if yesterday was checked (streak continuity)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    
    const isConsecutive = data.checkedDates.includes(yesterdayKey) || data.checkedDates.length === 0;
    
    data.checkedDates.push(dateKey);
    
    if (isConsecutive) {
        data.streak = (data.streak || 0) + 1;
    } else {
        data.streak = 1;
    }
    
    // Initialize stats for today
    if (!data.studyStats[dateKey]) {
        data.studyStats[dateKey] = { decks: 0, cards: 0, time: 0 };
    }
    
    saveCalendarData(data);
    renderCalendar();
    showToast(`Điểm danh thành công! 🔥 Streak: ${data.streak} ngày`, 'success');
}

// Change month
function changeMonth(delta) {
    const header = document.getElementById('calendarHeaderTitle');
    if (!header) return;
    
    const [monthName, yearStr] = header.textContent.split(' ');
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    let month = monthNames.indexOf(monthName);
    let year = parseInt(yearStr);
    
    month += delta;
    if (month > 11) { month = 0; year++; }
    if (month < 0) { month = 11; year--; }
    
    // Update header
    header.textContent = `${monthNames[month]} ${year}`;
    
    // Re-render with new month
    renderCalendarWithMonth(month, year);
}

// Render calendar with specific month
function renderCalendarWithMonth(month, year) {
    const grid = document.getElementById('calendarGridDates');
    if (!grid) return;
    
    const data = getCalendarData();
    
    // Clear grid
    grid.innerHTML = '';
    
    // Day names
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    dayNames.forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar-day-name';
        el.textContent = day;
        grid.appendChild(el);
    });
    
    // First day of month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-empty';
        grid.appendChild(el);
    }
    
    // Days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = day;
        
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (data.checkedDates.includes(dateKey)) {
            el.classList.add('checked');
        }
        
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            el.classList.add('today');
        }
        
        el.dataset.date = dateKey;
        el.addEventListener('click', () => showDayDetail(dateKey));
        
        grid.appendChild(el);
    }
}

// Initialize calendar
document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGridDates');
    if (calendarGrid) {
        renderCalendar();
        
        // Month navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => changeMonth(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => changeMonth(1));
        }
        
        // Streak check-in
        const checkinBtn = document.getElementById('btnStreakCheck');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', triggerStreakCheckin);
        }
    }
});