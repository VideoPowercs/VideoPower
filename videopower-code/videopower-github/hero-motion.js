/* Pointer depth is independent of the images' CSS floating transforms. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const enabled = matchMedia('(min-width: 861px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let visible = true;
  let frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const render = () => {
    frame = 0;
    if (!enabled.matches || !visible || document.hidden) return;
    x += (targetX - x) * 0.075;
    y += (targetY - y) * 0.075;
    hero.style.setProperty('--hero-pointer-x', `${x.toFixed(2)}px`);
    hero.style.setProperty('--hero-pointer-y', `${y.toFixed(2)}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.05) frame = requestAnimationFrame(render);
  };
  const schedule = () => {
    if (!frame && enabled.matches && visible && !document.hidden) frame = requestAnimationFrame(render);
  };
  const reset = () => { targetX = 0; targetY = 0; schedule(); };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    hero.classList.toggle('hero-motion-paused', !visible || document.hidden);
    if (!enabled.matches || !visible || document.hidden) {
      x = y = targetX = targetY = 0;
      hero.style.removeProperty('--hero-pointer-x');
      hero.style.removeProperty('--hero-pointer-y');
    } else schedule();
  };
  hero.addEventListener('pointermove', (event) => {
    if (!enabled.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    targetX = Math.max(-8, Math.min(8, ((event.clientX - bounds.left) / bounds.width - 0.5) * 16));
    targetY = Math.max(-6, Math.min(6, ((event.clientY - bounds.top) / bounds.height - 0.5) * 12));
    schedule();
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', sync);
  enabled.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(hero);
  }
  sync();
})();
