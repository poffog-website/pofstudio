/* ========================================
   POFSTUDIO - JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal();
    initCardHoverEffects();
    initNavbarScroll();
    initContactForm();
});

/**
 * Contact Form Handler
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const formStatus = document.getElementById('formStatus');

        // Validate
        if (!name || !email || !subject || !message) {
            formStatus.textContent = 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
            formStatus.className = 'form-status error';
            return;
        }

        // Create mailto link with form data
        const mailtoSubject = encodeURIComponent(`[POFSTUDIO] ${subject}`);
        const mailtoBody = encodeURIComponent(
            `ชื่อผู้ติดต่อ: ${name}\n` +
            `อีเมลตอบกลับ: ${email}\n` +
            `หัวข้อ: ${subject}\n\n` +
            `ข้อความ:\n${message}\n\n` +
            `---\nส่งจากฟอร์มติดต่อ POFSTUDIO`
        );

        const mailtoLink = `mailto:poffog@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

        // Show success message
        formStatus.textContent = 'กำลังเปิดโปรแกรมอีเมล... 📧';
        formStatus.className = 'form-status success';

        // Open email client
        window.location.href = mailtoLink;

        // Show confirmation
        setTimeout(() => {
            formStatus.textContent = 'เปิดโปรแกรมอีเมลแล้ว! กรุณากดส่งในโปรแกรมอีเมลของคุณ 💕';

            // Reset form after delay
            setTimeout(() => {
                contactForm.reset();
                formStatus.textContent = '';
                formStatus.className = 'form-status';
            }, 5000);
        }, 1000);
    });
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Smooth Scroll for Navigation Links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Scroll Reveal Animation
 */
function initScrollReveal() {
    // Add reveal class to elements
    const revealElements = document.querySelectorAll(
        '.category-card, .about-content, .contact-content, .section-header'
    );

    revealElements.forEach(el => {
        el.classList.add('reveal');
    });

    // Create intersection observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Add stagger delay for cards
                if (entry.target.classList.contains('category-card')) {
                    const cards = document.querySelectorAll('.category-card');
                    cards.forEach((card, index) => {
                        card.style.transitionDelay = `${index * 0.1}s`;
                    });
                }
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
}

/**
 * Card Hover Effects
 */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.category-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const icon = card.querySelector('.card-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        });

        card.addEventListener('mouseleave', (e) => {
            const icon = card.querySelector('.card-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });

        // Tilt effect on mouse move
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

/**
 * Navbar Scroll Effect
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');

    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow when scrolled
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 16px rgba(92, 64, 51, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        // Active link based on scroll position
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.style.color = '#C4A484';
                        link.style.background = 'rgba(196, 164, 132, 0.1)';
                    } else {
                        link.style.color = '';
                        link.style.background = '';
                    }
                });
            }
        });

        lastScroll = currentScroll;
    });
}

/**
 * Add sparkle effect on hero button
 */
const heroBtn = document.querySelector('.hero-btn');
if (heroBtn) {
    heroBtn.addEventListener('click', (e) => {
        // Create sparkle effect
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('span');
            sparkle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: var(--color-coral);
                border-radius: 50%;
                pointer-events: none;
                animation: sparkle 0.6s ease forwards;
            `;
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            heroBtn.style.position = 'relative';
            heroBtn.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 600);
        }
    });
}

// Add sparkle animation to head
const style = document.createElement('style');
style.textContent = `
    @keyframes sparkle {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: scale(2) rotate(180deg);
            opacity: 0;
        }
    }
    
    /* Section Indicator */
    .section-indicator {
        position: fixed;
        bottom: 100px;
        left: 30px;
        background: rgba(92, 64, 51, 0.9);
        color: white;
        padding: 10px 16px;
        border-radius: 30px;
        font-family: var(--font-heading);
        font-size: 0.85rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        transform: translateX(-20px);
        transition: all 0.3s ease;
        z-index: 1000;
        pointer-events: none;
    }
    
    .section-indicator.visible {
        opacity: 1;
        transform: translateX(0);
    }
    
    .section-indicator-dot {
        width: 8px;
        height: 8px;
        background: var(--color-sage);
        border-radius: 50%;
        animation: pulse 2s ease infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    /* Back to Top Button */
    .back-to-top {
        position: fixed;
        bottom: 30px;
        left: 30px;
        width: 45px;
        height: 45px;
        background: linear-gradient(135deg, var(--color-sage), var(--color-sage-light));
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(164, 190, 123, 0.3);
    }
    
    .back-to-top.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .back-to-top:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(164, 190, 123, 0.4);
    }
    
    @media (max-width: 768px) {
        .section-indicator {
            left: 15px;
            bottom: 90px;
            font-size: 0.75rem;
            padding: 8px 12px;
        }
        
        .back-to-top {
            left: 15px;
            width: 40px;
            height: 40px;
        }
    }
`;
document.head.appendChild(style);

// Create and add section indicator
const sectionIndicator = document.createElement('div');
sectionIndicator.className = 'section-indicator';
sectionIndicator.innerHTML = '<span class="section-indicator-dot"></span><span class="section-indicator-text">หน้าแรก</span>';
document.body.appendChild(sectionIndicator);

// Create and add back-to-top button
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.innerHTML = '↑';
backToTop.title = 'กลับขึ้นบน';
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.body.appendChild(backToTop);

// Section names mapping
const sectionNames = {
    'hero': '🏠 หน้าแรก',
    'categories': '📂 หมวดหมู่',
    'about': '💡 เกี่ยวกับเรา',
    'contact': '📞 ติดต่อ'
};

// Update section indicator on scroll
let currentSection = '';
window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const indicatorText = sectionIndicator.querySelector('.section-indicator-text');

    // Show/hide back to top button
    if (scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }

    // Update section indicator
    const sections = document.querySelectorAll('section[id], .hero');
    let found = false;

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionId = section.id || (section.classList.contains('hero') ? 'hero' : '');

        if (rect.top <= 150 && rect.bottom > 150 && sectionNames[sectionId]) {
            if (currentSection !== sectionId) {
                currentSection = sectionId;
                indicatorText.textContent = sectionNames[sectionId];
            }
            found = true;
        }
    });

    // Show indicator when scrolled
    if (scrollY > 100 && found) {
        sectionIndicator.classList.add('visible');
    } else {
        sectionIndicator.classList.remove('visible');
    }
});
