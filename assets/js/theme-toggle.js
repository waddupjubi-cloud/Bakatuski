(function initGlobalTheme() {
  'use strict';

  const STORAGE_KEY = 'bakatuski-theme';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    const isLight = theme === 'light';
    root.classList.toggle('light-theme', isLight);
    root.classList.toggle('dark-theme', !isLight);

    if (document.body) {
      document.body.classList.toggle('light-theme', isLight);
      document.body.classList.toggle('dark-theme', !isLight);
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', isLight ? '#f7fbf1' : '#1BDA80');

    const toggle = document.getElementById('global-theme-switch');
    if (toggle) {
      toggle.classList.toggle('is-light', isLight);
      toggle.classList.toggle('is-dark', !isLight);
      toggle.style.setProperty('--theme-switch-pos', isLight ? '46px' : '0px');
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      const label = toggle.querySelector('.theme-switcher-label');
      if (label) label.textContent = isLight ? 'Light' : 'Dark';
    }
  }

  function buildToggle() {
    if (document.getElementById('global-theme-switch')) return;

    const toggle = document.createElement('button');
    toggle.id = 'global-theme-switch';
    toggle.className = 'theme-switcher';
    toggle.type = 'button';
    toggle.innerHTML = '<span class="theme-switcher-label"></span>';
    toggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
    document.body.appendChild(toggle);
    applyTheme(localStorage.getItem(STORAGE_KEY) || initialTheme);
  }

  applyTheme(initialTheme);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(localStorage.getItem(STORAGE_KEY) || initialTheme);
      buildToggle();
    });
  } else {
    applyTheme(localStorage.getItem(STORAGE_KEY) || initialTheme);
    buildToggle();
  }
})();
