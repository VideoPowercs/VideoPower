if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollReset();
  initPageLoader();
  disableContextActions();
  initStars();
  initButtonSounds();
  initSectionButtonMotion();
  initGiveawayCarousel();
  initGiveawayButtonHover();
  initSpecialsCountdown();
  initYoutubeVideos();
  initHamburgerMenu();
});

function initScrollReset() {
  const syncUrlToTop = () => {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    if (window.location.hash) {
      window.history.replaceState(null, "", cleanUrl);
    }
  };

  const resetToTop = () => {
    syncUrlToTop();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    });
  };

  resetToTop();
  window.addEventListener("load", resetToTop, { once: true });
  window.addEventListener("pageshow", resetToTop, { once: true });
}

function initPageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  const loaderBarFill = loader.querySelector(".page-loader__bar-fill");
  const MIN_LOADER_VISIBLE_MS = 680;
  const FINISH_HOLD_MS = 130;
  const HIDE_TRANSITION_MS = 360;
  const startTime = window.performance.now();
  const fontsReady = document.fonts?.ready
    ? document.fonts.ready.catch(() => undefined)
    : Promise.resolve();
  let hasHidden = false;
  let progress = 8;
  let animationId = 0;

  const setProgress = (value) => {
    progress = Math.max(0, Math.min(100, value));
    if (loaderBarFill) {
      loaderBarFill.style.transform = `scaleX(${progress / 100})`;
    }
  };

  const animateProgress = () => {
    if (hasHidden) return;
    const elapsed = window.performance.now() - startTime;
    const target = Math.min(86, 10 + (elapsed / MIN_LOADER_VISIBLE_MS) * 66);
    progress += (target - progress) * 0.08;
    setProgress(progress);
    animationId = window.requestAnimationFrame(animateProgress);
  };

  const hideLoader = () => {
    if (hasHidden) return;
    hasHidden = true;
    const elapsed = window.performance.now() - startTime;
    const remaining = Math.max(0, MIN_LOADER_VISIBLE_MS - elapsed);

    window.setTimeout(() => {
      window.cancelAnimationFrame(animationId);
      loader.classList.add("is-finishing");
      setProgress(100);

      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        document.body.classList.remove("is-loading");

        window.setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, HIDE_TRANSITION_MS);
      }, FINISH_HOLD_MS);
    }, remaining);
  };

  const finalizeLoader = () => {
    fontsReady.then(hideLoader);
  };

  setProgress(progress);

  if (document.readyState === "complete") {
    finalizeLoader();
    return;
  }

  animationId = window.requestAnimationFrame(animateProgress);
  window.addEventListener("load", finalizeLoader, { once: true });
}

function disableContextActions() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("selectstart", (event) => event.preventDefault());
  document.addEventListener("dragstart", (event) => event.preventDefault());
  document.querySelectorAll("img").forEach((image) => {
    image.setAttribute("draggable", "false");
  });
}

function initStars() {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const layers = [
    { count: 90, size: [0.5, 1.2], speed: 0.18, colors: ["#ffffff", "#ffb22c"] },
    { count: 55, size: [1.2, 2], speed: 0.28, colors: ["#ffffff", "#ffb22c"] },
    { count: 28, size: [2, 3], speed: 0.4, colors: ["#ffffff", "#ffd76f"] }
  ];

  let width = 0;
  let height = 0;
  let stars = [];
  let animationId = 0;
  let resizeTimer = 0;

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function resizeCanvas() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
    drawStars();
  }

  function createStars() {
    stars = [];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        stars.push({
          x: randomBetween(0, width),
          y: randomBetween(0, height),
          r: randomBetween(layer.size[0], layer.size[1]),
          vx: Math.cos(angle) * randomBetween(layer.speed * 0.3, layer.speed),
          vy: Math.sin(angle) * randomBetween(layer.speed * 0.3, layer.speed),
          color: layer.colors[Math.floor(Math.random() * layer.colors.length)],
          alpha: randomBetween(0.45, 1)
        });
      }
    });
  }

  function drawStars() {
    context.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      context.beginPath();
      context.globalAlpha = star.alpha;
      context.fillStyle = star.color;
      context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      context.fill();
    });

    context.globalAlpha = 1;
  }

  function updateStars() {
    stars.forEach((star) => {
      star.x += star.vx;
      star.y += star.vy;

      if (star.x < -6) star.x = width + 6;
      if (star.x > width + 6) star.x = -6;
      if (star.y < -6) star.y = height + 6;
      if (star.y > height + 6) star.y = -6;
    });
  }

  function animate() {
    updateStars();
    drawStars();
    animationId = window.requestAnimationFrame(animate);
  }

  function start() {
    window.cancelAnimationFrame(animationId);
    if (prefersReducedMotion) {
      drawStars();
      return;
    }
    animationId = window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeCanvas();
      start();
    }, 120);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationId);
    } else {
      start();
    }
  });

  resizeCanvas();
  start();
}

function initGiveawayCarousel() {
  const carousels = document.querySelectorAll(".giveaway-img-carousel");
  if (!carousels.length) return;

  const MOBILE_BREAKPOINT = 768;
  const MOBILE_INTERVAL = 3000;
  const DESKTOP_INTERVAL = 3600;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".giveaway-img-track");
    const slides = Array.from(carousel.querySelectorAll(".giveaway-img"));
    const dots = Array.from(carousel.querySelectorAll(".dot"));
    const prevButton = carousel.querySelector(".giveaway-arrow.prev");
    const nextButton = carousel.querySelector(".giveaway-arrow.next");
    const card = carousel.closest(".giveaway-card");
    const title = card ? card.querySelector(".giveaway-title") : null;

    if (!track || !slides.length) return;

    let index = 0;
    let intervalId = null;
    let touchStartX = 0;
    let interactionState = "idle";
    let animationTimer = 0;
    let cooldownTimer = 0;
    let animationRunId = 0;
    let detachTransitionEnd = null;

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const hasMultipleSlides = slides.length > 1;
    const transitionDuration = () => (isMobile() ? 620 : 540);
    const postTransitionCooldown = () => (isMobile() ? 520 : 440);
    const isIdle = () => interactionState === "idle";

    function stopAutoPlay() {
      if (!intervalId) return;
      window.clearInterval(intervalId);
      intervalId = null;
    }

    function updateDotsAndTitle() {
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === index);
      });

      if (title && slides[index].dataset.title) {
        title.textContent = slides[index].dataset.title;
      }
    }

    function applyDesktop() {
      track.style.display = "block";
      track.style.transform = "none";
      track.style.transition = "none";

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === index);
        slide.style.position = "absolute";
        slide.style.inset = "0";
        slide.style.minWidth = "auto";
        slide.style.willChange = "transform, opacity";
        slide.style.opacity = slideIndex === index ? "1" : "0";
        slide.style.transform = slideIndex === index ? "translateX(0) scale(1)" : "translateX(32px) scale(0.96)";
        slide.style.zIndex = slideIndex === index ? "2" : "1";
      });
    }

    function applyMobile() {
      track.style.display = "flex";
      track.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
      track.style.transform = `translateX(-${index * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === index);
        slide.style.position = "relative";
        slide.style.inset = "auto";
        slide.style.minWidth = "100%";
        slide.style.willChange = "transform";
        slide.style.opacity = "1";
        slide.style.transform = slideIndex === index ? "scale(1)" : "scale(0.98)";
        slide.style.zIndex = "1";
      });
    }

    function render() {
      if (isMobile()) applyMobile();
      else applyDesktop();
      updateDotsAndTitle();
    }

    function startAutoPlay() {
      if (!hasMultipleSlides) {
        stopAutoPlay();
        return;
      }
      stopAutoPlay();
      const delay = isMobile() ? MOBILE_INTERVAL : DESKTOP_INTERVAL;
      intervalId = window.setInterval(() => {
        if (!isIdle()) return;
        goTo(index + 1, false);
      }, delay);
    }

    function setArrowsDisabled(disabled) {
      const shouldDisable = disabled || !hasMultipleSlides;
      if (prevButton) prevButton.disabled = shouldDisable;
      if (nextButton) nextButton.disabled = shouldDisable;
    }

    function clearTransitionListener() {
      if (!detachTransitionEnd) return;
      detachTransitionEnd();
      detachTransitionEnd = null;
    }

    function clearTransitionWait() {
      window.clearTimeout(animationTimer);
      clearTransitionListener();
    }

    function clearNavigationLocks() {
      clearTransitionWait();
      window.clearTimeout(cooldownTimer);
    }

    function setInteractionState(nextState) {
      interactionState = nextState;
      carousel.dataset.carouselState = nextState;
    }

    function unlockArrows(runId) {
      if (runId !== animationRunId) return;
      setInteractionState("idle");
      setArrowsDisabled(false);
    }

    function startCooldown(runId) {
      if (runId !== animationRunId) return;
      window.clearTimeout(cooldownTimer);
      setInteractionState("cooldown");
      setArrowsDisabled(true);
      cooldownTimer = window.setTimeout(() => {
        unlockArrows(runId);
      }, postTransitionCooldown());
    }

    function finishTransition(runId) {
      if (runId !== animationRunId) return;
      clearTransitionWait();
      startCooldown(runId);
    }

    function bindTransitionCompletion(runId, transitionSource) {
      if (!transitionSource) {
        finishTransition(runId);
        return;
      }

      const handleTransitionEnd = (event) => {
        if (runId !== animationRunId) return;
        if (isMobile()) {
          if (event.target !== track || event.propertyName !== "transform") return;
        } else if (
          event.target !== slides[index] ||
          (event.propertyName !== "transform" && event.propertyName !== "opacity")
        ) {
          return;
        }

        finishTransition(runId);
      };

      transitionSource.addEventListener("transitionend", handleTransitionEnd);
      detachTransitionEnd = () => {
        transitionSource.removeEventListener("transitionend", handleTransitionEnd);
      };

      animationTimer = window.setTimeout(() => {
        finishTransition(runId);
      }, transitionDuration() + 160);
    }

    function goTo(nextIndex, restartAutoPlay = true) {
      if (!hasMultipleSlides || !isIdle()) return false;

      clearNavigationLocks();
      animationRunId += 1;
      const currentRunId = animationRunId;
      setInteractionState("animating");
      setArrowsDisabled(true);
      index = (nextIndex + slides.length) % slides.length;
      render();

      if (restartAutoPlay) {
        startAutoPlay();
      }

      const transitionSource = isMobile() ? track : slides[index];
      bindTransitionCompletion(currentRunId, transitionSource);
      return true;
    }

    if (prevButton) {
      prevButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (prevButton.disabled || !isIdle()) return;
        prevButton.dataset.soundReady = "true";
        goTo(index - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (nextButton.disabled || !isIdle()) return;
        nextButton.dataset.soundReady = "true";
        goTo(index + 1);
      });
    }

    carousel.addEventListener("mouseenter", stopAutoPlay);
    carousel.addEventListener("mouseleave", startAutoPlay);

    carousel.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].clientX;
      stopAutoPlay();
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;

      if (Math.abs(delta) > 40) {
        const moved = delta < 0 ? goTo(index + 1) : goTo(index - 1);
        if (!moved) startAutoPlay();
      } else {
        startAutoPlay();
      }
    }, { passive: true });

    window.addEventListener("resize", debounce(() => {
      animationRunId += 1;
      clearNavigationLocks();
      setInteractionState("idle");
      setArrowsDisabled(false);
      render();
      startAutoPlay();
    }, 160));

    render();
    setInteractionState("idle");
    setArrowsDisabled(false);
    startAutoPlay();
  });
}

function initSectionButtonMotion() {
  const mappings = [
    { buttonSelector: ".promo-banner .cta-button", containerSelector: ".promo-banner" }
  ];

  mappings.forEach(({ buttonSelector, containerSelector }) => {
    document.querySelectorAll(buttonSelector).forEach((button) => {
      const container = button.closest(containerSelector);
      if (!container) return;

      const addState = () => container.classList.add("is-button-hovered");
      const removeState = () => container.classList.remove("is-button-hovered");

      button.addEventListener("mouseenter", addState);
      button.addEventListener("mouseleave", removeState);
      button.addEventListener("focus", addState);
      button.addEventListener("blur", removeState);
      button.addEventListener("touchstart", addState, { passive: true });
      button.addEventListener("touchend", removeState, { passive: true });
    });
  });
}

function initGiveawayButtonHover() {
  const buttons = document.querySelectorAll(".giveaway-card .enter-btn");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const card = button.closest(".giveaway-card");
    if (!card) return;

    const addHoverState = () => card.classList.add("is-cta-hovered");
    const removeHoverState = () => card.classList.remove("is-cta-hovered");

    button.addEventListener("mouseenter", addHoverState);
    button.addEventListener("mouseleave", removeHoverState);
    button.addEventListener("blur", removeHoverState);
  });
}

function initSpecialsCountdown() {
  const chips = [...document.querySelectorAll(".countdown-chip[data-countdown-key][data-countdown-duration-ms]")];
  if (!chips.length) return;

  const storagePrefix = "videopower-special-countdown:";

  const readTargetTime = (chip) => {
    const countdownKey = String(chip.dataset.countdownKey || "").trim();
    const durationMs = Number(chip.dataset.countdownDurationMs || 0);

    if (!countdownKey || !Number.isFinite(durationMs) || durationMs <= 0) {
      return null;
    }

    const storageKey = `${storagePrefix}${countdownKey}`;
    const now = Date.now();

    try {
      const savedTarget = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(savedTarget) && savedTarget > now) {
        return savedTarget;
      }

      const nextTarget = now + durationMs;
      window.localStorage.setItem(storageKey, String(nextTarget));
      return nextTarget;
    } catch (error) {
      return now + durationMs;
    }
  };

  const countdownTargets = new Map();

  chips.forEach((chip) => {
    const targetTime = readTargetTime(chip);
    if (targetTime) {
      countdownTargets.set(chip, targetTime);
    }
  });

  if (!countdownTargets.size) return;

  const formatCountdown = (remainingMs) => {
    if (remainingMs <= 0) return "EVENT ENDED";

    const totalMinutes = Math.floor(remainingMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return `ENDS IN ${days}D ${hours}H ${minutes}MIN`;
  };

  const renderCountdowns = () => {
    const now = Date.now();
    countdownTargets.forEach((targetTime, chip) => {
      chip.textContent = formatCountdown(targetTime - now);
    });
  };

  renderCountdowns();
  window.setInterval(renderCountdowns, 1000);
}

function initYoutubeVideos() {
  const container = document.getElementById("videos-grid");
  if (!container) return;

  const fallbackVideos = [
    {
      title: "CHECK OUT THE VIDEOPOWER CHANNEL.",
      url: "https://www.youtube.com/@VideoPower_cs",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1"
    },
    {
      title: "CHECK OUT VIDEOPOWER'S LATEST VIDEOS.",
      url: "https://www.youtube.com/@VideoPower_cs/videos",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1"
    },
    {
      title: "CHECK OUT THE VIDEOPOWER COMMUNITY PAGE.",
      url: "https://www.youtube.com/@VideoPower_cs/community",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1"
    }
  ];

  const MAX_RESULTS = fallbackVideos.length;

  function renderLoading() {
    container.innerHTML = "";

    for (let i = 0; i < MAX_RESULTS; i += 1) {
      const card = document.createElement("article");
      card.className = "video-card skeleton";
      card.innerHTML = `
        <div class="video-skeleton-media"></div>
        <div class="video-info">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
          <div class="skeleton-chip-row">
            <div class="skeleton-line skeleton-chip"></div>
            <div class="skeleton-line skeleton-chip"></div>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  function createCard(video) {
    const card = document.createElement("a");
    card.className = "video-card video-card--fallback";
    card.href = video.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.src = video.image;
    image.alt = video.title;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "video-info video-info--compact";

    const title = document.createElement("h3");
    title.textContent = video.title;
    info.append(title);

    card.append(image, info);
    return card;
  }

  function renderVideos(videos) {
    container.innerHTML = "";
    videos.forEach((video) => {
      container.appendChild(createCard(video));
    });
  }

  renderLoading();

  window.setTimeout(() => {
    renderVideos(fallbackVideos);
  }, 420);
}

function initHamburgerMenu() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("main-nav");
  if (!hamburger || !nav) return;

  const navLinks = nav.querySelectorAll("a");
  const isMobile = () => window.innerWidth <= 860;

  function syncNavAccessibility() {
    const mobile = isMobile();
    const isOpen = nav.classList.contains("show");
    nav.setAttribute("aria-hidden", mobile && !isOpen ? "true" : "false");
    if ("inert" in nav) {
      nav.inert = mobile && !isOpen;
    }
  }

  function openMenu() {
    hamburger.classList.add("active");
    nav.classList.add("show");
    document.body.classList.add("menu-open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close navigation");
    syncNavAccessibility();
  }

  function closeMenu() {
    hamburger.classList.remove("active");
    nav.classList.remove("show");
    document.body.classList.remove("menu-open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation");
    syncNavAccessibility();
  }

  function toggleMenu() {
    if (nav.classList.contains("show")) closeMenu();
    else openMenu();
  }

  hamburger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  hamburger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobile()) closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("show")) return;
    if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("show")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeMenu();
    } else {
      syncNavAccessibility();
    }
  });

  syncNavAccessibility();
}

function debounce(callback, delay) {
  let timeoutId = 0;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

function initButtonSounds() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const SOUND_PRESETS = {
    partners: [
      { frequency: 320, duration: 0.03, volume: 0.042, type: "triangle" },
      { frequency: 430, duration: 0.045, volume: 0.03, type: "sine", delay: 0.014 }
    ],
    videos: [
      { frequency: 520, duration: 0.028, volume: 0.044, type: "triangle" },
      { frequency: 720, duration: 0.05, volume: 0.032, type: "sine", delay: 0.016 }
    ],
    specials: [
      { frequency: 410, duration: 0.03, volume: 0.038, type: "triangle" },
      { frequency: 620, duration: 0.048, volume: 0.03, type: "triangle", delay: 0.016 }
    ],
    giveaways: [
      { frequency: 520, duration: 0.032, volume: 0.05, type: "square" },
      { frequency: 760, duration: 0.05, volume: 0.038, type: "triangle", delay: 0.016 },
      { frequency: 960, duration: 0.045, volume: 0.028, type: "sine", delay: 0.042 }
    ],
    bonus: [
      { frequency: 300, duration: 0.036, volume: 0.052, type: "square" },
      { frequency: 540, duration: 0.045, volume: 0.04, type: "square", delay: 0.015 },
      { frequency: 860, duration: 0.055, volume: 0.03, type: "triangle", delay: 0.04 }
    ],
    social: [
      { frequency: 430, duration: 0.032, volume: 0.036, type: "triangle" },
      { frequency: 610, duration: 0.05, volume: 0.026, type: "sine", delay: 0.016 }
    ],
    logo: [
      { frequency: 350, duration: 0.03, volume: 0.038, type: "triangle" },
      { frequency: 510, duration: 0.048, volume: 0.028, type: "sine", delay: 0.014 }
    ],
    action: [
      { frequency: 470, duration: 0.03, volume: 0.042, type: "square" },
      { frequency: 670, duration: 0.046, volume: 0.03, type: "triangle", delay: 0.015 }
    ],
    menu: [
      { frequency: 250, duration: 0.024, volume: 0.032, type: "triangle" },
      { frequency: 380, duration: 0.036, volume: 0.022, type: "sine", delay: 0.012 }
    ]
  };

  let audioContext = null;
  let lastPlayedControl = null;
  let lastPlayedAt = 0;

  function getAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }

    return audioContext;
  }

  function playSound(presetName) {
    try {
      const context = getAudioContext();
      const preset = SOUND_PRESETS[presetName] || SOUND_PRESETS.action;
      const now = context.currentTime;

      preset.forEach((tone) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = now + (tone.delay || 0);
        const endAt = startAt + tone.duration;

        oscillator.type = tone.type || "triangle";
        oscillator.frequency.setValueAtTime(tone.frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(tone.volume, startAt + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.01);
      });
    } catch (error) {
      console.warn("Button sound playback failed.", error);
    }
  }

  function resolvePreset(control) {
    const href = String(control.getAttribute("href") || "").toLowerCase();

    if (control.matches(".hamburger, .giveaway-arrow")) return "menu";
    if (control.matches(".video-card")) return "videos";
    if (control.matches("#promo-code")) return "bonus";
    if (control.matches(".social-icon")) return "social";
    if (href.endsWith("#bonuses")) return "partners";
    if (href.endsWith("#videos")) return "videos";
    if (href.endsWith("#specials")) return "specials";
    if (href.endsWith("#giveaways")) return "giveaways";
    if (control.matches(".main-nav a, .footer-nav a")) {
      return "action";
    }
    if (control.matches(".enter-btn")) return "giveaways";
    if (control.matches(".promo-banner")) return "specials";
    if (control.matches(".code-block a")) return "bonus";

    if (
      href.includes("youtube") ||
      href.includes("x.com") ||
      href.includes("twitter") ||
      href.includes("fourthwall")
    ) {
      return "social";
    }

    if (
      href.includes("hellca") ||
      href.includes("skinbaron") ||
      href.includes("skin.club")
    ) {
      return "bonus";
    }

    return "action";
  }

  function triggerSound(control) {
    const now = window.performance.now();
    if (control === lastPlayedControl && now - lastPlayedAt < 160) return;
    lastPlayedControl = control;
    lastPlayedAt = now;
    playSound(resolvePreset(control));

    if (control.matches(".giveaway-arrow")) {
      delete control.dataset.soundReady;
    }
  }

  function findSoundControl(event) {
    const control = event.target.closest(
      ".main-nav a, .footer-nav a, .btn, .video-card, #promo-code, .social-icon, .code-block a, .promo-banner, .giveaway-arrow, .hamburger"
    );

    if (!control) return null;
    if (event.type === "pointerdown" && control.matches(".giveaway-arrow")) return null;
    if (control.matches(".giveaway-arrow")) {
      const allowOneSuccessfulClickSound = control.dataset.soundReady === "true";
      if (control.disabled && !allowOneSuccessfulClickSound) return null;
    }

    return control;
  }

  document.addEventListener("pointerdown", (event) => {
    const control = findSoundControl(event);
    if (!control) return;
    triggerSound(control);
  });

  document.addEventListener("click", (event) => {
    const control = findSoundControl(event);
    if (!control) return;
    triggerSound(control);
  });
}

function initLogoHop() {
  const logoLink = document.querySelector(".logo-link");
  if (!logoLink) return;

  const press = () => {
    logoLink.classList.add("is-pressed");
  };

  const release = () => {
    window.setTimeout(() => {
      logoLink.classList.remove("is-pressed");
    }, 120);
  };

  logoLink.addEventListener("pointerdown", press);
  logoLink.addEventListener("click", release);
  logoLink.addEventListener("pointerup", release);
  logoLink.addEventListener("pointerleave", () => {
    logoLink.classList.remove("is-pressed");
  });
}
