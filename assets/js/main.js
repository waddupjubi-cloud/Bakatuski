/* ===================================================
   BAKATUSKI — main.js
   Vanilla JS — no dependencies
   =================================================== */

'use strict';

const responsiveWidths = [480, 900];

function hasOpenOverlay() {
  return document.body.classList.contains('nav-open') ||
    document.body.classList.contains('member-modal-open') ||
    document.body.classList.contains('lightbox-open');
}

function canScrollOverlay(target) {
  return Boolean(target.closest('.nav-links.open, .modal-panel, .modal-gallery-slider, .lightbox, .audio-panel'));
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

function syncPageScrollLock() {
  if (hasOpenOverlay()) lockPageScroll();
  else unlockPageScroll();
}

document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
document.addEventListener('wheel', preventBackgroundScroll, { passive: false });

function optimizedImageUrl(src, width) {
  if (!src || !src.startsWith('images/')) return src;
  return src
    .replace(/^images\//, `images/optimized/${width}/`)
    .replace(/\.[^.]+$/, '.jpg');
}

function responsiveImgHtml(src, alt, options = {}) {
  if (!src) return '';
  const {
    sizes = '(max-width: 700px) 92vw, 360px',
    initialWidth = 480,
    eager = false,
    extraAttrs = '',
    onerror = ''
  } = options;
  const safeAlt = String(alt || '').replace(/"/g, '&quot;');
  const srcset = responsiveWidths
    .map(width => `${optimizedImageUrl(src, width)} ${width}w`)
    .join(', ');
  const fallback = onerror || `this.onerror=null;this.removeAttribute('srcset');this.src='${src}'`;
  return `<img src="${optimizedImageUrl(src, initialWidth)}" srcset="${srcset}" sizes="${sizes}" alt="${safeAlt}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" onerror="${fallback}" ${extraAttrs}>`;
}

/* ─── CUSTOM CURSOR ─── */
(function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    document.body.style.cursor = 'auto';
    document.querySelectorAll('button').forEach(b => b.style.cursor = 'auto');
    return;
  }

  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let dotX = 0, dotY = 0;
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
    if (e.target.closest('a, button, [data-cursor-expand]')) {
      ring.classList.add('ring-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, [data-cursor-expand]')) {
      ring.classList.remove('ring-hover');
    }
  });

  document.addEventListener('mousedown', () => dot.classList.add('dot-click'));
  document.addEventListener('mouseup', () => dot.classList.remove('dot-click'));

  (function loop() {
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
  })();
})();

/* ─── NAVBAR ─── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  const ham = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    highlightActiveLink();
  }, { passive: true });

  ham && ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    links && links.classList.toggle('open');
    document.body.classList.toggle('nav-open', Boolean(links?.classList.contains('open')));
    syncPageScrollLock();
  });

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      ham && ham.classList.remove('open');
      links && links.classList.remove('open');
      document.body.classList.remove('nav-open');
      syncPageScrollLock();
    });
  });

  function highlightActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.s === current);
    });
  }
})();

/* ─── PARTICLE CANVAS ─── */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = ['rgba(27,218,128,', 'rgba(255,92,0,', 'rgba(255,138,64,'];
  for (let i = 0; i < 90; i++) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    particles.push({
      x: Math.random() * 1600,
      y: Math.random() * 900,
      r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: c,
      a: Math.random() * 0.5 + 0.2,
    });
  }

  let mx = -9999, my = -9999;
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });

  function draw() {
    if (document.hidden) {
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx = p.x - mx, dy = p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        p.vx += (dx / dist) * 0.15;
        p.vy += (dy / dist) * 0.15;
      }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.a + ')';
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(27,218,128,${0.06 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─── HERO SWIPER WITH CUSTOM ICON PAGINATION AND TYPEWRITER IGN ─── */
/* ─── HERO SWIPER WITH CUSTOM ICON PAGINATION AND TYPEWRITER IGN ─── */
function initHeroSwiper(players) {
  const container = document.getElementById('hero-slides');
  const dotsWrap = document.getElementById('swiper-dots');
  const prevBtn = document.getElementById('arrow-prev');
  const nextBtn = document.getElementById('arrow-next');
  if (!container || !players.length) return;

  let current = 0;
  let autoTimer;
  let typingTimeout = null;

  // Helper: fit text to container (reduce font size until it fits on one line)
  function fitTextToContainer(el, maxWidth) {
    if (!el) return;
    let fontSize = parseFloat(getComputedStyle(el).fontSize);
    const container = el.parentElement;
    if (!container) return;
    let containerWidth = container.clientWidth;
    if (containerWidth <= 0) containerWidth = maxWidth || 150;
    el.style.fontSize = '';
    let currentSize = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > containerWidth && currentSize > 8) {
      currentSize -= 1;
      el.style.fontSize = currentSize + 'px';
      if (currentSize <= 8) break;
    }
  }

  // Typewriter + fit for a given slide with 0.8s delay and previous clear
  function animateIgnForSlide(slide) {
    const ignSpan = slide.querySelector('.hero-meta-ign-value');
    if (!ignSpan) return;
    // Stop any ongoing typing
    if (typingTimeout) clearTimeout(typingTimeout);
    const fullText = ignSpan.dataset.fulltext || ignSpan.textContent;
    // Reset font size and clear current text immediately
    ignSpan.style.fontSize = '';
    ignSpan.textContent = '';
    let i = 0;

    // Delay 800ms before starting to type
    typingTimeout = setTimeout(() => {
      function typeChar() {
        if (i < fullText.length) {
          ignSpan.textContent += fullText.charAt(i);
          i++;
          typingTimeout = setTimeout(typeChar, 120); // typing speed 120ms/char
        } else {
          fitTextToContainer(ignSpan, 200);
          typingTimeout = setTimeout(() => {
            ignSpan.classList.remove('typing');
          }, 1500);
        }
      }
      ignSpan.classList.add('typing');
      typeChar();
    }, 800);  // 0.8 second delay before typing starts
  }

  // Build slides
  players.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.dataset.index = i;

    const playerColor = p.favColor || '#FF5C00';
    const rosterImg = p.images?.roster || '';
    const logoImg = 'images/logo/bakatuskisquadlogo.png';

    const statsHtml = p.stats
      ? Object.entries(p.stats).slice(0, 6).map(([k, v]) => `
          <div class="hero-stat-row">
            <div class="hero-stat-label"><span>${k}</span><span>${v}/10</span></div>
            <div class="hero-stat-track">
              <div class="hero-stat-fill" data-val="${v * 10}"></div>
            </div>
          </div>`).join('')
      : '';

    const initials = p.name.charAt(0).toUpperCase();
    const imgHtml = rosterImg
      ? responsiveImgHtml(rosterImg, p.name, {
          sizes: '(max-width: 760px) 86vw, 520px',
          initialWidth: 900,
          eager: i === 0,
          onerror: `this.parentElement.innerHTML='<div class=hero-img-placeholder>${initials}</div>'`
        })
      : `<div class="hero-img-placeholder">${initials}</div>`;

    const fulltext = (p.ign || p.name).replace(/"/g, '&quot;');

    slide.innerHTML = `
      <div class="hero-bg-color" style="--player-color: ${hexToRgba(playerColor, 0.18)}"></div>
      <div class="hero-scan-line"></div>
      <div class="hero-layout">
        <div class="hero-left">
          <div class="hero-badge">${p.role}</div>
          <div class="hero-player-name">${p.name}</div>
          <div class="hero-player-title">${p.title}</div>
          <div class="hero-stats">${statsHtml}</div>
        </div>
        <div class="hero-center">
          <div class="hero-jersey-bg">${p.jerseyNumber || ''}</div>
          <div class="hero-img-frame">
            ${imgHtml}
            <div class="hero-img-shine"></div>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-squad-logo">
            <img src="${logoImg}" alt="Bakatuski" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='🐼'">
          </div>
          <div class="hero-meta">
            <div class="hero-meta-id">${p.playerId || ''}</div>
            <div class="hero-meta-ign">
              <span class="hero-meta-ign-label">IGN:</span>
              <span class="hero-meta-ign-value" data-fulltext="${fulltext}">${p.ign || p.name}</span>
            </div>
          </div>
          <div class="hero-rating-wrap">
            <div class="hero-rating-num">${p.rating}</div>
            <div class="hero-rating-label">Rating</div>
          </div>
        </div>
      </div>`;
    container.appendChild(slide);
  });

  // Custom icon pagination (infinite 5-item carousel)
  const iconContainer = document.createElement('div');
  iconContainer.className = 'swiper-icons';
  if (dotsWrap && dotsWrap.parentNode) {
    dotsWrap.parentNode.appendChild(iconContainer);
    dotsWrap.style.display = 'none';
  }

  function renderIconStrip(activeIdx) {
    const total = players.length;
    const visible = 5;
    const half = Math.floor(visible / 2);
    let start = activeIdx - half;
    const indices = [];
    for (let i = 0; i < visible; i++) {
      indices.push(((start + i) % total + total) % total);
    }
    iconContainer.innerHTML = '';
    indices.forEach(idx => {
      const p = players[idx];
      const iconSrc = p.images?.icon || '';
      const div = document.createElement('div');
      div.className = 'icon-dot' + (idx === activeIdx ? ' active' : '');
      if (iconSrc) {
        const img = document.createElement('img');
        img.src = optimizedImageUrl(iconSrc, 480);
        img.srcset = responsiveWidths.map(width => `${optimizedImageUrl(iconSrc, width)} ${width}w`).join(', ');
        img.sizes = '56px';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => {
          img.style.display = 'none';
          div.innerHTML = `<span class="fallback">${p.name.charAt(0)}</span>`;
        };
        div.appendChild(img);
      } else {
        div.innerHTML = `<span class="fallback">${p.name.charAt(0)}</span>`;
      }
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        goTo(idx);
      });
      iconContainer.appendChild(div);
    });
  }

  function goTo(idx) {
    const slides = container.querySelectorAll('.hero-slide');
    // Clear the old slide's IGN text to avoid leftover content
    const oldSlide = slides[current];
    const oldIgnSpan = oldSlide.querySelector('.hero-meta-ign-value');
    if (oldIgnSpan) {
      if (typingTimeout) clearTimeout(typingTimeout);
      oldIgnSpan.textContent = '';
      oldIgnSpan.classList.remove('typing');
    }

    slides[current].classList.remove('active');
    current = (idx + players.length) % players.length;
    slides[current].classList.add('active');
    renderIconStrip(current);
    // Animate stat bars
    slides[current].querySelectorAll('.hero-stat-fill').forEach(bar => {
      bar.style.width = '0';
      requestAnimationFrame(() => { bar.style.width = bar.dataset.val + '%'; });
    });
    // Animate IGN typewriter for new slide
    animateIgnForSlide(slides[current]);
    resetAuto();
  }

  renderIconStrip(0);
  const firstSlide = container.querySelector('.hero-slide.active');
  setTimeout(() => {
    firstSlide.querySelectorAll('.hero-stat-fill').forEach(bar => {
      bar.style.width = bar.dataset.val + '%';
    });
    animateIgnForSlide(firstSlide);
  }, 300);

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', e => {
    if (window.scrollY > window.innerHeight * 0.5) return;
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  window.addEventListener('resize', () => {
    const activeSlide = container.querySelector('.hero-slide.active');
    if (activeSlide) {
      const ignSpan = activeSlide.querySelector('.hero-meta-ign-value');
      if (ignSpan && ignSpan.textContent.length > 0) {
        fitTextToContainer(ignSpan, 200);
      }
    }
  });

  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 7000); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }
  startAuto();
}

/* ─── SQUAD CARDS ─── */
function renderSquadCards(members) {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  grid.innerHTML = '';

  members.forEach(m => {
    const card = document.createElement('div');
    card.className = 'member-card reveal';
    card.dataset.type = m.type;

    const iconSrc = m.images?.icon || '';
    const initials = m.name.charAt(0).toUpperCase();
    const imgHtml = iconSrc
      ? responsiveImgHtml(iconSrc, m.name, {
          sizes: '(max-width: 620px) 92vw, 320px',
          initialWidth: 480,
          onerror: `this.parentElement.innerHTML='<div class=card-img-placeholder>${initials}</div>'`
        })
      : `<div class="card-img-placeholder">${initials}</div>`;

    const isPlayer = m.type === 'player';
    const isSub = m.subtype === 'substitute';
    const badgeClass = isPlayer ? (isSub ? 'badge-sub' : 'badge-player') : 'badge-staff';
    const badgeLabel = isPlayer ? (isSub ? 'sub' : 'starter') : 'staff';
    const starsHtml = generateStars(m.rating);
    card.dataset.subtype = m.subtype || (isPlayer ? 'starter' : 'staff');

    card.innerHTML = `
      <div class="card-img-wrap">
        ${imgHtml}
        <div class="card-type-badge ${badgeClass}">${badgeLabel}</div>
        <div class="card-view-btn">VIEW PROFILE →</div>
      </div>
      <div class="card-body">
        <div class="card-name">${m.name}</div>
        <div class="card-title">${m.title}</div>
        <div class="card-role-badge">${m.role}</div>
        <div class="card-stars">${starsHtml}</div>
      </div>`;

    card.addEventListener('click', () => openModal(m));
    init3DTilt(card);
    grid.appendChild(card);
  });

  // Filter
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      grid.querySelectorAll('.member-card').forEach(c => {
        const matchAll = f === 'all';
        const matchStarter = f === 'starter' && c.dataset.subtype === 'starter';
        const matchSub = f === 'substitute' && c.dataset.subtype === 'substitute';
        const matchStaff = f === 'staff' && c.dataset.type === 'staff';
        c.style.display = (matchAll || matchStarter || matchSub || matchStaff) ? '' : 'none';
      });
    });
  });
}

function generateStars(rating) {
  let html = '';
  for (let i = 1; i <= 10; i++) {
    if (rating >= i) html += '<span class="star full">★</span>';
    else if (rating >= i - 0.5) html += '<span class="star half">★</span>';
    else html += '<span class="star empty">★</span>';
  }
  return html;
}

/* ─── 3D CARD TILT ─── */
function init3DTilt(card) {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-8px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}

/* ─── MEMBER MODAL with gallery slider ─── */
function openModal(m) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;

  // Update URL with member slug (for sharing)
  const slugToUse = m.slug || m.nickname?.toLowerCase().replace(/\s+/g, '-') || m.name.toLowerCase().replace(/\s+/g, '-');
  const newUrl = `${window.location.pathname}?member=${encodeURIComponent(slugToUse)}`;
  window.history.pushState({ member: slugToUse }, '', newUrl);

  const popupSrc = m.images?.popup || m.images?.roster || '';
  const initials = m.name.charAt(0).toUpperCase();

  const imgHtml = popupSrc
    ? responsiveImgHtml(popupSrc, m.name, {
        sizes: '(max-width: 760px) 88vw, 420px',
        initialWidth: 900,
        eager: true,
        onerror: `this.parentElement.innerHTML='<div class=modal-img-placeholder>${initials}</div>'`
      })
    : `<div class="modal-img-placeholder">${initials}</div>`;

  const gallery = m.images?.gallery || [];
  let galleryHtml = '';
  if (gallery.length) {
    galleryHtml = `
      <div class="modal-section-label">Gallery</div>
      <div class="modal-gallery-slider" id="modal-gallery-slider">
        ${gallery.map((src, idx) => `
          <div class="gallery-slide ${idx === 0 ? 'active' : ''}" data-full="${src}">
            ${responsiveImgHtml(src, 'Gallery image', {
              sizes: '(max-width: 760px) 88vw, 320px',
              initialWidth: 480,
              onerror: "this.style.display='none'"
            })}
          </div>
        `).join('')}
      </div>`;
  }

  const statsHtml = m.stats
    ? `<div class="modal-section-label">Stats</div>
       <div class="modal-stats">
       ${Object.entries(m.stats).map(([k, v]) => `
         <div class="modal-stat-row">
           <div class="modal-stat-label"><span>${k}</span><span>${v}/10</span></div>
           <div class="modal-stat-track"><div class="modal-stat-fill" data-val="${v * 10}"></div></div>
         </div>`).join('')}
       </div>`
    : '';

  const heroesHtml = (m.favHeroes || []).length
    ? `<div class="modal-section-label">Favourite Heroes</div>
       <div class="heroes-list">
       ${m.favHeroes.map(h => `
         <div class="hero-chip">
           <div class="hero-chip-icon">
             ${h.icon ? `<img src="${h.icon}" alt="${h.name}" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='🐼'">` : '🐼'}
           </div>
           ${h.name}
         </div>`).join('')}
       </div>`
    : '';

  const likesHtml = (m.likes || []).length
    ? `<div class="modal-section-label">Likes</div>
       <div class="tags-list">${m.likes.map(l => `<span class="pill pill-like">+ ${l}</span>`).join('')}</div>`
    : '';

  const dislikesHtml = (m.dislikes || []).length
    ? `<div class="modal-section-label">Dislikes</div>
       <div class="tags-list">${m.dislikes.map(d => `<span class="pill pill-dislike">− ${d}</span>`).join('')}</div>`
    : '';

  const dobFormatted = m.dob
    ? new Date(m.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Classified';

  body.innerHTML = `
    <div class="modal-img-col">
      <div class="modal-img-frame">${imgHtml}</div>
    </div>
    <div class="modal-info-col">
      <div>
        <div class="modal-name">${m.name}</div>
        <div class="modal-title">${m.title}</div>
        <div class="modal-tags">
          <span class="modal-tag modal-tag-role">${m.role}</span>
          ${m.personality ? `<span class="modal-tag modal-tag-mbti">${m.personality} — ${m.personalityName || ''}</span>` : ''}
          ${m.jerseyNumber ? `<span class="modal-tag modal-tag-role">#${m.jerseyNumber}</span>` : ''}
        </div>
      </div>
      <div class="modal-divider"></div>
      ${statsHtml}
      <div class="modal-divider"></div>
      <div class="modal-meta-grid">
        <div class="meta-item"><span class="meta-key">Date of Birth</span><span class="meta-val">${dobFormatted}</span></div>
        <div class="meta-item"><span class="meta-key">Player ID</span><span class="meta-val">${m.playerId || 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-key">IGN</span><span class="meta-val">${m.ign || m.name}</span></div>
        <div class="meta-item"><span class="meta-key">Rating</span><span class="meta-val">${m.rating}/10</span></div>
      </div>
      <div class="modal-divider"></div>
      ${heroesHtml}
      ${likesHtml}
      ${dislikesHtml}
      <div class="modal-divider"></div>
      ${m.motto ? `<div class="modal-motto">"${m.motto}"</div>` : ''}
      ${m.testimonial ? `<div class="modal-testimonial">"${m.testimonial}"</div>` : ''}
      ${galleryHtml}
    </div>`;

  overlay.classList.remove('hidden');
  document.body.classList.add('member-modal-open');
  syncPageScrollLock();

  requestAnimationFrame(() => {
    body.querySelectorAll('.modal-stat-fill').forEach(bar => {
      bar.style.width = bar.dataset.val + '%';
    });
  });

  // Gallery interaction
  const slider = document.getElementById('modal-gallery-slider');
  if (slider) {
    slider.querySelectorAll('.gallery-slide').forEach(slide => {
      slide.addEventListener('click', (e) => {
        e.stopPropagation();
        slider.querySelectorAll('.gallery-slide').forEach(s => s.classList.remove('active'));
        slide.classList.add('active');
        const fullSrc = slide.dataset.full;
        if (fullSrc) {
          const lightbox = document.createElement('div');
          lightbox.className = 'lightbox';
          lightbox.innerHTML = `<img src="${fullSrc}" alt="Full size" decoding="async"><div class="lightbox-close">✕</div>`;
          document.body.appendChild(lightbox);
          document.body.classList.add('lightbox-open');
          syncPageScrollLock();
          lightbox.addEventListener('click', () => {
            lightbox.remove();
            document.body.classList.remove('lightbox-open');
            syncPageScrollLock();
          });
        }
      });
    });
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.classList.remove('member-modal-open');
  document.querySelectorAll('.lightbox').forEach(lightbox => lightbox.remove());
  document.body.classList.remove('lightbox-open');
  syncPageScrollLock();
  // Remove the query parameter from URL without reloading
  const newUrl = window.location.pathname;
  window.history.pushState({}, '', newUrl);
}

/* ─── ROSTER MATRIX ─── */
function renderMatrixTable(allPlayers) {
  const tbody = document.getElementById('roster-tbody');
  const tabBtns = document.querySelectorAll('.matrix-tab');
  if (!tbody) return;

  const starters = allPlayers.filter(p => (p.subtype || 'starter') === 'starter');
  const substitutes = allPlayers.filter(p => p.subtype === 'substitute');

  function buildRows(list) {
    tbody.innerHTML = '';
    list.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.className = 'reveal';
      tr.style.transitionDelay = i * 0.05 + 's';

      const iconSrc = p.images?.icon || '';
      const initials = p.name.charAt(0).toUpperCase();
      const avatarHtml = iconSrc
        ? `<div class="table-avatar">${responsiveImgHtml(iconSrc, p.name, {
            sizes: '56px',
            initialWidth: 480,
            onerror: `this.parentElement.innerHTML='<div class=table-avatar-fallback>${initials}</div>'`
          })}</div>`
        : `<div class="table-avatar"><div class="table-avatar-fallback">${initials}</div></div>`;

      const favHero = (p.favHeroes || [])[0];
      const favHeroHtml = favHero
        ? `<div class="table-hero-chip">
             <div class="table-hero-icon">${favHero.icon ? `<img src="${favHero.icon}" alt="${favHero.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">` : '🐼'}</div>
             <span>${favHero.name}</span>
           </div>`
        : '—';

      tr.innerHTML = `
        <td>${avatarHtml}</td>
        <td>
          <div class="table-name">${p.name}</div>
          <div class="table-player-title">${p.title}</div>
        </td>
        <td><span class="table-role">${p.role}</span></td>
        <td class="table-jersey">${p.jerseyNumber || '—'}</td>
        <td>${favHeroHtml}</td>
        <td class="table-rating">${p.rating}</td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('#roster-tbody .reveal').forEach(el => {
      if (!el.classList.contains('visible')) {
        setTimeout(() => el.classList.add('visible'), 50);
      }
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildRows(btn.dataset.tab === 'substitute' ? substitutes : starters);
    });
  });

  buildRows(starters);
}

/* ─── ROADMAP ─── */
function renderRoadmap(events) {
  const wrap = document.getElementById('timeline');
  if (!wrap) return;
  wrap.innerHTML = '';
  events.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'timeline-item reveal';
    item.style.transitionDelay = i * 0.1 + 's';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-year">${ev.year}</div>
        <div class="timeline-title">${ev.title}</div>
        <div class="timeline-arrow">▾</div>
        <div class="timeline-desc">${ev.description}</div>
      </div>`;
    item.addEventListener('click', () => item.classList.toggle('open'));
    wrap.appendChild(item);
  });
}

/* ─── TESTIMONIALS ─── */
/* ─── TESTIMONIALS - DYNAMIC CHAT FEED (SMOOTH 3D ANIMATIONS, ALTERNATING ALIGNMENT) ─── */
function renderTestimonials(members) {
  const feed = document.getElementById('chat-feed');
  if (!feed) return;

  if (window.chatInterval) clearInterval(window.chatInterval);
  feed.innerHTML = '';

  const testiMembers = members.filter(m => m.testimonial);
  if (testiMembers.length === 0) return;

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let currentBubbles = [];
  let lastUsedIndex = -1;
  let availableQueue = [];
  let lastAlignment = null;

  function createBubble(m, isRightAlign = false) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble-wrap' + (isRightAlign ? ' right-align' : '');
    const iconSrc = m.images?.icon || '';
    const initials = m.name.charAt(0).toUpperCase();
    const avatarHtml = iconSrc
      ? `<div class="chat-avatar">${responsiveImgHtml(iconSrc, m.name, {
          sizes: '48px',
          initialWidth: 480,
          onerror: `this.parentElement.innerHTML='<div class=chat-avatar-fallback style=background:${m.favColor}>${initials}</div>'`
        })}</div>`
      : `<div class="chat-avatar"><div class="chat-avatar-fallback" style="background:${m.favColor || '#333'}">${initials}</div></div>`;

    wrap.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble">
        <div class="chat-name">${m.name} <span style="color:var(--gray-3);font-weight:400;font-size:0.8rem">• ${m.role}</span></div>
        <div class="chat-text">${m.testimonial}</div>
      </div>`;
    return wrap;
  }

  function getNextMember() {
    if (availableQueue.length === 0) {
      let shuffled = shuffleArray([...testiMembers]);
      if (lastUsedIndex !== -1 && shuffled[0] === testiMembers[lastUsedIndex]) {
        if (shuffled.length > 1) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      availableQueue = shuffled;
    }
    const next = availableQueue.shift();
    const idx = testiMembers.findIndex(m => m === next);
    if (idx !== -1) lastUsedIndex = idx;
    return next;
  }

  function getAlignment() {
    if (lastAlignment === null) {
      lastAlignment = Math.random() > 0.5 ? 'right' : 'left';
    } else {
      lastAlignment = lastAlignment === 'right' ? 'left' : 'right';
    }
    return lastAlignment === 'right';
  }

  function addNewBubble() {
    const member = getNextMember();
    const isRight = getAlignment();
    const newBubble = createBubble(member, isRight);
    newBubble.classList.add('fade-in');
    feed.appendChild(newBubble);
    currentBubbles.push(newBubble);

    if (currentBubbles.length > 4) {
      const oldest = currentBubbles.shift();
      oldest.classList.add('fade-out');
      // Wait for animation to finish before removing
      oldest.addEventListener('transitionend', () => {
        if (oldest.parentNode) oldest.remove();
      }, { once: true });
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(() => {
        if (oldest.parentNode) oldest.remove();
      }, 500);
    }

    setTimeout(() => {
      newBubble.classList.remove('fade-in');
    }, 500);
  }

  function initialFill() {
    feed.innerHTML = '';
    currentBubbles = [];
    lastAlignment = null;
    for (let i = 0; i < 2; i++) addNewBubble();
  }

  initialFill();

  window.chatInterval = setInterval(() => {
    addNewBubble();
  }, Math.random() * 3000 + 6000);
}

/* ─── ABOUT COUNTERS ─── */
function renderCounters(squadInfo) {
  const wrap = document.getElementById('squad-counters');
  if (!wrap || !squadInfo.stats) return;
  const items = Object.entries(squadInfo.stats);
  items.forEach(([label, val]) => {
    const card = document.createElement('div');
    card.className = 'counter-card reveal';
    // Check if val is a numeric string or number, else treat as special display
    const isNumeric = !isNaN(parseFloat(val)) && isFinite(val);
    if (isNumeric) {
      card.innerHTML = `<span class="counter-num" data-target="${val}">0</span><span class="counter-label">${label}</span>`;
    } else {
      // Display the value directly (e.g., "∞", "all of them (100% of games)", etc.)
      card.innerHTML = `<span class="counter-num"">${val}</span><span class="counter-label">${label}</span>`;
    }
    wrap.appendChild(card);
  });
}

function animateCounter(el) {
  const target = el.dataset.target;
  if (!target) return;
  const numericTarget = parseFloat(target);
  if (isNaN(numericTarget)) return;
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * numericTarget).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─── SOCIALS ─── */
function renderSocials(socials) {
  const wrap = document.getElementById('contact-socials');
  if (!wrap || !socials) return;
  const icons = { facebook: 'f', twitter: 'X', youtube: '▶', discord: 'D', tiktok: 'T', instagram: 'ig' };
  Object.entries(socials).forEach(([platform, url]) => {
    if (url === '#' || !url) return;
    const a = document.createElement('a');
    a.className = 'social-link'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = `<span>${icons[platform] || '→'}</span>${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
    wrap.appendChild(a);
  });
}

/* ─── CONTACT FORM ─── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (success) { success.classList.remove('hidden'); }
    form.reset();
    setTimeout(() => success && success.classList.add('hidden'), 4000);
  });
}

/* ─── INTERSECTION OBSERVER (scroll reveal) ─── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        const nums = entry.target.querySelectorAll('.counter-num');
        nums.forEach(n => animateCounter(n));
        entry.target.querySelectorAll('.hero-stat-fill, .modal-stat-fill').forEach(bar => {
          bar.style.width = bar.dataset.val + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  function watchNew() {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      if (!el.classList.contains('visible')) observer.observe(el);
    });
    document.querySelectorAll('.chat-bubble-wrap').forEach((el, i) => {
      const chatObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { el.classList.add('visible'); chatObs.unobserve(el); }
        });
      }, { threshold: 0.2 });
      chatObs.observe(el);
    });
  }
  watchNew();
  return watchNew;
}

/* ─── MODAL EVENTS ─── */
(function () {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
})();

/* ─── HELPER: hex to rgba ─── */
function hexToRgba(hex, alpha = 1) {
  const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
  return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},${alpha})`;
}

/* ─── FIND MEMBER BY SLUG OR NICKNAME ─── */
function findMemberBySlug(members, slug) {
  return members.find(m => 
    m.slug === slug || 
    m.nickname?.toLowerCase() === slug.toLowerCase() ||
    m.name.toLowerCase().includes(slug.toLowerCase())
  );
}

/* ─── MAIN INIT ─── */
/* Jersey showcase */
function initJerseyShowcase() {
  const stage = document.getElementById('jersey-stage');
  const img = document.getElementById('jersey-main-img');
  const controls = document.getElementById('jersey-controls');
  const title = document.getElementById('jersey-view-title');
  const desc = document.getElementById('jersey-view-desc');
  const titleMobile = document.getElementById('jersey-view-title-mobile');
  const descMobile = document.getElementById('jersey-view-desc-mobile');
  if (!stage || !img || !controls || !title || !desc) return;

  const views = {
    full: {
      src: 'images/Esports_Jersey/FullI.png',
      alt: 'Bakatuski full jersey kit',
      title: 'Full <span>Kit</span>',
      desc: 'Complete jersey presentation for the main hero display and launch visuals.',
      rotate: 0
    },
    front: {
      src: 'images/Esports_Jersey/front.png',
      alt: 'Bakatuski jersey front view',
      title: 'Front <span>View</span>',
      desc: 'The squad mark, center panel, and front color flow built for first-glance recognition.',
      rotate: -6
    },
    back: {
      src: 'images/Esports_Jersey/back.png',
      alt: 'Bakatuski jersey back view',
      title: 'Back <span>View</span>',
      desc: 'Back profile with the nameplate area and clean contrast for player identity.',
      rotate: 6
    },
    left: {
      src: 'images/Esports_Jersey/left.png',
      alt: 'Bakatuski jersey left side view',
      title: 'Left <span>Side</span>',
      desc: 'Side contour view for sleeve shape, side graphics, and profile balance.',
      rotate: -18
    },
    right: {
      src: 'images/Esports_Jersey/right.png',
      alt: 'Bakatuski jersey right side view',
      title: 'Right <span>Side</span>',
      desc: 'Alternate side profile with matching sleeve weight and bamboo-line movement.',
      rotate: 18
    },
    overview: {
      src: 'images/Esports_Jersey/JerseyOverview.png',
      alt: 'Bakatuski jersey overview',
      title: 'Kit <span>Overview</span>',
      desc: 'Presentation board view for comparing the complete jersey design language.',
      rotate: 0
    }
  };

  let activeView = 'full';
  let isAnimating = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches;

  function setActiveButton(view) {
    controls.querySelectorAll('.jersey-view-btn').forEach(btn => {
      const active = btn.dataset.view === view;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function switchView(view) {
    const current = views[activeView];
    const next = views[view];
    if (!next || view === activeView || isAnimating) return;
    isAnimating = true;
    activeView = view;
    setActiveButton(view);

    const showNext = () => {
      img.src = next.src;
      img.alt = next.alt;
      title.innerHTML = next.title;
      desc.textContent = next.desc;
      if (titleMobile) titleMobile.innerHTML = next.title;
      if (descMobile) descMobile.textContent = next.desc;

      if (reducedMotion) {
        isAnimating = false;
        return;
      }

      img.animate([
        { opacity: 0, transform: `translateX(36px) rotateY(${next.rotate * -1}deg) scale(0.94)`, filter: 'blur(8px) drop-shadow(0 30px 36px rgba(0,0,0,0.5))' },
        { opacity: 1, transform: `translateX(0) rotateY(${next.rotate}deg) scale(1)`, filter: 'blur(0) drop-shadow(0 36px 42px rgba(0,0,0,0.6))' }
      ], {
        duration: 560,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      }).finished.finally(() => {
        isAnimating = false;
      });
    };

    if (reducedMotion) {
      showNext();
      return;
    }

    img.animate([
      { opacity: 1, transform: `translateX(0) rotateY(${current.rotate}deg) scale(1)`, filter: 'blur(0) drop-shadow(0 36px 42px rgba(0,0,0,0.6))' },
      { opacity: 0, transform: 'translateX(-36px) rotateY(-18deg) scale(0.94)', filter: 'blur(8px) drop-shadow(0 24px 30px rgba(0,0,0,0.45))' }
    ], {
      duration: 260,
      easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
      fill: 'forwards'
    }).finished.then(showNext);
  }

  controls.addEventListener('click', e => {
    const btn = e.target.closest('.jersey-view-btn');
    if (!btn) return;
    switchView(btn.dataset.view);
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('mousemove', e => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      img.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 8}deg) translateZ(18px)`;
    });
    stage.addEventListener('mouseleave', () => {
      img.style.transform = '';
    });
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.jersey-reveal').forEach(el => revealObserver.observe(el));
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('assets/data/data.json', { cache: 'force-cache' });
    const data = await res.json();

    const rosterPlayers = data.members.filter(m => m.type === 'player');
    const allMembers = data.members;

    initParticles();
    initHeroSwiper(rosterPlayers);
    renderSquadCards(allMembers);
    renderMatrixTable(rosterPlayers);
    renderRoadmap(data.roadmap);
    renderTestimonials(allMembers);
    renderCounters(data.squadInfo);
    renderSocials(data.squadInfo.socials);
    initContactForm();
    initJerseyShowcase();

    const aboutEl = document.getElementById('about-text');
    const formEl = document.getElementById('formation-text');
    const quoteEl = document.getElementById('footer-quote');
    if (aboutEl) aboutEl.textContent = data.squadInfo.about;
    if (formEl) formEl.textContent = data.squadInfo.formation;
    if (quoteEl) quoteEl.textContent = `"${data.squadInfo.quote}"`;

    // --- MEMBER MODAL FROM URL PARAMETER + UPDATE META IMAGE ---
    let memberSlug = null;
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('member=')) {
      memberSlug = hash.substring(7);
    } else if (hash.length > 0 && !hash.includes('=')) {
      memberSlug = hash;
    }
    if (!memberSlug) {
      const params = new URLSearchParams(window.location.search);
      memberSlug = params.get('member');
    }
    
    if (memberSlug) {
      const foundMember = findMemberBySlug(allMembers, memberSlug);
      if (foundMember) {
        // Update Open Graph image for social sharing
        const ogImageTag = document.getElementById('og-image');
        if (ogImageTag && foundMember.images?.roster) {
          ogImageTag.setAttribute('content', foundMember.images.roster);
          // Also update page title and description optionally
          document.title = `${foundMember.name} - Bakatuski Squad`;
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute('content', `${foundMember.name} — ${foundMember.title} | Bakatuski`);
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.setAttribute('content', foundMember.bio ? foundMember.bio.substring(0, 200) : `Meet ${foundMember.name}, our ${foundMember.role}.`);
        }
        // Open modal after a short delay
        setTimeout(() => {
          openModal(foundMember);
        }, 500);
      } else {
        console.warn(`Member with slug/name "${memberSlug}" not found`);
      }
    }

    const refresh = initScrollReveal();
    setTimeout(refresh, 200);
  } catch (err) {
    console.error('Failed to load squad data:', err);
  }
});
