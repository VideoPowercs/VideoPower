if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const YOUTUBE_CHANNEL_ID = "UCVQXiCVDW0rF2a9pCv1pR-g";

document.addEventListener("DOMContentLoaded", () => {
  initScrollReset();
  initPageLoader();
  initHomepagePopup();
  disableContextActions();
  initPromoCodeCopy();
  initFaqAccordion();
  initSpecialsCountdown();
  initHamburgerMenu();
  initTouchInteractionCleanup();

  const runDeferredEnhancements = () => {
    initStars();
    initFloatingImagesMotion();
    initSectionButtonMotion();
    initGiveawayCarousel();
    initGiveawayButtonHover();
    initYoutubeVideos();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runDeferredEnhancements, { timeout: 120 });
  } else {
    window.setTimeout(runDeferredEnhancements, 24);
  }
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
  document.documentElement.classList.remove("loader-ready");
  document.documentElement.classList.remove("fonts-ready");
  const loaderBarFill = loader.querySelector(".page-loader__bar-fill");
  const MIN_LOADER_VISIBLE_MS = 1150;
  const FINISH_HOLD_MS = 180;
  const HIDE_TRANSITION_MS = 340;
  const startTime = window.performance.now();
  const fontsReady = document.fonts?.ready
    ? document.fonts.ready.catch(() => undefined)
    : Promise.resolve();
  const fontReadyTimeout = new Promise((resolve) => {
    window.setTimeout(resolve, 1400);
  });
  const loaderReadyGate = Promise.race([fontsReady, fontReadyTimeout]);
  let hasHidden = false;
  let hasRevealed = false;
  let progress = 8;
  let animationId = 0;
  let visibleSince = startTime;

  fontsReady.then(() => {
    document.documentElement.classList.add("fonts-ready");
  });

  const revealLoader = () => {
    if (hasRevealed) return;
    hasRevealed = true;
    visibleSince = window.performance.now();
    document.documentElement.classList.add("loader-ready");
  };

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
    revealLoader();
    const elapsed = window.performance.now() - visibleSince;
    const remaining = Math.max(0, MIN_LOADER_VISIBLE_MS - elapsed);

    window.setTimeout(() => {
      window.cancelAnimationFrame(animationId);
      loader.classList.add("is-finishing");
      setProgress(100);

      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        document.body.classList.remove("is-loading");
        document.dispatchEvent(new CustomEvent("videopower:loader-hidden"));

        window.setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, HIDE_TRANSITION_MS);
      }, FINISH_HOLD_MS);
    }, remaining);
  };

  const finalizeLoader = () => {
    loaderReadyGate.then(() => {
      revealLoader();
      hideLoader();
    });
  };

  setProgress(progress);

  if (document.readyState === "complete") {
    finalizeLoader();
    return;
  }

  animationId = window.requestAnimationFrame(animateProgress);
  window.addEventListener("load", finalizeLoader, { once: true });
}

function initHomepagePopup() {
  const popup = document.getElementById("homepage-popup");
  const closeButton = document.getElementById("homepage-popup-close");
  if (!popup || !closeButton) return;
  const POPUP_DELAY_MS = 850;
  let isOpen = false;

  const closePopup = () => {
    if (!isOpen) return;
    isOpen = false;
    popup.classList.remove("is-visible");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("popup-open");
    closeButton.blur();
  };

  const openPopup = () => {
    if (isOpen || document.body.classList.contains("is-loading")) return false;
    isOpen = true;
    popup.classList.add("is-visible");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("popup-open");
    return true;
  };

  const requestOpen = () => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        openPopup();
      });
    }, POPUP_DELAY_MS);
  };

  closeButton.addEventListener("click", closePopup);

  popup.addEventListener("click", (event) => {
    const closer = event.target.closest("[data-popup-close='true']");
    if (closer) {
      closePopup();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePopup();
    }
  });

  if (document.body.classList.contains("is-loading")) {
    document.addEventListener("videopower:loader-hidden", requestOpen, { once: true });
  } else {
    requestOpen();
  }
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

function initFloatingImagesMotion() {
  const images = Array.from(document.querySelectorAll(".floating-images img"));
  if (!images.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const timers = [];
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const profiles = [
    { x: 22, y: 24, z: 54, rx: 12, ry: 34, rz: 20, scale: 0.08, glow: 30, brightness: 0.11 },
    { x: 18, y: 20, z: 46, rx: 9, ry: 28, rz: 24, scale: 0.07, glow: 26, brightness: 0.09 },
    { x: 24, y: 26, z: 58, rx: 13, ry: 38, rz: 18, scale: 0.09, glow: 32, brightness: 0.12 },
    { x: 17, y: 19, z: 42, rx: 8, ry: 24, rz: 22, scale: 0.07, glow: 24, brightness: 0.08 },
    { x: 21, y: 23, z: 50, rx: 11, ry: 32, rz: 26, scale: 0.08, glow: 28, brightness: 0.1 }
  ];

  function applyPose(image, pose, durationMs) {
    image.style.transitionDuration = `${durationMs}ms`;
    image.style.transitionTimingFunction = pose.timing;
    image.style.transform = `
      translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px)
      rotateX(${pose.rx}deg)
      rotateY(${pose.ry}deg)
      rotateZ(${pose.rz}deg)
      scale(${pose.scale})
    `;
    image.style.filter = `
      drop-shadow(0 0 ${pose.glow}px rgba(255, 178, 44, 0.2))
      drop-shadow(0 18px 28px rgba(0, 0, 0, 0.34))
      saturate(${pose.saturate})
      contrast(${pose.contrast})
      brightness(${pose.brightness})
    `;
  }

  function createPose(profile, intensity = 1, drift = 1) {
    const spinBias = randomBetween(0.7, 1.2);

    return {
      x: randomBetween(-profile.x, profile.x) * intensity,
      y: randomBetween(-profile.y, profile.y) * intensity + randomBetween(-5, 14) * drift,
      z: randomBetween(-8, profile.z) * intensity,
      rx: randomBetween(-profile.rx, profile.rx) * intensity,
      ry: randomBetween(-profile.ry, profile.ry) * intensity * spinBias,
      rz: randomBetween(-profile.rz, profile.rz) * intensity,
      scale: clamp(randomBetween(0.99, 1.01 + profile.scale * intensity), 0.97, 1.09),
      glow: clamp(randomBetween(14, profile.glow), 14, 34),
      saturate: clamp(randomBetween(0.98, 1.08 + profile.brightness), 0.96, 1.18),
      contrast: clamp(randomBetween(0.98, 1.08), 0.96, 1.12),
      brightness: clamp(randomBetween(0.97, 1.04 + profile.brightness), 0.95, 1.12),
      timing: [
        "cubic-bezier(0.22, 1, 0.36, 1)",
        "cubic-bezier(0.34, 1.12, 0.64, 1)",
        "cubic-bezier(0.18, 0.96, 0.3, 1)"
      ][Math.floor(randomBetween(0, 3))]
    };
  }

  function scheduleImage(image, profile) {
    const idleDelay = randomBetween(700, 5200);
    const burstTimer = window.setTimeout(() => {
      const activeDuration = randomBetween(2400, 5200);
      const burstIntensity = randomBetween(0.7, 1.18);
      applyPose(image, createPose(profile, burstIntensity, 1), activeDuration);

      const settleTimer = window.setTimeout(() => {
        const settleDuration = randomBetween(2800, 6200);
        applyPose(image, createPose(profile, randomBetween(0.16, 0.34), 0.35), settleDuration);

        const nextTimer = window.setTimeout(() => {
          scheduleImage(image, profile);
        }, randomBetween(900, 4200));

        timers.push(nextTimer);
      }, activeDuration + randomBetween(120, 520));

      timers.push(settleTimer);
    }, idleDelay);

    timers.push(burstTimer);
  }

  images.forEach((image, index) => {
    const profile = profiles[index % profiles.length];
    applyPose(image, createPose(profile, 0.12, 0.18), 0);

    const startTimer = window.setTimeout(() => {
      scheduleImage(image, profile);
    }, randomBetween(0, 3600));

    timers.push(startTimer);
  });

  window.addEventListener("beforeunload", () => {
    timers.forEach((timer) => window.clearTimeout(timer));
  }, { once: true });
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
    let intervalId = 0;
    let unlockTimer = 0;
    let touchStartX = 0;
    let isAnimating = false;

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const hasMultipleSlides = slides.length > 1;
    const transitionDuration = () => (isMobile() ? 560 : 420);

    function stopAutoPlay() {
      if (!intervalId) return;
      window.clearInterval(intervalId);
      intervalId = 0;
    }

    function updateDotsAndTitle() {
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === index);
      });

      if (title && slides[index].dataset.title) {
        title.textContent = slides[index].dataset.title;
      }
    }

    function applyDesktop(animate) {
      track.style.position = "relative";
      track.style.display = "block";
      track.style.transform = "none";
      track.style.transition = "none";

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === index;
        slide.classList.toggle("active", isActive);
        slide.style.position = "absolute";
        slide.style.inset = "0";
        slide.style.minWidth = "auto";
        slide.style.willChange = "transform, opacity";
        slide.style.transition = animate
          ? "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease"
          : "none";
        slide.style.opacity = isActive ? "1" : "0";
        slide.style.transform = isActive ? "translateX(0) scale(1)" : "translateX(32px) scale(0.96)";
        slide.style.zIndex = isActive ? "2" : "1";
      });
    }

    function applyMobile(animate) {
      track.style.position = "static";
      track.style.display = "flex";
      track.style.transition = animate
        ? "transform 0.56s cubic-bezier(0.22, 1, 0.36, 1)"
        : "none";
      track.style.transform = `translateX(-${index * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === index;
        slide.classList.toggle("active", isActive);
        slide.style.position = "relative";
        slide.style.inset = "auto";
        slide.style.minWidth = "100%";
        slide.style.willChange = "transform";
        slide.style.opacity = "1";
        slide.style.transition = animate
          ? "transform 0.56s cubic-bezier(0.22, 1, 0.36, 1)"
          : "none";
        slide.style.transform = isActive ? "scale(1)" : "scale(0.985)";
        slide.style.zIndex = "1";
      });
    }

    function render(options = {}) {
      const { animate = false } = options;
      if (isMobile()) applyMobile(animate);
      else applyDesktop(animate);
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
        if (isAnimating) return;
        goTo(index + 1, false);
      }, delay);
    }

    function setArrowsDisabled(disabled) {
      const shouldDisable = disabled || !hasMultipleSlides;
      if (prevButton) prevButton.disabled = shouldDisable;
      if (nextButton) nextButton.disabled = shouldDisable;
    }

    function unlockNavigation() {
      window.clearTimeout(unlockTimer);
      isAnimating = false;
      carousel.dataset.carouselState = "idle";
      setArrowsDisabled(false);
    }

    function lockNavigation() {
      isAnimating = true;
      carousel.dataset.carouselState = "animating";
      setArrowsDisabled(true);
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        unlockNavigation();
      }, transitionDuration() + 140);
    }

    function goTo(nextIndex, restartAutoPlay = true) {
      if (!hasMultipleSlides || isAnimating) return false;

      lockNavigation();
      index = (nextIndex + slides.length) % slides.length;
      render({ animate: true });

      if (restartAutoPlay) {
        startAutoPlay();
      }

      return true;
    }

    if (prevButton) {
      prevButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (prevButton.disabled || isAnimating) return;
        prevButton.dataset.soundReady = "true";
        goTo(index - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (nextButton.disabled || isAnimating) return;
        nextButton.dataset.soundReady = "true";
        goTo(index + 1);
      });
    }

    carousel.addEventListener("mouseenter", () => {
      if (!isMobile()) stopAutoPlay();
    });

    carousel.addEventListener("mouseleave", () => {
      if (!isMobile()) startAutoPlay();
    });

    carousel.addEventListener("touchstart", (event) => {
      if (event.target.closest(".giveaway-arrow")) return;
      touchStartX = event.changedTouches[0].clientX;
      stopAutoPlay();
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      if (event.target.closest(".giveaway-arrow")) {
        startAutoPlay();
        return;
      }

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
      unlockNavigation();
      render({ animate: false });
      startAutoPlay();
    }, 160));

    render({ animate: false });
    carousel.dataset.carouselState = "idle";
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

function initTouchInteractionCleanup() {
  const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
  if (!touchMedia.matches) return;
  const touchFocusableSelector =
    ".btn, .promo-copy-btn, #bonuses .code-block a, a.footer-nav-link, .main-nav a, .main-nav .nav-social-link, .social-icon, .hamburger";

  const clearTouchStates = () => {
    document.querySelectorAll(".promo-banner.is-button-hovered, .giveaway-card.is-cta-hovered").forEach((element) => {
      element.classList.remove("is-button-hovered", "is-cta-hovered");
    });

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.matches(touchFocusableSelector)) {
      activeElement.blur();
    }

    document.querySelectorAll(touchFocusableSelector).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.blur();
      }
    });

    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.removeAllRanges();
      }
    }
  };

  const scheduleCleanup = () => {
      window.setTimeout(clearTouchStates, 60);
  };

  document.addEventListener("touchend", scheduleCleanup, { passive: true });
  document.addEventListener("touchcancel", clearTouchStates, { passive: true });
  document.addEventListener("contextmenu", clearTouchStates);
  window.addEventListener("pagehide", clearTouchStates);
}

function initPromoCodeCopy() {
  const copyButton = document.querySelector(".promo-copy-btn");
  if (!(copyButton instanceof HTMLButtonElement)) return;

  const codeToCopy = String(copyButton.dataset.copyText || "").trim();
  if (!codeToCopy) return;

  const defaultLabel = copyButton.textContent.trim() || "COPY CODE";
  let resetTimer = 0;

  const setButtonState = (label, className = "") => {
    window.clearTimeout(resetTimer);
    copyButton.textContent = label;
    copyButton.classList.remove("is-copied", "is-error");
    if (className) {
      copyButton.classList.add(className);
    }
    resetTimer = window.setTimeout(() => {
      copyButton.textContent = defaultLabel;
      copyButton.classList.remove("is-copied", "is-error");
    }, 1800);
  };

  const fallbackCopy = () => {
    const helperInput = document.createElement("textarea");
    helperInput.value = codeToCopy;
    helperInput.setAttribute("readonly", "");
    helperInput.style.position = "fixed";
    helperInput.style.top = "-9999px";
    helperInput.style.left = "-9999px";
    document.body.appendChild(helperInput);
    helperInput.focus();
    helperInput.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(helperInput);
    return copied;
  };

  const copyCode = async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(codeToCopy);
        return true;
      } catch (error) {
        return fallbackCopy();
      }
    }

    return fallbackCopy();
  };

  copyButton.addEventListener("click", async () => {
    const copied = await copyCode();
    if (copied) {
      setButtonState("COPIED!", "is-copied");
      return;
    }

    setButtonState("TRY AGAIN", "is-error");
  });
}

function initFaqAccordion() {
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const summary = item.querySelector("summary");
    if (!(summary instanceof HTMLElement)) return;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = item.hasAttribute("open");

      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.removeAttribute("open");
        }
      });

      if (isOpen) {
        item.removeAttribute("open");
      } else {
        item.setAttribute("open", "");
      }

      window.requestAnimationFrame(() => {
        summary.blur();
        item.blur();

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
    });

    summary.addEventListener("pointerup", () => {
      summary.blur();
    });
  });
}

function initSpecialsCountdown() {
  const chips = [...document.querySelectorAll(".countdown-chip[data-countdown-duration-ms], .countdown-chip[data-countdown-target]")];
  if (!chips.length) return;

  const storagePrefix = "videopower-special-countdown-session:";

  const readTargetTime = (chip) => {
    const countdownKey = String(chip.dataset.countdownKey || "").trim();
    const explicitTarget = Date.parse(String(chip.dataset.countdownTarget || "").trim());
    const durationMs = Number(chip.dataset.countdownDurationMs || 0);

    if (Number.isFinite(explicitTarget) && explicitTarget > 0) {
      return explicitTarget;
    }

    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      return null;
    }

    const now = Date.now();

    if (!countdownKey) {
      return now + durationMs;
    }

    try {
      const storageKey = `${storagePrefix}${countdownKey}`;
      const savedTarget = Number(window.sessionStorage.getItem(storageKey));
      if (Number.isFinite(savedTarget) && savedTarget > now) {
        return savedTarget;
      }

      const nextTarget = now + durationMs;
      window.sessionStorage.setItem(storageKey, String(nextTarget));
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
    if (remainingMs <= 0) return "EVENT HAS ENDED";

    const totalMinutes = Math.floor(remainingMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return `ENDS IN ${days}D ${hours}H ${minutes}MIN`;
  };

  const renderCountdowns = () => {
    const now = Date.now();
    countdownTargets.forEach((targetTime, chip) => {
      const remaining = targetTime - now;
      chip.textContent = formatCountdown(remaining);
      chip.dataset.countdownEnded = remaining <= 0 ? "true" : "false";
    });
  };

  renderCountdowns();
  window.setInterval(renderCountdowns, 1000);
}

function initYoutubeVideos() {
  const container = document.getElementById("videos-grid");
  if (!container) return;

  const MAX_RESULTS = 5;
  const channelFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(YOUTUBE_CHANNEL_ID)}`;

  const fallbackVideos = [
    {
      title: "CHECK OUT THE VIDEOPOWER CHANNEL.",
      url: "https://www.youtube.com/@VideoPower_cs",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1",
      type: "VIDEO"
    },
    {
      title: "CHECK OUT VIDEOPOWER VIDEOS.",
      url: "https://www.youtube.com/@VideoPower_cs/videos",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1",
      type: "VIDEO"
    },
    {
      title: "CHECK OUT VIDEOPOWER SHORTS.",
      url: "https://www.youtube.com/@VideoPower_cs/shorts",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1",
      type: "SHORT"
    },
    {
      title: "CHECK OUT VIDEOPOWER COMMUNITY PAGE.",
      url: "https://www.youtube.com/@VideoPower_cs/community",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1",
      type: "COMMUNITY"
    },
    {
      title: "CHECK OUT VIDEOPOWER PLAYLISTS.",
      url: "https://www.youtube.com/@VideoPower_cs/playlists",
      image: "https://yt3.ggpht.com/PZjQ4YWcWgdS5jBH6zKqCJvKxIjX2lMv4fGL5Ra--6uhPibujxW0AWfQrAUqJNYgUrwA3ZZwmGwvEw=s607-c-fcrop64=1,380f0000c7f0ffff-rw-nd-v1",
      type: "PLAYLIST"
    }
  ];

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

  function createMeta(className, iconSrc, text) {
    const meta = document.createElement("span");
    meta.className = className;

    const icon = document.createElement("img");
    icon.className = className === "video-date" ? "clock-icon" : "duration-icon";
    icon.src = iconSrc;
    icon.alt = className === "video-date" ? "Clock" : "Duration";

    meta.append(icon, document.createTextNode(text));
    return meta;
  }

  function resolveVideoType(video) {
    const explicitType = String(video.type || "").trim().toUpperCase();
    if (explicitType === "COMMUNITY" || explicitType === "PLAYLIST") return explicitType;
    if (explicitType === "SHORT" || explicitType === "VIDEO") return explicitType;

    const durationSeconds = Number(video.durationSeconds || 0);
    const url = String(video.url || "").toLowerCase();
    const title = String(video.title || "").toLowerCase();
    const length = String(video.length || "").toLowerCase();
    const hasVideoStyleTitle = title.includes("(") && title.includes(")");
    const hasShortStyleKeyword = /\bkills?\b/.test(title);

    const shortMatch = length.match(/(\d+)\s*min/);
    const shortMinutes = shortMatch ? Number.parseInt(shortMatch[1], 10) : Number.NaN;

    if (hasVideoStyleTitle) return "VIDEO";
    if (hasShortStyleKeyword) return "SHORT";
    if (url.includes("/shorts") || title.includes("#shorts")) return "SHORT";
    if (durationSeconds > 0 && durationSeconds <= 90) return "SHORT";
    if (durationSeconds > 90) return "VIDEO";
    if (Number.isFinite(shortMinutes) && shortMinutes < 2) return "SHORT";
    if (Number.isFinite(shortMinutes) && shortMinutes >= 2) return "VIDEO";
    if (!shortMatch && length.includes("sec")) return "SHORT";
    if (url.includes("/community")) return "COMMUNITY";
    if (url.includes("/playlists") || title.includes("playlist")) return "PLAYLIST";
    return "VIDEO";
  }

  function createCard(video, index) {
    const card = document.createElement("a");
    card.className = "video-card";
    card.href = video.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const videoType = resolveVideoType(video);
    card.classList.add(`video-card--type-${videoType.toLowerCase()}`);

    const badge = document.createElement("span");
    badge.className = "video-card__badge";
    badge.textContent = videoType;

    const image = document.createElement("img");
    image.src = video.image;
    image.alt = video.title;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "video-info";
    const hasDate = Boolean(video.date);
    const hasLength = Boolean(video.length);

    if (!hasDate && !hasLength) {
      info.classList.add("video-info--compact");
      card.classList.add("video-card--fallback");
    }

    const title = document.createElement("h3");
    title.textContent = video.title;
    info.append(title);

    if (hasDate) {
      const date = createMeta(
        "video-date",
        "https://cdn-icons-png.freepik.com/512/11738/11738460.png?ga=GA1.1.292190565.1765117586",
        video.date
      );
      info.append(date);
    }

    if (hasLength) {
      const length = createMeta(
        "video-length",
        "https://cdn-icons-png.freepik.com/512/12000/12000206.png?ga=GA1.1.292190565.1765117586",
        video.length
      );
      info.append(length);
    }

    card.append(badge, image, info);
    return card;
  }

  function renderVideos(videos) {
    container.innerHTML = "";
    videos.forEach((video, index) => {
      container.appendChild(createCard(video, index));
    });
  }

  function formatPublishedDate(value) {
    const parsed = Date.parse(String(value || ""));
    if (Number.isNaN(parsed)) return "";

    return new Date(parsed).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function parseIsoDurationToSeconds(value) {
    const match = String(value || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const days = Number.parseInt(match[1] || "0", 10);
    const hours = Number.parseInt(match[2] || "0", 10);
    const minutes = Number.parseInt(match[3] || "0", 10);
    const seconds = Number.parseInt(match[4] || "0", 10);

    return (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
  }

  function formatDurationFromSeconds(totalSeconds) {
    const secondsValue = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(secondsValue / 3600);
    const minutes = Math.floor((secondsValue % 3600) / 60);
    const seconds = secondsValue % 60;
    const parts = [];

    if (hours > 0) parts.push(`${hours} H`);
    if (minutes > 0) parts.push(`${minutes} Min`);
    if (hours === 0 && minutes === 0) parts.push(`${seconds} Sec`);
    else if (seconds > 0) parts.push(`${seconds} Sec`);

    return parts.join(" ");
  }

  function getVideoIdFromUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";

    try {
      const parsed = new URL(url);
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v") || "";
      }

      const pathnameParts = parsed.pathname.split("/").filter(Boolean);
      return pathnameParts[pathnameParts.length - 1] || "";
    } catch (error) {
      const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[/?&#]|$)/);
      return match?.[1] || "";
    }
  }

  function normalizeFeedVideos(items) {
    return items
      .map((item) => {
        const rawLink = item.link || item.guid || item.url || "";
        const videoId = getVideoIdFromUrl(rawLink);
        const title = String(item.title || "").trim();
        const image =
          String(item.thumbnail || item.enclosure?.link || "").trim() ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

        return {
          title,
          url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawLink,
          image,
          date: formatPublishedDate(item.pubDate || item.published || item.isoDate || ""),
          length: "",
          videoId,
          durationSeconds: 0
        };
      })
      .filter((video) => video.title && video.url)
      .slice(0, MAX_RESULTS);
  }

  function parseXmlVideos(xmlText) {
    const parser = new DOMParser();
    const xmlDocument = parser.parseFromString(xmlText, "application/xml");
    const entries = [...xmlDocument.querySelectorAll("entry")].slice(0, MAX_RESULTS);

    return entries
      .map((entry) => {
        const videoId =
          entry.getElementsByTagName("yt:videoId")[0]?.textContent?.trim() ||
          entry.getElementsByTagName("videoId")[0]?.textContent?.trim() ||
          "";
        const title = entry.getElementsByTagName("title")[0]?.textContent?.trim() || "";
        const published = entry.getElementsByTagName("published")[0]?.textContent?.trim() || "";

        return {
          title,
          url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          image: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
          date: formatPublishedDate(published),
          length: "",
          videoId,
          durationSeconds: 0
        };
      })
      .filter((video) => video.title && video.url);
  }

  async function fetchVideosFromRss2Json() {
    const rss2JsonUrl = new URL("https://api.rss2json.com/v1/api.json");
    rss2JsonUrl.search = new URLSearchParams({
      rss_url: channelFeedUrl,
      count: String(MAX_RESULTS)
    }).toString();

    const response = await fetch(rss2JsonUrl.toString(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) throw new Error("rss2json request failed.");
    const payload = await response.json();
    const videos = normalizeFeedVideos(Array.isArray(payload.items) ? payload.items : []);
    if (!videos.length) throw new Error("rss2json returned no videos.");
    return videos;
  }

  async function fetchVideosFromXmlProxy(proxyBaseUrl) {
    const response = await fetch(`${proxyBaseUrl}${encodeURIComponent(channelFeedUrl)}`, {
      headers: {
        Accept: "application/xml,text/xml"
      }
    });

    if (!response.ok) throw new Error("XML proxy request failed.");
    const xmlText = await response.text();
    const videos = parseXmlVideos(xmlText);
    if (!videos.length) throw new Error("XML proxy returned no videos.");
    return videos;
  }

  async function fetchVideosDirectXml() {
    const response = await fetch(channelFeedUrl, {
      headers: {
        Accept: "application/xml,text/xml"
      }
    });

    if (!response.ok) throw new Error("Direct feed request failed.");
    const xmlText = await response.text();
    const videos = parseXmlVideos(xmlText);
    if (!videos.length) throw new Error("Direct feed returned no videos.");
    return videos;
  }

  function parseDurationFromVideoPage(htmlText) {
    const source = String(htmlText || "");
    const approxDurationMatch = source.match(/"approxDurationMs":"(\d+)"/);
    if (approxDurationMatch) {
      return Math.round(Number.parseInt(approxDurationMatch[1], 10) / 1000);
    }

    const lengthSecondsMatch = source.match(/"lengthSeconds":"(\d+)"/);
    if (lengthSecondsMatch) {
      return Number.parseInt(lengthSecondsMatch[1], 10);
    }

    const isoDurationMatch = source.match(/"duration":"(P[^"]+)"/);
    if (isoDurationMatch) {
      return parseIsoDurationToSeconds(isoDurationMatch[1]);
    }

    return 0;
  }

  async function fetchDurationFromVideoPage(proxyBaseUrl, video) {
    const videoUrl = String(video.url || "").trim();
    if (!videoUrl) throw new Error("Missing video URL.");

    const response = await fetch(`${proxyBaseUrl}${encodeURIComponent(videoUrl)}`, {
      headers: {
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error("Video page proxy request failed.");
    }

    const htmlText = await response.text();
    const durationSeconds = parseDurationFromVideoPage(htmlText);
    if (!durationSeconds) {
      throw new Error("Duration not found in video page.");
    }

    return durationSeconds;
  }

  async function fetchVideoDurationSeconds(video) {
    const strategies = [
      () => fetchDurationFromVideoPage("https://api.allorigins.win/raw?url=", video),
      () => fetchDurationFromVideoPage("https://api.codetabs.com/v1/proxy/?quest=", video)
    ];

    for (const strategy of strategies) {
      try {
        const durationSeconds = await strategy();
        if (durationSeconds > 0) {
          return durationSeconds;
        }
      } catch (error) {
        continue;
      }
    }

    return 0;
  }

  async function hydrateVideoDurations(videos) {
    if (!videos.length) return videos;

    const updatedVideos = await Promise.all(
      videos.map(async (video) => {
        const durationSeconds = await fetchVideoDurationSeconds(video);
        return {
          ...video,
          durationSeconds,
          length: durationSeconds > 0 ? formatDurationFromSeconds(durationSeconds) : video.length
        };
      })
    );

    return updatedVideos;
  }

  async function fetchVideos() {
    const strategyPromises = [
      fetchVideosFromRss2Json(),
      fetchVideosFromXmlProxy("https://api.allorigins.win/raw?url="),
      fetchVideosFromXmlProxy("https://api.codetabs.com/v1/proxy/?quest="),
      fetchVideosDirectXml()
    ];

    if (typeof Promise.any === "function") {
      return Promise.any(strategyPromises);
    }

    for (const strategyPromise of strategyPromises) {
      try {
        const videos = await strategyPromise;
        if (videos.length) {
          return videos;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error("No client-side video source returned data.");
  }

  renderLoading();

  fetchVideos()
    .then((videos) => {
      renderVideos(videos);

      return hydrateVideoDurations(videos)
        .then((videosWithDurations) => {
          renderVideos(videosWithDurations);
        })
        .catch(() => undefined);
    })
    .catch(() => renderVideos(fallbackVideos));
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
    nav.scrollTop = 0;
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

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobile()) closeMenu();
    });
  });

  nav.addEventListener("click", (event) => {
    if (!isMobile()) return;
    if (event.target === nav) {
      closeMenu();
    }
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

  window.addEventListener("resize", debounce(() => {
    if (!isMobile()) {
      closeMenu();
    } else {
      syncNavAccessibility();
    }
  }, 120));

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
    if (control.matches("#promo-code, .promo-copy-btn")) return "bonus";
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
      ".main-nav a, .footer-nav a, .btn, .promo-copy-btn, .video-card, #promo-code, .social-icon, .code-block a, .promo-banner, .giveaway-arrow, .hamburger"
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
