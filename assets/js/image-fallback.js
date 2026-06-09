'use strict';

(() => {
  const FALLBACK_IMAGE = 'images/ComingSoon.png';

  function addFallback(img) {
    if (!(img instanceof HTMLImageElement) || img.dataset.fallbackReady === 'true' || img.onerror) return;
    img.dataset.fallbackReady = 'true';
    img.addEventListener('error', () => {
      if (img.getAttribute('src') === FALLBACK_IMAGE) return;
      img.removeAttribute('srcset');
      img.src = FALLBACK_IMAGE;
    });
  }

  document.querySelectorAll('img').forEach(addFallback);

  new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        addFallback(node);
        node.querySelectorAll?.('img').forEach(addFallback);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
