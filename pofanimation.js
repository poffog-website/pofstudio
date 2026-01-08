/* ========================================
   POFANIMATION - JavaScript
   ======================================== */

const API_BASE = 'http://localhost:3000';

// State
let videos = [];
let isLoggedIn = false;
let currentVideo = null;

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const mainVideo = document.getElementById('mainVideo');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const currentVideoTitle = document.getElementById('currentVideoTitle');
const currentVideoDesc = document.getElementById('currentVideoDesc');
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
    loadVideos();
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

// Upload Form Handler
function initUploadForm() {
    if (!uploadForm) return;

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('videoFile');
        const titleInput = document.getElementById('videoTitle');
        const file = fileInput.files[0];
        const title = titleInput.value.trim();

        if (!file || !title) {
            showUploadStatus('กรุณาเลือกไฟล์และใส่ชื่อวิดีโอ', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);

        try {
            showUploadStatus('กำลังอัพโหลด...', 'info');

            const response = await fetch(`${API_BASE}/api/videos/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showUploadStatus('อัพโหลดสำเร็จ! 🎉', 'success');
                uploadForm.reset();
                loadVideos();
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
    uploadStatus.className = 'upload-status';
    uploadStatus.classList.add(type);
    uploadStatus.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 3000);
    }
}

// Load Videos
async function loadVideos() {
    try {
        const response = await fetch(`${API_BASE}/api/videos`);
        const data = await response.json();

        if (data.success && data.videos.length > 0) {
            videos = data.videos;
            renderVideoGrid();
            underConstruction.classList.add('hidden');
        } else {
            // Use static videos if no videos from API
            loadStaticVideos();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback to static videos
        loadStaticVideos();
    }
}

// Load Static Videos (when server is not available)
function loadStaticVideos() {
    videos = [
        {
            filename: 'gus_dance.mp4',
            title: 'GUS Dance',
            url: 'pofanimation/gus_dance.mp4',
            thumbnail: 'images/kids-animation.png'
        }
    ];

    if (videos.length > 0) {
        renderVideoGrid();
        underConstruction.classList.add('hidden');

        // Auto-load first video
        mainVideo.src = videos[0].url;
        mainVideo.classList.add('playing');
        videoPlaceholder.classList.add('hidden');
        currentVideoTitle.textContent = videos[0].title;
        currentVideoDesc.textContent = `🎬 ${videos[0].filename}`;
    } else {
        showUnderConstruction();
    }
}

function showUnderConstruction() {
    videoGrid.innerHTML = '';
    underConstruction.classList.remove('hidden');
}

// Render Video Grid
function renderVideoGrid() {
    videoGrid.innerHTML = videos.map((video, index) => `
        <div class="video-card" data-index="${index}" onclick="playVideo(${index})">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'images/kids-animation.png'}" alt="${video.title}">
                <div class="thumbnail-overlay">
                    <div class="thumbnail-play">▶</div>
                </div>
                ${isLoggedIn ? `<button class="video-delete" onclick="event.stopPropagation(); deleteVideo('${video.filename}')" title="ลบวิดีโอ">🗑️</button>` : ''}
            </div>
            <div class="video-card-info">
                <h3 class="video-card-title">${video.title}</h3>
                <p class="video-card-meta">🎬 ${video.filename}</p>
            </div>
        </div>
    `).join('');
}

// Play Video
function playVideo(index) {
    const video = videos[index];
    if (!video) return;

    currentVideo = video;
    mainVideo.src = video.url;
    mainVideo.classList.add('playing');
    videoPlaceholder.classList.add('hidden');
    currentVideoTitle.textContent = video.title;
    currentVideoDesc.textContent = `🎬 ${video.filename}`;

    mainVideo.play();

    // Scroll to player
    document.querySelector('.video-player-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Delete Video
async function deleteVideo(filename) {
    if (!confirm('ต้องการลบวิดีโอนี้หรือไม่?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/videos/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('ลบวิดีโอสำเร็จ!');
            loadVideos();
        } else {
            alert(data.error || 'ไม่สามารถลบวิดีโอได้');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('เกิดข้อผิดพลาด');
    }
}
