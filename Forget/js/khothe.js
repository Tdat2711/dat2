// ============================================
// KHO THE JS - Full version (CRUD + AI Generate)
// ============================================

const DECKS_KEY = 'forgetmenot_decks';
let decks = [];
let currentFilter = 'all';
let searchQuery = '';
let sortBy = 'newest';
let editingDeckId = null;
let viewingDeckId = null;
let editingFlashcardId = null;

// Biến AI
let selectedFile = null;
let isProcessing = false;
let geminiModel = null;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadDecks();
    renderDecks();
    bindEvents();
    initAiGenerate();
});

// ============================================
// LOAD & SAVE DECKS
// ============================================
function loadDecks() {
    const data = localStorage.getItem(DECKS_KEY);
    decks = data ? JSON.parse(data) : [];
    if (decks.length === 0) {
        createDemoDecks();
    }
}

function createDemoDecks() {
    const now = new Date();
    decks = [{
        id: 'D001',
        name: 'Từ vựng IELTS Writing',
        description: 'Từ vựng chủ đề giáo dục, công nghệ, môi trường',
        icon: '🗣️',
        category: 'english',
        totalCards: 5,
        learned: 0,
        starred: true,
        createdAt: new Date(now - 5 * 86400000).toISOString(),
        dueDate: new Date(now + 3 * 86400000).toISOString(),
        flashcards: [
            { id: 'F001', question: 'What is "education"?', answer: 'Giáo dục' },
            { id: 'F002', question: 'What is "technology"?', answer: 'Công nghệ' },
            { id: 'F003', question: 'What is "environment"?', answer: 'Môi trường' },
            { id: 'F004', question: 'What is "sustainable"?', answer: 'Bền vững' },
            { id: 'F005', question: 'What is "innovation"?', answer: 'Đổi mới' }
        ]
    }];
    saveDecks();
}

function saveDecks() {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

// ============================================
// RENDER
// ============================================
function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    const now = new Date();
    const due = new Date(dateStr);
    return Math.ceil((due - now) / 86400000);
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

function createDeckCard(deck) {
    const progress = deck.totalCards > 0 ? Math.round((deck.learned / deck.totalCards) * 100) : 0;
    const days = getDaysLeft(deck.dueDate);
    let badgeHTML = '';
    if (deck.dueDate) {
        let cls = 'deck-badge';
        if (days < 0) cls += ' due';
        else if (days <= 7) cls += ' soon';
        else cls += ' safe';
        badgeHTML = `<div class="${cls}">${days < 0 ? '⚠️ Quá hạn' : `📅 ${days} ngày`}</div>`;
    } else {
        badgeHTML = `<div class="deck-badge no-date">📅 Chưa đặt ngày</div>`;
    }

    return `
        <div class="deck-card" data-id="${deck.id}">
            <div class="deck-card-header">
                <div class="deck-card-title">
                    <div class="deck-card-icon">${deck.icon}</div>
                    <div>
                        <div class="deck-card-name">${deck.name}</div>
                        <div class="deck-card-category">${getCategoryName(deck.category)}</div>
                    </div>
                </div>
                <div class="deck-card-actions">
                    <button class="star-btn ${deck.starred ? 'active' : ''}" onclick="toggleStar('${deck.id}')">
                        <i class="${deck.starred ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <button onclick="editDeck('${deck.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDeck('${deck.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="deck-card-description">${deck.description}</div>
            ${badgeHTML}
            <div class="deck-card-stats">
                <div class="deck-stat">
                    <span class="deck-stat-value">${deck.totalCards}</span>
                    <span class="deck-stat-label">Tổng thẻ</span>
                </div>
                <div class="deck-stat">
                    <span class="deck-stat-value">${deck.learned}</span>
                    <span class="deck-stat-label">Đã học</span>
                </div>
                <div class="deck-stat">
                    <span class="deck-stat-value">${progress}%</span>
                    <span class="deck-stat-label">Tiến độ</span>
                </div>
            </div>
            <div class="deck-card-footer">
                <button class="btn btn-outline btn-sm" onclick="viewFlashcards('${deck.id}')">
                    <i class="fas fa-eye"></i> Xem thẻ
                </button>
                <button class="btn btn-primary btn-sm" onclick="studyDeck('${deck.id}')">
                    <i class="fas fa-book-open"></i> Học
                </button>
            </div>
        </div>
    `;
}

// Đổi giá trị mặc định của sortBy thành 'due'
let sortBy = 'due'; // thay vì 'newest'

// Hàm renderDecks được chỉnh sửa
function renderDecks() {
    const grid = document.getElementById('decksGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    let filtered = [...decks];

    // Áp dụng bộ lọc
    if (currentFilter === 'starred') {
        filtered = filtered.filter(d => d.starred);
    } else if (currentFilter === 'recent') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        filtered = filtered.slice(0, 4);
    } else if (currentFilter === 'due') {
        const now = new Date();
        filtered = filtered.filter(d => {
            if (!d.dueDate) return false;
            return new Date(d.dueDate) < new Date(now + 7 * 86400000);
        });
    }

    // Tìm kiếm
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(d => 
            d.name.toLowerCase().includes(q) || 
            d.description.toLowerCase().includes(q)
        );
    }

    // Sắp xếp theo sortBy
    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'cards') {
        filtered.sort((a, b) => b.totalCards - a.totalCards);
    } else if (sortBy === 'progress') {
        filtered.sort((a, b) => (b.learned / b.totalCards) - (a.learned / a.totalCards));
    } else if (sortBy === 'due') {
        // Sắp xếp theo ngày thi gần nhất (ưu tiên bộ có ngày thi, sắp xếp tăng dần)
        filtered.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    } else {
        // Mặc định: sắp xếp theo ngày tạo mới nhất
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Render
    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';
    grid.innerHTML = filtered.map(deck => createDeckCard(deck)).join('');
}

// ============================================
// CRUD DECK
// ============================================
function openCreateModal(deckId = null) {
    const modal = document.getElementById('createModal');
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('saveDeckBtn');
    const name = document.getElementById('deckName');
    const desc = document.getElementById('deckDescription');
    const cat = document.getElementById('deckCategory');
    const icon = document.getElementById('deckIcon');
    const exam = document.getElementById('deckExamDate');

    if (deckId) {
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;
        editingDeckId = deckId;
        title.textContent = 'Chỉnh sửa bộ thẻ';
        btn.textContent = 'Cập nhật';
        name.value = deck.name;
        desc.value = deck.description;
        cat.value = deck.category;
        icon.value = deck.icon;
        exam.value = deck.dueDate || '';
    } else {
        editingDeckId = null;
        title.textContent = 'Tạo bộ thẻ mới';
        btn.textContent = 'Tạo bộ thẻ';
        name.value = '';
        desc.value = '';
        cat.value = 'general';
        icon.value = '📚';
        exam.value = '';
    }
    modal.classList.add('open');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('open');
}

function saveDeck() {
    const name = document.getElementById('deckName').value.trim();
    if (!name) { showToast('Vui lòng nhập tên bộ thẻ', 'error'); return; }

    const data = {
        name: name,
        description: document.getElementById('deckDescription').value.trim() || 'Không có mô tả',
        category: document.getElementById('deckCategory').value,
        icon: document.getElementById('deckIcon').value,
        dueDate: document.getElementById('deckExamDate').value || null
    };

    if (editingDeckId) {
        const deck = decks.find(d => d.id === editingDeckId);
        if (deck) {
            Object.assign(deck, data);
            showToast('Đã cập nhật bộ thẻ', 'success');
        }
    } else {
        const newDeck = {
            id: 'D' + Date.now().toString().slice(-6),
            ...data,
            totalCards: 0,
            learned: 0,
            starred: false,
            createdAt: new Date().toISOString(),
            flashcards: []
        };
        decks.push(newDeck);
        showToast('Đã tạo bộ thẻ mới', 'success');
    }
    saveDecks();
    renderDecks();
    closeCreateModal();
}

function editDeck(id) {
    openCreateModal(id);
}

function deleteDeck(id) {
    if (!confirm('Bạn có chắc muốn xóa bộ thẻ này?')) return;
    decks = decks.filter(d => d.id !== id);
    saveDecks();
    renderDecks();
    showToast('Đã xóa bộ thẻ', 'success');
}

function toggleStar(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    deck.starred = !deck.starred;
    saveDecks();
    renderDecks();
    showToast(deck.starred ? 'Đã thêm yêu thích' : 'Đã bỏ yêu thích', 'success');
}

// ============================================
// VIEW FLASHCARDS & CRUD
// ============================================
function viewFlashcards(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    viewingDeckId = deckId;
    document.getElementById('viewModalTitle').textContent = `Flashcards: ${deck.name}`;
    renderFlashcards(deck);
    document.getElementById('viewFlashcardsModal').classList.add('open');
}

function renderFlashcards(deck) {
    const container = document.getElementById('flashcardsList');
    if (!deck.flashcards || deck.flashcards.length === 0) {
        container.innerHTML = `<p style="color:var(--text-gray);text-align:center;padding:20px;">Chưa có flashcard nào. Hãy thêm thẻ mới!</p>`;
        return;
    }
    container.innerHTML = deck.flashcards.map(f => `
        <div class="flashcard-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-light);border-radius:8px;margin-bottom:8px;">
            <div>
                <div style="font-weight:500;">${f.question}</div>
                <div style="font-size:13px;color:var(--text-gray);">${f.answer}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="editFlashcard('${f.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteFlashcard('${f.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openFlashcardModal(flashcardId = null) {
    const modal = document.getElementById('flashcardModal');
    const title = document.getElementById('flashcardModalTitle');
    const btn = document.getElementById('saveFlashcardBtn');
    const q = document.getElementById('flashcardQuestion');
    const a = document.getElementById('flashcardAnswer');

    if (flashcardId) {
        const deck = decks.find(d => d.id === viewingDeckId);
        if (!deck) return;
        const f = deck.flashcards.find(f => f.id === flashcardId);
        if (!f) return;
        editingFlashcardId = flashcardId;
        title.textContent = 'Chỉnh sửa flashcard';
        btn.textContent = 'Cập nhật';
        q.value = f.question;
        a.value = f.answer;
    } else {
        editingFlashcardId = null;
        title.textContent = 'Thêm flashcard mới';
        btn.textContent = 'Thêm';
        q.value = '';
        a.value = '';
    }
    modal.classList.add('open');
}

function closeFlashcardModal() {
    document.getElementById('flashcardModal').classList.remove('open');
}

function saveFlashcard() {
    const question = document.getElementById('flashcardQuestion').value.trim();
    const answer = document.getElementById('flashcardAnswer').value.trim();
    if (!question || !answer) {
        showToast('Vui lòng nhập đầy đủ câu hỏi và đáp án', 'error');
        return;
    }

    const deck = decks.find(d => d.id === viewingDeckId);
    if (!deck) return;

    if (editingFlashcardId) {
        const f = deck.flashcards.find(f => f.id === editingFlashcardId);
        if (f) {
            f.question = question;
            f.answer = answer;
            showToast('Đã cập nhật flashcard', 'success');
        }
    } else {
        const newF = {
            id: 'F' + Date.now().toString().slice(-6),
            question: question,
            answer: answer
        };
        deck.flashcards.push(newF);
        deck.totalCards = deck.flashcards.length;
        showToast('Đã thêm flashcard mới', 'success');
    }
    saveDecks();
    renderFlashcards(deck);
    renderDecks();
    closeFlashcardModal();
}

function editFlashcard(id) {
    openFlashcardModal(id);
}

function deleteFlashcard(id) {
    if (!confirm('Xóa flashcard này?')) return;
    const deck = decks.find(d => d.id === viewingDeckId);
    if (!deck) return;
    deck.flashcards = deck.flashcards.filter(f => f.id !== id);
    deck.totalCards = deck.flashcards.length;
    saveDecks();
    renderFlashcards(deck);
    renderDecks();
    showToast('Đã xóa flashcard', 'success');
}

// ============================================
// STUDY
// ============================================
function studyDeck(deckId) {
    localStorage.setItem('selectedDeckId', deckId);
    window.location.href = 'ontap.html';
}

// ============================================
// AI GENERATE - GEMINI API
// ============================================

// Khởi tạo Gemini với key
async function initGemini(apiKey) {
    try {
        // Kiểm tra xem GoogleGenerativeAI đã được load chưa
        if (typeof GoogleGenerativeAI === 'undefined') {
            console.error('GoogleGenerativeAI not loaded. Check script tag.');
            throw new Error('Thư viện Gemini chưa được tải. Vui lòng kiểm tra kết nối mạng.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return true;
    } catch (error) {
        console.error('Gemini init error:', error);
        geminiModel = null;
        throw new Error('Không thể khởi tạo Gemini: ' + error.message);
    }
}

// Gửi nội dung lên Gemini và nhận flashcard
async function generateFlashcardsWithGemini(content, apiKey) {
    // Nếu chưa có model, khởi tạo
    if (!geminiModel) {
        await initGemini(apiKey);
    }

    const prompt = `
Bạn là trợ lý AI chuyên tạo flashcard học tập. Hãy phân tích nội dung dưới đây và trả về danh sách flashcard dạng JSON.
Mỗi flashcard là object có 2 trường: "question" và "answer".

Yêu cầu:
- Mỗi cặp hỏi-đáp rõ ràng, ngắn gọn.
- Nếu nội dung là danh sách khái niệm, tạo flashcard cho từng khái niệm.
- Nếu có câu hỏi trực tiếp, trích xuất đúng.
- Trả về mảng JSON hợp lệ, không có văn bản thừa.

Nội dung:
"""
${content}
"""

Trả về mảng JSON:
[
  {"question": "...", "answer": "..."}
]
`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        console.log('Gemini response:', responseText);
        
        // Trích xuất JSON từ response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Không tìm thấy JSON trong phản hồi');
        }
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Gemini API lỗi: ' + error.message);
    }
}

// Đọc nội dung file
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'txt') {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Không thể đọc file TXT'));
            reader.readAsText(file, 'UTF-8');
        } else if (extension === 'pdf' || extension === 'docx') {
            // Nếu có thư viện parse, xử lý ở đây. Hiện tại dùng dữ liệu mẫu.
            showToast('PDF/DOCX đang dùng dữ liệu mẫu (cần server để parse thực tế)', 'info');
            resolve(`
                Lập trình là gì? Lập trình là quá trình tạo ra chương trình máy tính.
                Biến là gì? Biến là nơi lưu trữ dữ liệu.
                Hàm là gì? Hàm là khối lệnh thực hiện một nhiệm vụ.
                Mảng là gì? Mảng là tập hợp các phần tử cùng kiểu.
                Vòng lặp dùng để làm gì? Vòng lặp lặp lại đoạn mã nhiều lần.
            `);
        } else {
            reject(new Error('Định dạng file không được hỗ trợ'));
        }
    });
}

// Xử lý file với Gemini
async function processFileWithAI(file) {
    const apiKeyInput = document.getElementById('geminiApiKey');
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        showToast('Vui lòng nhập Gemini API Key', 'error');
        apiKeyInput.focus();
        return;
    }

    isProcessing = true;
    const btn = document.getElementById('generateAiBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đọc file...';

    try {
        // Đọc nội dung file
        const content = await readFileContent(file);
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi đến Gemini...';

        // Gọi Gemini
        let flashcards;
        try {
            flashcards = await generateFlashcardsWithGemini(content, apiKey);
        } catch (geminiError) {
            // Nếu Gemini lỗi, fallback sang phương pháp parse cục bộ
            console.warn('Gemini lỗi, fallback local parse:', geminiError);
            showToast('Gemini lỗi, đang dùng phương pháp dự phòng...', 'warning');
            flashcards = extractFlashcardsLocally(content);
        }

        if (!flashcards || flashcards.length === 0) {
            throw new Error('Không tạo được flashcard nào');
        }

        // Lấy thông tin người dùng
        const deckName = document.getElementById('aiDeckName').value.trim() || 
                        file.name.replace(/\.[^.]+$/, '') + ' (AI)';
        const category = document.getElementById('aiDeckCategory').value;
        const examDate = document.getElementById('aiExamDate').value || null;

        // Tạo bộ thẻ mới
        const newDeck = {
            id: 'D' + Date.now().toString().slice(-6),
            name: deckName,
            description: `Tạo từ file ${file.name} (${flashcards.length} thẻ)`,
            icon: '🤖',
            category: category,
            totalCards: flashcards.length,
            learned: 0,
            starred: false,
            createdAt: new Date().toISOString(),
            dueDate: examDate,
            flashcards: flashcards.map((f, idx) => ({
                id: 'F' + Date.now().toString().slice(-6) + (idx + 1),
                question: f.question || 'Câu hỏi',
                answer: f.answer || 'Đáp án'
            }))
        };

        decks.push(newDeck);
        saveDecks();
        renderDecks();

        // Reset
        resetAiState();
        closeModal('aiModal');
        showToast(`✅ Đã tạo bộ thẻ "${deckName}" với ${flashcards.length} thẻ!`, 'success');

    } catch (error) {
        console.error('AI error:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        isProcessing = false;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Tạo bộ thẻ';
    }
}

// Hàm parse flashcard cục bộ (fallback)
function extractFlashcardsLocally(content) {
    const flashcards = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
        let q = '', a = '';
        // Tìm dấu ?
        const qMatch = line.match(/^(.*?)\s*\?/);
        if (qMatch) {
            q = qMatch[1].trim() + '?';
            a = line.replace(qMatch[0], '').trim();
            if (a) {
                flashcards.push({ question: q, answer: a });
                continue;
            }
        }
        // Tìm dấu :
        const colonMatch = line.match(/^(.*?)\s*[:：]\s*(.*)/);
        if (colonMatch) {
            q = colonMatch[1].trim();
            a = colonMatch[2].trim();
            if (q && a) {
                flashcards.push({ question: q, answer: a });
                continue;
            }
        }
        // Tìm dấu -
        const dashMatch = line.match(/^(.*?)\s*[-–—]\s*(.*)/);
        if (dashMatch) {
            q = dashMatch[1].trim();
            a = dashMatch[2].trim();
            if (q && a) {
                flashcards.push({ question: q, answer: a });
                continue;
            }
        }
    }

    if (flashcards.length === 0) {
        // Nếu không tìm thấy, tạo từ các câu dài
        const sentences = lines.filter(l => l.length > 20 && l.length < 200);
        for (const s of sentences) {
            flashcards.push({
                question: 'Ý chính của câu này là gì?',
                answer: s.slice(0, 150)
            });
        }
    }

    return flashcards.slice(0, 30);
}

// Reset AI state
function resetAiState() {
    selectedFile = null;
    document.getElementById('fileName').textContent = 'Chưa có file';
    document.getElementById('fileName').style.color = 'var(--text-gray)';
    document.getElementById('fileInput').value = '';
}

// ============================================
// AI UI EVENTS
// ============================================
function initAiGenerate() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });

    document.getElementById('generateAiBtn').addEventListener('click', function() {
        if (!selectedFile) {
            showToast('Vui lòng chọn file', 'error');
            return;
        }
        if (isProcessing) return;
        processFileWithAI(selectedFile);
    });

    document.getElementById('aiCreateBtn').addEventListener('click', () => openModal('aiModal'));
    document.getElementById('closeAiModal').addEventListener('click', () => closeModal('aiModal'));
    document.getElementById('cancelAiModal').addEventListener('click', () => closeModal('aiModal'));

    // Lưu API key vào localStorage
    const apiKeyInput = document.getElementById('geminiApiKey');
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) apiKeyInput.value = savedKey;
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value);
    });
}

function handleFileSelection(file) {
    const validExtensions = ['pdf', 'docx', 'txt'];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
        showToast('Chỉ hỗ trợ PDF, DOCX, TXT', 'error');
        return;
    }
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileName').style.color = 'var(--success)';
    showToast(`Đã chọn file: ${file.name}`, 'success');
}

// ============================================
// EVENTS BINDING
// ============================================
function bindEvents() {
    // Create deck
    document.getElementById('createDeckBtn').addEventListener('click', () => openCreateModal());
    document.getElementById('emptyCreateBtn').addEventListener('click', () => openCreateModal());
    document.getElementById('closeModal').addEventListener('click', closeCreateModal);
    document.getElementById('cancelModal').addEventListener('click', closeCreateModal);
    document.getElementById('saveDeckBtn').addEventListener('click', saveDeck);
    document.getElementById('createModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeCreateModal();
    });

    // View flashcards
    document.getElementById('closeViewModal').addEventListener('click', () => closeModal('viewFlashcardsModal'));
    document.getElementById('closeViewModalBtn').addEventListener('click', () => closeModal('viewFlashcardsModal'));
    document.getElementById('viewFlashcardsModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('viewFlashcardsModal');
    });

    // Flashcard CRUD
    document.getElementById('addFlashcardBtn').addEventListener('click', () => openFlashcardModal());
    document.getElementById('closeFlashcardModal').addEventListener('click', closeFlashcardModal);
    document.getElementById('cancelFlashcard').addEventListener('click', closeFlashcardModal);
    document.getElementById('saveFlashcardBtn').addEventListener('click', saveFlashcard);
    document.getElementById('flashcardModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeFlashcardModal();
    });

    // Filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderDecks();
        });
    });

    document.getElementById('searchInput').addEventListener('input', function() {
        searchQuery = this.value.trim();
        renderDecks();
    });

    document.getElementById('sortSelect').addEventListener('change', function() {
        sortBy = this.value;
        renderDecks();
    });
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }