(() => {
  if (!('IntersectionObserver' in window)) return;
  const timers = new Map();
  const recorded = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const section = entry.target.id;
      clearTimeout(timers.get(section));
      if (!entry.isIntersecting || document.visibilityState !== 'visible' || recorded.has(section)) continue;
      timers.set(section, setTimeout(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
          const response = await fetch('/api/game/missions/visit', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({section}),credentials:'same-origin'});
          if (response.ok && (await response.json()).recorded) recorded.add(section);
        } catch {}
      }, 1200));
    }
  }, {rootMargin:'-15% 0px -15% 0px',threshold:0});
  for (const id of ['bonuses','giveaways','videos']) { const section=document.getElementById(id); if(section) observer.observe(section); }
  document.addEventListener('visibilitychange',()=>{if(document.hidden) {for(const timer of timers.values()) clearTimeout(timer);} });
})();
