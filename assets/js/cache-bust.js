'use strict';

(function () {
  const version = String(Date.now());
  const localAssetPattern = /^(?:\.\/)?assets\/(?:css|js|data)\//;

  function bust(url) {
    if (!url || /^(?:https?:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) return url;
    if (!localAssetPattern.test(url)) return url;

    const parts = String(url).split('#');
    const base = parts[0];
    const hash = parts[1] ? `#${parts[1]}` : '';
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}v=${encodeURIComponent(version)}${hash}`;
  }

  function attr(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function css(id, href) {
    document.write(`<link id="${attr(id)}" rel="stylesheet" href="${attr(bust(href))}">`);
  }

  function js(id, src) {
    document.write(`<script id="${attr(id)}" src="${attr(bust(src))}"><\/script>`);
  }

  const nativeFetch = window.fetch?.bind(window);
  if (nativeFetch) {
    window.fetch = (input, init) => {
      if (typeof input === 'string') return nativeFetch(bust(input), init);
      if (input instanceof Request) {
        const bustedUrl = bust(input.url);
        if (bustedUrl !== input.url) return nativeFetch(new Request(bustedUrl, input), init);
      }
      return nativeFetch(input, init);
    };
  }

  window.BakatuskiCacheBust = { version, bust, css, js };
})();
