/* ===================================================
   BAKATUSKI – stories.js
   Full lore gallery with custom cursor, navbar, Swiper modal, lightbox, dark/light theme
   + responsive thumbs (horizontal on mobile)
   =================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // ---------- DOM elements ----------
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const grid = document.getElementById('lore-grid');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('lore-modal');
    const modalClose = document.getElementById('modal-close');
    const modalHeroName = document.getElementById('modal-hero-name');
    const mainSwiperWrapper = document.getElementById('main-swiper-wrapper');
    const thumbSwiperWrapper = document.getElementById('thumb-swiper-wrapper');
    const modalCaption = document.getElementById('modal-caption');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox?.querySelector('.lightbox-img');
    const lightboxClose = lightbox?.querySelector('.lightbox-close');
    const themeBtn = document.getElementById('theme-switch');

    // Swiper instances
    let mainSwiper = null;
    let thumbSwiper = null;
    let currentChapterTitles = [];
    let storiesData = [];
    let currentLoreForModal = null;

    // ---------- CUSTOM CURSOR ----------
    function initCursor() {
        if (!dot || !ring) return;
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            dot.style.display = 'none';
            ring.style.display = 'none';
            document.body.style.cursor = 'auto';
            document.querySelectorAll('button, a').forEach(el => el.style.cursor = 'auto');
            return;
        }
        let mx = 0, my = 0, rx = 0, ry = 0, dotX = 0, dotY = 0;
        let started = false;

        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
            if (!started) {
                rx = mx; ry = my; dotX = mx; dotY = my;
                dot.style.opacity = '1';
                ring.style.opacity = '1';
                started = true;
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            if (started) {
                dot.style.opacity = '1';
                ring.style.opacity = '1';
            }
        });

        document.addEventListener('mouseover', e => {
            if (e.target.closest('a, button, .lore-card, .modal-close, .theme-btn, .swiper-button-next, .swiper-button-prev, .lightbox-close')) {
                ring.classList.add('ring-hover');
            }
        });
        document.addEventListener('mouseout', e => {
            if (e.target.closest('a, button, .lore-card, .modal-close, .theme-btn, .swiper-button-next, .swiper-button-prev, .lightbox-close')) {
                ring.classList.remove('ring-hover');
            }
        });

        document.addEventListener('mousedown', () => dot.classList.add('dot-click'));
        document.addEventListener('mouseup', () => dot.classList.remove('dot-click'));

        function loop() {
            dotX += (mx - dotX) * 0.55;
            dotY += (my - dotY) * 0.55;
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            dot.style.left = dotX + 'px';
            dot.style.top = dotY + 'px';
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(loop);
        }
        loop();
    }

    // ---------- NAVBAR ----------
    function initNavbar() {
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 60);
        });
        if (window.scrollY > 60) navbar.classList.add('scrolled');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('open');
                navLinks.classList.toggle('open');
            });
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    navLinks.classList.remove('open');
                });
            });
        }
    }

    // ---------- THEME ----------
    function initTheme() {
        const saved = localStorage.getItem('stories-theme');
        const body = document.body;
        if (saved === 'light') {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            if (themeBtn) themeBtn.textContent = '☀️ Light';
        } else {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            if (themeBtn) themeBtn.textContent = '🌙 Dark';
        }
    }
    function toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('stories-theme', 'light');
            themeBtn.textContent = '☀️ Light';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('stories-theme', 'dark');
            themeBtn.textContent = '🌙 Dark';
        }
    }

    // ---------- Load stories.json ----------
    async function loadStories() {
        try {
            const res = await fetch('assets/data/stories.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            storiesData = data.lores || [];
            renderCards(storiesData);
        } catch (err) {
            console.error(err);
            if (grid) grid.innerHTML = '<p class="error-msg">⚠️ Failed to load lore data. Please refresh or try again later.</p>';
        }
    }

    // ---------- Render cards ----------
    function renderCards(data) {
        if (!grid) return;
        grid.innerHTML = '';
        if (!data.length) {
            grid.innerHTML = '<p class="no-results">🌿 No legends match your search. Try another name.</p>';
            return;
        }
        data.forEach(lore => {
            const card = document.createElement('div');
            card.className = 'lore-card reveal';
            card.innerHTML = `
                <div class="card-cover" style="background-image: url('${lore.cover}');"></div>
                <div class="card-content">
                    <h3>${escapeHtml(lore.hero)}</h3>
                    <p>${escapeHtml(lore.description || 'Unveil the untold chapters')}</p>
                </div>
            `;
            card.addEventListener('click', () => openModal(lore));
            grid.appendChild(card);
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.lore-card.reveal').forEach(card => observer.observe(card));
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // ---------- Modal & Swiper (responsive thumbs) ----------
    function openModal(lore) {
        if (!modal || !mainSwiperWrapper || !thumbSwiperWrapper) return;
        currentLoreForModal = lore;
        const chapters = lore.chapters || [];
        if (!chapters.length) return;

        const folder = lore.folder;
        const imageUrls = [];
        const titles = [];
        chapters.forEach(ch => {
            if (ch.imageFile) {
                imageUrls.push(`${folder}${ch.imageFile}`);
                titles.push(ch.title || `Chapter ${ch.number}`);
            }
        });
        if (imageUrls.length === 0) return;
        currentChapterTitles = titles;

        mainSwiperWrapper.innerHTML = '';
        thumbSwiperWrapper.innerHTML = '';

        imageUrls.forEach((url, idx) => {
            const mainSlide = document.createElement('div');
            mainSlide.className = 'swiper-slide';
            const img = document.createElement('img');
            img.src = url;
            img.alt = `${lore.hero} - ${titles[idx]}`;
            img.setAttribute('data-full', url);
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(url);
            });
            mainSlide.appendChild(img);
            mainSwiperWrapper.appendChild(mainSlide);

            const thumbSlide = document.createElement('div');
            thumbSlide.className = 'swiper-slide';
            const thumbImg = document.createElement('img');
            thumbImg.src = url;
            thumbImg.alt = `thumb ${titles[idx]}`;
            thumbSlide.appendChild(thumbImg);
            thumbSwiperWrapper.appendChild(thumbSlide);
        });

        modalHeroName.innerText = lore.hero;
        initSwiper();
        if (currentChapterTitles[0]) modalCaption.innerText = currentChapterTitles[0];
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function initSwiper() {
        if (mainSwiper) mainSwiper.destroy(true, true);
        if (thumbSwiper) thumbSwiper.destroy(true, true);

        // Determine if we are on mobile (width <= 900px) to set thumb direction
        const isMobile = window.innerWidth <= 900;
        
        mainSwiper = new Swiper('.main-swiper', {
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            spaceBetween: 10,
            loop: false,
            on: {
                slideChange: () => {
                    if (mainSwiper && currentChapterTitles[mainSwiper.activeIndex]) {
                        modalCaption.innerText = currentChapterTitles[mainSwiper.activeIndex];
                    }
                }
            }
        });

        thumbSwiper = new Swiper('.thumb-swiper', {
            direction: isMobile ? 'horizontal' : 'vertical',
            slidesPerView: isMobile ? 4 : 5,
            spaceBetween: 12,
            freeMode: true,
            watchSlidesProgress: true,
        });
        mainSwiper.params.thumbs.swiper = thumbSwiper;
        mainSwiper.thumbs.init();
    }

    // Handle window resize to reinit swiper with correct direction
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (!modal || modal.classList.contains('hidden')) return;
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (currentLoreForModal) initSwiper();
        }, 150);
    });

    function closeModal() {
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (mainSwiper) { mainSwiper.destroy(true, true); mainSwiper = null; }
        if (thumbSwiper) { thumbSwiper.destroy(true, true); thumbSwiper = null; }
        currentChapterTitles = [];
        currentLoreForModal = null;
    }

    // ---------- Lightbox ----------
    function openLightbox(src) {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        if (lightboxImg) lightboxImg.src = '';
        document.body.style.overflow = '';
    }

    // ---------- Search ----------
    function filterCards() {
        if (!searchInput) return;
        const term = searchInput.value.trim().toLowerCase();
        const filtered = storiesData.filter(lore =>
            lore.hero.toLowerCase().includes(term) ||
            (lore.description && lore.description.toLowerCase().includes(term))
        );
        renderCards(filtered);
    }

    // ---------- Event listeners ----------
    if (searchInput) searchInput.addEventListener('input', filterCards);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && !lightbox.classList.contains('hidden')) closeLightbox();
            else if (modal && !modal.classList.contains('hidden')) closeModal();
        }
    });

    // ---------- Initialize ----------
    initCursor();
    initNavbar();
    initTheme();
    await loadStories();
});