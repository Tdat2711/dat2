// ============================================
// THONG KE JS
// ============================================

let dailyChartInstance = null;
let retentionChartInstance = null;
let currentPeriod = 'week';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadStats();
    renderCharts();
    renderDeckPerformance();
    bindEvents();
});

// Load stats
function loadStats() {
    const calendarData = getCalendarData();
    const decks = JSON.parse(localStorage.getItem('forgetmenot_decks') || '[]');
    const user = getCurrentUser();
    
    // Calculate stats
    const totalCards = decks.reduce((sum, d) => sum + d.totalCards, 0);
    const totalLearned = decks.reduce((sum, d) => sum + d.learned, 0);
    const retention = totalCards > 0 ? Math.round((totalLearned / totalCards) * 100) : 0;
    const streak = calendarData.streak || 0;
    
    // Update UI
    document.getElementById('streakStat').textContent = streak;
    document.getElementById('cardsLearnedStat').textContent = totalLearned;
    document.getElementById('timeStat').textContent = user?.totalTime || 0;
    document.getElementById('retentionStat').textContent = retention + '%';
}

// Render charts
function renderCharts() {
    renderDailyChart();
    renderRetentionChart();
}

// Daily chart
function renderDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    // Get last 7 days data
    const labels = [];
    const data = [];
    const days = currentPeriod === 'week' ? 7 : currentPeriod === 'month' ? 30 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = formatDateKey(date);
        labels.push(date.getDate() + '/' + (date.getMonth() + 1));
        
        const calendarData = getCalendarData();
        const checked = calendarData.checkedDates.includes(key) ? 1 : 0;
        data.push(checked);
    }
    
    if (dailyChartInstance) {
        dailyChartInstance.destroy();
    }
    
    dailyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số thẻ đã học',
                data: data.map(d => d * 5 + Math.floor(Math.random() * 3)),
                backgroundColor: 'rgba(79,70,229,0.7)',
                borderColor: 'rgba(79,70,229,1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: { stepSize: 5 }
                }
            }
        }
    });
}

// Retention chart
function renderRetentionChart() {
    const ctx = document.getElementById('retentionChart').getContext('2d');
    
    const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6'];
    const data = [45, 55, 65, 72, 78, 85];
    
    if (retentionChartInstance) {
        retentionChartInstance.destroy();
    }
    
    retentionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tỷ lệ ghi nhớ',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Render deck performance
function renderDeckPerformance() {
    const container = document.getElementById('deckPerformanceList');
    const decks = JSON.parse(localStorage.getItem('forgetmenot_decks') || '[]');
    
    if (decks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-gray);">
                <i class="fas fa-layer-group" style="font-size: 40px; margin-bottom: 16px; display: block;"></i>
                <p>Chưa có dữ liệu bộ thẻ</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = decks.map(deck => {
        const progress = deck.totalCards > 0 ? Math.round((deck.learned / deck.totalCards) * 100) : 0;
        const fillClass = progress >= 70 ? 'high' : progress >= 40 ? 'medium' : 'low';
        
        return `
            <div class="deck-perf-item">
                <div class="deck-perf-name">
                    <span class="icon">${deck.icon}</span>
                    <span>${deck.name}</span>
                </div>
                <div class="deck-perf-progress">
                    <div class="bar">
                        <div class="fill ${fillClass}" style="width: ${progress}%"></div>
                    </div>
                    <span style="font-size: 13px; font-weight: 600; min-width: 40px;">${progress}%</span>
                </div>
                <div class="deck-perf-stats">
                    <div class="number">${deck.learned}</div>
                    <div class="label">Đã học</div>
                </div>
                <div class="deck-perf-stats">
                    <div class="number">${deck.totalCards}</div>
                    <div class="label">Tổng</div>
                </div>
            </div>
        `;
    }).join('');
}

// Bind events
function bindEvents() {
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            renderCharts();
        });
    });
}

// Helper functions (reuse from calendar.js)
function getCalendarData() {
    const data = localStorage.getItem('forgetmenot_calendar');
    return data ? JSON.parse(data) : { checkedDates: [], streak: 0, studyStats: {} };
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}