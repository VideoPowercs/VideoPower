(() => {
  const isSocial = (link) => {
    const hostname = new URL(link.href, location.href).hostname;
    return /^(www\.)?(youtube\.com|x\.com)$/.test(hostname);
  };
  const syncNavigation = () => {
    document.querySelectorAll('.hero-explore').forEach((link) => {
      link.draggable = false;
      link.style.setProperty('-webkit-user-drag', 'none', 'important');
    });
    document.querySelectorAll('.main-header a, #main-nav a, .main-footer a').forEach((link) => {
      const allowed = isSocial(link);
      link.draggable = allowed;
      link.style.setProperty('-webkit-user-drag', allowed ? 'element' : 'none', 'important');
      link.querySelectorAll('img').forEach((image) => { image.draggable = false; });
    });
  };
  document.addEventListener('dragstart', (event) => {
    if (event.target instanceof Element && event.target.closest('.hero-explore')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const link = event.target instanceof Element ? event.target.closest('.main-header a, #main-nav a, .main-footer a') : null;
    if (link && !isSocial(link)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  syncNavigation();
  document.addEventListener('DOMContentLoaded', syncNavigation);
  // Run after the legacy responsive navigation has applied its own styles.
  matchMedia('(max-width: 860px)').addEventListener('change', () => queueMicrotask(syncNavigation));
  window.addEventListener('pageshow', syncNavigation);

  const copyButton = document.querySelector('.footer-code-copy');
  if (copyButton) {
    copyButton.addEventListener('dragstart', (event) => event.preventDefault());
    copyButton.addEventListener('pointercancel', () => copyButton.blur());
  }

  document.querySelectorAll('.footer-partnership-email').forEach((email) => {
    let downAt = 0;
    let wasLongPress = false;
    const isMobile = () => matchMedia('(max-width: 860px), (pointer: coarse)').matches;
    email.addEventListener('contextmenu', (event) => {
      if (isMobile()) { event.preventDefault(); wasLongPress = true; }
    });
    email.addEventListener('pointerdown', () => { downAt = performance.now(); wasLongPress = false; });
    email.addEventListener('pointerup', () => {
      if (isMobile() && performance.now() - downAt > 450) wasLongPress = true;
    });
    email.addEventListener('click', (event) => {
      if (isMobile() && wasLongPress) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  });
})();
