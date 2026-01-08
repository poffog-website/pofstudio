/* ========================================
   POFSONG - JavaScript
   ======================================== */

const API_BASE = 'http://localhost:3000';

let songs = [];
let isLoggedIn = false;
let currentSong = null;

// DOM Elements
const songList = document.getElementById('songList');
const audioPlayer = document.getElementById('audioPlayer');
const currentSongTitle = document.getElementById('currentSongTitle');
const currentSongArtist = document.getElementById('currentSongArtist');
const adminPanel = document.getElementById('adminPanel');
const adminToggle = document.getElementById('adminToggle');
const closeAdmin = document.getElementById('closeAdmin');
const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');
const logoutBtn = document.getElementById('logoutBtn');
const adminContainer = document.getElementById('adminContainer');
const underConstruction = document.getElementById('underConstruction');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initAdminPanel();
    initUploadForm();
    initLogout();
    loadSongs();
});

// Check Login Status
function checkLoginStatus() {
    isLoggedIn = sessionStorage.getItem('pofstudio_admin') === 'true';

    if (isLoggedIn) {
        if (adminContainer) adminContainer.style.display = 'flex';
        if (adminToggle) adminToggle.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (adminContainer) adminContainer.style.display = 'none';
        if (adminToggle) adminToggle.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

// Logout Handler
function initLogout() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('pofstudio_admin');
            isLoggedIn = false;
            checkLoginStatus();
            adminPanel.classList.add('hidden');
            alert('ออกจากระบบสำเร็จ!');
        });
    }
}

// Admin Panel Toggle
function initAdminPanel() {
    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            adminPanel.classList.toggle('hidden');
        });
    }

    if (closeAdmin) {
        closeAdmin.addEventListener('click', () => {
            adminPanel.classList.add('hidden');
        });
    }
}

// Upload Form
function initUploadForm() {
    if (!uploadForm) return;

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('audioFile');
        const titleInput = document.getElementById('songTitle');
        const file = fileInput.files[0];
        const title = titleInput.value.trim();

        if (!file || !title) {
            showUploadStatus('กรุณาเลือกไฟล์และใส่ชื่อเพลง', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('audio', file);
        formData.append('title', title);

        try {
            showUploadStatus('กำลังอัพโหลด...', 'info');

            const response = await fetch(`${API_BASE}/api/songs/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showUploadStatus('อัพโหลดสำเร็จ! 🎉', 'success');
                uploadForm.reset();
                loadSongs();
            } else {
                showUploadStatus(data.error || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showUploadStatus('ไม่สามารถอัพโหลดได้', 'error');
        }
    });
}

function showUploadStatus(message, type) {
    if (!uploadStatus) return;
    uploadStatus.textContent = message;
    uploadStatus.className = 'upload-status ' + type;
    uploadStatus.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 3000);
    }
}

// Load Songs
async function loadSongs() {
    try {
        const response = await fetch(`${API_BASE}/api/songs`);
        const data = await response.json();

        if (data.success && data.songs.length > 0) {
            songs = data.songs;
            renderSongList();
            underConstruction.classList.add('hidden');
            songList.style.display = 'flex';
        } else {
            // Use static songs if no songs from API
            loadStaticSongs();
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        // Fallback to static songs
        loadStaticSongs();
    }
}

// Load Static Songs (when server is not available)
function loadStaticSongs() {
    songs = [
        {
            filename: 'GUS_Open_Song_V01.mp3',
            title: 'GUS Open Song',
            url: 'pofsong/GUS_Open_Song_V01.mp3'
        }
    ];

    if (songs.length > 0) {
        renderSongList();
        underConstruction.classList.add('hidden');
        songList.style.display = 'flex';

        // Auto-load first song
        audioPlayer.src = songs[0].url;
        currentSongTitle.textContent = songs[0].title;
        currentSongArtist.textContent = 'POFSTUDIO';
    } else {
        showUnderConstruction();
    }
}

function showUnderConstruction() {
    songList.style.display = 'none';
    underConstruction.classList.remove('hidden');
}

// Render Song List
function renderSongList() {
    songList.innerHTML = songs.map((song, index) => `
        <div class="song-item" data-index="${index}" onclick="playSong(${index})">
            <div class="song-icon">🎵</div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">POFSTUDIO</div>
            </div>
            ${isLoggedIn ? `<button class="song-delete" onclick="event.stopPropagation(); deleteSong('${song.filename}')" title="ลบเพลง">🗑️</button>` : ''}
        </div>
    `).join('');
}

// Play Song
function playSong(index) {
    const song = songs[index];
    if (!song) return;

    // Remove playing class from all items
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('playing');
    });

    // Add playing class to current item
    document.querySelector(`[data-index="${index}"]`).classList.add('playing');

    currentSong = song;
    audioPlayer.src = song.url;
    currentSongTitle.textContent = song.title;
    currentSongArtist.textContent = 'POFSTUDIO';
    audioPlayer.play();
}

// Delete Song
async function deleteSong(filename) {
    if (!confirm('ต้องการลบเพลงนี้หรือไม่?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/songs/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('ลบเพลงสำเร็จ!');
            loadSongs();
        } else {
            alert(data.error || 'ไม่สามารถลบเพลงได้');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('เกิดข้อผิดพลาด');
    }
}
