'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const FALLBACK_IMAGE = 'images/ComingSoon.png';
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const list = document.getElementById('vehicle-list');
  const stage = document.getElementById('vehicle-stage');
  const grid = document.getElementById('vehicle-grid');
  const search = document.getElementById('vehicle-search');
  const typeFilter = document.getElementById('vehicle-type-filter');
  const regionFilter = document.getElementById('vehicle-region-filter');
  const sortSelect = document.getElementById('vehicle-sort');
  const telemetry = document.getElementById('hero-telemetry');
  const modal = document.getElementById('vehicle-modal');
  const modalPanel = document.querySelector('.vehicle-modal-panel');
  const modalClose = document.getElementById('vehicle-modal-close');
  const modalCarousel = document.getElementById('modal-carousel');
  const modalCarouselTrack = document.getElementById('modal-carousel-track');
  const modalPrev = document.getElementById('modal-vehicle-prev');
  const modalNext = document.getElementById('modal-vehicle-next');
  const modalCount = document.getElementById('modal-vehicle-count');
  const vehicleLightbox = document.getElementById('vehicle-lightbox');
  const vehicleLightboxClose = document.getElementById('vehicle-lightbox-close');
  const vehicleLightboxImage = document.getElementById('vehicle-lightbox-image');

  let vehicles = [];
  let filtered = [];
  let activeSlug = '';
  let activePanel = 'overview';
  let modalDrag = null;
  let suppressModalClick = false;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, match => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[match]));
  }

  function currentVehicle() {
    return vehicles.find(vehicle => vehicle.slug === activeSlug) || filtered[0] || vehicles[0];
  }

  function isSmallPopupViewport() {
    return window.matchMedia('(max-width: 980px)').matches;
  }

  function vehicleUrl(slug = activeSlug) {
    const url = new URL(window.location.href);
    url.searchParams.set('ride', slug);
    return url.toString();
  }

  function setUrlVehicle(slug, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set('ride', slug);
    const method = replace ? 'replaceState' : 'pushState';
    history[method]({ ride: slug }, '', url);
  }

  function imageWithFallback(img, primary) {
    if (!img) return;
    img.classList.remove('using-fallback');
    img.src = primary || FALLBACK_IMAGE;
    img.onerror = () => {
      img.onerror = null;
      img.src = FALLBACK_IMAGE;
      img.classList.add('using-fallback');
    };
  }

  function initCursor() {
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let dx = 0;
    let dy = 0;
    let started = false;

    document.addEventListener('mousemove', event => {
      mx = event.clientX;
      my = event.clientY;
      if (!started) {
        rx = mx;
        ry = my;
        dx = mx;
        dy = my;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        started = true;
      }
    }, { passive: true });

    document.addEventListener('mouseover', event => {
      if (event.target.closest('a, button, input, select, .vehicle-card, .vehicle-row, .detail-image-wrap, .modal-slide, .modal-nav')) {
        ring.classList.add('ring-hover');
      }
    });

    document.addEventListener('mouseout', event => {
      if (event.target.closest('a, button, input, select, .vehicle-card, .vehicle-row, .detail-image-wrap, .modal-slide, .modal-nav')) {
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
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      dot.style.left = `${dx}px`;
      dot.style.top = `${dy}px`;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(loop);
    }

    loop();
  }

  function initNavbar() {
    if (!navbar) return;
    const syncScrolled = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', syncScrolled, { passive: true });
    syncScrolled();

    if (!hamburger || !navLinks) return;
    const setMenuOpen = open => {
      hamburger.classList.toggle('open', open);
      navLinks.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('nav-open', open);
    };

    hamburger.addEventListener('click', () => {
      setMenuOpen(!navLinks.classList.contains('open'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navLinks.classList.contains('open')) setMenuOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && navLinks.classList.contains('open')) setMenuOpen(false);
    });
  }

  function buildTelemetry() {
    if (!telemetry || !vehicles.length) return;
    const fastest = vehicles.reduce((best, vehicle) => vehicle.stats.speed > best.stats.speed ? vehicle : best, vehicles[0]);
    const armored = vehicles.reduce((best, vehicle) => vehicle.stats.armor > best.stats.armor ? vehicle : best, vehicles[0]);
    const arcane = vehicles.reduce((best, vehicle) => vehicle.stats.magic > best.stats.magic ? vehicle : best, vehicles[0]);

    telemetry.innerHTML = [
      { label: 'Registered', value: vehicles.length },
      { label: 'Fastest', value: `${fastest.hero} ${fastest.stats.speed}` },
      { label: 'Armored', value: armored.hero },
      { label: 'Arcane Peak', value: arcane.hero }
    ].map(item => `
      <div class="telemetry-cell">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join('');
  }

  function fillSelect(select, values, allLabel) {
    if (!select) return;
    select.innerHTML = [
      `<option value="all">${escapeHtml(allLabel)}</option>`,
      ...values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join('');
  }

  function buildFilters() {
    fillSelect(typeFilter, [...new Set(vehicles.map(vehicle => vehicle.conceptType))].sort(), 'All vehicle types');
    fillSelect(regionFilter, [...new Set(vehicles.map(vehicle => vehicle.region))].sort(), 'All regions');
  }

  function matchesSearch(vehicle, term) {
    if (!term) return true;
    const haystack = [
      vehicle.hero,
      vehicle.title,
      vehicle.seriesTitle,
      vehicle.vehicleName,
      vehicle.vehicleClass,
      vehicle.conceptType,
      vehicle.region,
      vehicle.summary,
      vehicle.design,
      vehicle.lore,
      vehicle.palette,
      vehicle.environment,
      ...(vehicle.tags || [])
    ].join(' ').toLowerCase();
    return haystack.includes(term);
  }

  function applyFilters() {
    const term = (search?.value || '').trim().toLowerCase();
    const typeValue = typeFilter?.value || 'all';
    const regionValue = regionFilter?.value || 'all';

    filtered = vehicles.filter(vehicle => {
      const typeMatch = typeValue === 'all' || vehicle.conceptType === typeValue;
      const regionMatch = regionValue === 'all' || vehicle.region === regionValue;
      return typeMatch && regionMatch && matchesSearch(vehicle, term);
    });

    const sortValue = sortSelect?.value || 'id';
    filtered.sort((a, b) => {
      if (sortValue === 'name') return a.hero.localeCompare(b.hero);
      if (sortValue === 'id') return a.id - b.id;
      return (b.stats?.[sortValue] || 0) - (a.stats?.[sortValue] || 0);
    });

    if (!filtered.some(vehicle => vehicle.slug === activeSlug)) {
      activeSlug = filtered[0]?.slug || vehicles[0]?.slug || '';
      if (activeSlug) setUrlVehicle(activeSlug, true);
    }

    renderList();
    renderGrid();
    renderStage();
  }

  function statAverage(vehicle) {
    const values = Object.values(vehicle.stats || {});
    return values.length ? Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length) : 0;
  }

  function renderList() {
    if (!list) return;
    if (!filtered.length) {
      list.innerHTML = '<div class="vehicle-empty">No registered vehicle matches that scan.</div>';
      return;
    }

    list.innerHTML = filtered.map(vehicle => `
      <button class="vehicle-row ${vehicle.slug === activeSlug ? 'active' : ''}" type="button" data-slug="${escapeHtml(vehicle.slug)}">
        <span class="row-index">${String(vehicle.id).padStart(2, '0')}</span>
        <span>
          <strong>${escapeHtml(vehicle.hero)}</strong>
          <small>${escapeHtml(vehicle.seriesTitle)} / ${escapeHtml(vehicle.vehicleClass)}</small>
        </span>
        <span class="row-score">${statAverage(vehicle)}</span>
      </button>
    `).join('');

    list.querySelectorAll('.vehicle-row').forEach(row => {
      row.setAttribute('aria-label', `Show ${row.dataset.slug} vehicle details`);
    });
  }

  function renderStatBars(vehicle) {
    return Object.entries(vehicle.stats || {}).map(([label, value]) => `
      <div class="stat-line">
        <div class="stat-label">
          <span>${escapeHtml(label)}</span>
          <strong>${value}</strong>
        </div>
        <div class="stat-track"><span style="width: ${Number(value)}%"></span></div>
      </div>
    `).join('');
  }

  function renderFeaturePills(vehicle) {
    return (vehicle.features || []).map(feature => `<span>${escapeHtml(feature)}</span>`).join('');
  }

  function heroBackdropUrl(vehicle) {
    const path = `images/heroes/${vehicle.slug}.png`;
    return `url("${new URL(path, window.location.href).href}")`;
  }

  function modalVehicleSet() {
    if (filtered.some(vehicle => vehicle.slug === activeSlug)) return filtered;
    return vehicles;
  }

  function modalVehicleIndex(slug = activeSlug) {
    const set = modalVehicleSet();
    const index = set.findIndex(vehicle => vehicle.slug === slug);
    return index >= 0 ? index : 0;
  }

  function applyVehicleTheme(vehicle, target = modal) {
    if (!vehicle || !target) return;
    const accent = vehicle.accent || '#1bda80';
    const secondary = vehicle.secondary || '#ff5c00';
    const ownerImage = heroBackdropUrl(vehicle);
    target.style.setProperty('--vehicle-a', accent);
    target.style.setProperty('--vehicle-b', secondary);
    target.style.setProperty('--vehicle-owner-image', ownerImage);
    target.style.setProperty('--vehicle-theme-dark', `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, #06080d), color-mix(in srgb, ${secondary} 18%, #11131a))`);
    target.style.setProperty('--vehicle-theme-light', `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, #fffaf0), color-mix(in srgb, ${secondary} 14%, #f8fff7))`);
    if (target === modal && modalPanel) {
      modalPanel.style.setProperty('--vehicle-a', accent);
      modalPanel.style.setProperty('--vehicle-b', secondary);
      modalPanel.style.setProperty('--vehicle-owner-image', ownerImage);
      modalPanel.style.setProperty('--vehicle-theme-dark', `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, #06080d), color-mix(in srgb, ${secondary} 18%, #11131a))`);
      modalPanel.style.setProperty('--vehicle-theme-light', `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, #fffaf0), color-mix(in srgb, ${secondary} 14%, #f8fff7))`);
      modalCarousel?.style.setProperty('--vehicle-owner-image', ownerImage);
      modalCarousel?.style.setProperty('--vehicle-a', accent);
      modalCarousel?.style.setProperty('--vehicle-b', secondary);
    }
  }

  function renderModalSystemBars(vehicle) {
    return `
      <div class="modal-system-bars" aria-label="${escapeHtml(vehicle.hero)} vehicle system readouts">
        ${Object.entries(vehicle.stats || {}).map(([key, value]) => `
          <div class="modal-system-bar">
            <div>
              <span>${escapeHtml(key)}</span>
              <strong>${Number(value)}</strong>
            </div>
            <div class="system-progress" style="--system-value: ${Number(value)}%">
              <span></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderStage() {
    if (!stage) return;
    const vehicle = currentVehicle();
    if (!vehicle) {
      stage.innerHTML = '<div class="vehicle-empty">Vehicle database is empty.</div>';
      return;
    }

    applyVehicleTheme(vehicle, stage);
    stage.innerHTML = `
      <article class="vehicle-detail">
        <button class="detail-image-wrap" type="button" data-open-modal aria-label="Open ${escapeHtml(vehicle.vehicleName)} details">
          <img class="detail-image" alt="${escapeHtml(vehicle.vehicleName)} concept" loading="eager" decoding="async">
          <span class="detail-badge">${escapeHtml(vehicle.conceptType)}</span>
          <span class="detail-open">Open dossier</span>
        </button>
        <div class="detail-copy">
          <p class="vehicle-kicker">${escapeHtml(vehicle.seriesTitle)} / ${String(vehicle.id).padStart(2, '0')}</p>
          <h2>${escapeHtml(vehicle.vehicleName)}</h2>
          <h3>${escapeHtml(vehicle.hero)} - ${escapeHtml(vehicle.formalTitle)}</h3>
          <p class="detail-summary">${escapeHtml(vehicle.summary)}</p>
          <div class="quote-strip">
            <span>${escapeHtml(vehicle.catchphrase)}</span>
          </div>
          <div class="feature-pills">${renderFeaturePills(vehicle)}</div>
          <div class="system-grid">
            <div>
              <span>Palette</span>
              <strong>${escapeHtml(vehicle.palette)}</strong>
            </div>
            <div>
              <span>Environment</span>
              <strong>${escapeHtml(vehicle.environment)}</strong>
            </div>
          </div>
        </div>
        <aside class="detail-panel">
          <h4>Telemetry</h4>
          ${renderStatBars(vehicle)}
          <button class="copy-link" type="button" data-copy-link>Copy ride link</button>
        </aside>
      </article>
    `;

    imageWithFallback(stage.querySelector('.detail-image'), vehicle.image);
    stage.querySelector('[data-open-modal]')?.addEventListener('click', () => openModal(vehicle.slug));
    stage.querySelector('[data-copy-link]')?.addEventListener('click', event => copyRideLink(event.currentTarget));
  }

  function renderGrid() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = '<div class="vehicle-empty">No vehicle cards to display.</div>';
      return;
    }

    grid.innerHTML = filtered.map(vehicle => `
      <article class="vehicle-card ${vehicle.slug === activeSlug ? 'active' : ''}" data-slug="${escapeHtml(vehicle.slug)}" style="--vehicle-a: ${escapeHtml(vehicle.accent)}; --vehicle-b: ${escapeHtml(vehicle.secondary)}">
        <div class="card-image-wrap">
          <img alt="${escapeHtml(vehicle.vehicleName)}" loading="lazy" decoding="async">
          <span>${escapeHtml(vehicle.region)}</span>
        </div>
        <div class="vehicle-card-copy">
          <p>${escapeHtml(vehicle.seriesTitle)}</p>
          <h3>${escapeHtml(vehicle.hero)}</h3>
          <small>${escapeHtml(vehicle.vehicleName)} / ${escapeHtml(vehicle.vehicleClass)}</small>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.vehicle-card').forEach(card => {
      const vehicle = filtered.find(item => item.slug === card.dataset.slug);
      imageWithFallback(card.querySelector('img'), vehicle?.image);
      card.addEventListener('click', () => selectVehicle(card.dataset.slug, { open: true }));
    });
  }

  function modalPanelContent(vehicle, panel) {
    const specs = `
      <div class="modal-spec-grid">
        ${Object.entries(vehicle.stats || {}).map(([key, value]) => `
          <div>
            <span>${escapeHtml(key)}</span>
            <strong>${value}</strong>
          </div>
        `).join('')}
      </div>
      <div class="modal-feature-list">${renderFeaturePills(vehicle)}</div>
    `;

    const content = {
      overview: `
        <p>${escapeHtml(vehicle.summary)}</p>
        <blockquote>${escapeHtml(vehicle.catchphrase)}</blockquote>
        <p>${escapeHtml(vehicle.quote)}</p>
      `,
      design: `
        <p>${escapeHtml(vehicle.design)}</p>
        <dl>
          <dt>Palette</dt><dd>${escapeHtml(vehicle.palette)}</dd>
          <dt>Visual Mood</dt><dd>${escapeHtml(vehicle.mood)}</dd>
        </dl>
      `,
      lore: `
        <p>${escapeHtml(vehicle.lore)}</p>
        <p>${escapeHtml(vehicle.personalityFit)}</p>
        <dl>
          <dt>Region</dt><dd>${escapeHtml(vehicle.region)}</dd>
          <dt>Environment</dt><dd>${escapeHtml(vehicle.environment)}</dd>
        </dl>
      `,
      systems: `
        <p>${escapeHtml(vehicle.combatUse)}</p>
        ${renderModalSystemBars(vehicle)}
        <dl>
          <dt>Power Core</dt><dd>${escapeHtml(vehicle.powerCore)}</dd>
          <dt>Ride Feel</dt><dd>${escapeHtml(vehicle.rideFeel)}</dd>
        </dl>
        ${specs}
      `,
      prompt: `
        <div class="prompt-card">
          <p><strong>${escapeHtml(vehicle.seriesTitle)} - ${escapeHtml(vehicle.formalTitle)}</strong></p>
          <p>${escapeHtml(vehicle.conceptType)}. ${escapeHtml(vehicle.design)} Environment: ${escapeHtml(vehicle.environment)} Mood: ${escapeHtml(vehicle.mood)}</p>
        </div>
        <button class="copy-link" type="button" data-copy-link>Copy current ride URL</button>
      `
    };

    return `<div class="modal-panel-copy is-entering">${content[panel] || content.overview}</div>`;
  }

  function positionModalCarousel() {
    if (!modalCarousel || !modalCarouselTrack) return;
    const activeSlide = modalCarouselTrack.querySelector('.modal-slide.active');
    if (!activeSlide) return;
    const viewportWidth = modalCarousel.clientWidth;
    const slideWidth = activeSlide.getBoundingClientRect().width;
    const target = activeSlide.offsetLeft - ((viewportWidth - slideWidth) / 2);
    modalCarouselTrack.style.transform = `translate3d(calc(${-target}px + var(--drag-x, 0px)), 0, 0)`;
  }

  function renderModalCarousel() {
    if (!modalCarouselTrack) return;
    const set = modalVehicleSet();
    const activeIndex = modalVehicleIndex();
    const panels = ['overview', 'design', 'lore', 'systems', 'prompt'];

    modalCarouselTrack.innerHTML = set.map((vehicle, index) => {
      const distance = Math.abs(index - activeIndex);
      const side = index < activeIndex ? 'before' : (index > activeIndex ? 'after' : 'center');
      const ownerImage = heroBackdropUrl(vehicle);
      return `
        <article class="modal-slide ${vehicle.slug === activeSlug ? 'active' : ''} distance-${Math.min(distance, 4)} ${side}" data-slug="${escapeHtml(vehicle.slug)}" style="--vehicle-a: ${escapeHtml(vehicle.accent)}; --vehicle-b: ${escapeHtml(vehicle.secondary)}; --vehicle-owner-image: ${escapeHtml(ownerImage)}">
          <div class="modal-slide-card">
            <div class="modal-image-shell">
              <button class="modal-slide-frame" type="button" data-full-image="${escapeHtml(vehicle.slug)}" aria-label="Open full image for ${escapeHtml(vehicle.vehicleName)}">
                <img alt="${escapeHtml(vehicle.vehicleName)}" loading="${index === activeIndex ? 'eager' : 'lazy'}" decoding="async">
              </button>
            </div>
            <div class="modal-content">
              <p class="vehicle-kicker">${escapeHtml(vehicle.seriesTitle)} / ${escapeHtml(vehicle.chapterTitle)}</p>
              <h2${vehicle.slug === activeSlug ? ' id="modal-vehicle-name"' : ''}>${escapeHtml(vehicle.vehicleName)}</h2>
              <p class="modal-subtitle">${escapeHtml(vehicle.hero)} - ${escapeHtml(vehicle.formalTitle)}</p>
              <p class="modal-theme-code">Theme codes: ${escapeHtml(vehicle.accent || '#1bda80')} / ${escapeHtml(vehicle.secondary || '#ff5c00')}</p>
              <div class="modal-actions">
                ${panels.map(panel => `<button class="modal-action ${panel === activePanel ? 'active' : ''}" type="button" data-panel="${panel}">${panel.charAt(0).toUpperCase() + panel.slice(1)}</button>`).join('')}
              </div>
              <div class="modal-slider">${modalPanelContent(vehicle, activePanel)}</div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    modalCarouselTrack.querySelectorAll('.modal-slide').forEach(slide => {
      const vehicle = set.find(item => item.slug === slide.dataset.slug);
      imageWithFallback(slide.querySelector('img'), vehicle?.image);
      slide.addEventListener('click', event => {
        if (event.target.closest('[data-full-image]') && isSmallPopupViewport()) return;
        if (suppressModalClick) return;
        if (slide.dataset.slug !== activeSlug) updateModalVehicle(slide.dataset.slug, { replaceUrl: true });
      });
    });
    modalCarouselTrack.querySelectorAll('[data-copy-link]').forEach(button => {
      button.addEventListener('click', event => copyRideLink(event.currentTarget));
    });

    if (modalCount) modalCount.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(set.length).padStart(2, '0')}`;
    requestAnimationFrame(() => {
      positionModalCarousel();
      modalCarouselTrack.querySelectorAll('.modal-panel-copy').forEach(panel => panel.classList.remove('is-entering'));
    });
  }

  function stepModalVehicle(direction) {
    const set = modalVehicleSet();
    if (!set.length) return;
    const currentIndex = modalVehicleIndex();
    const nextIndex = (currentIndex + direction + set.length) % set.length;
    updateModalVehicle(set[nextIndex].slug, { replaceUrl: true });
  }

  function updateModalVehicle(slug, options = {}) {
    const vehicle = vehicles.find(item => item.slug === slug);
    if (!vehicle || !modal) return;
    activeSlug = vehicle.slug;
    if (options.resetPanel) activePanel = 'overview';
    setUrlVehicle(activeSlug, options.replaceUrl === true);
    syncViews();

    applyVehicleTheme(vehicle, modal);
    renderModalCarousel();
  }

  function openModal(slug = activeSlug, options = {}) {
    const vehicle = vehicles.find(item => item.slug === slug);
    if (!vehicle || !modal) return;
    activePanel = 'overview';
    updateModalVehicle(vehicle.slug, { replaceUrl: options.replaceUrl === true });
    modal.classList.remove('hidden');
    document.body.classList.add('vehicle-modal-open', 'page-scroll-locked');
    document.documentElement.classList.add('page-scroll-locked');
    requestAnimationFrame(positionModalCarousel);
  }

  function closeModal() {
    modal?.classList.add('hidden');
    document.body.classList.remove('vehicle-modal-open', 'page-scroll-locked');
    document.documentElement.classList.remove('page-scroll-locked');
  }

  function openVehicleLightbox(slug = activeSlug) {
    const vehicle = vehicles.find(item => item.slug === slug);
    if (!vehicle || !vehicleLightbox || !vehicleLightboxImage) return;
    applyVehicleTheme(vehicle, vehicleLightbox);
    imageWithFallback(vehicleLightboxImage, vehicle.image);
    vehicleLightboxImage.alt = `${vehicle.vehicleName} full vehicle concept`;
    vehicleLightbox.classList.remove('hidden');
    document.body.classList.add('vehicle-lightbox-open');
  }

  function closeVehicleLightbox() {
    vehicleLightbox?.classList.add('hidden');
    document.body.classList.remove('vehicle-lightbox-open');
  }

  async function copyRideLink(button) {
    try {
      await navigator.clipboard.writeText(vehicleUrl());
      const oldText = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = oldText; }, 1200);
    } catch {
      button.textContent = 'Copy failed';
      setTimeout(() => { button.textContent = 'Copy ride link'; }, 1200);
    }
  }

  function syncViews() {
    renderList();
    renderGrid();
    renderStage();
  }

  function selectVehicle(slug, options = {}) {
    if (!vehicles.some(vehicle => vehicle.slug === slug)) return;
    activeSlug = slug;
    if (options.open) openModal(slug);
    else {
      setUrlVehicle(slug);
      syncViews();
    }
  }

  async function loadVehicles() {
    try {
      const response = await fetch('assets/data/vehicles.json', { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      vehicles = data.vehicles || [];
      const requested = new URLSearchParams(window.location.search).get('ride');
      activeSlug = vehicles.some(vehicle => vehicle.slug === requested) ? requested : (vehicles[0]?.slug || '');
      filtered = [...vehicles];
      if (activeSlug) setUrlVehicle(activeSlug, true);
      buildTelemetry();
      buildFilters();
      applyFilters();
      if (requested && vehicles.some(vehicle => vehicle.slug === requested)) {
        openModal(activeSlug, { replaceUrl: true });
      }
    } catch (error) {
      console.error(error);
      if (stage) stage.innerHTML = '<div class="vehicle-empty">Failed to load the vehicle registry.</div>';
    }
  }

  [search, typeFilter, regionFilter, sortSelect].forEach(control => {
    control?.addEventListener('input', applyFilters);
    control?.addEventListener('change', applyFilters);
  });

  list?.addEventListener('click', event => {
    const row = event.target.closest('.vehicle-row');
    if (!row) return;
    event.preventDefault();
    selectVehicle(row.dataset.slug);
  });

  modalPrev?.addEventListener('click', () => stepModalVehicle(-1));
  modalNext?.addEventListener('click', () => stepModalVehicle(1));

  modalCarousel?.addEventListener('pointerdown', event => {
    if (event.target.closest('button:not([data-full-image]), a, input, select, textarea')) return;
    modalDrag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    modalCarousel.setPointerCapture(event.pointerId);
    modalCarousel.classList.add('dragging');
  });

  modalCarousel?.addEventListener('pointermove', event => {
    if (!modalDrag || modalDrag.id !== event.pointerId) return;
    const dx = event.clientX - modalDrag.startX;
    const dy = event.clientY - modalDrag.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      event.preventDefault();
      modalDrag.moved = true;
      modalCarouselTrack?.style.setProperty('--drag-x', `${dx}px`);
    }
  });

  function finishModalDrag(event) {
    if (!modalDrag || modalDrag.id !== event.pointerId) return;
    const dx = event.clientX - modalDrag.startX;
    modalCarousel?.classList.remove('dragging');
    modalCarouselTrack?.style.setProperty('--drag-x', '0px');
    if (modalDrag.moved) {
      suppressModalClick = true;
      setTimeout(() => { suppressModalClick = false; }, 0);
    }
    if (Math.abs(dx) > 52 && modalDrag.moved) stepModalVehicle(dx < 0 ? 1 : -1);
    else positionModalCarousel();
    modalDrag = null;
  }

  modalCarousel?.addEventListener('pointerup', finishModalDrag);
  modalCarousel?.addEventListener('pointercancel', finishModalDrag);

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {
    if (event.target.matches('[data-close-modal]')) closeModal();
    const fullImage = event.target.closest('[data-full-image]');
    if (fullImage) {
      if (isSmallPopupViewport() && !suppressModalClick) {
        event.stopPropagation();
        openVehicleLightbox(fullImage.dataset.fullImage);
      }
      return;
    }
    const action = event.target.closest('.modal-action');
    if (action) {
      event.stopPropagation();
      activePanel = action.dataset.panel;
      renderModalCarousel();
    }
  });
  vehicleLightboxClose?.addEventListener('click', closeVehicleLightbox);
  vehicleLightbox?.addEventListener('click', event => {
    if (event.target === vehicleLightbox) closeVehicleLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && vehicleLightbox && !vehicleLightbox.classList.contains('hidden')) {
      closeVehicleLightbox();
      return;
    }
    if (event.key === 'Escape') closeModal();
    if (modal?.classList.contains('hidden')) return;
    if (event.key === 'ArrowLeft') stepModalVehicle(-1);
    if (event.key === 'ArrowRight') stepModalVehicle(1);
  });
  window.addEventListener('resize', positionModalCarousel);
  window.addEventListener('popstate', () => {
    const requested = new URLSearchParams(window.location.search).get('ride');
    if (vehicles.some(vehicle => vehicle.slug === requested)) {
      activeSlug = requested;
      syncViews();
      if (!modal?.classList.contains('hidden')) openModal(activeSlug, { replaceUrl: true });
    }
  });

  initCursor();
  initNavbar();
  await loadVehicles();
});
