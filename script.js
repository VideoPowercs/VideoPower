if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const YOUTUBE_CHANNEL_IDS = [
  "UCjwNlVuvjU9ZLuenZM1mAXA",
  "UCVQXiCVDW0rF2a9pCv1pR-g"
];

const YOUTUBE_CHANNEL_NAMES = ["VIDEOPOWER 2", "VIDEOPOWER"];

const SHARED_EXTERNAL_DRAG_LINK_SELECTOR = [
  ".main-header .logo-link[href]",
  ".main-header .main-nav a[href]",
  ".hero-buttons #giveaways-button[href]",
  ".hero-buttons #partners-button[href]",
  ".hero .hero-explore[href]",
  "#videos .video-card[href]",
  "#giveaways .giveaway-card--shinobu[href]"
].join(", ");

const ALLOWED_EXTERNAL_DRAG_LINK_SELECTOR = [
  "#bonuses .bonus-reward-card__surface-link[href]",
  "#news .news-team-action[href]",
  SHARED_EXTERNAL_DRAG_LINK_SELECTOR
].join(", ");

document.addEventListener("DOMContentLoaded", () => {
  initPageLoader();
  initReloadGuard();
  initScrollReset();
  initHeaderScrollState();
  initCustomScrollbar();
  disableContextActions();
  initSharedExternalLinkDragging();
  initShinobuGiveawayReturnState();
  initHomepagePopup();
  initHomeNavigationState();
  initHamburgerMenu();
  initTouchInteractionCleanup();
  initHeroCodeCopy();
  initPromoCodeCopy();
  initHeroGiveawaysClickFeedback();
  initNewsTeamButtonPress();
  initScrollReveal();

  let enhancementsStarted = false;
  const runDeferredEnhancements = () => {
    if (enhancementsStarted) return;
    enhancementsStarted = true;
    initStars();
    initFloatingImagesMotion();
    initNewsShowcase();
    initGiveawayCarousel();
    initGiveawayButtonHover();
    initBonusClaimButtonCleanup();
    initYoutubeVideos();
    initImageWarmCache();
  };

  window.requestAnimationFrame(runDeferredEnhancements);
});

function initHomeNavigationState() {
  const homeUrl = "https://videopowercodes.com/";
  const navLinks = Array.from(document.querySelectorAll(".main-nav > a, .footer-nav a"));
  const routeTargets = {
    "/bonuses": "bonuses",
    "/socials": "news",
    "/videos": "videos",
    "/giveaways": "giveaways"
  };
  if (!navLinks.length) return;

  const isHomeHref = (href) => {
    if (!href) return false;
    const normalized = href.replace(/\/+$/, "");
    return normalized === homeUrl.replace(/\/+$/, "");
  };

  const getRouteTarget = () => routeTargets[window.location.pathname.toLowerCase()] || "";
  const getLocationTarget = () => {
    const hashTarget = window.location.hash.replace(/^#/, "");
    if (trackedSections.some((section) => section.id === hashTarget)) return hashTarget;
    return getRouteTarget();
  };

  const header = document.querySelector(".main-header");
  const trackedSections = ["bonuses", "news", "videos", "giveaways"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  let navigationScrollSequence = 0;

  const getVisibleTarget = () => {
    const probeY = (header?.offsetHeight || 0) + Math.min(window.innerHeight * 0.22, 160);
    let activeTarget = "home";

    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= probeY) activeTarget = section.id;
    });

    return activeTarget;
  };

  const scrollToSection = (targetId) => {
    const scrollSequence = ++navigationScrollSequence;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (targetId === "home") {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }

    const section = document.getElementById(targetId);
    if (!section) return;
    // Match each section's intended position below the fixed header.
    const breathingRoom = {
      bonuses: 36,
      giveaways: 24,
      news: 0,
      videos: 0
    }[targetId] || 0;
    const getTargetTop = () => {
      const headerHeight = header?.getBoundingClientRect().height || 0;
      return Math.max(
        0,
        window.scrollY + section.getBoundingClientRect().top - headerHeight - breathingRoom
      );
    };

    window.scrollTo({
      top: getTargetTop(),
      behavior: reduceMotion ? "auto" : "smooth"
    });

    // The fixed header changes height after scrolling. Recalculate once the
    // smooth movement has settled so it cannot cover or shift the section.
    if (!reduceMotion) {
      window.setTimeout(() => {
        if (scrollSequence !== navigationScrollSequence) return;
        const correctedTop = getTargetTop();
        if (Math.abs(window.scrollY - correctedTop) < 2) return;
        window.scrollTo({ top: correctedTop, behavior: "auto" });
      }, 700);
    }
  };

  const syncActiveState = () => {
    const activeTarget = getVisibleTarget();

    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const linkTarget = isHomeHref(href) ? "home" : link.dataset.sectionTarget || "";
      const shouldBeActive = Boolean(linkTarget) && linkTarget === activeTarget;

      link.classList.toggle("is-active", shouldBeActive);
      if (shouldBeActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const target = link.dataset.sectionTarget || (isHomeHref(href) ? "home" : "");
    if (!target) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToSection(target);

      if (window.history && window.history.pushState) {
        try {
          const destination = new URL(href, window.location.href);
          const historyUrl = destination.origin === window.location.origin
            ? `${destination.pathname}${destination.search}${destination.hash}`
            : target === "home"
              ? `${window.location.pathname}${window.location.search}`
              : `#${target}`;
          window.history.pushState(null, "", historyUrl);
        } catch (error) {
          const safeLocalUrl = target === "home"
            ? `${window.location.pathname}${window.location.search}`
            : `#${target}`;
          window.history.pushState(null, "", safeLocalUrl);
        }
      }

      syncActiveState();
    });
  });

  let activeFrame = 0;
  const requestActiveSync = () => {
    if (activeFrame) return;
    activeFrame = window.requestAnimationFrame(() => {
      activeFrame = 0;
      syncActiveState();
    });
  };

  const syncHistoryLocation = () => {
    scrollToSection(getLocationTarget() || "home");
    syncActiveState();
  };

  syncActiveState();
  const initialLocationTarget = getLocationTarget();
  if (initialLocationTarget) {
    window.requestAnimationFrame(() => scrollToSection(initialLocationTarget));
  }
  window.addEventListener("scroll", requestActiveSync, { passive: true });
  window.addEventListener("resize", requestActiveSync);
  window.addEventListener("hashchange", syncHistoryLocation);
  window.addEventListener("popstate", syncHistoryLocation);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncHistoryLocation();
    else requestActiveSync();
  });
}

function initHeroCodeCopy() {
  const button = document.querySelector("[data-hero-copy-code]");
  if (!(button instanceof HTMLButtonElement)) return;

  const code = String(button.dataset.heroCopyCode || "").trim();
  if (!code) return;

  let resetTimer = 0;

  const fallbackCopy = () => {
    const helper = document.createElement("textarea");
    helper.value = code;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-9999px";
    document.body.appendChild(helper);
    helper.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    helper.remove();
    return copied;
  };

  const copyCode = async () => {
    if (!navigator.clipboard?.writeText) return fallbackCopy();

    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (error) {
      return fallbackCopy();
    }
  };

  button.addEventListener("click", async () => {
    if (button.classList.contains("is-copied")) return;

    await copyCode();

    window.clearTimeout(resetTimer);
    button.textContent = "Copied!";
    button.classList.add("is-copied");
    button.setAttribute("aria-label", "Code VIDEOPOWER copied");

    resetTimer = window.setTimeout(() => {
      button.textContent = code;
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", "Copy code VIDEOPOWER");
      button.blur();
    }, 1500);
  });
}

function initHeroGiveawaysClickFeedback() {
  ["giveaways-button", "partners-button"].forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    if (!(button instanceof HTMLAnchorElement)) return;

    let feedbackTimer = 0;

    const clearFeedback = () => {
      window.clearTimeout(feedbackTimer);
      feedbackTimer = 0;
      button.classList.remove("is-click-confirmed");
    };

    const playFeedback = () => {
      clearFeedback();
      void button.offsetWidth;
      button.classList.add("is-click-confirmed");
      feedbackTimer = window.setTimeout(() => {
        button.classList.remove("is-click-confirmed");
        feedbackTimer = 0;
      }, 140);
    };

    button.addEventListener("pointerdown", clearFeedback);
    button.addEventListener("pointercancel", clearFeedback);
    button.addEventListener("dragstart", clearFeedback);
    button.addEventListener("click", playFeedback);
  });
}

function initReloadGuard() {
  const LOCK_KEY = "videopowerReloadLockedUntil";
  const RELOAD_LOCK_MS = 5200;

  const now = () => Date.now();
  const getLockedUntil = () => Number(window.sessionStorage.getItem(LOCK_KEY) || 0);
  const isLocked = () => getLockedUntil() > now();
  let allowCurrentReload = false;
  const lockReload = () => {
    window.sessionStorage.setItem(LOCK_KEY, String(now() + RELOAD_LOCK_MS));
  };
  const unlockReload = () => {
    window.sessionStorage.removeItem(LOCK_KEY);
  };

  window.__videopowerUnlockReload = unlockReload;

  document.addEventListener("keydown", (event) => {
    const isReloadShortcut =
      event.key === "F5" ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

    if (!isReloadShortcut) return;

    if (isLocked()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    lockReload();
    allowCurrentReload = true;
  }, { capture: true });

  window.addEventListener("beforeunload", (event) => {
    if (allowCurrentReload) {
      allowCurrentReload = false;
      return undefined;
    }

    if (isLocked()) {
      event.preventDefault();
      event.returnValue = "";
      return "";
    }

    lockReload();
    return undefined;
  });
}

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
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetToTop();
  }, { once: true });
}

function initHeaderScrollState() {
  const root = document.documentElement;
  let updateFrame = 0;

  const sync = () => {
    updateFrame = 0;
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    root.classList.toggle("is-header-scrolled", scrollTop > 4);
  };

  const scheduleSync = () => {
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(sync);
  };

  sync();
  window.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync, { passive: true });
  window.addEventListener("pageshow", scheduleSync);
  window.addEventListener("load", scheduleSync, { once: true });
}

function initCustomScrollbar() {
  const existingTrack = document.querySelector(".vp-scrollbar");
  const track = existingTrack instanceof HTMLElement
    ? existingTrack
    : document.createElement("div");
  const existingThumb = track.querySelector(".vp-scrollbar__thumb");
  const thumb = existingThumb instanceof HTMLElement
    ? existingThumb
    : document.createElement("div");

  if (track.dataset.scrollbarReady === "true") return;

  let isDragging = false;
  let dragPointerOffset = 0;
  let dragCaptureTarget = null;
  let updateFrame = 0;

  track.className = "vp-scrollbar";
  track.setAttribute("aria-hidden", "true");
  thumb.className = "vp-scrollbar__thumb";
  if (!track.contains(thumb)) track.appendChild(thumb);
  if (!track.isConnected) document.body.appendChild(track);
  track.dataset.scrollbarReady = "true";
  document.documentElement.classList.add("has-custom-scrollbar");

  const getMetrics = () => {
    const root = document.documentElement;
    const viewportHeight = window.innerHeight;
    const scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
    const maxScrollTop = Math.max(0, scrollHeight - viewportHeight);
    const trackHeight = track.clientHeight || viewportHeight;
    const trackInset = 0;
    const usableTrackHeight = Math.max(0, trackHeight - (trackInset * 2));
    const thumbHeight = Math.min(
      usableTrackHeight,
      Math.max(140, usableTrackHeight * (viewportHeight / scrollHeight))
    );
    const maxThumbTop = Math.max(0, usableTrackHeight - thumbHeight);

    return { maxScrollTop, thumbHeight, maxThumbTop, trackInset };
  };

  const update = () => {
    updateFrame = 0;
    const { maxScrollTop, thumbHeight, maxThumbTop, trackInset } = getMetrics();
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const thumbTop = trackInset + (maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0);

    track.classList.toggle("is-hidden", maxScrollTop <= 0);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${thumbTop}px, 0)`;
  };

  const scheduleUpdate = () => {
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(update);
  };

  const setScrollTop = (top) => {
    const { maxScrollTop } = getMetrics();
    const scrollingElement = document.scrollingElement || document.documentElement;
    scrollingElement.scrollTop = Math.max(0, Math.min(maxScrollTop, top));
    update();
  };

  const beginDragging = (event, pointerOffset, captureTarget) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    isDragging = true;
    dragPointerOffset = pointerOffset;
    dragCaptureTarget = captureTarget;
    document.documentElement.classList.add("is-scrollbar-dragging");
    document.body.classList.add("is-scrollbar-dragging");
    thumb.classList.add("is-dragging");

    if (
      event.pointerId !== undefined
      && typeof captureTarget?.setPointerCapture === "function"
    ) {
      captureTarget.setPointerCapture(event.pointerId);
    }
  };

  thumb.addEventListener("pointerdown", (event) => {
    beginDragging(
      event,
      event.clientY - thumb.getBoundingClientRect().top,
      thumb
    );
  });

  const moveThumb = (event) => {
    if (!isDragging) return;
    event.preventDefault();
    const { maxScrollTop, maxThumbTop, trackInset } = getMetrics();
    if (maxThumbTop <= 0) return;
    const rect = track.getBoundingClientRect();
    const thumbTop = Math.max(
      0,
      Math.min(maxThumbTop, event.clientY - rect.top - trackInset - dragPointerOffset)
    );
    setScrollTop((thumbTop / maxThumbTop) * maxScrollTop);
  };

  window.addEventListener("pointermove", moveThumb, { passive: false });

  const release = (event) => {
    if (!isDragging) return;
    isDragging = false;
    const captureTarget = dragCaptureTarget;
    dragCaptureTarget = null;
    if (
      event.pointerId !== undefined
      && typeof captureTarget?.hasPointerCapture === "function"
      && captureTarget.hasPointerCapture(event.pointerId)
    ) {
      captureTarget.releasePointerCapture(event.pointerId);
    }
    thumb.classList.remove("is-dragging");
    document.documentElement.classList.remove("is-scrollbar-dragging");
    document.body.classList.remove("is-scrollbar-dragging");
    scheduleUpdate();
  };

  thumb.addEventListener("pointerup", release);
  thumb.addEventListener("pointercancel", release);
  thumb.addEventListener("lostpointercapture", release);
  track.addEventListener("lostpointercapture", release);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", () => release({}));

  const setHovered = () => track.classList.add("is-hovered");
  track.addEventListener("pointerenter", setHovered);
  track.addEventListener("pointermove", setHovered);
  track.addEventListener("pointerleave", () => {
    if (!isDragging) track.classList.remove("is-hovered");
  });
  window.addEventListener("pointermove", (event) => {
    const rect = track.getBoundingClientRect();
    const isInsideTrack =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    track.classList.toggle("is-hovered", isDragging || isInsideTrack);
  }, { passive: true });

  track.addEventListener("pointerdown", (event) => {
    if (event.target === thumb) return;
    if (event.button !== 0) return;
    const { maxScrollTop, maxThumbTop, trackInset } = getMetrics();
    const rect = track.getBoundingClientRect();
    const thumbTop = Math.max(
      0,
      Math.min(maxThumbTop, event.clientY - rect.top - trackInset - (thumb.clientHeight / 2))
    );
    setScrollTop(maxThumbTop > 0 ? (thumbTop / maxThumbTop) * maxScrollTop : 0);
    beginDragging(event, thumb.clientHeight / 2, track);
  });

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("load", scheduleUpdate, { once: true });
  scheduleUpdate();
}

function initBlockedPageKeys() {
  document.addEventListener("keydown", (event) => {
    const isDesktop = window.matchMedia("(min-width: 861px)").matches;
    const blockedKeys = isDesktop
      ? new Set(["PageUp", "PageDown", "ArrowUp", "ArrowDown"])
      : new Set(["PageUp", "PageDown"]);

    if (blockedKeys.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });
}

function initDisableMiddleClickScroll() {
  const blockMiddleClick = (event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener("mousedown", blockMiddleClick, { capture: true });
  document.addEventListener("mouseup", blockMiddleClick, { capture: true });
  document.addEventListener("auxclick", blockMiddleClick, { capture: true });
}

function initPageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  document.documentElement.classList.remove("loader-ready");
  document.documentElement.classList.add("is-loading");
  const MIN_LOADER_VISIBLE_MS = 760;
  const MAX_LOADER_VISIBLE_MS = 2200;
  const FINISH_HOLD_MS = 100;
  const HIDE_TRANSITION_MS = 260;
  const ENTERING_SCROLL_LOCK_MS = 120;
  const startTime = window.performance.now();
  let hasHidden = false;
  let fallbackTimer = 0;

  const isLoading = () => document.body.classList.contains("is-loading");
  const preventScrollDuringLoading = (event) => {
    if (isLoading()) event.preventDefault();
  };

  const preventScrollKeysDuringLoading = (event) => {
    const scrollKeys = new Set([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);
    if (isLoading() && scrollKeys.has(event.key)) {
      event.preventDefault();
    }
  };

  window.addEventListener("wheel", preventScrollDuringLoading, { passive: false });
  window.addEventListener("touchmove", preventScrollDuringLoading, { passive: false });
  window.addEventListener("keydown", preventScrollKeysDuringLoading);

  const revealLoader = () => {
    document.documentElement.classList.add("loader-ready");
  };

  const hideLoader = () => {
    if (hasHidden) return;
    hasHidden = true;
    window.clearTimeout(fallbackTimer);
    const elapsed = window.performance.now() - startTime;
    const remaining = Math.max(0, MIN_LOADER_VISIBLE_MS - elapsed);

    window.setTimeout(() => {
      loader.classList.add("is-finishing");

      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        document.body.classList.add("is-entering");
        document.documentElement.classList.add("is-entering");
        document.body.classList.remove("is-loading");
        document.documentElement.classList.remove("is-loading");
        window.removeEventListener("wheel", preventScrollDuringLoading);
        window.removeEventListener("touchmove", preventScrollDuringLoading);
        window.removeEventListener("keydown", preventScrollKeysDuringLoading);
        if (typeof window.__videopowerUnlockReload === "function") {
          window.__videopowerUnlockReload();
        }
        document.dispatchEvent(new CustomEvent("videopower:loader-hidden"));

        window.setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, HIDE_TRANSITION_MS);

        window.setTimeout(() => {
          document.body.classList.remove("is-entering");
          document.documentElement.classList.remove("is-entering");
        }, ENTERING_SCROLL_LOCK_MS);
      }, FINISH_HOLD_MS);
    }, remaining);
  };

  window.requestAnimationFrame(() => {
    revealLoader();
  });

  fallbackTimer = window.setTimeout(() => {
    hideLoader();
  }, MAX_LOADER_VISIBLE_MS);

  if (document.readyState === "complete") {
    hideLoader();
    return;
  }

  window.addEventListener("load", hideLoader, { once: true });
  window.addEventListener("pagehide", () => {
    window.clearTimeout(fallbackTimer);
  }, { once: true });
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
    if (
      isOpen ||
      document.body.classList.contains("is-loading") ||
      window.getComputedStyle(popup).display === "none"
    ) {
      return false;
    }
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
  document.addEventListener("dragstart", (event) => {
    if (
      event.target instanceof Element
      && event.target.closest(ALLOWED_EXTERNAL_DRAG_LINK_SELECTOR)
    ) {
      return;
    }
    event.preventDefault();
  });
  document.querySelectorAll("img").forEach((image) => {
    image.setAttribute("draggable", "false");
    if (!image.hasAttribute("decoding")) {
      image.decoding = "async";
    }
    if (image.loading === "lazy" && "fetchPriority" in image) {
      image.fetchPriority = "low";
    }
  });
}

let externalLinkDragImage = null;

function getExternalLinkDragImage() {
  if (externalLinkDragImage?.isConnected) return externalLinkDragImage;

  const canvas = document.createElement("canvas");
  canvas.className = "external-link-drag-image";
  canvas.width = 1;
  canvas.height = 1;
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  externalLinkDragImage = canvas;
  return canvas;
}

function setExternalLinkDragData(event, url, hidePreview = false) {
  if (!event.dataTransfer || !url) return;

  event.dataTransfer.effectAllowed = "link";
  event.dataTransfer.setData("text/uri-list", url);
  event.dataTransfer.setData("text/plain", url);

  if (hidePreview && typeof event.dataTransfer.setDragImage === "function") {
    event.dataTransfer.setDragImage(getExternalLinkDragImage(), 0, 0);
  }
}

function enableExternalLinkDragging(link) {
  if (!(link instanceof HTMLAnchorElement)) return;
  if (link.dataset.externalLinkDragReady === "true") return;

  const settle = () => {
    link.classList.remove("is-link-dragging");
  };

  link.dataset.externalLinkDragReady = "true";
  link.draggable = true;
  link.setAttribute("draggable", "true");
  link.addEventListener("pointerdown", settle);
  link.addEventListener("dragstart", (event) => {
    setExternalLinkDragData(event, link.href);
    link.classList.add("is-link-dragging");
  });
  link.addEventListener("dragend", settle);
  link.addEventListener("pointercancel", settle);
  link.addEventListener("click", settle);
  link.addEventListener("blur", settle);
}

function initSharedExternalLinkDragging() {
  getExternalLinkDragImage();
  document
    .querySelectorAll(SHARED_EXTERNAL_DRAG_LINK_SELECTOR)
    .forEach(enableExternalLinkDragging);
}

function initShinobuGiveawayReturnState() {
  const cards = document.querySelectorAll("#giveaways .giveaway-card--shinobu[href]");
  cards.forEach((card) => {
    if (!(card instanceof HTMLAnchorElement)) return;

  const holdAtRest = () => {
    card.classList.add("is-return-resting");
    card.blur();
  };

  card.addEventListener("click", () => {
    card.dataset.awaitingReturn = "true";
    holdAtRest();
  });

  card.addEventListener("dragstart", () => {
    card.dataset.awaitingReturn = "true";
    holdAtRest();
  });

  card.addEventListener("dragend", () => {
    delete card.dataset.awaitingReturn;
    holdAtRest();
    window.setTimeout(() => {
      if (!card.matches(":hover")) card.classList.remove("is-return-resting");
    }, 0);
  });

  card.addEventListener("pointerleave", () => {
    delete card.dataset.awaitingReturn;
    card.classList.remove("is-return-resting");
  });

  const resetAfterReturn = () => {
    if (card.dataset.awaitingReturn === "true") holdAtRest();
  };

  window.addEventListener("pageshow", resetAfterReturn);
  window.addEventListener("focus", resetAfterReturn);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resetAfterReturn();
  });
  });
}

function initImageWarmCache() {
  const warmedElements = new WeakSet();
  const warmedUrls = new Set();
  const queue = [];
  const MAX_ACTIVE_WARMS = 3;
  const CRITICAL_IMAGE_SELECTOR = ".vp-logo-mark, .logo, .footer-vp-logo-mark, .footer-logo, .floating-images img";
  let activeWarms = 0;
  let pumpScheduled = false;
  let imageObserver = null;

  const runWhenIdle = (callback, timeout = 1200) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout });
      return;
    }

    window.setTimeout(callback, Math.min(timeout, 450));
  };

  const getImageUrl = (image) => image.currentSrc || image.src || image.getAttribute("src") || "";

  const setImagePriority = (image, priority) => {
    image.decoding = "async";

    if ("fetchPriority" in image) {
      image.fetchPriority = priority === "critical" ? "high" : "low";
    }

    if (priority === "critical" && image.loading === "lazy") {
      image.loading = "eager";
    }
  };

  const decodeElement = (image) => {
    if (warmedElements.has(image)) return;
    warmedElements.add(image);

    if (typeof image.decode !== "function") return;

    const decode = () => image.decode().catch(() => undefined);
    if (image.complete) {
      decode();
      return;
    }

    image.addEventListener("load", decode, { once: true });
  };

  const warmUrl = (url) => new Promise((resolve) => {
    if (!url || warmedUrls.has(url)) {
      resolve();
      return;
    }

    warmedUrls.add(url);
    const probe = new Image();
    probe.decoding = "async";

    if ("fetchPriority" in probe) {
      probe.fetchPriority = "low";
    }

    const finish = () => {
      if (typeof probe.decode === "function") {
        probe.decode().catch(() => undefined).finally(resolve);
        return;
      }

      resolve();
    };

    probe.onload = finish;
    probe.onerror = resolve;
    probe.src = url;
  });

  const pumpQueue = () => {
    pumpScheduled = false;

    while (activeWarms < MAX_ACTIVE_WARMS && queue.length) {
      const item = queue.shift();
      activeWarms += 1;
      warmUrl(item.url).finally(() => {
        activeWarms -= 1;
        if (queue.length) {
          schedulePump();
        }
      });
    }
  };

  const schedulePump = () => {
    if (pumpScheduled) return;
    pumpScheduled = true;
    runWhenIdle(pumpQueue, 900);
  };

  const enqueueWarm = (image, priority = "idle") => {
    const url = getImageUrl(image);
    if (!url || warmedUrls.has(url)) return;

    if (priority === "critical") {
      warmedUrls.add(url);
      decodeElement(image);
      return;
    }

    queue.push({ url });
    schedulePump();
  };

  const scoreImage = (image, index) => {
    if (image.matches(CRITICAL_IMAGE_SELECTOR)) {
      return 0;
    }

    const rect = image.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (rect.top < viewportHeight * 1.35) return 1;
    if (index < 18) return 2;
    return 3;
  };

  const warmImage = (image, index = 0) => {
    if (!(image instanceof HTMLImageElement)) return;
    const score = scoreImage(image, index);
    const priority = score <= 1 ? "critical" : "idle";
    setImagePriority(image, priority);
    decodeElement(image);
    enqueueWarm(image, priority);
  };

  const observeNextImages = (images) => {
    if (!("IntersectionObserver" in window)) return;

    if (!imageObserver) {
      imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const image = entry.target;
          imageObserver.unobserve(image);
          warmImage(image);
        });
      }, {
        rootMargin: "1200px 0px",
        threshold: 0
      });
    }

    images.forEach((image) => {
      if (!warmedElements.has(image)) {
        imageObserver.observe(image);
      }
    });
  };

  const warmImages = () => {
    const images = Array.from(document.images)
      .filter((image) => getImageUrl(image))
      .sort((a, b) => scoreImage(a, 0) - scoreImage(b, 0));

    images.forEach((image, index) => {
      warmImage(image, index);
    });

    observeNextImages(images);
  };

  const observeAddedImages = () => {
    if (!("MutationObserver" in window)) return;

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            warmImage(node);
            return;
          }

          if (node instanceof HTMLElement) {
            const images = Array.from(node.querySelectorAll("img"));
            images.forEach((image) => warmImage(image));
            observeNextImages(images);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  };

  const scheduleWarm = () => {
    runWhenIdle(() => {
      warmImages();
      observeAddedImages();
    }, 300);
  };

  const warmCriticalImages = () => {
    const criticalImages = Array.from(document.querySelectorAll(CRITICAL_IMAGE_SELECTOR));
    criticalImages.forEach((image) => warmImage(image, 0));
  };

  if (document.body.classList.contains("is-loading")) {
    warmCriticalImages();
    observeAddedImages();
    document.addEventListener("videopower:loader-hidden", scheduleWarm, { once: true });
    return;
  }

  scheduleWarm();
}

function initStars() {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const STAR_MIN_GAP = 11;
  const STAR_COLOR = "#ffa914";
  const STAR_SOFT_COLOR = "#ffa914";

  const layers = [
    { count: 42, size: [0.7, 1.25], speed: [0.54, 0.92], alpha: [0.22, 0.46] },
    { count: 24, size: [1.25, 1.9], speed: [0.72, 1.12], alpha: [0.3, 0.6] },
    { count: 8, size: [1.9, 2.65], speed: [0.86, 1.28], alpha: [0.38, 0.7] }
  ];

  let width = 0;
  let height = 0;
  let stars = [];
  let animationId = 0;
  let lastFrameTime = 0;
  let resizeTimer = 0;
  const spriteCache = new Map();

  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const randomDiagonalVelocity = () => (
    randomBetween(0.1, 0.18) * (Math.random() < 0.5 ? -1 : 1)
  );

  function getStarSprite(color, radius) {
    const roundedRadius = Math.round(radius * 4) / 4;
    const key = `${color}-${roundedRadius}`;
    if (spriteCache.has(key)) {
      return spriteCache.get(key);
    }

    const padding = Math.ceil(roundedRadius * 2.2);
    const size = Math.max(8, Math.ceil((roundedRadius + padding) * 2));
    const sprite = document.createElement("canvas");
    sprite.width = size * dpr;
    sprite.height = size * dpr;
    const spriteContext = sprite.getContext("2d");

    if (!spriteContext) return null;

    spriteContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    spriteContext.imageSmoothingEnabled = true;
    spriteContext.imageSmoothingQuality = "high";
    const center = size / 2;
    const fill = spriteContext.createRadialGradient(
      center - (roundedRadius * 0.24),
      center - (roundedRadius * 0.28),
      0,
      center,
      center,
      roundedRadius
    );
    fill.addColorStop(0, "#ffd88a");
    fill.addColorStop(0.42, color);
    fill.addColorStop(1, "#d97800");
    spriteContext.beginPath();
    spriteContext.fillStyle = fill;
    spriteContext.shadowBlur = 0;
    spriteContext.arc(size / 2, size / 2, roundedRadius, 0, Math.PI * 2);
    spriteContext.fill();

    const cachedSprite = { canvas: sprite, size };
    spriteCache.set(key, cachedSprite);
    return cachedSprite;
  }

  function resizeCanvas() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    createStars();
    drawStars();
  }

  function findOpenStarPosition(radius) {
    const padding = radius + STAR_MIN_GAP;
    const minX = Math.min(padding, width / 2);
    const maxX = Math.max(minX, width - padding);
    const minY = -height;
    const maxY = height;

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = randomBetween(minX, maxX);
      const y = randomBetween(minY, maxY);
      const hasCollision = stars.some((star) => {
        const minDistance = radius + star.r + STAR_MIN_GAP;
        const dx = x - star.x;
        const dy = y - star.y;
        return (dx * dx) + (dy * dy) < minDistance * minDistance;
      });

      if (!hasCollision) {
        return { x, y };
      }
    }

    return {
      x: randomBetween(0, width),
      y: randomBetween(0, height)
    };
  }

  function createStars() {
    stars = [];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i += 1) {
        const radius = randomBetween(layer.size[0], layer.size[1]);
        const color = Math.random() > 0.22 ? STAR_COLOR : STAR_SOFT_COLOR;
        const position = findOpenStarPosition(radius);
        const riseSpeed = randomBetween(layer.speed[0], layer.speed[1]);
        const targetY = randomBetween(height * 0.38, height * 0.56);
        const startY = randomBetween(Math.max(targetY + 80, height * 0.86), height * 1.12);
        const life = Math.max(80, startY - targetY);
        const baseAlpha = randomBetween(layer.alpha[0], layer.alpha[1]);
        stars.push({
          x: position.x,
          y: startY,
          startY,
          targetY,
          r: radius,
          vx: randomDiagonalVelocity(),
          vy: -riseSpeed,
          drift: randomBetween(0.008, 0.028),
          phase: randomBetween(0, Math.PI * 2),
          life,
          color,
          sprite: getStarSprite(color, radius),
          baseAlpha,
          alpha: baseAlpha
        });
      }
    });
  }

  function drawStars() {
    context.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      context.globalAlpha = star.alpha;
      if (star.sprite) {
        context.drawImage(
          star.sprite.canvas,
          star.x - (star.sprite.size / 2),
          star.y - (star.sprite.size / 2),
          star.sprite.size,
          star.sprite.size
        );
      } else {
        context.beginPath();
        context.fillStyle = star.color;
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fill();
      }
    });
    context.globalAlpha = 1;
  }

  function resolveStarCollisions() {
    for (let i = 0; i < stars.length; i += 1) {
      const current = stars[i];

      for (let j = i + 1; j < stars.length; j += 1) {
        const next = stars[j];
        const minDistance = current.r + next.r + STAR_MIN_GAP;
        let dx = next.x - current.x;
        let dy = next.y - current.y;
        let distanceSquared = (dx * dx) + (dy * dy);

        if (distanceSquared === 0) {
          dx = minDistance;
          dy = 0;
          distanceSquared = minDistance * minDistance;
        }

        if (distanceSquared >= minDistance * minDistance) continue;

        const distance = Math.sqrt(distanceSquared);
        const normalX = dx / distance;
        const normalY = dy / distance;
        const push = (minDistance - distance) / 2;

        current.x -= normalX * push;
        current.y -= normalY * push;
        next.x += normalX * push;
        next.y += normalY * push;

        current.x = Math.max(current.r, Math.min(width - current.r, current.x));
        next.x = Math.max(next.r, Math.min(width - next.r, next.x));
      }
    }
  }

  function resetStar(star, offsetY = 0) {
    const radius = star.r;
    const position = findOpenStarPosition(radius);
    star.x = position.x;
    star.targetY = randomBetween(height * 0.38, height * 0.56);
    star.y = randomBetween(height + radius + offsetY, height * 1.2);
    star.startY = star.y;
    star.life = Math.max(80, star.startY - star.targetY);
    star.vy = -randomBetween(0.56, 1.24);
    star.vx = randomDiagonalVelocity();
    star.phase = randomBetween(0, Math.PI * 2);
    star.baseAlpha = randomBetween(0.28, 0.76);
    star.alpha = star.baseAlpha;
  }

  function updateStars(deltaScale) {
    stars.forEach((star) => {
      star.phase += star.drift * deltaScale;
      star.x += (star.vx + Math.sin(star.phase) * 0.045) * deltaScale;
      star.y += star.vy * deltaScale;

      if (star.x < -8) star.x = width + 8;
      if (star.x > width + 8) star.x = -8;

      const progress = Math.max(0, Math.min(1, (star.startY - star.y) / star.life));
      const fade = 1 - Math.pow(progress, 1.45);
      star.alpha = Math.max(0, star.baseAlpha * fade);

      if (star.y <= star.targetY || progress >= 1) {
        resetStar(star, star.r);
      }
    });

    resolveStarCollisions();
  }

  function animate(frameTime) {
    if (!lastFrameTime) lastFrameTime = frameTime;
    const deltaMs = Math.min(90, Math.max(8, frameTime - lastFrameTime));
    const deltaScale = deltaMs / (1000 / 60);
    lastFrameTime = frameTime;

    updateStars(deltaScale);
    drawStars();
    animationId = window.requestAnimationFrame(animate);
  }

  function start() {
    window.cancelAnimationFrame(animationId);
    if (prefersReducedMotion) {
      drawStars();
      return;
    }
    lastFrameTime = 0;
    animationId = window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeCanvas();
      start();
    }, 120);
  });

  window.addEventListener("orientationchange", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeCanvas();
      start();
    }, 180);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationId);
    } else {
      lastFrameTime = 0;
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

  images.forEach((image, index) => {
    image.classList.add("floating-item-bob");
    image.style.setProperty("--float-order", index);
  });
}

function initNewsShowcase() {
  const showcase = document.getElementById("news-showcase");
  if (!showcase) return;

  const slides = Array.from(showcase.querySelectorAll("[data-news-slide]"));
  const dots = Array.from(showcase.querySelectorAll(".news-showcase__dot"));
  const prevButton = showcase.querySelector(".news-showcase__arrow--prev");
  const nextButton = showcase.querySelector(".news-showcase__arrow--next");
  const progressFill = showcase.querySelector(".news-showcase__progress span");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROTATE_MS = 5600;

  if (!slides.length) return;

  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  let autoTimer = 0;
  let rotationStartedAt = 0;
  let remainingMs = ROTATE_MS;
  let isAnimating = false;
  let unlockTimer = 0;
  const usesProgressAnimation = Boolean(progressFill && !prefersReducedMotion && slides.length > 1);

  const normalizeIndex = (index) => (index + slides.length) % slides.length;
  const isUserHoldingShowcase = () => showcase.matches(":hover");

  function clearAutoTimer() {
    if (!autoTimer) return;
    window.clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function restartProgress(durationMs = ROTATE_MS) {
    showcase.classList.remove("is-rotating");
    if (prefersReducedMotion || slides.length < 2) return;
    if (progressFill) {
      progressFill.style.animationDuration = `${durationMs}ms`;
    }
    void showcase.offsetWidth;
    showcase.classList.add("is-rotating");
  }

  function render() {
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      slide.tabIndex = isActive ? 0 : -1;
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });

  }

  function pauseAutoPlay() {
    if (!autoTimer && !usesProgressAnimation) return;
    clearAutoTimer();
    const elapsed = window.performance.now() - rotationStartedAt;
    remainingMs = Math.max(260, remainingMs - elapsed);
    showcase.classList.add("is-paused");
  }

  function setArrowsDisabled(disabled) {
    if (prevButton) prevButton.disabled = disabled;
    if (nextButton) nextButton.disabled = disabled;
  }

  function unlockNavigation() {
    window.clearTimeout(unlockTimer);
    isAnimating = false;
    showcase.dataset.carouselState = "idle";
    setArrowsDisabled(false);
  }

  function lockNavigation() {
    isAnimating = true;
    showcase.dataset.carouselState = "animating";
    setArrowsDisabled(true);
    window.clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      unlockNavigation();
    }, 900);
  }

  function goTo(nextIndex, restartAutoPlay = true) {
    if (slides.length < 2 || isAnimating) return false;
    lockNavigation();
    activeIndex = normalizeIndex(nextIndex);
    render();

    if (restartAutoPlay) {
      startAutoPlay();
      if (isUserHoldingShowcase()) {
        pauseAutoPlay();
      }
    }

    return true;
  }

  function startAutoPlay(delayMs = ROTATE_MS) {
    clearAutoTimer();
    if (prefersReducedMotion || slides.length < 2 || document.hidden) return;

    remainingMs = Math.max(260, delayMs);
    rotationStartedAt = window.performance.now();
    showcase.classList.remove("is-paused");
    restartProgress(remainingMs);
    if (!usesProgressAnimation) {
      autoTimer = window.setTimeout(() => {
        autoTimer = 0;
        remainingMs = ROTATE_MS;
        goTo(activeIndex + 1);
      }, remainingMs);
    }
  }

  function resumeAutoPlay() {
    if (prefersReducedMotion || slides.length < 2 || document.hidden) return;
    clearAutoTimer();
    rotationStartedAt = window.performance.now();
    showcase.classList.remove("is-paused");
    if (!usesProgressAnimation) {
      autoTimer = window.setTimeout(() => {
        autoTimer = 0;
        remainingMs = ROTATE_MS;
        goTo(activeIndex + 1);
      }, remainingMs);
    }
  }

  if (progressFill) {
    progressFill.addEventListener("animationend", (event) => {
      if (event.animationName !== "newsProgress") return;
      if (!usesProgressAnimation || showcase.classList.contains("is-paused") || document.hidden) return;
      remainingMs = ROTATE_MS;
      goTo(activeIndex + 1);
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (prevButton.disabled || isAnimating) return;
      prevButton.dataset.soundReady = "true";
      goTo(activeIndex - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (nextButton.disabled || isAnimating) return;
      nextButton.dataset.soundReady = "true";
      goTo(activeIndex + 1);
    });
  }

  showcase.addEventListener("mouseenter", () => {
    pauseAutoPlay();
  });

  showcase.addEventListener("mouseleave", () => {
    resumeAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", (event) => {
      event.preventDefault();
      goTo(index);
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAutoPlay();
    } else {
      resumeAutoPlay();
    }
  });

  render();
  startAutoPlay();
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
    const title = card ? card.querySelector(".giveaway-title:not(.giveaway-title--price)") : null;
    const winnerName = card ? card.querySelector(".featured-winner-name") : null;
    const winnerAvatar = card ? card.querySelector(".featured-winner-avatar") : null;
    const skinName = card ? card.querySelector(".featured-skin-name") : null;
    const skinWeapon = card ? card.querySelector(".featured-skin-weapon") : null;
    const skinFinish = card ? card.querySelector(".featured-skin-finish") : null;
    const itemCondition = card ? card.querySelector(".featured-item-condition") : null;
    const itemPrice = card ? card.querySelector(".featured-item-price") : null;

    if (!track || !slides.length) return;

    let index = 0;
    let intervalId = 0;
    let unlockTimer = 0;
    let touchStartX = 0;
    let isAnimating = false;

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const hasMultipleSlides = slides.length > 1;
    const autoDelay = () => (isMobile() ? MOBILE_INTERVAL : DESKTOP_INTERVAL);
    const transitionDuration = () => (isMobile() ? 560 : 420);

    function stopAutoPlay() {
      if (!intervalId) return;
      window.clearInterval(intervalId);
      intervalId = 0;
    }

    function restartProgress() {
      if (!hasMultipleSlides) return;
      carousel.style.setProperty("--giveaway-carousel-duration", `${autoDelay()}ms`);
      carousel.classList.remove("is-progress-running", "is-progress-paused");
      void carousel.offsetWidth;
      carousel.classList.add("is-progress-running");
    }

    function pauseAutoPlay() {
      stopAutoPlay();
      if (hasMultipleSlides) {
        carousel.classList.add("is-progress-paused");
      }
    }

    function updateDotsAndTitle() {
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === index);
      });

      const activeSlide = slides[index];

      if (title && activeSlide.dataset.title) {
        title.textContent = activeSlide.dataset.title;
      }

      if (winnerName && activeSlide.dataset.winner) {
        winnerName.textContent = activeSlide.dataset.winner;
      }

      if (winnerAvatar && activeSlide.dataset.avatar) {
        winnerAvatar.src = activeSlide.dataset.avatar;
        winnerAvatar.alt = activeSlide.dataset.winner || "Giveaway winner";
      } else if (winnerAvatar && activeSlide.dataset.avatarLabel) {
        const label = activeSlide.dataset.avatarLabel;
        const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#373123"/><text x="32" y="39" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#ffa914">${label}</text></svg>`;
        winnerAvatar.src = `data:image/svg+xml,${encodeURIComponent(avatarSvg)}`;
        winnerAvatar.alt = activeSlide.dataset.winner || label;
      }

      if (skinWeapon) skinWeapon.textContent = activeSlide.dataset.weapon || "";
      if (skinFinish) skinFinish.textContent = activeSlide.dataset.finish || "";
      if (itemCondition) itemCondition.textContent = activeSlide.dataset.condition || "";
      if (itemPrice) itemPrice.textContent = activeSlide.dataset.price || "";

      if (skinName) {
        const fullName = [activeSlide.dataset.weapon, activeSlide.dataset.finish]
          .filter(Boolean)
          .join(" ");
        skinName.setAttribute("aria-label", fullName);
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
        carousel.classList.remove("is-progress-running", "is-progress-paused");
        return;
      }
      stopAutoPlay();
      const delay = autoDelay();
      intervalId = window.setInterval(() => {
        if (isAnimating) return;
        goTo(index + 1, false);
      }, delay);
      restartProgress();
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
      } else {
        restartProgress();
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

    carousel.addEventListener("touchstart", (event) => {
      if (event.target.closest(".giveaway-arrow")) return;
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      if (event.target.closest(".giveaway-arrow")) {
        return;
      }

      const touchEndX = event.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;

      if (Math.abs(delta) > 40) {
        const moved = delta < 0 ? goTo(index + 1) : goTo(index - 1);
        if (!moved) startAutoPlay();
      } else {
        return;
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
      if (container.classList.contains("promo-banner--hellcase")) return;

      const addState = () => container.classList.add("is-button-hovered");
      const removeState = () => container.classList.remove("is-button-hovered");

      button.addEventListener("mouseenter", addState);
      button.addEventListener("mouseleave", removeState);
      button.addEventListener("focus", addState);
      button.addEventListener("blur", removeState);
      button.addEventListener("touchstart", addState, { passive: true });
      button.addEventListener("touchend", removeState, { passive: true });
      button.addEventListener("touchcancel", removeState, { passive: true });
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
    const releaseButtonState = () => {
      window.setTimeout(() => {
        removeHoverState();
        button.classList.remove("is-touch-pressed");
        button.blur();
      }, 80);
    };

    button.addEventListener("mouseenter", addHoverState);
    button.addEventListener("mouseleave", removeHoverState);
    button.addEventListener("pointerdown", removeHoverState);
    button.addEventListener("pointerup", releaseButtonState);
    button.addEventListener("click", releaseButtonState);
    button.addEventListener("focus", removeHoverState);
    button.addEventListener("blur", removeHoverState);
  });
}

function initBonusClaimButtonCleanup() {
  const buttons = document.querySelectorAll("#bonuses .code-block a, #bonuses .bonus-reward-card__button");
  const cards = document.querySelectorAll("#bonuses .bonus-reward-card");
  if (!cards.length) return;
  getExternalLinkDragImage();

  const setPartnerDragData = (event, link) => {
    const card = link.closest(".bonus-reward-card");
    const partnerUrl = card?.dataset.bonusUrl?.trim() || link.href;
    setExternalLinkDragData(event, partnerUrl);
  };

  const transientCardClasses = [
    "is-touch-pressed",
    "is-button-hovered",
    "is-claiming",
    "is-card-pressing",
    "is-card-dragging",
    "is-card-mouse-held",
    "is-card-drag-locked",
    "is-card-hovered"
  ];

  const clearBonusClaimStates = () => {
    document
      .querySelectorAll(
        "#bonuses .bonus-reward-card, #bonuses .bonus-reward-card__button, #bonuses .bonus-reward-card__surface-link, #bonuses .code-block a"
      )
      .forEach((element) => {
        element.classList.remove(...transientCardClasses);
      });

    cards.forEach((card) => {
      delete card.dataset.activePointerId;
      delete card.dataset.dragStartX;
      delete card.dataset.dragStartY;
    });
  };

  const blurActiveBonusLink = () => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement
      && activeElement.matches(
        "#bonuses .bonus-reward-card__button, #bonuses .bonus-reward-card__surface-link, #bonuses .code-block a"
      )
    ) {
      activeElement.blur();
    }
  };

  const clearAndBlurBonusClaimStates = () => {
    clearBonusClaimStates();
    blurActiveBonusLink();
  };

  const settleDraggedCards = () => {
    cards.forEach((card) => {
      if (card.classList.contains("is-card-dragging")) {
        card.classList.add("is-card-dragged");
      }
    });
    clearAndBlurBonusClaimStates();
  };

  const finishPotentialPointerDrags = () => {
    let hadPointerDrag = false;
    cards.forEach((card) => {
      if (card.classList.contains("is-card-dragging")) {
        card.classList.add("is-card-dragged");
        hadPointerDrag = true;
      }
    });
    clearBonusClaimStates();
    if (hadPointerDrag) {
      blurActiveBonusLink();
    }
  };

  const releaseButtonState = (button) => {
    window.setTimeout(() => {
      const card = button.closest(".bonus-reward-card");
      if (card) {
        card.classList.remove("is-touch-pressed", "is-button-hovered", "is-claiming", "is-card-pressing");
      }
      button.classList.remove("is-touch-pressed", "is-button-hovered", "is-claiming");
      button.blur();
    }, 80);
  };

  buttons.forEach((button) => {
    button.draggable = false;
    button.setAttribute("draggable", "false");
    button.addEventListener("dragstart", (event) => {
      event.preventDefault();
      const card = button.closest(".bonus-reward-card");
      if (card) {
        card.classList.remove(...transientCardClasses);
      }
    });
    button.addEventListener("pointerdown", () => {
      const card = button.closest(".bonus-reward-card");
      if (card) {
        card.classList.remove(...transientCardClasses);
      }
      button.classList.remove(...transientCardClasses);
    });
    button.addEventListener("click", () => releaseButtonState(button));
    button.addEventListener("pointerup", () => releaseButtonState(button));
    button.addEventListener("mouseleave", () => releaseButtonState(button));
    button.addEventListener("blur", () => releaseButtonState(button));
  });

  cards.forEach((card) => {
    let clickAnimationTimer = 0;

    const clearClickAnimation = () => {
      window.clearTimeout(clickAnimationTimer);
      clickAnimationTimer = 0;
      card.classList.remove("is-card-clicked");
    };

    const playClickAnimation = () => {
      clearClickAnimation();
      void card.offsetWidth;
      card.classList.add("is-card-clicked");
      clickAnimationTimer = window.setTimeout(() => {
        card.classList.remove("is-card-clicked");
        clickAnimationTimer = 0;
      }, 140);
    };

    const clearCardMotion = () => {
      card.classList.remove(...transientCardClasses);
      delete card.dataset.activePointerId;
      delete card.dataset.dragStartX;
      delete card.dataset.dragStartY;
    };

    const surfaceLink = card.querySelector(".bonus-reward-card__surface-link[href]");
    const finishCardPointer = () => {
      const wasDragging = card.classList.contains("is-card-dragging");
      if (wasDragging) {
        card.classList.add("is-card-dragged");
      }
      clearCardMotion();
      if (wasDragging && surfaceLink instanceof HTMLElement) {
        surfaceLink.blur();
      }
    };

    card.addEventListener("pointermove", (event) => {
      if (String(event.pointerId) !== card.dataset.activePointerId) return;
      const startX = Number(card.dataset.dragStartX);
      const startY = Number(card.dataset.dragStartY);
      if (!Number.isFinite(startX) || !Number.isFinite(startY)) return;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < 7) return;
      card.classList.remove("is-card-hovered", "is-card-dragged");
      card.classList.add("is-card-dragging");
    });

    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch" && !card.classList.contains("is-card-dragging")) {
        card.classList.remove("is-card-dragged");
        card.classList.add("is-card-hovered");
      }
    });

    if (surfaceLink instanceof HTMLAnchorElement) {
      surfaceLink.draggable = true;
      surfaceLink.setAttribute("draggable", "true");
      surfaceLink.addEventListener("pointerdown", (event) => {
        clearClickAnimation();
        card.classList.remove("is-card-dragged");
        if (event.button === 0) {
          card.classList.add("is-card-mouse-held");
        }
        card.dataset.activePointerId = String(event.pointerId);
        card.dataset.dragStartX = String(event.clientX);
        card.dataset.dragStartY = String(event.clientY);
      });
      surfaceLink.addEventListener("focus", () => {
        card.classList.remove("is-card-dragged");
      });
      surfaceLink.addEventListener("dragstart", (event) => {
        clearClickAnimation();
        card.classList.remove("is-card-dragged");
        clearCardMotion();
        card.classList.add("is-card-dragging");
        setPartnerDragData(event, surfaceLink);
      });
      surfaceLink.addEventListener("click", (event) => {
        const wasDragged = card.classList.contains("is-card-dragging")
          || card.classList.contains("is-card-dragged");
        clearCardMotion();
        clearClickAnimation();
        if (!wasDragged && event.button === 0) {
          surfaceLink.blur();
        }
      });
      surfaceLink.addEventListener("dragend", () => {
        card.classList.add("is-card-dragged");
        clearCardMotion();
        surfaceLink.blur();
      });
      surfaceLink.addEventListener("pointercancel", finishCardPointer);
      surfaceLink.addEventListener("pointerup", finishCardPointer);
    }

    card.addEventListener("pointerup", finishCardPointer);
    card.addEventListener("mouseup", finishCardPointer);
    card.addEventListener("pointercancel", finishCardPointer);
    const handleCardLeave = () => {
      card.classList.remove("is-card-hovered");
      if (!card.classList.contains("is-card-dragging")) {
        clearCardMotion();
      }
    };
    card.addEventListener("pointerleave", handleCardLeave);
    card.addEventListener("mouseleave", handleCardLeave);
    card.addEventListener("dragstart", (event) => {
      if (
        event.target instanceof Element
        && event.target.closest(".bonus-reward-card__surface-link")
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      clearCardMotion();
    });
  });

  document.addEventListener("pointerup", finishPotentialPointerDrags);
  document.addEventListener("mouseup", finishPotentialPointerDrags);
  document.addEventListener("dragend", settleDraggedCards);
  document.addEventListener("drop", settleDraggedCards);
  window.addEventListener("dragend", settleDraggedCards, { capture: true });
  window.addEventListener("drop", settleDraggedCards, { capture: true });
  window.addEventListener("pageshow", clearAndBlurBonusClaimStates);
  window.addEventListener("focus", clearAndBlurBonusClaimStates);
  window.addEventListener("pagehide", settleDraggedCards);
  window.addEventListener("blur", settleDraggedCards);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      settleDraggedCards();
    } else {
      clearAndBlurBonusClaimStates();
    }
  });
}

function initTouchInteractionCleanup() {
  const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
  if (!touchMedia.matches) return;
  document.body.classList.add("touch-device");

  const touchFocusableSelector =
    ".btn, .promo-copy-btn, .bonus-copy-code, #bonuses .code-block a, a.footer-nav-link, .main-nav a, .main-nav .nav-social-link, .social-icon, .hamburger, .promo-banner, .promo-banner .cta-button, .video-card";

  const clearTouchPress = () => {
    document.querySelectorAll(".is-touch-pressed").forEach((element) => {
      element.classList.remove("is-touch-pressed");
    });
  };

  const clearTouchStates = () => {
    clearTouchPress();

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

  document.addEventListener("touchstart", (event) => {
    const touchTarget = event.target.closest(".video-card, .news-showcase__arrow, .news-showcase__dot, .main-nav a, a.footer-nav-link, .social-icon, .main-nav .nav-social-link, #bonuses .code-block a");
    if (touchTarget) {
      clearTouchPress();
      touchTarget.classList.add("is-touch-pressed");
    }
  }, { passive: true });

  document.addEventListener("touchend", scheduleCleanup, { passive: true });
  document.addEventListener("touchcancel", clearTouchStates, { passive: true });
  document.addEventListener("pointerup", scheduleCleanup, { passive: true });
  document.addEventListener("contextmenu", clearTouchStates);
  window.addEventListener("blur", clearTouchStates);
  window.addEventListener("pagehide", clearTouchStates);
}

function initScrollReveal() {
  const revealSelector = [
    ".section",
    "#specials",
    ".partners-title",
    ".bonuses-reveal-title",
    ".bonuses-reveal-subtitle",
    ".videos-heading-row",
    ".videos-title",
    ".videos-subtitle",
    ".specials-title",
    ".giveaways-title",
    ".news-title",
    ".news-team-heading",
    ".partner-card",
    ".bonus-reward-card",
    ".video-card",
    ".promo-banner",
    ".giveaway-card",
    ".news-showcase",
    ".news-team-panel",
    ".news-team-member",
    ".footer-brand",
    ".footer-side"
  ].join(", ");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preparedElements = new WeakSet();
  const revealTimers = new WeakMap();
  let lastScrollY = window.scrollY || window.pageYOffset || 0;
  let scrollDirection = "down";

  const syncScrollDirection = () => {
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const delta = currentScrollY - lastScrollY;

    if (Math.abs(delta) < 4) return;
    scrollDirection = delta > 0 ? "down" : "up";
    document.documentElement.classList.toggle("is-scrolling-up", scrollDirection === "up");
    document.documentElement.classList.toggle("is-scrolling-down", scrollDirection === "down");
    lastScrollY = currentScrollY;
  };

  document.documentElement.classList.add("is-scrolling-down");
  window.addEventListener("scroll", syncScrollDirection, { passive: true });

  const revealElement = (element) => {
    window.clearTimeout(revealTimers.get(element));
    syncScrollDirection();
    element.dataset.revealDirection = scrollDirection;
    element.style.willChange = "opacity, transform, filter";
    element.classList.add("is-revealed");

    if (element.classList.contains("video-card--entering")) {
      window.requestAnimationFrame(() => {
        element.classList.add("is-ready");
      });
    }

    const timer = window.setTimeout(() => {
      element.style.willChange = "auto";
    }, 920);
    revealTimers.set(element, timer);
  };

  const observer = !prefersReducedMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: [0, 0.12]
    })
    : null;

  const prepareElement = (element, index = 0) => {
    if (!(element instanceof HTMLElement) || preparedElements.has(element)) return;
    preparedElements.add(element);
    element.classList.add("reveal-on-scroll");

    const bonusRevealDelay = (() => {
      if (element.matches("#bonuses .bonuses-reveal-title")) return 0;
      if (element.matches("#bonuses .bonuses-reveal-subtitle")) return 0;
      if (element.matches("#bonuses .bonus-reward-card")) return 0;
      return null;
    })();

    element.style.setProperty(
      "--reveal-delay",
      `${bonusRevealDelay ?? Math.min((index % 8) * 55, 330)}ms`
    );

    if (!observer) {
      revealElement(element);
      return;
    }

    observer.observe(element);
  };

  const prepareTree = (root = document) => {
    const elements = root instanceof HTMLElement && root.matches(revealSelector)
      ? [root, ...root.querySelectorAll(revealSelector)]
      : [...root.querySelectorAll(revealSelector)];

    elements.forEach((element, index) => prepareElement(element, index));
  };

  prepareTree();

  if ("MutationObserver" in window) {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            prepareTree(node);
          }
        });
      });
    });

    const main = document.querySelector("main");
    if (main) {
      mutationObserver.observe(main, { childList: true, subtree: true });
    }
  }
}

function initSmartAiAssistant() {
  const chat = document.getElementById("ai-chat");
  const toggle = document.getElementById("ai-chat-toggle");
  const panel = document.getElementById("ai-chat-panel");
  const closeButton = document.getElementById("ai-chat-close");
  const messages = document.getElementById("ai-chat-messages");
  const form = document.getElementById("ai-chat-form");
  const input = document.getElementById("ai-chat-input");

  if (!chat || !toggle || !panel || !closeButton || !messages || !form || !input) return;

  const links = {
    bonuses: "#bonuses",
    videos: "#videos",
    specials: "#specials",
    giveaways: "#giveaways",
    faq: "#faq",
    youtube: "https://www.youtube.com/@VideoPower_cs",
    youtubeVideos: "https://www.youtube.com/@VideoPower_cs/videos",
    youtubeShorts: "https://www.youtube.com/@VideoPower_cs/shorts",
    youtubeCommunity: "https://www.youtube.com/@VideoPower_cs/community",
    twitter: "https://x.com/VideoPower_cs",
    merch: "https://videopower-shop.fourthwall.com/en-eur",
    hellcase: "https://hellca.se/videopower"
  };

  const labels = {
    en: {
      bonuses: "OPEN BONUSES",
      videos: "OPEN VIDEOS",
      specials: "OPEN SPECIALS",
      giveaways: "OPEN GIVEAWAYS",
      faq: "OPEN FAQ",
      youtube: "YOUTUBE",
      shorts: "SHORTS",
      community: "COMMUNITY",
      twitter: "TWITTER",
      merch: "OPEN MERCH",
      copy: "COPY CODE",
      copied: "COPIED!",
      hellcase: "HELLCASE",
      askBonuses: "ASK BONUSES",
      askVideos: "ASK VIDEOS",
      askGiveaways: "ASK GIVEAWAYS"
    },
    lv: {
      bonuses: "ATVERT BONUSUS",
      videos: "ATVERT VIDEO",
      specials: "ATVERT SPECIALS",
      giveaways: "ATVERT GIVEAWAYS",
      faq: "ATVERT FAQ",
      youtube: "YOUTUBE",
      shorts: "SHORTS",
      community: "COMMUNITY",
      twitter: "TWITTER",
      merch: "ATVERT MERCH",
      copy: "KOPET KODU",
      copied: "NOKOPETS!",
      hellcase: "HELLCASE",
      askBonuses: "JAUTAT BONUSUS",
      askVideos: "JAUTAT VIDEO",
      askGiveaways: "JAUTAT GIVEAWAYS"
    }
  };

  let hasWelcomed = false;
  let lastTopicId = "website";
  let lastLanguage = "en";
  let botTimer = 0;

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\u0400-\u04ff$%+.@#\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const hasAny = (text, terms) => terms.some((term) => text.includes(normalize(term)));
  const getLabel = (language, key) => labels[language]?.[key] || labels.en[key] || key;
  const makeAction = (language, labelKey, data) => ({ label: getLabel(language, labelKey), ...data });

  const detectLanguage = (rawValue, normalizedValue) => {
    const raw = String(rawValue || "");
    const text = normalizedValue || normalize(raw);

    if (hasAny(text, ["english", "angliski", "answer in english"])) return "en";
    if (hasAny(text, ["latviski", "latviesu", "latvian", "atbildi latviski"])) return "lv";
    if (/[\u0400-\u04ff]/.test(raw)) return "en";

    const words = new Set(text.split(" ").filter(Boolean));
    const lvWords = [
      "ka", "kur", "kapec", "kas", "vai", "man", "vajag", "ludzu", "palidz",
      "bonusi", "bonusu", "kods", "kodu", "majaslapa", "izloze", "izlozes",
      "veikals", "preces", "poga", "aizslegts", "nepieejams", "skatities"
    ];
    const enWords = [
      "how", "where", "what", "why", "can", "help", "bonus", "code",
      "website", "video", "giveaway", "shop", "merch", "locked"
    ];

    const lvScore = lvWords.reduce((score, word) => score + (words.has(word) ? 1 : 0), 0);
    const enScore = enWords.reduce((score, word) => score + (words.has(word) ? 1 : 0), 0);
    return lvScore > enScore ? "lv" : "en";
  };

  const scrollMessagesToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  function closeChat() {
    chat.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  }

  const fallbackCopy = (text) => {
    const helperInput = document.createElement("textarea");
    helperInput.value = text;
    helperInput.setAttribute("readonly", "");
    helperInput.style.position = "fixed";
    helperInput.style.top = "-9999px";
    helperInput.style.left = "-9999px";
    document.body.appendChild(helperInput);
    helperInput.select();

    try {
      document.execCommand("copy");
    } catch (error) {
      console.warn("VideoPower assistant copy failed.", error);
    } finally {
      helperInput.remove();
    }
  };

  const copyText = (text) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return;
    }

    fallbackCopy(text);
  };

  const createAction = (action) => {
    const element = document.createElement(action.href ? "a" : "button");
    element.className = "ai-chat__action";
    element.textContent = action.label;

    if (action.href) {
      element.href = action.href;
      if (action.href.startsWith("#")) {
        element.addEventListener("click", closeChat);
      } else {
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }
      return element;
    }

    element.type = "button";

    if (action.copy) {
      element.addEventListener("click", () => {
        copyText(action.copy);
        element.textContent = getLabel(lastLanguage, "copied");
        window.setTimeout(() => {
          element.textContent = action.label;
        }, 1200);
      });
    }

    if (action.prompt) {
      element.addEventListener("click", () => askQuestion(action.prompt));
    }

    return element;
  };

  const addMessage = (sender, text, actions = []) => {
    const bubble = document.createElement("div");
    bubble.className = `ai-chat__message ai-chat__message--${sender}`;

    String(text || "")
      .split("\n")
      .filter(Boolean)
      .forEach((line, index) => {
        if (index > 0) bubble.append(document.createElement("br"));
        bubble.append(document.createTextNode(line));
      });

    if (actions.length) {
      const actionRow = document.createElement("div");
      actionRow.className = "ai-chat__actions";
      actions.forEach((item) => actionRow.appendChild(createAction(item)));
      bubble.appendChild(actionRow);
    }

    messages.appendChild(bubble);
    scrollMessagesToBottom();
    return bubble;
  };

  const showTyping = () => {
    const bubble = document.createElement("div");
    bubble.className = "ai-chat__message ai-chat__message--bot ai-chat__message--typing";
    bubble.innerHTML = '<span class="ai-chat__typing"><span></span><span></span><span></span></span>';
    messages.appendChild(bubble);
    scrollMessagesToBottom();
    return bubble;
  };

  const getLatestVideoSummary = () => {
    const videoCards = Array.from(document.querySelectorAll("#videos-grid .video-card"))
      .filter((card) => !card.classList.contains("skeleton"))
      .slice(0, 5);

    if (!videoCards.length) {
      return "The VIDEOS section loads channel content automatically. If it is still loading, open YouTube directly.";
    }

    return videoCards
      .map((card, index) => {
        const title = card.querySelector("h3")?.textContent?.trim();
        const badge = card.querySelector(".video-card__badge")?.textContent?.trim();
        return title ? `${index + 1}. ${badge ? `${badge}: ` : ""}${title}` : "";
      })
      .filter(Boolean)
      .join("\n");
  };

  const getBonusSummary = () => {
    const cards = Array.from(document.querySelectorAll("#bonuses .partner-card"));
    const lines = cards
      .map((card) => {
        const title = card.querySelector(".partner-title")?.textContent?.trim();
        const values = Array.from(card.querySelectorAll(".partner-description__value"))
          .map((item) => item.textContent.trim())
          .filter(Boolean);
        const locked = card.classList.contains("partner-card--locked") ? "LOCKED" : "AVAILABLE";
        return title ? `${title} - ${locked}${values.length ? `: ${values.join(" + ")}` : ""}` : "";
      })
      .filter(Boolean)
      .join("\n");

    return lines || "Open BONUSES to see the current VideoPower bonus cards.";
  };

  const getSpecialsSummary = () => {
    const banners = Array.from(document.querySelectorAll("#specials .promo-banner"));
    const lines = banners
      .map((banner) => {
        const title = banner.querySelector("h3")?.textContent?.trim();
        const event = banner.querySelector(".event-ribbon")?.textContent?.trim();
        const countdown = banner.querySelector(".countdown-chip")?.textContent?.trim();
        const locked = banner.classList.contains("promo-banner--locked") ? "LOCKED" : "AVAILABLE";
        return title ? `${event ? `${event}: ` : ""}${title} - ${locked}${countdown ? ` (${countdown})` : ""}` : "";
      })
      .filter(Boolean)
      .join("\n");

    return lines || "Open SPECIALS to see current limited-time opportunities.";
  };

  const getGiveawaySummary = () => {
    const cards = Array.from(document.querySelectorAll("#giveaways .giveaway-card"));
    const lines = cards
      .map((card) => {
        const title = card.querySelector(".giveaway-title")?.textContent?.trim();
        const status = card.querySelector(".active-tag, .inactive-tag")?.textContent?.trim();
        const price = card.querySelector(".price-tag")?.textContent?.trim();
        return title ? `${title}${status ? ` - ${status}` : ""}${price ? ` (${price})` : ""}` : "";
      })
      .filter(Boolean)
      .join("\n");

    return lines || "Open GIVEAWAYS to see the current giveaway cards.";
  };

  const getFaqSummary = () => {
    const items = Array.from(document.querySelectorAll("#faq .faq-item"));
    return items
      .map((item) => {
        const summary = item.querySelector("summary")?.textContent?.trim();
        const answer = item.querySelector(".faq-item__body p")?.textContent?.trim();
        return summary && answer ? `${summary} ${answer}` : "";
      })
      .filter(Boolean)
      .slice(0, 4)
      .join("\n");
  };

  const topics = [
    {
      id: "bonus",
      keywords: [
        "bonus", "bonuses", "bonuss", "bonusi", "bonusu", "claim", "code", "promo", "kods", "kodu",
        "copy code", "deposit", "depozit", "free case", "hellcase", "skinbaron", "hypedrop", "skinclub",
        "odds", "$0.70", "5%", "7%", "10%"
      ],
      build: (language) => ({
        text: language === "lv"
          ? `Atraka atbilde: izmanto kodu VIDEOPOWER.\nAtver BONUSES, izvelies saitu un spied CLAIM BONUS, lai atvertu oficialo VideoPower bonus linku.\nAktualie bonusi lapa:\n${getBonusSummary()}`
          : `Fast answer: use code VIDEOPOWER.\nOpen BONUSES, choose the site, then press CLAIM BONUS to use the official VideoPower bonus link.\nCurrent bonus cards detected on the page:\n${getBonusSummary()}`,
        actions: [
          makeAction(language, "bonuses", { href: links.bonuses }),
          makeAction(language, "copy", { copy: "VIDEOPOWER" }),
          makeAction(language, "hellcase", { href: links.hellcase })
        ]
      })
    },
    {
      id: "videos",
      keywords: [
        "video", "videos", "short", "shorts", "youtube", "channel", "kanals", "kanala",
        "latest", "newest", "pedej", "skatities", "watch", "kills", "playlist", "community"
      ],
      build: (language) => ({
        text: language === "lv"
          ? `VideoPower video un shorts ir VIDEOS sekcija. Ja bloki vel ladejas, vari atvert YouTube pogas zemak.\nPedejie atrastie ieraksti lapa:\n${getLatestVideoSummary()}`
          : `VideoPower videos and shorts are shown in the VIDEOS section. If the cards are still loading, use the YouTube buttons below.\nLatest detected items:\n${getLatestVideoSummary()}`,
        actions: [
          makeAction(language, "videos", { href: links.videos }),
          makeAction(language, "youtube", { href: links.youtube }),
          makeAction(language, "shorts", { href: links.youtubeShorts }),
          makeAction(language, "community", { href: links.youtubeCommunity })
        ]
      })
    },
    {
      id: "giveaways",
      keywords: [
        "giveaway", "giveaways", "izloze", "izlozes", "win", "winner", "prize", "balva",
        "enter", "join", "twitter", "tweet", "x.com", "requirements", "rules", "noteikumi"
      ],
      build: (language) => ({
        text: language === "lv"
          ? `Lai piedalitos giveaway: atver GIVEAWAYS, izvelies karti un spied ENTER GIVEAWAY. Tas aizved uz Twitter postu, kur redzami nosacijumi.\nAktualas kartes lapa:\n${getGiveawaySummary()}`
          : `To enter a giveaway: open GIVEAWAYS, choose a card, then press ENTER GIVEAWAY. It opens the Twitter post with exact requirements.\nCurrent cards detected on the page:\n${getGiveawaySummary()}`,
        actions: [
          makeAction(language, "giveaways", { href: links.giveaways }),
          makeAction(language, "twitter", { href: links.twitter })
        ]
      })
    },
    {
      id: "specials",
      keywords: [
        "special", "specials", "event", "events", "opportunity", "opportunities", "pasakums",
        "hellcase event", "sakura", "skinclub", "deep dive", "locked", "aizslegts", "unavailable",
        "nepieejams", "limited", "countdown"
      ],
      build: (language) => ({
        text: language === "lv"
          ? `SPECIALS sekcija rada ierobezota laika bonus iespejas un eventus. Ja bloks ir LOCKED, piedavajums sobrid nav pieejams vai tiek atjaunots.\nAktualie specials:\n${getSpecialsSummary()}`
          : `SPECIALS shows limited-time bonus opportunities and events. If a block is LOCKED, the offer is unavailable or being renewed.\nCurrent specials detected on the page:\n${getSpecialsSummary()}`,
        actions: [
          makeAction(language, "specials", { href: links.specials }),
          makeAction(language, "hellcase", { href: links.hellcase })
        ]
      })
    },
    {
      id: "merch",
      keywords: [
        "merch", "shop", "store", "veikals", "preces", "shirt", "hoodie", "clothes",
        "drip", "sale", "buy", "pirkt", "apparel"
      ],
      build: (language) => ({
        text: language === "lv"
          ? "VideoPower merch ir oficialaja veikala. Atver MERCH, lai apskatitu pieejamas preces un sale piedavajumus."
          : "VideoPower merch is in the official shop. Open MERCH to check available products and sale offers.",
        actions: [
          makeAction(language, "merch", { href: links.merch })
        ]
      })
    },
    {
      id: "faq",
      keywords: [
        "faq", "help", "palidz", "question", "questions", "jautajums", "jautajumi",
        "how", "where", "why", "ka", "kur", "kapec", "explain", "rules"
      ],
      build: (language) => ({
        text: language === "lv"
          ? `FAQ dod atras atbildes par kodu, bonusiem, locked blokiem un giveaways.\nNo lapas FAQ:\n${getFaqSummary()}`
          : `FAQ gives quick answers about the code, bonuses, locked blocks, and giveaways.\nDetected FAQ content:\n${getFaqSummary()}`,
        actions: [
          makeAction(language, "faq", { href: links.faq }),
          makeAction(language, "askGiveaways", { prompt: "How do giveaways work on Twitter?" })
        ]
      })
    },
    {
      id: "safety",
      keywords: [
        "18", "age", "vecums", "responsible", "gamble", "gambling", "risk", "loss",
        "safe", "droshi", "casino", "betting"
      ],
      build: (language) => ({
        text: language === "lv"
          ? "Svarigi: piedalities drikst tikai 18+ lietotaji. Gamble responsibly. Visi lemumi par spelem, depozitiem un riskiem ir tava atbildiba."
          : "Important: only users aged 18+ should participate. Gamble responsibly. Any casino, deposit, or betting decision is your own responsibility.",
        actions: [
          makeAction(language, "faq", { href: links.faq })
        ]
      })
    },
    {
      id: "website",
      keywords: [
        "website", "site", "page", "majaslapa", "home", "hub", "videopower",
        "about", "par ko", "navigate", "navigation", "sections"
      ],
      build: (language) => ({
        text: language === "lv"
          ? "VideoPower Codes ir centralais hubs bonusiem, special opportunities, giveaways, YouTube video/shorts, Twitter jaunumiem un merch. Vari jautat konkretu lietu, piemeram: kur ir kods, kas ir locked, vai kur skatities shorts."
          : "VideoPower Codes is the hub for bonuses, special opportunities, giveaways, YouTube videos/shorts, Twitter updates, and merch. Ask something specific like where the code is, what locked means, or where to watch shorts.",
        actions: [
          makeAction(language, "bonuses", { href: links.bonuses }),
          makeAction(language, "videos", { href: links.videos }),
          makeAction(language, "merch", { href: links.merch })
        ]
      })
    }
  ];

  const scoreTopic = (topic, normalizedQuestion) =>
    topic.keywords.reduce((score, keyword) => {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword) return score;
      if (normalizedQuestion === normalizedKeyword) return score + 4;
      if (normalizedQuestion.includes(normalizedKeyword)) {
        return score + (normalizedKeyword.length >= 8 ? 3 : 1);
      }
      return score;
    }, 0);

  const buildGreetingResponse = (language) => ({
    text: language === "lv"
      ? "Sveiks! Esmu VideoPower Smart Assistant. Vari jautat latviski vai angliski par bonusiem, kodu VIDEOPOWER, YouTube video/shorts, Twitter giveaways, specials, merch un FAQ."
      : "Welcome! I am the VideoPower Smart Assistant. You can ask in Latvian or English about bonuses, code VIDEOPOWER, YouTube videos/shorts, Twitter giveaways, specials, merch, and FAQ.",
    actions: [
      makeAction(language, "copy", { copy: "VIDEOPOWER" }),
      makeAction(language, "askBonuses", { prompt: "How do I claim bonuses and use the code?" }),
      makeAction(language, "askVideos", { prompt: "Show me the latest VideoPower videos and shorts." })
    ]
  });

  const buildFallbackResponse = (language, normalizedQuestion) => {
    const suggestions = topics
      .map((topic) => ({ topic, score: scoreTopic(topic, normalizedQuestion) }))
      .filter((item) => item.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 3)
      .map((item) => item.topic.id.toUpperCase())
      .join(", ");

    return {
      text: language === "lv"
        ? `Es neatradu 100% precizu atbilstibu, bet varu palidzet ar VideoPower lapas temam: bonusi, kods, videos, shorts, Twitter giveaways, specials, merch un FAQ.${suggestions ? `\nIespejami tuvakie temati: ${suggestions}.` : ""}\nUzraksti, piemeram: "ka sanemt bonusu?", "kur ir shorts?", "kas ir locked?"`
        : `I did not find a perfect match, but I can help with VideoPower website topics: bonuses, code, videos, shorts, Twitter giveaways, specials, merch, and FAQ.${suggestions ? `\nClosest detected topics: ${suggestions}.` : ""}\nTry: "how do I claim a bonus?", "where are the shorts?", or "what does locked mean?"`,
      actions: [
        makeAction(language, "askBonuses", { prompt: "How do I claim bonuses and use the code?" }),
        makeAction(language, "askVideos", { prompt: "Show me the latest VideoPower videos and shorts." }),
        makeAction(language, "merch", { href: links.merch })
      ]
    };
  };

  const buildResponse = (question) => {
    const normalized = normalize(question);
    const language = detectLanguage(question, normalized);
    const isGreeting = hasAny(normalized, ["hi", "hello", "hey", "sveiki", "cau", "labdien", "yo"]);
    const isThanks = hasAny(normalized, ["thanks", "thank you", "paldies", "nice", "cool"]);
    lastLanguage = language;

    if (!normalized || isGreeting) {
      return buildGreetingResponse(language);
    }

    if (isThanks && normalized.split(" ").length <= 4) {
      return {
        text: language === "lv"
          ? "Nav par ko! Ja vajag, varu uzreiz atrast bonusu, kodu, video, giveaway vai merch sadalu."
          : "No problem! If you need more, I can quickly point you to bonuses, the code, videos, giveaways, or merch.",
        actions: [
          makeAction(language, "copy", { copy: "VIDEOPOWER" }),
          makeAction(language, "faq", { href: links.faq })
        ]
      };
    }

    const rankedTopics = topics
      .map((topic) => ({ topic, score: scoreTopic(topic, normalized) }))
      .sort((first, second) => second.score - first.score);

    const bestMatch = rankedTopics[0];
    const followUpWords = ["it", "that", "this", "there", "tas", "to", "tur", "vins", "vina", "ari"];

    if (!bestMatch || bestMatch.score <= 0) {
      const previousTopic = topics.find((topic) => topic.id === lastTopicId);
      if (previousTopic && hasAny(normalized, followUpWords)) {
        return previousTopic.build(language);
      }

      return buildFallbackResponse(language, normalized);
    }

    lastTopicId = bestMatch.topic.id;
    return bestMatch.topic.build(language);
  };

  const askQuestion = (question) => {
    const trimmedQuestion = String(question || "").trim();
    if (!trimmedQuestion) return;

    window.clearTimeout(botTimer);
    addMessage("user", trimmedQuestion);
    input.value = "";

    const typing = showTyping();
    const delay = Math.min(640, Math.max(180, trimmedQuestion.length * 9));

    botTimer = window.setTimeout(() => {
      typing.remove();

      try {
        const response = buildResponse(trimmedQuestion);
        addMessage("bot", response.text, response.actions);
      } catch (error) {
        console.warn("VideoPower assistant response failed.", error);
        const fallback = buildFallbackResponse(lastLanguage, normalize(trimmedQuestion));
        addMessage("bot", fallback.text, fallback.actions);
      }
    }, delay);
  };

  function openChat() {
    chat.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");

    if (!hasWelcomed) {
      hasWelcomed = true;
      const welcome = buildGreetingResponse(lastLanguage);
      addMessage("bot", welcome.text, welcome.actions);
    }

    window.setTimeout(() => input.focus({ preventScroll: true }), 120);
  }

  toggle.addEventListener("click", () => {
    if (chat.classList.contains("is-open")) closeChat();
    else openChat();
  });

  closeButton.addEventListener("click", closeChat);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    askQuestion(input.value);
  });

  document.querySelectorAll("[data-ai-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      askQuestion(button.getAttribute("data-ai-prompt"));
    });
  });

  input.addEventListener("input", () => {
    const language = detectLanguage(input.value, normalize(input.value));
    chat.dataset.language = language;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chat.classList.contains("is-open")) {
      closeChat();
    }
  });
}

function initAiAssistant() {
  const chat = document.getElementById("ai-chat");
  const toggle = document.getElementById("ai-chat-toggle");
  const panel = document.getElementById("ai-chat-panel");
  const closeButton = document.getElementById("ai-chat-close");
  const messages = document.getElementById("ai-chat-messages");
  const form = document.getElementById("ai-chat-form");
  const input = document.getElementById("ai-chat-input");

  if (!chat || !toggle || !panel || !closeButton || !messages || !form || !input) return;

  const links = {
    bonuses: "#bonuses",
    videos: "#videos",
    specials: "#specials",
    giveaways: "#giveaways",
    faq: "#faq",
    youtube: "https://www.youtube.com/@VideoPower_cs",
    youtubeVideos: "https://www.youtube.com/@VideoPower_cs/videos",
    youtubeShorts: "https://www.youtube.com/@VideoPower_cs/shorts",
    twitter: "https://x.com/VideoPower_cs",
    merch: "https://videopower-shop.fourthwall.com/en-eur",
    hellcase: "https://hellca.se/videopower"
  };

  let hasWelcomed = false;
  let botTimer = 0;

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[ā]/g, "a")
      .replace(/[č]/g, "c")
      .replace(/[ē]/g, "e")
      .replace(/[ģ]/g, "g")
      .replace(/[ī]/g, "i")
      .replace(/[ķ]/g, "k")
      .replace(/[ļ]/g, "l")
      .replace(/[ņ]/g, "n")
      .replace(/[š]/g, "s")
      .replace(/[ū]/g, "u")
      .replace(/[ž]/g, "z");

  const scrollMessagesToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const createAction = (action) => {
    const isLink = Boolean(action.href);
    const element = document.createElement(isLink ? "a" : "button");
    element.className = "ai-chat__action";
    element.textContent = action.label;

    if (isLink) {
      element.href = action.href;
      if (action.href.startsWith("#")) {
        element.addEventListener("click", () => {
          closeChat();
        });
      } else {
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }
      return element;
    }

    element.type = "button";
    if (action.copy) {
      element.addEventListener("click", () => {
        copyText(action.copy);
        element.textContent = "COPIED!";
        window.setTimeout(() => {
          element.textContent = action.label;
        }, 1200);
      });
    }

    if (action.prompt) {
      element.addEventListener("click", () => {
        askQuestion(action.prompt);
      });
    }

    return element;
  };

  const addMessage = (sender, text, actions = []) => {
    const bubble = document.createElement("div");
    bubble.className = `ai-chat__message ai-chat__message--${sender}`;

    String(text)
      .split("\n")
      .filter(Boolean)
      .forEach((line, index) => {
        if (index > 0) bubble.append(document.createElement("br"));
        bubble.append(document.createTextNode(line));
      });

    if (actions.length) {
      const actionRow = document.createElement("div");
      actionRow.className = "ai-chat__actions";
      actions.forEach((action) => actionRow.appendChild(createAction(action)));
      bubble.appendChild(actionRow);
    }

    messages.appendChild(bubble);
    scrollMessagesToBottom();
    return bubble;
  };

  const showTyping = () => {
    const bubble = document.createElement("div");
    bubble.className = "ai-chat__message ai-chat__message--bot";
    bubble.innerHTML = '<span class="ai-chat__typing"><span></span><span></span><span></span></span>';
    messages.appendChild(bubble);
    scrollMessagesToBottom();
    return bubble;
  };

  const copyText = (text) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return;
    }

    fallbackCopy(text);
  };

  const fallbackCopy = (text) => {
    const helperInput = document.createElement("textarea");
    helperInput.value = text;
    helperInput.setAttribute("readonly", "");
    helperInput.style.position = "fixed";
    helperInput.style.top = "-9999px";
    helperInput.style.left = "-9999px";
    document.body.appendChild(helperInput);
    helperInput.select();

    try {
      document.execCommand("copy");
    } catch (error) {
      console.warn("AI chat copy fallback failed.", error);
    } finally {
      helperInput.remove();
    }
  };

  const getLatestVideoSummary = () => {
    const videoCards = Array.from(document.querySelectorAll("#videos-grid .video-card"))
      .filter((card) => !card.classList.contains("skeleton"))
      .slice(0, 5);

    if (!videoCards.length) {
      return "The VIDEOS section loads VideoPower channel content automatically. If it is still loading, use the YouTube buttons below.";
    }

    const titles = videoCards
      .map((card, index) => {
        const title = card.querySelector("h3")?.textContent?.trim();
        const badge = card.querySelector(".video-card__badge")?.textContent?.trim();
        if (!title) return "";
        return `${index + 1}. ${badge ? `${badge}: ` : ""}${title}`;
      })
      .filter(Boolean)
      .join("\n");

    return titles || "The latest VideoPower videos are available in the VIDEOS section.";
  };

  const getGiveawaySummary = () => {
    const cards = Array.from(document.querySelectorAll("#giveaways .giveaway-card"));
    const titles = cards
      .map((card) => {
        const title = card.querySelector(".giveaway-title")?.textContent?.trim();
        const status = card.querySelector(".active-tag, .inactive-tag")?.textContent?.trim();
        const price = card.querySelector(".price-tag")?.textContent?.trim();
        return title ? `${title}${status ? ` - ${status}` : ""}${price ? ` (${price})` : ""}` : "";
      })
      .filter(Boolean)
      .join("\n");

    return titles || "Open the GIVEAWAYS section to see current giveaway cards and entry links.";
  };

  const buildResponse = (question) => {
    const normalized = normalize(question);
    const has = (...terms) => terms.some((term) => normalized.includes(term));

    if (has("bonus", "claim", "code", "kods", "promo", "videopower")) {
      return {
        text: "Use code VIDEOPOWER for VideoPower bonuses. Go to the BONUSES section, choose the site you want, then press CLAIM BONUS for the official bonus link.\nSome offers can be locked when they are temporarily unavailable.",
        actions: [
          { label: "OPEN BONUSES", href: links.bonuses },
          { label: "COPY CODE", copy: "VIDEOPOWER" },
          { label: "HELLCASE BONUS", href: links.hellcase }
        ]
      };
    }

    if (has("video", "short", "youtube", "channel", "latest", "pedej")) {
      return {
        text: `VideoPower Shorts and videos are shown in the VIDEOS section.\nLatest detected items:\n${getLatestVideoSummary()}`,
        actions: [
          { label: "OPEN VIDEOS", href: links.videos },
          { label: "YOUTUBE CHANNEL", href: links.youtube },
          { label: "SHORTS", href: links.youtubeShorts }
        ]
      };
    }

    if (has("giveaway", "giveaways", "twitter", "tweet", "win", "enter", "x.com")) {
      return {
        text: `Giveaways are listed in the GIVEAWAYS section. Pick a giveaway and press ENTER GIVEAWAY to open the Twitter post and check requirements.\nCurrent cards:\n${getGiveawaySummary()}`,
        actions: [
          { label: "OPEN GIVEAWAYS", href: links.giveaways },
          { label: "TWITTER", href: links.twitter }
        ]
      };
    }

    if (has("merch", "shop", "shirt", "hoodie", "store")) {
      return {
        text: "VideoPower merch is available in the official shop. Use the MERCH button in navigation or open it directly below.",
        actions: [
          { label: "OPEN MERCH", href: links.merch }
        ]
      };
    }

    if (has("special", "event", "hellcase", "skinclub", "locked", "unavailable", "sakura", "deep dive")) {
      return {
        text: "SPECIALS show limited-time opportunities and events. Hellcase is currently shown as the active Sakura Chase event. SkinClub can be locked when that offer is unavailable or being renewed.",
        actions: [
          { label: "OPEN SPECIALS", href: links.specials },
          { label: "HELLCASE EVENT", href: links.hellcase }
        ]
      };
    }

    if (has("faq", "help", "how", "kapec", "why", "requirements", "rules")) {
      return {
        text: "The FAQ section explains how to claim bonuses, copy the code, understand locked blocks, and enter giveaways. For giveaways, always check the Twitter post requirements.",
        actions: [
          { label: "OPEN FAQ", href: links.faq },
          { label: "ASK ABOUT GIVEAWAYS", prompt: "How do I enter giveaways on Twitter?" }
        ]
      };
    }

    if (has("18", "age", "responsible", "gamble", "safe", "loss")) {
      return {
        text: "Only users aged 18 and over should participate. Please gamble responsibly. VideoPower is not responsible for losses from gambling or betting platforms.",
        actions: [
          { label: "READ FAQ", href: links.faq }
        ]
      };
    }

    return {
      text: "I can help with VideoPower bonuses, promo code, specials, giveaways, YouTube videos or shorts, Twitter posts, merch, and FAQ. Try asking: Where are the latest videos? How do I claim a bonus? Where is merch?",
      actions: [
        { label: "BONUSES", prompt: "How do I claim bonuses?" },
        { label: "VIDEOS", prompt: "Where can I watch VideoPower videos and shorts?" },
        { label: "MERCH", prompt: "Where is the merch shop?" }
      ]
    };
  };

  const askQuestion = (question) => {
    const trimmedQuestion = String(question || "").trim();
    if (!trimmedQuestion) return;

    window.clearTimeout(botTimer);
    addMessage("user", trimmedQuestion);
    input.value = "";

    const typing = showTyping();
    const delay = Math.min(720, Math.max(260, trimmedQuestion.length * 12));

    botTimer = window.setTimeout(() => {
      typing.remove();
      const response = buildResponse(trimmedQuestion);
      addMessage("bot", response.text, response.actions);
    }, delay);
  };

  function openChat() {
    chat.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");

    if (!hasWelcomed) {
      hasWelcomed = true;
      addMessage(
        "bot",
        "Welcome to VideoPower Assistant. Ask me about bonuses, code VIDEOPOWER, giveaways, YouTube videos, Twitter, specials, merch, or website help.",
        [
          { label: "COPY CODE", copy: "VIDEOPOWER" },
          { label: "LATEST VIDEOS", prompt: "Where can I watch VideoPower videos and shorts?" }
        ]
      );
    }

    window.setTimeout(() => input.focus({ preventScroll: true }), 120);
  }

  function closeChat() {
    chat.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => {
    if (chat.classList.contains("is-open")) closeChat();
    else openChat();
  });

  closeButton.addEventListener("click", closeChat);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    askQuestion(input.value);
  });

  document.querySelectorAll("[data-ai-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      askQuestion(button.getAttribute("data-ai-prompt"));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chat.classList.contains("is-open")) {
      closeChat();
    }
  });
}

function initPromoCodeCopy() {
  const copyButtons = Array.from(document.querySelectorAll(".promo-copy-btn, #bonuses .bonus-copy-code"));
  if (!copyButtons.length) return;

  copyButtons.forEach((copyButton) => {
    if (!(copyButton instanceof HTMLButtonElement)) return;

    const codeToCopy = String(copyButton.dataset.copyText || "").trim();
    if (!codeToCopy) return;

    const defaultLabel = copyButton.getAttribute("aria-label") || "Copy promo code VIDEOPOWER";
    const status = copyButton.querySelector(".bonus-copy-code__status");
    const isBonusCopyButton = copyButton.classList.contains("bonus-copy-code");
    let resetTimer = 0;

    const setButtonState = (label, className = "") => {
      window.clearTimeout(resetTimer);
      copyButton.dataset.copyFeedback = label;
      copyButton.setAttribute("aria-label", `${label} ${codeToCopy}`);
      if (status) {
        status.textContent = className === "is-copied"
          ? `Code ${codeToCopy} copied`
          : `Could not copy code ${codeToCopy}`;
      }
      copyButton.classList.remove("is-copying", "is-copied", "is-error");
      if (className) {
        copyButton.classList.add(className);
      }
      resetTimer = window.setTimeout(() => {
        copyButton.dataset.copyFeedback = "";
        copyButton.setAttribute("aria-label", defaultLabel);
        copyButton.classList.remove("is-copying", "is-copied", "is-error");
        if (status) status.textContent = "";
      }, 1800);
    };

    const releaseButtonState = () => {
      window.setTimeout(() => {
        copyButton.blur();
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
          }
        }
      }, 0);
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
        document.execCommand("copy");
        copied = true;
      } catch (error) {
        copied = false;
      }

      document.body.removeChild(helperInput);
      return copied;
    };

    const copyCode = async () => {
      const copiedWithFallback = fallbackCopy();
      if (copiedWithFallback) {
        if (navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(codeToCopy).catch(() => {});
        }
        return true;
      }

      if (navigator.clipboard?.writeText) {
        try {
          const clipboardResult = Promise.resolve(navigator.clipboard.writeText(codeToCopy))
            .then(() => true)
            .catch(() => false);
          const copiedWithClipboard = await Promise.race([
            clipboardResult,
            new Promise((resolve) => window.setTimeout(() => resolve(false), 320))
          ]);
          if (copiedWithClipboard) return true;
        } catch (error) {
          // Fall through to the synchronous copy path below.
        }
      }

      return fallbackCopy();
    };

    if (isBonusCopyButton) {
      ["pointerdown", "pointerup", "mousedown", "mouseup"].forEach((eventName) => {
        copyButton.addEventListener(eventName, (event) => event.stopPropagation());
      });
      copyButton.addEventListener("dragstart", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    }

    copyButton.addEventListener("click", async (event) => {
      if (isBonusCopyButton) event.stopPropagation();
      copyButton.classList.remove("is-copied", "is-error");
      copyButton.classList.add("is-copying");
      copyButton.dataset.copyFeedback = "COPYING";
      if (status) status.textContent = `Copying code ${codeToCopy}`;
      const copied = await copyCode();
      if (copied) {
        setButtonState("COPIED!", "is-copied");
        releaseButtonState();
        return;
      }

      setButtonState("TRY AGAIN", "is-error");
      releaseButtonState();
    });

    copyButton.addEventListener("touchend", releaseButtonState, { passive: true });
    copyButton.addEventListener("pointerup", releaseButtonState, { passive: true });
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

    const totalMinutes = Math.ceil(remainingMs / 60000);
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

  const previousChannelButton = document.getElementById("videos-channel-previous");
  const nextChannelButton = document.getElementById("videos-channel-next");
  const channelPagination = document.getElementById("videos-channel-pagination");

  let loadedVideosByChannel = YOUTUBE_CHANNEL_IDS.map(() => []);
  let activeChannelIndex = 0;
  let hasRenderedVideos = false;
  const MAX_RESULTS = 3;
  const FETCH_RESULTS = 15;
  const VIDEO_CHANNEL_ROTATION_MS = 12500;
  const VIDEO_CHANNEL_TRANSITION_OUT_MS = 260;
  const VIDEO_CHANNEL_TRANSITION_IN_MS = 560;
  const channelFeedUrls = YOUTUBE_CHANNEL_IDS
    .filter(Boolean)
    .map((channelId) => `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);

  const VIDEO_RETRY_DELAY_MS = 12000;
  let retryTimer = 0;
  let rotationTimer = 0;
  let rotationDeadline = 0;
  let rotationRemainingMs = VIDEO_CHANNEL_ROTATION_MS;
  let focusReleaseTimer = 0;
  const rotationPauseReasons = new Set();
  let channelTransitionTimer = 0;
  let channelTransitionCleanupTimer = 0;
  const reducedVideoMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const channelIndicators = YOUTUBE_CHANNEL_IDS.map((channelId, index) => {
    if (!channelPagination) return null;

    const indicator = document.createElement("button");
    indicator.className = "videos-channel-indicator";
    indicator.type = "button";
    indicator.setAttribute("aria-label", `Show ${YOUTUBE_CHANNEL_NAMES[index] || `video channel ${index + 1}`}`);
    indicator.dataset.channelIndex = String(index);
    channelPagination.appendChild(indicator);
    return indicator;
  });

  function syncChannelControls() {
    const availableChannelIndexes = getAvailableChannelIndexes();
    const hasMultipleChannels = availableChannelIndexes.length > 1;

    [previousChannelButton, nextChannelButton].forEach((button) => {
      if (!button) return;
      button.disabled = !hasMultipleChannels;
      button.setAttribute("aria-disabled", String(!hasMultipleChannels));
    });

    channelIndicators.forEach((indicator, index) => {
      if (!indicator) return;
      const isAvailable = availableChannelIndexes.includes(index);
      const isActive = isAvailable && index === activeChannelIndex;
      indicator.disabled = !isAvailable;
      indicator.classList.toggle("is-active", isActive);
      indicator.setAttribute("aria-current", isActive ? "true" : "false");
      indicator.setAttribute("aria-disabled", String(!isAvailable));
    });
  }

  function renderLoading() {
    container.innerHTML = "";

    for (let i = 0; i < MAX_RESULTS; i += 1) {
      const card = document.createElement("article");
      card.className = "video-card skeleton";
      card.innerHTML = `
        <div class="video-media video-media--loading">
          <div class="video-skeleton-media"></div>
        </div>
        <div class="video-info">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
          <div class="skeleton-chip-row">
            <div class="skeleton-line skeleton-chip"></div>
            <div class="skeleton-line skeleton-chip"></div>
          </div>
        </div>
        <span class="video-card__frame" aria-hidden="true"></span>
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

  function getYoutubeThumbnail(videoId, quality = "maxresdefault") {
    return videoId ? `https://i.ytimg.com/vi/${videoId}/${quality}.jpg` : "";
  }

  function setHdVideoThumbnail(image, video) {
    const videoId = video.videoId || getVideoIdFromUrl(video.url || "");
    const fallbacks = videoId
      ? [
          getYoutubeThumbnail(videoId, "maxresdefault"),
          getYoutubeThumbnail(videoId, "sddefault"),
          getYoutubeThumbnail(videoId, "hqdefault"),
          video.image
        ].filter(Boolean)
      : [video.image].filter(Boolean);
    let index = 0;

    image.src = fallbacks[index] || "";
    image.addEventListener("error", () => {
      index += 1;
      if (index < fallbacks.length) {
        image.src = fallbacks[index];
      }
    });
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

  function createCard(video, shouldAnimate = true) {
    const card = document.createElement("a");
    const videoType = resolveVideoType(video);
    card.className = shouldAnimate ? "video-card video-card--entering" : "video-card";
    card.classList.add(`video-card--type-${videoType.toLowerCase()}`);
    card.dataset.videoType = videoType;
    card.href = video.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    enableExternalLinkDragging(card);

    const image = document.createElement("img");
    setHdVideoThumbnail(image, video);
    image.alt = video.title;
    image.loading = "eager";
    image.decoding = "async";
    image.fetchPriority = "high";
    image.draggable = false;
    image.sizes = "(max-width: 680px) 100vw, (max-width: 1020px) 50vw, 440px";

    const media = document.createElement("div");
    media.className = "video-media";

    const platform = document.createElement("span");
    platform.className = "video-platform-pill";
    platform.textContent = "YouTube";
    media.append(image, platform);

    const info = document.createElement("div");
    info.className = "video-info";
    const hasDate = Boolean(video.date);

    if (!hasDate) {
      info.classList.add("video-info--compact");
      card.classList.add("video-card--fallback");
    }

    const title = document.createElement("h3");
    title.textContent = video.title;
    info.append(title);

    if (hasDate) {
      const date = createMeta(
        "video-date",
        "https://cdn-icons-png.magnific.com/512/10945/10945388.png?ga=GA1.1.2084952846.1778171337",
        video.date
      );
      info.append(date);
    }

    const frame = document.createElement("span");
    frame.className = "video-card__frame";
    frame.setAttribute("aria-hidden", "true");

    card.append(media, info, frame);
    return card;
  }

  function renderVideos(videos) {
    const shouldAnimateCards = !container.querySelector(".video-card.skeleton");
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();
    videos.forEach((video, index) => {
      const card = createCard(video, shouldAnimateCards);
      card.style.setProperty("--video-enter-delay", `${Math.min(index * 70, 280)}ms`);
      fragment.appendChild(card);
    });
    container.appendChild(fragment);

    if (shouldAnimateCards) {
      window.requestAnimationFrame(() => {
        container.querySelectorAll(".video-card--entering").forEach((card) => {
          card.classList.add("is-ready");
        });
      });
    }
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
        const publishedValue = item.pubDate || item.published || item.isoDate || "";
        const publishedTimestamp = Date.parse(String(publishedValue || ""));
        const image =
          String(item.thumbnail || item.enclosure?.link || "").trim() ||
          getYoutubeThumbnail(videoId);

        return {
          title,
          url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawLink,
          image,
          date: formatPublishedDate(publishedValue),
          publishedTimestamp: Number.isNaN(publishedTimestamp) ? 0 : publishedTimestamp,
          length: "",
          videoId,
          durationSeconds: 0
        };
      })
      .filter((video) => video.title && video.url);
  }

  function parseXmlVideos(xmlText) {
    const parser = new DOMParser();
    const xmlDocument = parser.parseFromString(xmlText, "application/xml");
    const entries = [...xmlDocument.querySelectorAll("entry")].slice(0, FETCH_RESULTS);

    return entries
      .map((entry) => {
        const videoId =
          entry.getElementsByTagName("yt:videoId")[0]?.textContent?.trim() ||
          entry.getElementsByTagName("videoId")[0]?.textContent?.trim() ||
          "";
        const title = entry.getElementsByTagName("title")[0]?.textContent?.trim() || "";
        const published = entry.getElementsByTagName("published")[0]?.textContent?.trim() || "";
        const publishedTimestamp = Date.parse(published);

        return {
          title,
          url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          image: getYoutubeThumbnail(videoId),
          date: formatPublishedDate(published),
          publishedTimestamp: Number.isNaN(publishedTimestamp) ? 0 : publishedTimestamp,
          length: "",
          videoId,
          durationSeconds: 0
        };
      })
      .filter((video) => video.title && video.url);
  }

  function sortAndLimitVideos(videos) {
    const uniqueVideos = [...videos.reduce((map, video) => {
      const key = video.videoId || video.url;
      if (key && !map.has(key)) {
        map.set(key, video);
      }
      return map;
    }, new Map()).values()];

    return uniqueVideos
      .sort((first, second) => (second.publishedTimestamp || 0) - (first.publishedTimestamp || 0))
      .slice(0, FETCH_RESULTS);
  }

  function normalizeVideoForDisplay(video) {
    const type = resolveVideoType(video);
    return {
      ...video,
      type
    };
  }

  function getAvailableChannelIndexes() {
    return loadedVideosByChannel.flatMap((videos, index) => (
      videos.length ? [index] : []
    ));
  }

  function renderLatestVideos() {
    const availableChannelIndexes = getAvailableChannelIndexes();

    if (!availableChannelIndexes.length) {
      renderLoading();
      return;
    }

    if (!availableChannelIndexes.includes(activeChannelIndex)) {
      activeChannelIndex = availableChannelIndexes[0];
    }

    const videos = loadedVideosByChannel[activeChannelIndex].slice(0, MAX_RESULTS);

    if (!videos.length) {
      renderLoading();
      return;
    }

    container.dataset.activeChannelIndex = String(activeChannelIndex);
    container.dataset.activeChannelName = YOUTUBE_CHANNEL_NAMES[activeChannelIndex] || `VIDEOPOWER ${activeChannelIndex + 1}`;
    renderVideos(videos);
    syncChannelControls();
  }

  function clearChannelTransition() {
    window.clearTimeout(channelTransitionTimer);
    window.clearTimeout(channelTransitionCleanupTimer);
    channelTransitionTimer = 0;
    channelTransitionCleanupTimer = 0;
    container.classList.remove("is-channel-leaving", "is-channel-entering");
  }

  function transitionToChannel(nextChannelIndex) {
    if (nextChannelIndex === activeChannelIndex) return;

    clearChannelTransition();
    activeChannelIndex = nextChannelIndex;
    renderLatestVideos();
  }

  function clearVideoRotationTimer() {
    window.clearTimeout(rotationTimer);
    rotationTimer = 0;
    rotationDeadline = 0;
  }

  function getNextVideoChannelIndex() {
    const availableChannelIndexes = getAvailableChannelIndexes();
    if (availableChannelIndexes.length < 2) return -1;

    const currentPosition = availableChannelIndexes.indexOf(activeChannelIndex);
    return availableChannelIndexes[
      ((currentPosition < 0 ? -1 : currentPosition) + 1) % availableChannelIndexes.length
    ];
  }

  function getPreviousVideoChannelIndex() {
    const availableChannelIndexes = getAvailableChannelIndexes();
    if (availableChannelIndexes.length < 2) return -1;

    const currentPosition = availableChannelIndexes.indexOf(activeChannelIndex);
    const safePosition = currentPosition < 0 ? 0 : currentPosition;
    return availableChannelIndexes[
      (safePosition - 1 + availableChannelIndexes.length) % availableChannelIndexes.length
    ];
  }

  function selectVideoChannel(nextChannelIndex) {
    const availableChannelIndexes = getAvailableChannelIndexes();
    if (!availableChannelIndexes.includes(nextChannelIndex) || nextChannelIndex === activeChannelIndex) return;

    transitionToChannel(nextChannelIndex);
    rotationRemainingMs = VIDEO_CHANNEL_ROTATION_MS;
    scheduleVideoRotation(VIDEO_CHANNEL_ROTATION_MS);
  }

  function scheduleVideoRotation(delayMs = rotationRemainingMs) {
    clearVideoRotationTimer();
    if (
      rotationPauseReasons.size
      || document.hidden
      || getAvailableChannelIndexes().length < 2
    ) {
      return;
    }

    const safeDelay = Number.isFinite(delayMs) ? delayMs : VIDEO_CHANNEL_ROTATION_MS;
    rotationRemainingMs = Math.max(0, Math.min(VIDEO_CHANNEL_ROTATION_MS, safeDelay));
    rotationDeadline = window.performance.now() + rotationRemainingMs;

    rotationTimer = window.setTimeout(() => {
      rotationTimer = 0;
      rotationDeadline = 0;

      const nextChannelIndex = getNextVideoChannelIndex();
      rotationRemainingMs = VIDEO_CHANNEL_ROTATION_MS;

      if (nextChannelIndex < 0 || rotationPauseReasons.size || document.hidden) return;

      transitionToChannel(nextChannelIndex);
      scheduleVideoRotation(VIDEO_CHANNEL_ROTATION_MS);
    }, rotationRemainingMs);
  }

  function pauseVideoRotation(reason) {
    if (rotationPauseReasons.has(reason)) return;

    rotationPauseReasons.add(reason);
    if (!rotationTimer) return;

    rotationRemainingMs = Math.max(0, rotationDeadline - window.performance.now());
    clearVideoRotationTimer();
  }

  function resumeVideoRotation(reason) {
    if (!rotationPauseReasons.delete(reason)) return;
    if (rotationPauseReasons.size || document.hidden) return;

    scheduleVideoRotation(rotationRemainingMs);
  }

  function startVideoRotation() {
    if (getAvailableChannelIndexes().length < 2) {
      clearVideoRotationTimer();
      rotationRemainingMs = VIDEO_CHANNEL_ROTATION_MS;
      return;
    }

    if (rotationTimer || rotationPauseReasons.size) return;
    scheduleVideoRotation(rotationRemainingMs);
  }

  const getVideoCardFromTarget = (target) => {
    const card = target instanceof Element ? target.closest(".video-card") : null;
    return card && container.contains(card) ? card : null;
  };

  const syncVideoHoverPause = () => {};

  container.addEventListener("focusin", (event) => {
    window.clearTimeout(focusReleaseTimer);
    if (getVideoCardFromTarget(event.target)) pauseVideoRotation("focus");
  });

  container.addEventListener("focusout", () => {
    window.clearTimeout(focusReleaseTimer);
    focusReleaseTimer = window.setTimeout(() => {
      if (!getVideoCardFromTarget(document.activeElement)) resumeVideoRotation("focus");
    }, 0);
  });

  container.addEventListener("dragstart", (event) => {
    if (getVideoCardFromTarget(event.target)) pauseVideoRotation("drag");
  }, true);

  const finishVideoDrag = () => {
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && getVideoCardFromTarget(activeElement)) {
        activeElement.blur();
      }

      syncVideoHoverPause();
      resumeVideoRotation("drag");
    });
  };

  container.addEventListener("dragend", finishVideoDrag, true);
  window.addEventListener("dragend", finishVideoDrag, true);
  window.addEventListener("drop", finishVideoDrag, true);

  previousChannelButton?.addEventListener("click", () => {
    const previousChannelIndex = getPreviousVideoChannelIndex();
    if (previousChannelIndex >= 0) selectVideoChannel(previousChannelIndex);
  });

  nextChannelButton?.addEventListener("click", () => {
    const nextChannelIndex = getNextVideoChannelIndex();
    if (nextChannelIndex >= 0) selectVideoChannel(nextChannelIndex);
  });

  channelIndicators.forEach((indicator, index) => {
    indicator?.addEventListener("click", () => selectVideoChannel(index));
  });

  if (document.hidden) rotationPauseReasons.add("visibility");
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseVideoRotation("visibility");
    else resumeVideoRotation("visibility");
  });

  async function fetchVideosFromRss2Json(channelFeedUrl) {
    const rss2JsonUrl = new URL("https://api.rss2json.com/v1/api.json");
    rss2JsonUrl.search = new URLSearchParams({
      rss_url: channelFeedUrl,
      count: String(FETCH_RESULTS)
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

  async function fetchVideosFromXmlProxy(proxyBaseUrl, channelFeedUrl) {
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

  async function fetchVideosDirectXml(channelFeedUrl) {
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

  async function fetchVideosFromChannel(channelFeedUrl) {
    const strategyPromises = [
      fetchVideosFromRss2Json(channelFeedUrl),
      fetchVideosFromXmlProxy("https://api.allorigins.win/raw?url=", channelFeedUrl),
      fetchVideosFromXmlProxy("https://api.codetabs.com/v1/proxy/?quest=", channelFeedUrl),
      fetchVideosDirectXml(channelFeedUrl)
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

    throw new Error("No client-side video source returned channel data.");
  }

  async function fetchVideos() {
    const channelResults = await Promise.allSettled(channelFeedUrls.map(fetchVideosFromChannel));
    const channelVideos = channelResults.map((result) => (
      result.status === "fulfilled"
        ? sortAndLimitVideos(result.value).map(normalizeVideoForDisplay)
        : []
    ));

    if (channelVideos.some((videos) => videos.length)) {
      return {
        channelVideos,
        hasMissingChannel: channelVideos.some((videos) => !videos.length)
      };
    }

    throw new Error("No client-side video source returned data.");
  }

  const loadVideos = () => {
    window.clearTimeout(retryTimer);

    fetchVideos()
      .then(({ channelVideos, hasMissingChannel }) => {
        const primaryWasAvailable = Boolean(loadedVideosByChannel[0]?.length);

        loadedVideosByChannel = channelVideos.map((videos, index) => (
          videos.length ? videos : loadedVideosByChannel[index]
        ));

        const availableChannelIndexes = getAvailableChannelIndexes();
        const primaryBecameAvailable = !primaryWasAvailable && Boolean(loadedVideosByChannel[0]?.length);

        if (!hasRenderedVideos || primaryBecameAvailable) {
          activeChannelIndex = availableChannelIndexes.includes(0)
            ? 0
            : availableChannelIndexes[0];
        }

        hasRenderedVideos = true;
        clearChannelTransition();
        renderLatestVideos();
        startVideoRotation();

        if (hasMissingChannel) {
          retryTimer = window.setTimeout(loadVideos, VIDEO_RETRY_DELAY_MS);
        }
      })
      .catch(() => {
        if (!getAvailableChannelIndexes().length) {
          renderLoading();
        }
        retryTimer = window.setTimeout(loadVideos, VIDEO_RETRY_DELAY_MS);
      });
  };

  renderLoading();
  syncChannelControls();
  loadVideos();
}

function initHamburgerMenu() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("main-nav");
  if (!hamburger || !nav) return;

  const navLinks = nav.querySelectorAll("a");
  const isMobile = () => window.innerWidth <= 860;
  const releaseFocus = (element) => {
    if (!(element instanceof HTMLElement)) return;
    window.setTimeout(() => {
      element.blur();
    }, 0);
  };

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
    document.documentElement.classList.add("menu-open");
    document.body.classList.add("menu-open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close navigation");
    nav.scrollTop = 0;
    syncNavAccessibility();
  }

  function closeMenu() {
    hamburger.classList.remove("active");
    nav.classList.remove("show");
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation");
    releaseFocus(hamburger);
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

  hamburger.addEventListener("touchend", () => {
    releaseFocus(hamburger);
  }, { passive: true });

  hamburger.addEventListener("pointerup", () => {
    releaseFocus(hamburger);
  });

  hamburger.addEventListener("pointercancel", () => {
    releaseFocus(hamburger);
  });

  hamburger.addEventListener("mouseleave", () => {
    releaseFocus(hamburger);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobile()) closeMenu();
      releaseFocus(link);
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
    if (
      !nav.contains(event.target)
      && !hamburger.contains(event.target)
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("show")) {
      closeMenu();
    }
  });

  window.addEventListener("hashchange", () => {
    if (isMobile()) closeMenu();
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
      ".main-nav a, .footer-nav a, .btn, .promo-copy-btn, .video-card, #promo-code, .social-icon, .code-block a, .bonus-reward-card__button, .bonus-reward-card__surface-link, .news-team-action, .promo-banner, .giveaway-arrow, .hamburger"
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

function initNewsTeamButtonPress() {
  const actions = Array.from(document.querySelectorAll("#news .news-team-action"));
  if (!actions.length) return;
  getExternalLinkDragImage();

  actions.forEach((action) => {
    const member = action.closest(".news-team-member");

    const settle = () => {
      action.classList.remove("is-link-drag-ready", "is-link-dragging");
      action.blur();
    };

    const setReturnRestState = () => {
      settle();
      action.dataset.awaitingReturn = "true";
      action.classList.add("is-return-resting");
      member?.classList.add("is-news-action-resting");
    };

    const clearReturnRestState = () => {
      delete action.dataset.awaitingReturn;
      action.classList.remove("is-return-resting");
      member?.classList.remove("is-news-action-resting");
    };

    enableExternalLinkDragging(action);
    action.addEventListener("dragstart", clearReturnRestState);
    action.addEventListener("pointerup", settle);
    action.addEventListener("pointercancel", settle);
    action.addEventListener("pointerleave", () => {
      clearReturnRestState();
      if (!action.classList.contains("is-link-dragging")) settle();
    });
    action.addEventListener("dragend", settle);
    action.addEventListener("click", setReturnRestState);
    action.addEventListener("blur", settle);
  });

  const reset = () => {
    actions.forEach((action) => {
      action.classList.remove("is-link-drag-ready", "is-link-dragging");
      action.classList.toggle("is-return-resting", action.dataset.awaitingReturn === "true");
      action.blur();
    });

    document.querySelectorAll("#news .news-team-member").forEach((member) => {
      member.classList.remove("is-news-action-pressing");
      member.classList.toggle(
        "is-news-action-resting",
        Boolean(member.querySelector('.news-team-action[data-awaiting-return="true"]'))
      );
    });
  };

  window.addEventListener("pageshow", reset);
  window.addEventListener("focus", reset);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) reset();
  });
}
