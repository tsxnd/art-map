"use strict";
(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll('.theme-toggle')];
  function refresh() {
    const dark = root.dataset.theme === 'dark';
    const label = dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える';
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', label);
      button.title = label;
    }
    // file: storage can be isolated per document. Carry the preference on local
    // HTML links so the standalone, offline lessons behave like the website.
    if (location.protocol === 'file:') {
      for (const link of document.querySelectorAll('a[href]')) {
        if (link.getAttribute('href').startsWith('#')) continue;
        const url = new URL(link.href);
        if (url.protocol === 'file:' && /\.html$/i.test(url.pathname)) {
          url.searchParams.set('theme', dark ? 'dark' : 'light');
          link.href = url.href;
        }
      }
    }
  }
  for (const button of buttons) button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    try { localStorage.setItem('art-history-theme', theme); } catch (_) {}
    if (location.protocol === 'file:') {
      const url = new URL(location.href);
      url.searchParams.set('theme', theme);
      history.replaceState(null, '', url);
    }
    refresh();
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => {
    if (event.key === 'art-history-theme' && ['light', 'dark'].includes(event.newValue)) {
      root.dataset.theme = event.newValue;
      refresh();
    }
  });
  refresh();
})();
