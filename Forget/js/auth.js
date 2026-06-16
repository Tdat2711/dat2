// ============================================
// AUTHENTICATION SYSTEM
// ============================================

// User database key
const USERS_KEY = 'forgetmenot_users';
const CURRENT_USER_KEY = 'forgetmenot_current_user';

// Initialize default users if not exists
function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers = [
            {
                id: 'FMN001',
                name: 'Demo User',
                email: 'demo@forgetmenot.com',
                password: '123456',
                createdAt: new Date().toISOString(),
                streak: 0,
                totalCards: 0,
                totalDecks: 2,
                totalTime: 0
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
}

// Get all users
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

// Save users
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current logged in user
function getCurrentUser() {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Redirect to login if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect to dashboard if already logged in
function requireGuest() {
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Register function
function register(event) {
    if (event) event.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    
    let isValid = true;
    
    if (!fullname) {
        showError('fullnameError', 'Vui lòng nhập họ tên');
        isValid = false;
    }
    
    if (!email) {
        showError('emailError', 'Vui lòng nhập email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Email không hợp lệ');
        isValid = false;
    }
    
    if (!password) {
        showError('passwordError', 'Vui lòng nhập mật khẩu');
        isValid = false;
    } else if (password.length < 6) {
        showError('passwordError', 'Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('confirmError', 'Mật khẩu xác nhận không khớp');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Check if email exists
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showError('emailError', 'Email đã được đăng ký');
        return;
    }
    
    // Create new user
    const newUser = {
        id: 'FMN' + Date.now().toString().slice(-6),
        name: fullname,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        streak: 0,
        totalCards: 0,
        totalDecks: 0,
        totalTime: 0
    };
    
    users.push(newUser);
    saveUsers(users);
    
    showToast('Đăng ký thành công!', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Login function
function login(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    
    if (!email || !password) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showToast('Email hoặc mật khẩu không đúng', 'error');
        return;
    }
    
    // Save current user (remove password)
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    
    showToast('Đăng nhập thành công!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 500);
}

// Logout function
function logout() {
    clearCurrentUser();
    showToast('Đã đăng xuất', 'success');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 500);
}

// Helper functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icon = toast.querySelector('i');
    const msgSpan = toast.querySelector('#toastMessage');
    
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' :
                        type === 'error' ? 'fas fa-exclamation-circle' :
                        'fas fa-info-circle';
    }
    
    if (msgSpan) msgSpan.textContent = message;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load user info on dashboard pages
function loadUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update all elements with user info
    const userNameElements = document.querySelectorAll('#userName, .user-name, #welcomeName');
    userNameElements.forEach(el => {
        if (el) el.textContent = user.name;
    });
    
    const userEmailElements = document.querySelectorAll('#userEmail, .user-email');
    userEmailElements.forEach(el => {
        if (el) el.textContent = user.email;
    });
}

// Initialize
initUsers();

// Auto bind forms if they exist
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', login);
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', register);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Load user info if on dashboard page
    if (window.location.pathname.includes('dashboard') || 
        window.location.pathname.includes('khothe') ||
        window.location.pathname.includes('congdong') ||
        window.location.pathname.includes('ontap') ||
        window.location.pathname.includes('thongke') ||
        window.location.pathname.includes('caidat')) {
        if (!requireAuth()) return;
        loadUserInfo();
    }
});



// Thêm vào cuối file auth.js hoặc trong main.js
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            // Lưu trạng thái vào localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });

        // Khôi phục trạng thái
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
});