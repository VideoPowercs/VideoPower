(() => {
  'use strict';
  const card = document.querySelector('.giveaway-card--featured-carousel');
  const message = card?.querySelector('.giveaway-closed-message__copy strong')?.textContent || '';
  if (!card || !/\blive\b/i.test(message)) return;
  const prizes = [...card.querySelectorAll('.giveaway-img-track .giveaway-img')];
  if (!prizes.length) return;
  const edition = JSON.stringify([card.href, ...prizes.map(img => [img.src, img.alt])]);
  const storageKey = 'videopower-giveaway-news-seen';
  let seen = false;
  try { seen = localStorage.getItem(storageKey) === edition; } catch {}
  if (seen) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'giveaway-news';
  dialog.setAttribute('aria-labelledby', 'giveaway-news-title');
  dialog.setAttribute('aria-describedby', 'giveaway-news-description');
  dialog.innerHTML = `<button class="giveaway-news-close" type="button" aria-label="Close giveaway news"><img src="/assets/close-icon.png" alt="" draggable="false"></button><div class="giveaway-news-eyebrow"><span class="giveaway-news-live"></span> NEW GIVEAWAY <span class="giveaway-news-exclusive">3 WINNERS</span></div><h2 id="giveaway-news-title">Your next skin<br><span>could be here.</span></h2><p id="giveaway-news-description">Three AK-47 skins. Three lucky winners.<br>The giveaway is live. Enter now!</p><div class="giveaway-news-prizes"></div><a class="giveaway-news-enter" target="_blank" rel="noopener noreferrer">ENTER GIVEAWAY <span aria-hidden="true">↗</span></a><button class="giveaway-news-later" type="button">MAYBE LATER</button><div class="giveaway-news-footer">HOSTED ON HELLCASE <span>•</span> GOOD LUCK!</div>`;
  const list = dialog.querySelector('.giveaway-news-prizes');
  prizes.forEach((prize, index) => {
    const tile = document.createElement('div');
    tile.className = 'giveaway-news-prize';
    const palettes = {
      'Frontside Misty': ['#54CFFF', '#101D27'],
      'Crane Flight': ['#E8BC70', '#211C15'],
      'Nouveau Rouge': ['#EB667A', '#25141B'],
    };
    const palette = palettes[prize.dataset.finish] || ['#E8BC70', '#211C15'];
    tile.style.setProperty('--prize-color', palette[0]);
    tile.style.setProperty('--prize-bg', palette[1]);
    tile.style.setProperty('--prize-delay', `${index * 90 + 120}ms`);
    const image = document.createElement('img');
    image.src = prize.src; image.alt = prize.alt; image.draggable = false;
    const label = document.createElement('strong'); label.textContent = prize.dataset.finish || prize.alt;
    const weapon = document.createElement('span'); weapon.className = 'giveaway-news-weapon'; weapon.textContent = prize.dataset.weapon || 'AK-47';
    const condition = document.createElement('span'); condition.className = 'giveaway-news-condition'; condition.textContent = prize.dataset.condition || '';
    tile.append(image, weapon, label, condition); list.append(tile);
  });
  const link = dialog.querySelector('.giveaway-news-enter'); link.href = card.href;
  document.body.append(dialog);
  let previousFocus;
  let scrollPosition = 0;
  let bodyStyles;
  let rootOverflow;
  const blockBackgroundScroll = event => {
    if (dialog.open && !dialog.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  window.addEventListener('wheel', blockBackgroundScroll, {capture:true, passive:false});
  window.addEventListener('touchmove', blockBackgroundScroll, {capture:true, passive:false});
  window.addEventListener('keydown', event => {
    if(dialog.open && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End',' '].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); }
  },true);
  const markSeen = () => { try { localStorage.setItem(storageKey, edition); } catch {} };
  const close = () => { markSeen(); dialog.close(); };
  dialog.querySelector('.giveaway-news-close').addEventListener('click', close);
  dialog.querySelector('.giveaway-news-later').addEventListener('click', close);
  link.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('giveaway-news-open');
    rootOverflow?.forEach(([property,value,priority])=>document.documentElement.style.setProperty(property,value,priority));
    if (bodyStyles) {
      Object.assign(document.body.style, bodyStyles);
      window.scrollTo({top:scrollPosition, left:0, behavior:'instant'});
    }
    previousFocus?.focus?.({preventScroll:true});
  });
  const show = () => {
    if (document.visibilityState !== 'visible' || document.querySelector('dialog[open]') || /menu-open|nav-open/.test(document.body.className + document.documentElement.className)) { setTimeout(show, 1000); return; }
    previousFocus = document.activeElement;
    scrollPosition = window.scrollY;
    rootOverflow = ['overflow-x','overflow-y'].map(property=>[property,document.documentElement.style.getPropertyValue(property),document.documentElement.style.getPropertyPriority(property)]);
    ['overflow-x','overflow-y'].forEach(property=>document.documentElement.style.setProperty(property,'hidden','important'));
    bodyStyles = {position:document.body.style.position, top:document.body.style.top, width:document.body.style.width, overflow:document.body.style.overflow};
    Object.assign(document.body.style, {position:'fixed', top:`-${scrollPosition}px`, width:'100%', overflow:'hidden'});
    dialog.showModal(); document.documentElement.classList.add('giveaway-news-open');
  };
  setTimeout(show, 1800);
})();
