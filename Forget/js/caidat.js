// ============================================
// CAI DAT JS
// ============================================

const SETTINGS_KEY = 'forgetmenot_settings';

// Default settings
const defaultSettings = {
    darkMode: false,
    language: 'vi',
    reminder: true,
    cardsPerSession: 10,
    shareProgress: true,
    publicDecks: false
};

// Load settings
function loadSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { ...defaultSettings };
}

// Save settings
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Apply settings to UI
function applySettings(settings) {
    document.getElementById('darkModeToggle').checked = settings.darkMode || false;
    document.getElementById('languageSelect').value = settings.language || 'vi';
    document.getElementById('reminderToggle').checked = settings.reminder !== false;
    document.getElementById('cardsPerSession').value = settings.cardsPerSession || 10;
    document.getElementById('shareProgress').checked = settings.shareProgress !== false;
    document.getElementById('publicDecks').checked = settings.publicDecks || false;
}

// Get settings from UI
function getSettingsFromUI() {
    return {
        darkMode: document.getElementById('darkModeToggle').checked,
        language: document.getElementById('languageSelect').value,
        reminder: document.getElementById('reminderToggle').checked,
        cardsPerSession: parseInt(document.getElementById('cardsPerSession').value),
        shareProgress: document.getElementById('shareProgress').checked,
        publicDecks: document.getElementById('publicDecks').checked
    };
}

// Apply dark mode
function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.style.setProperty('--bg-main', '#0f172a');
        document.documentElement.style.setProperty('--bg-light', '#1e293b');
        document.documentElement.style.setProperty('--text-dark', '#f1f5f9');
        document.documentElement.style.setProperty('--text-gray', '#94a3b8');
        document.documentElement.style.setProperty('--border', '#334155');
        document.documentElement.style.setProperty('--white', '#1e293b');
    } else {
        document.documentElement.style.setProperty('--bg-main', '#f8fafc');
        document.documentElement.style.setProperty('--bg-light', '#f1f5f9');
        document.documentElement.style.setProperty('--text-dark', '#0f172a');
        document.documentElement.style.setProperty('--text-gray', '#64748b');
        document.documentElement.style.setProperty('--border', '#e2e8f0');
        document.documentElement.style.setProperty('--white', '#ffffff');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    
    const settings = loadSettings();
    applySettings(settings);
    applyDarkMode(settings.darkMode);
    bindEvents();
});

// Bind events
function bindEvents() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('change', function() {
        applyDarkMode(this.checked);
    });
    
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', function() {
        const settings = getSettingsFromUI();
        saveSettings(settings);
        showToast('Đã lưu cài đặt thành công!', 'success');
    });
}