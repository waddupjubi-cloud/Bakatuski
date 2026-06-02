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
    const storyReaderWrapper = document.getElementById('story-reader-wrapper');
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
    let storyReaderSwiper = null;
    let currentLoreForModal = null;
    let currentGalleryImages = [];       // store URLs for lightbox
    let currentGalleryIndex = 0;
    let lightboxSwiper = null;
    const responsiveWidths = [480, 900];
    const OVERLAY_STATE_KEY = 'bakatuskiStoriesOverlay';

    function canScrollOverlay(target) {
        return Boolean(target.closest('.nav-links.open, .modal-container, .lightbox-swiper, .swiper-zoom-container'));
    }

    function preventBackgroundScroll(event) {
        if (!document.body.classList.contains('page-scroll-locked')) return;
        if (canScrollOverlay(event.target)) return;
        event.preventDefault();
    }

    function lockPageScroll() {
        if (document.body.classList.contains('page-scroll-locked')) return;
        document.documentElement.classList.add('page-scroll-locked');
        document.body.classList.add('page-scroll-locked');
    }

    function unlockPageScroll() {
        if (!document.body.classList.contains('page-scroll-locked')) return;
        document.documentElement.classList.remove('page-scroll-locked');
        document.body.classList.remove('page-scroll-locked');
    }

    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
    document.addEventListener('wheel', preventBackgroundScroll, { passive: false });

    function isMobileViewport() {
        return window.matchMedia('(max-width: 640px)').matches;
    }

    function setBodyOverlayState(name, active) {
        document.body.classList.toggle(`${name}-open`, active);
        const overlayActive = Boolean(
            document.body.classList.contains('nav-open') ||
            document.body.classList.contains('lore-modal-open') ||
            document.body.classList.contains('lightbox-open')
        );
        document.body.classList.toggle('stories-overlay-active', overlayActive);
        if (overlayActive) lockPageScroll();
        else unlockPageScroll();
    }

    function currentOverlayState() {
        return history.state && history.state[OVERLAY_STATE_KEY];
    }

    function pushOverlayState(name) {
        if (!isMobileViewport()) return;
        if (currentOverlayState() === name) return;
        history.pushState({ ...(history.state || {}), [OVERLAY_STATE_KEY]: name }, '', window.location.href);
    }

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

    function setCoverImage(img, coverSrc) {
        img.src = coverSrc;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => {
            img.onerror = null;
            img.src = 'images/logo/bakatuskisquadlogo.png';
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
            if (e.target.closest('a, button, .lore-card, .modal-close, .theme-btn, .story-reader-pagination .swiper-pagination-bullet, .swiper-button-next, .swiper-button-prev, .lightbox-close')) {
                ring.classList.add('ring-hover');
            }
        });
        document.addEventListener('mouseout', e => {
            if (e.target.closest('a, button, .lore-card, .modal-close, .theme-btn, .story-reader-pagination .swiper-pagination-bullet, .swiper-button-next, .swiper-button-prev, .lightbox-close')) {
                ring.classList.remove('ring-hover');
            }
        });

        document.addEventListener('mousedown', () => dot.classList.add('dot-click'));
        document.addEventListener('mouseup', () => dot.classList.remove('dot-click'));

        function loop() {
            if (document.hidden) {
                requestAnimationFrame(loop);
                return;
            }
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
                setBodyOverlayState('nav', navLinks.classList.contains('open'));
            });
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    navLinks.classList.remove('open');
                    setBodyOverlayState('nav', false);
                });
            });
        }
    }

    // ---------- Load stories.json ----------
    async function loadStories() {
        try {
            const res = await fetch('assets/data/stories.json', { cache: 'force-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            storiesData = data.lores || [];
            renderStoryReader(storiesData);
            renderCards(storiesData);
        } catch (err) {
            console.error(err);
            if (grid) grid.innerHTML = '<p class="error-msg">⚠️ Failed to load lore data. Please refresh or try again later.</p>';
        }
    }

    // ---------- Render story reader ----------
    function renderStoryReader(data) {
        if (!storyReaderWrapper) return;
        if (storyReaderSwiper) {
            storyReaderSwiper.destroy(true, true);
            storyReaderSwiper = null;
        }

        storyReaderWrapper.innerHTML = '';
        if (!data.length) {
            storyReaderWrapper.innerHTML = '<div class="swiper-slide story-reader-loading">No hero stories found.</div>';
            const pagination = document.getElementById('story-reader-pagination');
            if (pagination) pagination.innerHTML = '';
            return;
        }

        data.forEach(lore => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide story-reader-slide';
            slide.dataset.loreSlug = lore.slug || '';

            const content = document.createElement('article');
            content.className = 'story-reader-card';

            const heroName = document.createElement('h3');
            heroName.className = 'story-reader-hero';
            heroName.textContent = lore.hero || 'Unknown Hero';
            content.appendChild(heroName);

            const chaptersWrap = document.createElement('div');
            chaptersWrap.className = 'story-reader-chapters';
            (lore.chapters || []).forEach(chapter => {
                const chapterEl = document.createElement('section');
                chapterEl.className = 'story-reader-chapter';

                const title = document.createElement('h4');
                title.textContent = chapter.title || `Chapter ${chapter.number || ''}`.trim();

                const desc = document.createElement('p');
                desc.textContent = chapter.fullDesc || chapter.shortDesc || '';

                chapterEl.append(title, desc);
                chaptersWrap.appendChild(chapterEl);
            });

            content.appendChild(chaptersWrap);
            slide.appendChild(content);
            storyReaderWrapper.appendChild(slide);
        });

        storyReaderSwiper = new Swiper('.story-reader-swiper', {
            slidesPerView: 1,
            spaceBetween: 34,
            loop: data.length > 1,
            grabCursor: true,
            effect: 'creative',
            creativeEffect: {
                limitProgress: 3,
                prev: {
                    translate: ['-110%', 0, -420],
                    rotate: [0, 16, -10],
                    opacity: 0.38,
                    scale: 0.86
                },
                next: {
                    translate: ['110%', 0, -420],
                    rotate: [0, -16, 10],
                    opacity: 0.38,
                    scale: 0.86
                }
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true
            },
            navigation: {
                nextEl: '.story-reader-next',
                prevEl: '.story-reader-prev'
            },
            pagination: {
                el: '#story-reader-pagination',
                clickable: true,
                renderBullet(index, className) {
                    const lore = data[index] || {};
                    const cover = lore.cover || '';
                    const hero = escapeHtml(lore.hero || `Story ${index + 1}`);
                    return `<button class="${className}" type="button" aria-label="${hero} story"><img src="${cover}" alt="${hero}" loading="lazy" decoding="async"></button>`;
                }
            },
            on: {
                init(swiper) {
                    setStoryReaderAccent(data[swiper.realIndex]);
                    updateStoryReaderPagination(data.length, swiper.realIndex);
                },
                slideChange(swiper) {
                    setStoryReaderAccent(data[swiper.realIndex]);
                    updateStoryReaderPagination(data.length, swiper.realIndex);
                }
            }
        });
    }

    function setStoryReaderAccent(lore) {
        const reader = document.getElementById('story-reader-swiper');
        if (!reader || !lore) return;
        reader.dataset.loreSlug = lore.slug || '';
    }

    function updateStoryReaderPagination(total, activeIndex) {
        const pagination = document.getElementById('story-reader-pagination');
        if (!pagination) return;
        const bullets = [...pagination.querySelectorAll('.swiper-pagination-bullet')];
        if (!bullets.length) return;

        if (total <= 7) {
            bullets.forEach((bullet, index) => {
                bullet.classList.remove('story-page-hidden');
                bullet.dataset.arcOffset = String(index - activeIndex);
                bullet.style.order = index;
            });
            return;
        }

        const visibleIndexes = Array.from({ length: 7 }, (_, position) => (
            (activeIndex + position - 3 + total) % total
        ));

        bullets.forEach((bullet, index) => {
            const position = visibleIndexes.indexOf(index);
            if (position === -1) {
                bullet.classList.add('story-page-hidden');
                bullet.removeAttribute('data-arc-offset');
                bullet.style.removeProperty('order');
                return;
            }

            bullet.classList.remove('story-page-hidden');
            bullet.dataset.arcOffset = String(position - 3);
            bullet.style.order = position;
        });
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
                    <img alt="${escapeHtml(lore.hero)} cover" loading="lazy" decoding="async">
                </div>
                <div class="card-content">
                    <h3>${escapeHtml(lore.hero)}</h3>
                    <p>${escapeHtml(lore.description || 'Unveil the untold chapters')}</p>
                </div>
            `;
            const coverImg = card.querySelector('.card-cover img');
            if (coverImg) {
                setCoverImage(coverImg, lore.cover);
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
            thumbSlide.dataset.thumbIndex = String(idx);
            const thumbImg = document.createElement('img');
            thumbImg.alt = `thumb ${titles[idx]}`;
            setResponsiveImage(thumbImg, url, {
                sizes: '(max-width: 900px) 22vw, 130px',
                initialWidth: 480
            });
            thumbSlide.addEventListener('click', () => {
                if (mainSwiper) mainSwiper.slideToLoop(idx);
            });
            thumbSlide.appendChild(thumbImg);
            thumbSwiperWrapper.appendChild(thumbSlide);
        });

        modalHeroName.innerText = lore.hero;
        modal.dataset.loreSlug = lore.slug || '';
        initSwiper();
        if (currentChapterTitles[0]) modalCaption.innerText = currentChapterTitles[0];
        modal.classList.remove('hidden');
        setBodyOverlayState('lore-modal', true);
        pushOverlayState('lore-modal');
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
                    if (mainSwiper) {
                        modalCaption.innerText = currentChapterTitles[mainSwiper.realIndex] || currentChapterTitles[0];
                        updateModalThumbArc(currentChapterTitles.length, mainSwiper.realIndex);
                    }
                }
            }
        });

        thumbSwiper = new Swiper('.thumb-swiper', {
            direction: isMobile ? 'horizontal' : 'vertical',
            slidesPerView: 5,
            spaceBetween: 12,
            freeMode: true,
            watchSlidesProgress: true,
        });
        mainSwiper.params.thumbs.swiper = thumbSwiper;
        mainSwiper.thumbs.init();
        updateModalThumbArc(currentChapterTitles.length, mainSwiper.realIndex || 0);
    }

    function updateModalThumbArc(total, activeIndex) {
        if (!thumbSwiperWrapper) return;
        const thumbs = [...thumbSwiperWrapper.querySelectorAll('.swiper-slide')];
        if (!thumbs.length) return;

        const activeSet = new Set();
        if (total <= 5) {
            thumbs.forEach((thumb, index) => {
                const offset = index - activeIndex;
                thumb.classList.remove('modal-thumb-hidden');
                thumb.classList.toggle('swiper-slide-thumb-active', index === activeIndex);
                thumb.dataset.arcOffset = String(offset);
                thumb.style.order = index;
            });
            if (thumbSwiper) thumbSwiper.update();
            return;
        }

        const visibleIndexes = Array.from({ length: 5 }, (_, position) => (
            (activeIndex + position - 2 + total) % total
        ));

        visibleIndexes.forEach(index => activeSet.add(index));

        thumbs.forEach((thumb, index) => {
            const position = visibleIndexes.indexOf(index);
            thumb.classList.toggle('modal-thumb-hidden', !activeSet.has(index));
            thumb.classList.toggle('swiper-slide-thumb-active', index === activeIndex);

            if (position === -1) {
                thumb.removeAttribute('data-arc-offset');
                thumb.style.removeProperty('order');
                return;
            }

            thumb.dataset.arcOffset = String(position - 2);
            thumb.style.order = position;
        });

        if (thumbSwiper) thumbSwiper.update();
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (!modal || modal.classList.contains('hidden')) return;
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (currentLoreForModal) initSwiper();
        }, 150);
    });

    function closeModalInternal() {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.removeAttribute('data-lore-slug');
        setBodyOverlayState('lore-modal', false);
        if (mainSwiper) { mainSwiper.destroy(true, true); mainSwiper = null; }
        if (thumbSwiper) { thumbSwiper.destroy(true, true); thumbSwiper = null; }
        currentChapterTitles = [];
        currentLoreForModal = null;
        currentGalleryImages = [];
    }

    function closeModal() {
        if (isMobileViewport() && currentOverlayState() === 'lore-modal') {
            history.back();
            return;
        }
        closeModalInternal();
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
            const zoomContainer = document.createElement('div');
            zoomContainer.className = 'swiper-zoom-container';
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100vw';
            img.style.maxHeight = '100vh';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '16px';
            img.style.boxShadow = '0 0 40px rgba(0,0,0,0.5)';
            zoomContainer.appendChild(img);
            slide.appendChild(zoomContainer);
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
            resistanceRatio: 0.85,
            zoom: {
                maxRatio: 4,
                minRatio: 1
            }
        });

        lightbox.classList.remove('hidden');
        lightbox.dataset.loreSlug = currentLoreForModal?.slug || '';
        setBodyOverlayState('lightbox', true);
        pushOverlayState('lightbox');
    }

    function closeLightboxInternal() {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        if (lightboxSwiper) {
            lightboxSwiper.destroy(true, true);
            lightboxSwiper = null;
        }
        // Clean up swiper container
        const swiperContainer = lightbox.querySelector('.lightbox-swiper');
        if (swiperContainer) swiperContainer.remove();
        lightbox.removeAttribute('data-lore-slug');
        setBodyOverlayState('lightbox', false);
    }

    function closeLightbox() {
        if (isMobileViewport() && currentOverlayState() === 'lightbox') {
            history.back();
            return;
        }
        closeLightboxInternal();
    }

    // ---------- Search ----------
    function filterCards() {
        if (!searchInput) return;
        const term = searchInput.value.trim().toLowerCase();
        const filtered = storiesData.filter(lore =>
            lore.hero.toLowerCase().includes(term) ||
            (lore.description && lore.description.toLowerCase().includes(term)) ||
            (lore.chapters || []).some(chapter =>
                `${chapter.title || ''} ${chapter.shortDesc || ''} ${chapter.fullDesc || ''}`.toLowerCase().includes(term)
            )
        );
        renderStoryReader(filtered);
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

    function handleGalleryKeyboard(e, swiper) {
        if (!swiper) return false;
        const forwardKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
        const backwardKeys = ['ArrowLeft', 'ArrowUp', 'PageUp'];

        if (forwardKeys.includes(e.key)) {
            e.preventDefault();
            swiper.slideNext();
            return true;
        }

        if (backwardKeys.includes(e.key)) {
            e.preventDefault();
            swiper.slidePrev();
            return true;
        }

        if (e.key === 'Home') {
            e.preventDefault();
            if (swiper.params.loop && typeof swiper.slideToLoop === 'function') swiper.slideToLoop(0);
            else swiper.slideTo(0);
            return true;
        }

        if (e.key === 'End') {
            e.preventDefault();
            const lastIndex = Math.max(0, (swiper.slides?.length || 1) - 1);
            if (swiper.params.loop && typeof swiper.slideToLoop === 'function') {
                const realLastIndex = Math.max(0, currentGalleryImages.length - 1);
                swiper.slideToLoop(realLastIndex);
            } else {
                swiper.slideTo(lastIndex);
            }
            return true;
        }

        return false;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && !lightbox.classList.contains('hidden')) closeLightbox();
            else if (modal && !modal.classList.contains('hidden')) closeModal();
            return;
        }

        if (lightbox && !lightbox.classList.contains('hidden')) {
            handleGalleryKeyboard(e, lightboxSwiper);
            return;
        }

        if (modal && !modal.classList.contains('hidden')) {
            handleGalleryKeyboard(e, mainSwiper);
        }
    });
    window.addEventListener('popstate', () => {
        if (lightbox && !lightbox.classList.contains('hidden') && currentOverlayState() !== 'lightbox') {
            closeLightboxInternal();
            return;
        }
        if (modal && !modal.classList.contains('hidden') && !currentOverlayState()) {
            closeModalInternal();
        }
    });

    // ---------- Initialize ----------
    initCursor();
    initNavbar();
    await loadStories();
});
