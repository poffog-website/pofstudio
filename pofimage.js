/* ========================================
   POFIMAGE Gallery JavaScript
   ======================================== */

// API Base URL
const API_BASE = '';

// State
let allImages = [];
let currentCategory = 'all';
let lightboxIndex = 0;
let filteredImages = [];
let isLoggedIn = false;

// DOM Elements
const galleryContainer = document.getElementById('galleryContainer');
const categoryFilters = document.getElementById('categoryFilters');
const uploadForm = document.getElementById('uploadForm');
const categoryForm = document.getElementById('categoryForm');
const categorySelect = document.getElementById('categorySelect');
const adminPanel = document.getElementById('adminPanel');
const adminToggle = document.getElementById('adminToggle');
const closeAdmin = document.getElementById('closeAdmin');
const uploadStatus = document.getElementById('uploadStatus');
const filePreview = document.getElementById('filePreview');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxFilename = document.getElementById('lightboxFilename');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initMobileMenu();
    initAdminPanel();
    initUploadForm();
    initCategoryForm();
    initFilePreview();
    initLightbox();
    initLogout();
    loadGallery();
});

// Check Login Status
function checkLoginStatus() {
    isLoggedIn = sessionStorage.getItem('pofstudio_admin') === 'true';

    if (isLoggedIn) {
        // User is logged in - show admin buttons
        if (adminToggle) adminToggle.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (loginBtn) loginBtn.classList.add('hidden');
    } else {
        // User is not logged in - show login button
        if (adminToggle) adminToggle.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
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

// Mobile Menu (same as main site)
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Admin Panel Toggle
function initAdminPanel() {
    adminToggle.addEventListener('click', () => {
        adminPanel.classList.toggle('hidden');
    });

    closeAdmin.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });
}

// File Preview
function initFilePreview() {
    const fileInput = document.getElementById('imageFile');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.innerHTML = '';
        }
    });
}

// Upload Form
function initUploadForm() {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        const fileInput = document.getElementById('imageFile');
        const category = categorySelect.value;

        if (!fileInput.files[0]) {
            showStatus('กรุณาเลือกไฟล์ภาพ', 'error');
            return;
        }

        if (!category) {
            showStatus('กรุณาเลือกหมวดหมู่', 'error');
            return;
        }

        formData.append('image', fileInput.files[0]);
        formData.append('category', category);

        try {
            showStatus('กำลังอัพโหลด...', '');

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showStatus('อัพโหลดสำเร็จ! 🎉', 'success');
                uploadForm.reset();
                filePreview.innerHTML = '';
                loadGallery();
            } else {
                showStatus(`เกิดข้อผิดพลาด: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        }
    });
}

// Category Form
function initCategoryForm() {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('categoryName').value.trim();

        if (!name) {
            showStatus('กรุณาใส่ชื่อหมวดหมู่', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (data.success) {
                showStatus(`สร้างหมวดหมู่ "${data.category.displayName}" สำเร็จ! 📁`, 'success');
                categoryForm.reset();
                loadCategories();
            } else {
                showStatus(`เกิดข้อผิดพลาด: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        }
    });
}

// Show Status Message
function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'upload-status' + (type ? ` ${type}` : '');

    if (type) {
        setTimeout(() => {
            uploadStatus.textContent = '';
            uploadStatus.className = 'upload-status';
        }, 5000);
    }
}

// Load Gallery
async function loadGallery() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();

        if (data.success) {
            renderGallery(data.categories);
            updateCategorySelect(data.categories);
            updateCategoryFilters(data.categories);
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryContainer.innerHTML = `
            <div class="error-message">
                <p>ไม่สามารถโหลดภาพได้ กรุณารัน server ก่อน</p>
                <code>npm install && npm start</code>
            </div>
        `;
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();

        if (data.success) {
            updateCategorySelect(data.categories);
            updateCategoryFilters(data.categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Update Category Select
function updateCategorySelect(categories) {
    categorySelect.innerHTML = '<option value="">-- เลือกหมวดหมู่ --</option>';

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.displayName;
        categorySelect.appendChild(option);
    });
}

// Update Category Filters
function updateCategoryFilters(categories) {
    categoryFilters.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = cat.name;
        btn.textContent = `${cat.displayName} (${cat.imageCount})`;
        btn.addEventListener('click', () => filterByCategory(cat.name));
        categoryFilters.appendChild(btn);
    });

    // Add click handler to "All" button
    document.querySelector('.filter-btn[data-category="all"]').addEventListener('click', () => filterByCategory('all'));
}

// Filter by Category
function filterByCategory(category) {
    currentCategory = category;

    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    // Show/hide category rows
    document.querySelectorAll('.category-row').forEach(row => {
        if (category === 'all') {
            row.style.display = 'block';
        } else {
            row.style.display = row.dataset.category === category ? 'block' : 'none';
        }
    });
}

// Render Gallery
async function renderGallery(categories) {
    // Check if there are any images
    const totalImages = categories.reduce((sum, cat) => sum + cat.imageCount, 0);

    if (totalImages === 0) {
        galleryContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    allImages = [];

    let html = '';

    for (const category of categories) {
        if (category.imageCount === 0) continue;

        // Fetch images for this category
        const response = await fetch(`${API_BASE}/api/images/${category.name}`);
        const data = await response.json();

        if (data.success && data.images.length > 0) {
            allImages.push(...data.images);

            html += `
                <div class="category-row" data-category="${category.name}">
                    <div class="category-header">
                        <h3 class="category-title">
                            📁 ${category.displayName}
                            <span class="category-count">${data.images.length} ภาพ</span>
                        </h3>
                        <div class="scroll-buttons">
                            <button class="scroll-btn scroll-left" onclick="scrollGallery('${category.name}', -1)">❮</button>
                            <button class="scroll-btn scroll-right" onclick="scrollGallery('${category.name}', 1)">❯</button>
                        </div>
                    </div>
                    <div class="gallery-scroll" id="gallery-${category.name}">
                        ${data.images.map((img, idx) => `
                            <div class="gallery-card" onclick="openLightbox('${img.url}', '${category.displayName}', '${img.filename}')">
                                <img src="${img.url}" alt="${img.filename}" loading="lazy">
                                <button class="card-delete" onclick="event.stopPropagation(); deleteImage('${category.name}', '${img.filename}')" title="ลบภาพ">🗑️</button>
                                <div class="card-info">
                                    <span class="card-filename">${img.filename}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    galleryContainer.innerHTML = html || '<div class="loading-spinner"><p>ไม่พบภาพ</p></div>';
}

// Scroll Gallery
function scrollGallery(categoryName, direction) {
    const gallery = document.getElementById(`gallery-${categoryName}`);
    if (gallery) {
        const scrollAmount = 300;
        gallery.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
}

// Delete Image
async function deleteImage(category, filename) {
    if (!confirm(`ต้องการลบภาพ "${filename}" ใช่หรือไม่?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/images/${category}/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showStatus('ลบภาพสำเร็จ!', 'success');
            loadGallery();
        } else {
            showStatus(`เกิดข้อผิดพลาด: ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    }
}

// Lightbox
function initLightbox() {
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(url, category, filename) {
    lightboxImage.src = url;
    lightboxCategory.textContent = category;
    lightboxFilename.textContent = filename;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Find index
    lightboxIndex = allImages.findIndex(img => img.url === url);
    filteredImages = currentCategory === 'all'
        ? allImages
        : allImages.filter(img => img.category === currentCategory);
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    const images = currentCategory === 'all'
        ? allImages
        : allImages.filter(img => img.category === currentCategory);

    if (images.length === 0) return;

    lightboxIndex = (lightboxIndex + direction + images.length) % images.length;
    const img = images[lightboxIndex];

    lightboxImage.src = img.url;
    lightboxCategory.textContent = formatCategoryName(img.category);
    lightboxFilename.textContent = img.filename;
}

function formatCategoryName(name) {
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Make scrollGallery available globally
window.scrollGallery = scrollGallery;
window.openLightbox = openLightbox;
window.deleteImage = deleteImage;
