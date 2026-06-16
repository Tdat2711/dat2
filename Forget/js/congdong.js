const FRIENDS_KEY = 'forgetmenot_friends';
const GROUPS_KEY = 'forgetmenot_groups';

let friends = JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]');
let groups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
let currentUser = null;

const leaderboardData = [
    { rank: 1, name: 'minh_hoc99', initials: 'MH', points: 5840, streak: 120, change: '+2', color: 'gold' },
    { rank: 2, name: 'thuylinhh', initials: 'TL', points: 4210, streak: 85, change: '+1', color: 'silver' },
    { rank: 3, name: 'namtran', initials: 'NT', points: 3890, streak: 67, change: '-1', color: 'bronze' },
    { rank: 4, name: 'hoa_anh2k4', initials: 'HA', points: 3610, streak: 42, change: '+2', color: 'blue' },
    { rank: 5, name: 'phuongkhanh_', initials: 'PK', points: 3420, streak: 18, change: '0', color: 'purple' },
    { rank: 6, name: 'bao_tran2k5', initials: 'BT', points: 3105, streak: 9, change: '-1', color: 'green' },
    { rank: 7, name: 'duc_long_vn', initials: 'DL', points: 2880, streak: 27, change: '+3', color: 'orange' },
    { rank: 8, name: 'mai_yen_k65', initials: 'MY', points: 2640, streak: 5, change: '-2', color: 'red' },
    { rank: 9, name: 'khanh_hoc24', initials: 'KH', points: 2200, streak: 12, change: '+1', color: 'blue' },
    { rank: 10, name: 'quang_minh', initials: 'QM', points: 1950, streak: 8, change: '0', color: 'purple' },
];

const activityData = [
    { user: 'minh_hoc99', action: 'vừa hoàn thành 120 thẻ Toán Cao Cấp', time: '2 phút trước', color: 'green' },
    { user: 'hoa_anh2k4', action: 'đạt streak 42 ngày liên tiếp 🔥', time: '15 phút trước', color: 'orange' },
    { user: 'namtran', action: 'chia sẻ bộ thẻ IELTS Writing Band 8', time: '1 giờ trước', color: 'purple' },
    { user: 'duc_long_vn', action: 'leo lên hạng 7 bảng xếp hạng', time: '2 giờ trước', color: 'blue' },
];

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    currentUser = getCurrentUser();
    cleanGroups();
    renderLeaderboard();
    renderActivity();
    renderFriends();
    renderGroups();
    bindCommunityEvents();
});

function renderLeaderboard() {
    const container = document.getElementById('rankList');
    if (!container) return;
    container.innerHTML = leaderboardData.map((user, index) => {
        const isMe = index === 7;
        const changeClass = user.change === '+2' ? 'change-up' : user.change === '-1' ? 'change-down' : 'change-same';
        const changeIcon = user.change === '+2' ? 'fa-arrow-up' : user.change === '-1' ? 'fa-arrow-down' : 'fa-minus';
        return `<div class="rank-item ${isMe ? 'is-me' : ''}">
            <span class="rank-number">${user.rank}</span>
            <div class="rank-avatar ${user.color}">${user.initials}</div>
            <div class="rank-info"><div class="rank-name">${user.name} ${isMe ? '👈 Bạn' : ''}</div><div class="rank-meta">${user.streak} ngày streak</div></div>
            <div class="rank-stats"><div class="rank-points">${user.points}</div><div class="rank-change ${changeClass}"><i class="fas ${changeIcon}"></i> ${user.change}</div></div>
        </div>`;
    }).join('');
}

function renderActivity() {
    const container = document.getElementById('activityList');
    if (!container) return;
    container.innerHTML = activityData.map(item => `
        <div class="activity-item">
            <div class="activity-dot ${item.color}"></div>
            <div><div class="activity-text"><strong>${item.user}</strong> ${item.action}</div><div class="activity-time">${item.time}</div></div>
        </div>
    `).join('');
}

// === FRIENDS ===
function renderFriends() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    if (friends.length === 0) {
        container.innerHTML = `<p style="color:var(--text-gray);text-align:center;padding:20px;">Chưa có bạn bè. Hãy thêm bạn mới!</p>`;
        return;
    }
    container.innerHTML = friends.map(f => `
        <div class="friend-item">
            <div class="friend-info">
                <div class="friend-avatar" style="background:${f.color || '#4f46e5'}">${f.initials}</div>
                <div><div class="friend-name">${f.name}</div><div class="friend-email">${f.email}</div></div>
            </div>
            <div class="friend-actions">
                <button class="btn btn-outline btn-sm" onclick="removeFriend('${f.id}')">Xóa</button>
            </div>
        </div>
    `).join('');
}

function addFriend(emailOrName) {
    const newFriend = {
        id: 'F' + Date.now().toString().slice(-6),
        name: emailOrName,
        email: emailOrName + '@example.com',
        initials: emailOrName.substring(0,2).toUpperCase(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')
    };
    friends.push(newFriend);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    renderFriends();
    showToast(`Đã thêm bạn: ${newFriend.name}`, 'success');
}

function removeFriend(id) {
    if (!confirm('Xóa bạn này?')) return;
    friends = friends.filter(f => f.id !== id);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    renderFriends();
    showToast('Đã xóa bạn', 'success');
}

// === GROUPS ===
function renderGroups() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    if (groups.length === 0) {
        container.innerHTML = `<p style="color:var(--text-gray);text-align:center;padding:20px;">Chưa có nhóm nào. Tạo nhóm ngay!</p>`;
        return;
    }
    container.innerHTML = groups.map(g => `
        <div class="group-item">
            <div class="group-info">
                <div class="group-avatar" style="background:${g.color || '#8b5cf6'}">${g.icon || '👥'}</div>
                <div><div class="group-name">${g.name}</div><div class="group-members">${g.members.length} thành viên</div></div>
            </div>
            <div class="group-actions">
                ${g.members.includes(currentUser?.id) ? `<button class="btn btn-outline btn-sm" onclick="leaveGroup('${g.id}')">Rời nhóm</button>` :
                `<button class="btn btn-primary btn-sm" onclick="joinGroup('${g.id}')">Tham gia</button>`}
                ${g.creator === currentUser?.id ? `<button class="btn btn-danger btn-sm" onclick="deleteGroup('${g.id}')">Xóa</button>` : ''}
            </div>
        </div>
    `).join('');
}

function createGroup(name, description) {
    const newGroup = {
        id: 'G' + Date.now().toString().slice(-6),
        name: name,
        description: description || '',
        creator: currentUser.id,
        members: [currentUser.id],
        createdAt: new Date().toISOString(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),
        icon: '👥'
    };
    groups.push(newGroup);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    renderGroups();
    showToast(`Đã tạo nhóm "${name}"`, 'success');
}

function joinGroup(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.members.includes(currentUser.id)) { showToast('Bạn đã ở trong nhóm này', 'info'); return; }
    group.members.push(currentUser.id);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    renderGroups();
    showToast(`Đã tham gia nhóm "${group.name}"`, 'success');
}

function leaveGroup(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.creator === currentUser.id) { showToast('Không thể rời nhóm do bạn là người tạo', 'error'); return; }
    group.members = group.members.filter(id => id !== currentUser.id);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    renderGroups();
    showToast(`Đã rời nhóm "${group.name}"`, 'success');
}

function deleteGroup(groupId) {
    if (!confirm('Xóa nhóm này?')) return;
    groups = groups.filter(g => g.id !== groupId);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    renderGroups();
    showToast('Đã xóa nhóm', 'success');
}

function cleanGroups() {
    const now = Date.now();
    const toRemove = groups.filter(g => {
        if (g.members.length < 3 && (now - new Date(g.createdAt).getTime()) > 3 * 86400000) {
            return true;
        }
        return false;
    });
    if (toRemove.length) {
        groups = groups.filter(g => !toRemove.includes(g));
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        console.log('Đã tự động xóa nhóm không đủ thành viên');
    }
}

// === BIND EVENTS ===
function bindCommunityEvents() {
    document.querySelectorAll('.ctab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ctab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('addFriendBtn').addEventListener('click', () => openModal('addFriendModal'));
    document.getElementById('closeAddFriend').addEventListener('click', () => closeModal('addFriendModal'));
    document.getElementById('cancelAddFriend').addEventListener('click', () => closeModal('addFriendModal'));
    document.getElementById('confirmAddFriend').addEventListener('click', function() {
        const val = document.getElementById('friendInput').value.trim();
        if (!val) { showToast('Vui lòng nhập tên hoặc email', 'error'); return; }
        addFriend(val);
        document.getElementById('friendInput').value = '';
        closeModal('addFriendModal');
    });

    document.getElementById('createGroupBtn').addEventListener('click', () => openModal('createGroupModal'));
    document.getElementById('closeCreateGroup').addEventListener('click', () => closeModal('createGroupModal'));
    document.getElementById('cancelCreateGroup').addEventListener('click', () => closeModal('createGroupModal'));
    document.getElementById('confirmCreateGroup').addEventListener('click', function() {
        const name = document.getElementById('groupNameInput').value.trim();
        const desc = document.getElementById('groupDescInput').value.trim();
        if (!name) { showToast('Vui lòng nhập tên nhóm', 'error'); return; }
        createGroup(name, desc);
        document.getElementById('groupNameInput').value = '';
        document.getElementById('groupDescInput').value = '';
        closeModal('createGroupModal');
    });
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }