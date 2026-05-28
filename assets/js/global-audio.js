(function initGlobalAudio() {
  'use strict';

  if (window.__bakatuskiAudioInitialized) return;
  window.__bakatuskiAudioInitialized = true;

  const state = {
    audio: new Audio(),
    tracks: [],
    groups: [],
    currentIndex: 0,
    isPlaying: false,
    mode: localStorage.getItem('bakatuski-audio-mode') || 'playlist',
    panelOpen: false
  };

  state.audio.preload = 'metadata';
  state.audio.volume = Number(localStorage.getItem('bakatuski-audio-volume') || 0.7);

  const icons = {
    play: '▶',
    pause: 'Ⅱ',
    prev: '‹',
    next: '›',
    library: '♫'
  };

  function fullSrc(basePath, src) {
    if (!src) return '';
    if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
    return `${basePath || ''}${src}`;
  }

  function playerInitial(name) {
    return (name || 'B').trim().charAt(0).toUpperCase();
  }

  async function loadAudioData() {
    const [audioConfig, squadData] = await Promise.all([
      fetch('assets/data/audio.json').then(res => res.ok ? res.json() : null).catch(() => null),
      fetch('assets/data/data.json').then(res => res.ok ? res.json() : null).catch(() => null)
    ]);

    const config = audioConfig || { basePath: 'assets/audio/', playlists: [] };
    const groups = [];

    (config.playlists || []).forEach(group => {
      const tracks = (group.tracks || []).map(track => ({
        ...track,
        groupId: group.id,
        groupName: group.name,
        src: fullSrc(config.basePath, track.src),
        badge: track.badge || playerInitial(track.title)
      }));
      if (tracks.length) groups.push({ id: group.id, name: group.name, tracks });
    });

    const members = squadData?.members || [];
    const pattern = config.playerTrackPattern || 'players/{slug}.mp3';
    const playerTracks = members
      .filter(member => member.slug)
      .map(member => ({
        id: `player-${member.slug}`,
        title: `${member.nickname || member.name} Theme`,
        artist: member.name,
        src: fullSrc(config.basePath, pattern.replace('{slug}', member.slug)),
        mood: member.role || 'Player',
        groupId: 'player-themes',
        groupName: 'Player Themes',
        badge: playerInitial(member.nickname || member.name)
      }));

    if (playerTracks.length) {
      const existing = groups.find(group => group.id === 'player-themes');
      if (existing) existing.tracks.push(...playerTracks);
      else groups.push({ id: 'player-themes', name: 'Player Themes', tracks: playerTracks });
    }

    state.groups = groups;
    state.tracks = groups.flatMap(group => group.tracks);
  }

  function buildPlayer() {
    const dock = document.createElement('div');
    dock.className = 'audio-dock';
    dock.innerHTML = `
      <button class="audio-btn audio-play" type="button" aria-label="Play music">${icons.play}</button>
      <div class="audio-meta">
        <div class="audio-title">Bakatuski Radio</div>
        <div class="audio-subtitle">Choose a theme song</div>
      </div>
      <div class="audio-actions">
        <button class="audio-btn audio-prev" type="button" aria-label="Previous track">${icons.prev}</button>
        <button class="audio-btn audio-next" type="button" aria-label="Next track">${icons.next}</button>
        <button class="audio-btn audio-volume" type="button" aria-label="Adjust volume">Vol</button>
        <button class="audio-btn audio-library" type="button" aria-label="Open music library">${icons.library}</button>
      </div>
      <div class="audio-progress"><div class="audio-progress-fill"></div></div>
      <div class="audio-volume-popover" aria-label="Music volume">
        <span class="audio-volume-label">Volume</span>
        <input class="audio-volume-range" type="range" min="0" max="100" step="1" value="${Math.round(state.audio.volume * 100)}" aria-label="Music volume">
        <span class="audio-volume-value">${Math.round(state.audio.volume * 100)}%</span>
      </div>
    `;

    const panel = document.createElement('div');
    panel.className = 'audio-panel';
    panel.innerHTML = `
      <div class="audio-panel-head">
        <div>
          <div class="audio-panel-title">Bakatuski Radio</div>
          <div class="audio-subtitle">Theme songs, player songs, loop and shuffle.</div>
        </div>
        <button class="audio-btn audio-close" type="button" aria-label="Close music library">×</button>
      </div>
      <div class="audio-mode-row">
        <button class="audio-mode" type="button" data-mode="single">Song Loop</button>
        <button class="audio-mode" type="button" data-mode="playlist">Folder Loop</button>
        <button class="audio-mode" type="button" data-mode="shuffle">Shuffle</button>
      </div>
      <div class="audio-list"></div>
    `;

    document.body.append(dock, panel);
    bindControls(dock, panel);
    renderLibrary(panel);
    updateModeButtons(panel);
    updateNowPlaying();
    setVolume(state.audio.volume);
  }

  function bindControls(dock, panel) {
    dock.querySelector('.audio-play').addEventListener('click', togglePlay);
    dock.querySelector('.audio-prev').addEventListener('click', previousTrack);
    dock.querySelector('.audio-next').addEventListener('click', nextTrack);
    dock.querySelector('.audio-library').addEventListener('click', () => setPanelOpen(!state.panelOpen, panel));
    dock.querySelector('.audio-volume').addEventListener('click', (event) => {
      event.stopPropagation();
      setVolumeOpen(!dock.classList.contains('volume-open'), dock);
    });
    dock.querySelector('.audio-volume-range').addEventListener('input', (event) => {
      setVolume(Number(event.target.value) / 100);
    });
    document.addEventListener('click', (event) => {
      if (!dock.contains(event.target)) setVolumeOpen(false, dock);
    });
    panel.querySelector('.audio-close').addEventListener('click', () => setPanelOpen(false, panel));

    panel.querySelectorAll('.audio-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;
        localStorage.setItem('bakatuski-audio-mode', state.mode);
        state.audio.loop = state.mode === 'single';
        updateModeButtons(panel);
      });
    });

    state.audio.addEventListener('timeupdate', updateProgress);
    state.audio.addEventListener('ended', () => {
      if (state.mode !== 'single') nextTrack(true);
    });
    state.audio.addEventListener('play', () => {
      state.isPlaying = true;
      updateNowPlaying();
    });
    state.audio.addEventListener('pause', () => {
      state.isPlaying = false;
      updateNowPlaying();
    });
    state.audio.addEventListener('error', () => {
      const track = state.tracks[state.currentIndex];
      setSubtitle(track ? `Missing audio file: ${track.src}` : 'Audio file not found');
      state.isPlaying = false;
      updateNowPlaying();
    });
  }

  function renderLibrary(panel) {
    const list = panel.querySelector('.audio-list');
    if (!state.tracks.length) {
      list.innerHTML = '<div class="audio-empty">No audio tracks configured yet. Add tracks to assets/data/audio.json.</div>';
      return;
    }

    list.innerHTML = state.groups.map(group => `
      <div class="audio-group-label">${group.name}</div>
      ${group.tracks.map(track => {
        const index = state.tracks.indexOf(track);
        return `
          <button class="audio-track" type="button" data-index="${index}">
            <span class="audio-track-badge">${track.badge || playerInitial(track.title)}</span>
            <span>
              <span class="audio-track-title">${track.title}</span>
              <span class="audio-track-sub">${track.artist || group.name}</span>
            </span>
            <span class="audio-track-pill">${track.mood || 'Theme'}</span>
          </button>
        `;
      }).join('')}
    `).join('');

    list.querySelectorAll('.audio-track').forEach(btn => {
      btn.addEventListener('click', () => playTrack(Number(btn.dataset.index)));
    });
  }

  function setPanelOpen(open, panel = document.querySelector('.audio-panel')) {
    state.panelOpen = open;
    panel?.classList.toggle('open', open);
  }

  function setVolumeOpen(open, dock = document.querySelector('.audio-dock')) {
    dock?.classList.toggle('volume-open', open);
  }

  function setVolume(volume) {
    const nextVolume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : state.audio.volume));
    state.audio.volume = nextVolume;
    localStorage.setItem('bakatuski-audio-volume', String(nextVolume));
    document.querySelectorAll('.audio-volume-range').forEach(range => {
      range.value = String(Math.round(nextVolume * 100));
    });
    document.querySelectorAll('.audio-volume-value').forEach(value => {
      value.textContent = `${Math.round(nextVolume * 100)}%`;
    });
    document.querySelectorAll('.audio-volume').forEach(btn => {
      btn.classList.toggle('muted', nextVolume === 0);
      btn.setAttribute('aria-label', `Adjust volume, currently ${Math.round(nextVolume * 100)}%`);
    });
  }

  function setSubtitle(text) {
    document.querySelectorAll('.audio-subtitle').forEach(el => {
      if (el.closest('.audio-panel-head')) return;
      el.textContent = text;
    });
  }

  function updateModeButtons(panel = document.querySelector('.audio-panel')) {
    panel?.querySelectorAll('.audio-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });
    state.audio.loop = state.mode === 'single';
  }

  function updateNowPlaying() {
    const track = state.tracks[state.currentIndex];
    const playBtn = document.querySelector('.audio-play');
    if (playBtn) {
      playBtn.textContent = state.isPlaying ? icons.pause : icons.play;
      playBtn.classList.toggle('playing', state.isPlaying);
      playBtn.setAttribute('aria-label', state.isPlaying ? 'Pause music' : 'Play music');
    }

    if (track) {
      const title = document.querySelector('.audio-dock .audio-title');
      const subtitle = document.querySelector('.audio-dock .audio-subtitle');
      if (title) title.textContent = track.title;
      if (subtitle) subtitle.textContent = `${track.artist || track.groupName} · ${state.mode}`;
    }

    document.querySelectorAll('.audio-track').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.index) === state.currentIndex);
    });
  }

  function updateProgress() {
    const fill = document.querySelector('.audio-progress-fill');
    if (!fill || !state.audio.duration) return;
    fill.style.width = `${(state.audio.currentTime / state.audio.duration) * 100}%`;
  }

  function loadTrack(index) {
    if (!state.tracks.length) return null;
    state.currentIndex = (index + state.tracks.length) % state.tracks.length;
    const track = state.tracks[state.currentIndex];
    if (state.audio.src !== new URL(track.src, window.location.href).href) {
      state.audio.src = track.src;
      state.audio.load();
    }
    updateNowPlaying();
    return track;
  }

  function playTrack(index = state.currentIndex) {
    const track = loadTrack(index);
    if (!track) return;
    state.audio.play().catch(() => {
      setSubtitle('Tap play to start audio');
    });
  }

  function togglePlay() {
    if (!state.tracks.length) return;
    if (!state.audio.src) loadTrack(state.currentIndex);
    if (state.audio.paused) playTrack(state.currentIndex);
    else state.audio.pause();
  }

  function randomIndex() {
    const choices = groupIndices();
    if (choices.length <= 1) return state.currentIndex;
    let next = state.currentIndex;
    while (next === state.currentIndex) {
      next = choices[Math.floor(Math.random() * choices.length)];
    }
    return next;
  }

  function groupIndices() {
    const current = state.tracks[state.currentIndex];
    if (!current) return state.tracks.map((_, index) => index);
    const indices = state.tracks
      .map((track, index) => track.groupId === current.groupId ? index : -1)
      .filter(index => index !== -1);
    return indices.length ? indices : state.tracks.map((_, index) => index);
  }

  function adjacentInGroup(direction) {
    const indices = groupIndices();
    const position = indices.indexOf(state.currentIndex);
    if (position === -1) return state.currentIndex;
    return indices[(position + direction + indices.length) % indices.length];
  }

  function nextTrack(fromEnded = false) {
    if (!state.tracks.length) return;
    const next = state.mode === 'shuffle' ? randomIndex() : adjacentInGroup(1);
    if (!fromEnded && state.audio.paused) loadTrack(next);
    else playTrack(next);
  }

  function previousTrack() {
    if (!state.tracks.length) return;
    const prev = state.mode === 'shuffle' ? randomIndex() : adjacentInGroup(-1);
    if (state.audio.paused) loadTrack(prev);
    else playTrack(prev);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadAudioData();
    buildPlayer();
    loadTrack(0);
  });
})();
