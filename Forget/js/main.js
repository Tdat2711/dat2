// ============================================
// MAIN APPLICATION JS
// ============================================

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 500);
    }
    
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navButtons = document.getElementById('navButtons');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu?.classList.toggle('active');
            navButtons?.classList.toggle('active');
        });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
            navButtons?.classList.remove('active');
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Review now button
    const reviewBtn = document.getElementById('reviewNowBtn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            window.location.href = 'ontap.html';
        });
    }
    
    // AI Create button
    const aiBtn = document.getElementById('aiCreateBtn');
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            window.location.href = 'khothe.html?action=ai';
        });
    }
});

// Toast notification function (global)
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
    
    toast.className = 'toast show';
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Generate random ID
function generateId() {
    return 'FMN' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(-3);
}