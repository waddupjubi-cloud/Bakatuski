/* ===================================================
   BAKATUSKI – stories.js
   Full lore gallery with custom cursor, navbar, Swiper modal, lightbox, dark/light theme
   + responsive thumbs (horizontal on mobile)
   + swipeable gallery lightbox with index navigation
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
    const lightboxClose = lightbox?.querySelector('.lightbox-close');

    // Swiper instances
    let mainSwiper = null;
    let thumbSwiper = null;
    let currentChapterTitles = [];
    let storiesData = [];
    let currentLoreForModal = null;
    let currentGalleryImages = [];       // store URLs for lightbox
    let currentGalleryIndex = 0;
    let lightboxSwiper = null;
    const responsiveWidths = [480, 900];

    function optimizedImageUrl(src, width) {
        if (!src || !src.startsWith('images/')) return src;
        return src
            .replace(/^images\//, `images/optimized/${width}/`)
            .replace(/\.[^.]+$/, '.jpg');
    }

    function setResponsiveImage(img, originalSrc, options = {}) {
        const {
            sizes = '(max-width: 700px) 92vw, 360px',
            initialWidth = 900,
            eager = false,
            fullSrc = originalSrc
        } = options;

        img.src = optimizedImageUrl(originalSrc, initialWidth);
        img.srcset = responsiveWidths
            .map(width => `${optimizedImageUrl(originalSrc, width)} ${width}w`)
            .join(', ');
        img.sizes = sizes;
        img.loading = eager ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.dataset.full = fullSrc;
        img.onerror = () => {
            img.onerror = null;
            img.removeAttribute('srcset');
            img.src = originalSrc;
        };
    }

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
                <div class="card-cover">
                    <img alt="${escapeHtml(lore.hero)} cover">
                </div>
                <div class="card-content">
                    <h3>${escapeHtml(lore.hero)}</h3>
                    <p>${escapeHtml(lore.description || 'Unveil the untold chapters')}</p>
                </div>
            `;
            const coverImg = card.querySelector('.card-cover img');
            if (coverImg) {
                setResponsiveImage(coverImg, lore.cover, {
                    sizes: '(max-width: 520px) 92vw, (max-width: 1000px) 46vw, 300px',
                    initialWidth: 480
                });
            }
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
        currentGalleryImages = imageUrls; // store for lightbox

        mainSwiperWrapper.innerHTML = '';
        thumbSwiperWrapper.innerHTML = '';

        imageUrls.forEach((url, idx) => {
            const mainSlide = document.createElement('div');
            mainSlide.className = 'swiper-slide';
            const img = document.createElement('img');
            img.alt = `${lore.hero} - ${titles[idx]}`;
            img.setAttribute('data-index', idx);
            setResponsiveImage(img, url, {
                sizes: '(max-width: 900px) 92vw, 520px',
                initialWidth: 900,
                eager: idx === 0,
                fullSrc: url
            });
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                openGallery(idx);
            });
            mainSlide.appendChild(img);
            mainSwiperWrapper.appendChild(mainSlide);

            const thumbSlide = document.createElement('div');
            thumbSlide.className = 'swiper-slide';
            const thumbImg = document.createElement('img');
            thumbImg.alt = `thumb ${titles[idx]}`;
            setResponsiveImage(thumbImg, url, {
                sizes: '(max-width: 900px) 22vw, 130px',
                initialWidth: 480
            });
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

        const isMobile = window.innerWidth <= 900;
        
        mainSwiper = new Swiper('.main-swiper', {
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            spaceBetween: 10,
            loop: true,
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
        currentGalleryImages = [];
    }

    // ---------- SWIPEABLE LIGHTBOX GALLERY ----------
    function openGallery(startIndex) {
        if (!lightbox || !currentGalleryImages.length) return;
        currentGalleryIndex = startIndex;

        // Clear previous content
        const lightboxInner = lightbox;
        // Remove existing swiper container if any
        const oldSwiperContainer = lightboxInner.querySelector('.lightbox-swiper');
        if (oldSwiperContainer) oldSwiperContainer.remove();

        // Create new swiper container
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'swiper lightbox-swiper';
        swiperContainer.style.width = '100%';
        swiperContainer.style.height = '100%';
        swiperContainer.style.position = 'relative';
        
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        
        currentGalleryImages.forEach((url, idx) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.style.display = 'flex';
            slide.style.alignItems = 'center';
            slide.style.justifyContent = 'center';
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100vw';
            img.style.maxHeight = '100vh';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '16px';
            img.style.boxShadow = '0 0 40px rgba(0,0,0,0.5)';
            slide.appendChild(img);
            swiperWrapper.appendChild(slide);
        });
        
        swiperContainer.appendChild(swiperWrapper);
        
        // Add navigation buttons
        const prevBtn = document.createElement('div');
        prevBtn.className = 'swiper-button-prev';
        const nextBtn = document.createElement('div');
        nextBtn.className = 'swiper-button-next';
        swiperContainer.appendChild(prevBtn);
        swiperContainer.appendChild(nextBtn);
        
        lightboxInner.appendChild(swiperContainer);
        
        // Init Swiper
        if (lightboxSwiper) lightboxSwiper.destroy(true, true);
        lightboxSwiper = new Swiper('.lightbox-swiper', {
            initialSlide: startIndex,
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            loop: true,
            spaceBetween: 0,
            grabCursor: true,
            touchRatio: 1,
            resistance: true,
            resistanceRatio: 0.85
        });
        
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        if (lightboxSwiper) {
            lightboxSwiper.destroy(true, true);
            lightboxSwiper = null;
        }
        // Clean up swiper container
        const swiperContainer = lightbox.querySelector('.lightbox-swiper');
        if (swiperContainer) swiperContainer.remove();
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
    // Lightbox backdrop click: close only if clicking on backdrop, NOT on image
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && !lightbox.classList.contains('hidden')) closeLightbox();
            else if (modal && !modal.classList.contains('hidden')) closeModal();
        }
    });

    // ---------- Initialize ----------
    initCursor();
    initNavbar();
    await loadStories();
});
