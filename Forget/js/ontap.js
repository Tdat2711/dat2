// ============================================
// ON TAP JS - Lấy bộ thẻ từ kho
// ============================================

const DECKS_KEY = 'forgetmenot_decks';
let decks = [];
let currentDeck = null;
let currentIndex = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadDecks();
    renderDeckList();
    bindEvents();

    // Kiểm tra nếu có deck được chọn từ kho thẻ
    const selectedId = localStorage.getItem('selectedDeckId');
    if (selectedId) {
        const deck = decks.find(d => d.id === selectedId);
        if (deck) {
            startStudy(deck);
            localStorage.removeItem('selectedDeckId');
        }
    }
});

function loadDecks() {
    const data = localStorage.getItem(DECKS_KEY);
    decks = data ? JSON.parse(data) : [];
}

function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    const now = new Date();
    const due = new Date(dateStr);
    return Math.ceil((due - now) / 86400000);
}

function renderDeckList() {
    const container = document.getElementById('deckListContainer');
    const empty = document.getElementById('emptyState');
    const count = document.getElementById('totalDecksCount');

    if (!container) return;
    if (decks.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
        if (count) count.textContent = '0';
        return;
    }
    empty.style.display = 'none';
    if (count) count.textContent = decks.length;

    container.innerHTML = decks.map(deck => {
        const days = getDaysLeft(deck.dueDate);
        let badgeHTML = '';
        if (deck.dueDate) {
            let cls = 'deck-badge';
            if (days < 0) cls += ' due';
            else if (days <= 7) cls += ' soon';
            else cls += ' safe';
            badgeHTML = `<span class="${cls}">${days < 0 ? '⚠️ Quá hạn' : `📅 ${days} ngày`}</span>`;
        } else {
            badgeHTML = `<span class="deck-badge no-date">📅 Chưa đặt ngày</span>`;
        }

        return `
            <div class="deck-item" data-id="${deck.id}">
                <div class="deck-item-left">
                    <div class="deck-icon">${deck.icon}</div>
                    <div class="deck-info">
                        <div class="deck-name">${deck.name}</div>
                        <div class="deck-meta">${deck.description || 'Không có mô tả'}</div>
                        <div class="deck-badges">
                            ${badgeHTML}
                            <span class="deck-category">${getCategoryName(deck.category)}</span>
                            <span class="deck-cards">${deck.totalCards} thẻ</span>
                        </div>
                    </div>
                </div>
                <div class="deck-item-right">
                    <button class="btn btn-primary" onclick="startStudyById('${deck.id}')">
                        <i class="fas fa-book-open"></i> Ôn luyện
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getCategoryName(cat) {
    const map = {
        'general': 'Tổng hợp',
        'english': 'Tiếng Anh',
        'math': 'Toán học',
        'science': 'Khoa học',
        'history': 'Lịch sử',
        'tech': 'Công nghệ',
        'other': 'Khác'
    };
    return map[cat] || cat;
}

function startStudyById(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) {
        showToast('Không tìm thấy bộ thẻ', 'error');
        return;
    }
    startStudy(deck);
}

function startStudy(deck) {
    currentDeck = deck;
    currentIndex = 0;
    isFlipped = false;

    // Ẩn danh sách, hiện phần học
    document.getElementById('deckListContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('studyContainer').style.display = 'block';

    // Cập nhật tên deck
    document.querySelector('.deck-name-display')?.remove();
    const controlCenter = document.querySelector('.control-center');
    if (controlCenter) {
        const existing = controlCenter.querySelector('.deck-name-display');
        if (existing) existing.remove();
        const span = document.createElement('span');
        span.className = 'deck-name-display';
        span.textContent = deck.name;
        controlCenter.appendChild(span);
    }

    renderCard();
}

function renderCard() {
    if (!currentDeck || !currentDeck.flashcards || currentDeck.flashcards.length === 0) {
        showToast('Bộ thẻ này chưa có flashcard nào', 'warning');
        backToDeckList();
        return;
    }

    const cards = currentDeck.flashcards;
    if (currentIndex >= cards.length) {
        showToast('Hoàn thành! Bạn đã học xong tất cả thẻ 🎉', 'success');
        backToDeckList();
        return;
    }

    const card = cards[currentIndex];
    document.getElementById('questionText').textContent = card.question;
    document.getElementById('answerText').textContent = card.answer;
    document.getElementById('cardCounter').textContent = `${currentIndex + 1} / ${cards.length}`;

    // Reset flip
    if (isFlipped) {
        document.getElementById('flashcardInner').classList.remove('flipped');
        isFlipped = false;
    }

    updateProgress();
}

function updateProgress() {
    const cards = currentDeck?.flashcards || [];
    const total = cards.length;
    const current = currentIndex + 1;
    const progress = total > 0 ? (current / total) * 100 : 0;

    document.getElementById('progressText').textContent = `${current}/${total}`;
    document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;
}

function backToDeckList() {
    document.getElementById('studyContainer').style.display = 'none';
    document.getElementById('deckListContainer').style.display = 'block';
    renderDeckList();
    currentDeck = null;
}

function flipCard() {
    if (!currentDeck) return;
    const inner = document.getElementById('flashcardInner');
    isFlipped = !isFlipped;
    inner.classList.toggle('flipped');
}

function nextCard() {
    if (!currentDeck) return;
    if (currentIndex < currentDeck.flashcards.length - 1) {
        currentIndex++;
        renderCard();
    } else {
        showToast('Hoàn thành! 🎉', 'success');
        backToDeckList();
    }
}

function prevCard() {
    if (!currentDeck) return;
    if (currentIndex > 0) {
        currentIndex--;
        renderCard();
    }
}

function rateCard(level) {
    if (!currentDeck) return;
    const cards = currentDeck.flashcards;
    if (currentIndex >= cards.length) return;

    // Cập nhật độ khó (có thể lưu vào localStorage sau)
    const intervals = [1, 3, 7, 14];
    const interval = intervals[level - 1] || 3;
    showToast(`Đánh giá: ${['Khó','Bình thường','Dễ','Rất dễ'][level-1]} ✅`, 'success');

    if (currentIndex < cards.length - 1) {
        currentIndex++;
        renderCard();
    } else {
        showToast('Hoàn thành! Bạn đã học xong tất cả thẻ 🎉', 'success');
        backToDeckList();
    }
}

function bindEvents() {
    // Flashcard click
    document.getElementById('flashcardWrapper').addEventListener('click', flipCard);

    // Navigation
    document.getElementById('prevBtn').addEventListener('click', prevCard);
    document.getElementById('nextBtn').addEventListener('click', nextCard);
    document.getElementById('backToDeckBtn').addEventListener('click', backToDeckList);

    // Rating
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            rateCard(level);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return;
        if (!currentDeck) return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flipCard();
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevCard();
        }
        if (e.key >= '1' && e.key <= '4') {
            const level = parseInt(e.key);
            if (document.querySelector(`.rating-btn[data-level="${level}"]`)) {
                rateCard(level);
            }
        }
    });
}