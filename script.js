/* ---------- Hero background videos: start at once, keep playing, rest only while off screen ---------- */
const heroVideos = Array.from(document.querySelectorAll(".hero-loop"));

// Columns 3 and 4 are hidden on phones, so index.html only attaches their clips (data-src) on wider
// screens. This also covers a phone being turned sideways later.
const heroNarrowQuery = window.matchMedia("(max-width: 700px)");
// (attachHeroSources() itself is defined and first run at the end of this hero block, after the helpers it uses.)

// The clips autoplay and loop on their own (muted + autoplay + loop in the markup; the files are cut so the
// native wrap is a soft dissolve). Nothing below ever seeks them, reloads them or touches one that is playing:
// it only starts a clip that is NOT playing. That matters because browsers hold autoplay back or undo it in
// several situations - Chrome pauses muted video "to save power" while the window is hidden or covered (for
// example a just-opened browser window that is not on top yet) and then does not always start it again;
// iPhones in Low Power Mode and some profiles/policies refuse autoplay until the first touch or click.
// So a paused clip is started again at every moment that can matter (see the listeners and the watchdog below).
const heroHasPlayed = new WeakSet();
const heroRestartLog = new WeakMap(); // when a clip was recently restarted automatically
const heroLastAuto = new WeakMap();   // the last such restart
const heroFights = new WeakMap();     // how many of those restarts something undid again at once
const heroBlocked = new WeakSet();    // clips whose last play() was refused by the autoplay policy

// Browsers only treat a video as autoplay-eligible when it is muted; set it as a property too (some only
// honour that), also for clips whose file is attached later. All no-ops on a clip that is already set up.
function prepareHeroVideo(v) {
  v.defaultMuted = true;
  v.muted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.loop = true;
}
// While the page is hidden (minimised, covered, background tab) a play() would only be refused by the
// browser (it aborts it "to save power") and would use up the clip's one automatic start: wait for it to show.
// (anyway = the visitor has just clicked / pressed a key: the page is plainly in use, whatever it reports.)
function heroCanPlayNow(v, anyway) {
  return v.paused && !!v.getAttribute("src") && (anyway || !document.hidden) &&
    v.dataset.offscreen !== "1" && !document.body.classList.contains("vsl-playing");
}
// A clip that something keeps stopping again (a "block autoplay" extension, a power-saver) is not fought
// with: after 3 automatic restarts that were undone at once, or 5 within 10 s, it is left to the visitor's
// next click / key press.
function heroMayRestart(v) {
  const now = Date.now();
  const log = (heroRestartLog.get(v) || []).filter((t) => now - t < 10000);
  heroRestartLog.set(v, log);
  if (log.length >= 5) return false;
  log.push(now);
  return true;
}
function kickHeroVideo(v, automatic, anyway) {
  if (!heroCanPlayNow(v, anyway)) return;
  if (automatic) {
    if ((heroFights.get(v) || 0) >= 3) return;
    if (heroHasPlayed.has(v) && !heroMayRestart(v)) return;
    heroLastAuto.set(v, Date.now());
  }
  const p = v.play();
  if (p && p.catch) p.catch((err) => {
    // Refused outright (autoplay policy: no user activation yet): no UI, the watchdog just slows down for this
    // clip, and the next click / key press (onHeroGesture) starts it.
    if (err && err.name === "NotAllowedError") heroBlocked.add(v);
  });
}
function kickAllHeroVideos() {
  heroVideos.forEach((v) => kickHeroVideo(v));
}
// Window too small to mean anything (hidden window opened at 0x0 / 1x1 before it is sized) or page hidden:
// the observer's "not in view" answer is not trusted then, and is asked again when the page shows or resizes.
function heroViewportUsable() {
  return !document.hidden && window.innerWidth >= 100 && window.innerHeight >= 100;
}
let heroViewportWasUsable = heroViewportUsable();
// A clip is paused only once it is completely out of view with a wide margin (300px), and resumed when it
// comes back - small scroll movements near the edge of the screen never toggle it.
const heroVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const v = entry.target;
    if (entry.isIntersecting) {
      delete v.dataset.offscreen;
      kickHeroVideo(v);
    } else if (heroViewportUsable()) {
      v.dataset.offscreen = "1";
      if (!v.paused) v.pause();
    }
  });
}, { rootMargin: "300px 0px", threshold: 0 });
function reobserveHeroVideos() {
  heroVideos.forEach((v) => { heroVideoObserver.unobserve(v); heroVideoObserver.observe(v); });
}
function heroAllPlaying() {
  return heroVideos.every((v) => !v.getAttribute("src") || (heroHasPlayed.has(v) && !v.paused));
}

// First-input fallback for browsers that hold autoplay back (even muted) until the visitor does something:
// the first click / key / touch / scroll / mouse move starts any clip that is paused. Stays registered until
// every clip is confirmed playing, then removes itself (and comes back if a clip is found stopped again).
const heroGestureEvents = ["pointerdown", "mousedown", "click", "touchstart", "keydown", "mousemove", "wheel", "scroll"];
let heroGesturesArmed = false;
let heroGestureLast = 0;
function onHeroGesture(e) {
  if (e.type === "mousemove" || e.type === "wheel" || e.type === "scroll") { // harmless, fires a lot
    const n = performance.now();
    if (n - heroGestureLast < 200) return;
    heroGestureLast = n;
  }
  const activation = e.type === "pointerdown" || e.type === "mousedown" || e.type === "click" || e.type === "touchstart" || e.type === "keydown";
  heroVideos.forEach((v) => {
    if (activation) { heroFights.delete(v); heroRestartLog.delete(v); heroBlocked.delete(v); } // a real click / key press: start afresh
    kickHeroVideo(v, false, true);
  });
  if (heroAllPlaying()) disarmHeroGestures();
}
function armHeroGestures() {
  if (heroGesturesArmed) return;
  heroGesturesArmed = true;
  heroGestureEvents.forEach((name) => window.addEventListener(name, onHeroGesture, { passive: true, capture: true }));
}
function disarmHeroGestures() {
  if (!heroGesturesArmed) return;
  heroGesturesArmed = false;
  heroGestureEvents.forEach((name) => window.removeEventListener(name, onHeroGesture, { capture: true }));
}

heroVideos.forEach((v) => {
  prepareHeroVideo(v);
  // Try again the moment there is something to play, at every stage of loading.
  ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"].forEach((type) => {
    v.addEventListener(type, () => kickHeroVideo(v));
  });
  v.addEventListener("playing", () => {
    heroHasPlayed.add(v);
    heroBlocked.delete(v);
    if (heroAllPlaying()) disarmHeroGestures();
  });
  // Stopped by someone else while the hero is on screen and the page is showing (not our own off-screen / VSL
  // rest, not the browser's rest while the page is hidden): start it again.
  v.addEventListener("pause", () => {
    if (!v.getAttribute("src") || document.hidden || v.dataset.offscreen === "1" || document.body.classList.contains("vsl-playing")) return;
    if (Date.now() - (heroLastAuto.get(v) || 0) < 1500) heroFights.set(v, (heroFights.get(v) || 0) + 1); // undone right after our restart
    armHeroGestures();
    setTimeout(() => kickHeroVideo(v, true), 50);
  });
  heroVideoObserver.observe(v);
});

// Every moment that can matter, not only once: the document is parsed / fully loaded, the page is restored
// from the back-forward cache, the window or tab is shown or focused, the window is resized.
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kickAllHeroVideos, { once: true });
window.addEventListener("load", kickAllHeroVideos);
window.addEventListener("pageshow", kickAllHeroVideos);
window.addEventListener("focus", kickAllHeroVideos);
document.addEventListener("visibilitychange", () => {
  heroViewportWasUsable = heroViewportUsable();
  if (document.hidden) return;
  reobserveHeroVideos(); // fresh in/out-of-view answer for every clip (also kicks the ones in view)
  kickAllHeroVideos();
});
window.addEventListener("resize", () => {
  const usable = heroViewportUsable();
  if (usable && !heroViewportWasUsable) { reobserveHeroVideos(); kickAllHeroVideos(); }
  heroViewportWasUsable = usable;
});

// Watchdog: every 400 ms for the first 8 s, then every 2 s, any clip that is paused and not deliberately
// resting (off screen, VSL playing, page hidden) is started. Cheap: four property reads per tick.
let heroWatchTick = 0;
(function heroWatchdog() {
  heroWatchTick++;
  let stuck = false;
  heroVideos.forEach((v) => {
    if (!heroCanPlayNow(v)) return;
    stuck = true;
    // A clip the autoplay policy refused is only retried every 5th tick; it is the visitor's click that starts it.
    if (!heroBlocked.has(v) || heroWatchTick % 5 === 0) kickHeroVideo(v, true);
  });
  if (stuck) armHeroGestures();
  setTimeout(heroWatchdog, performance.now() < 8000 ? 400 : 2000);
})();

function attachHeroSources() {
  if (heroNarrowQuery.matches) return;
  heroVideos.forEach((v) => {
    if (!v.getAttribute("src") && v.dataset.src) {
      v.src = v.dataset.src;
      prepareHeroVideo(v);
      kickHeroVideo(v);
    }
  });
  armHeroGestures();
}
attachHeroSources();
if (heroNarrowQuery.addEventListener) heroNarrowQuery.addEventListener("change", attachHeroSources);
armHeroGestures();
// At once, without waiting for the observer's first answer.
kickAllHeroVideos();

/* ---------- Site background video: crossfaded loop, always smooth ---------- */
(function () {
  const a = document.getElementById("bg-fixed-video-a");
  const b = document.getElementById("bg-fixed-video-b");
  if (!a || !b) return;
  const speed = 1;

  function whenReady(video) {
    return new Promise((resolve) => {
      if (video.readyState >= 1 && video.duration) resolve();
      else video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    });
  }

  function crossfade(video) {
    const dur = video.duration;
    if (!dur) return 1;
    const phase = (video.currentTime / dur) * 2 * Math.PI;
    return (1 - Math.cos(phase)) / 2;
  }

  // The page starts with the plain dark background; once the clips run they fade in over 1.5 s (rather
  // than popping in), then the crossfade loop below carries on exactly as before.
  let tickStart = 0;
  let rampStart = 0;
  function tick() {
    const now = performance.now();
    if (!rampStart && ((a.readyState >= 3 && b.readyState >= 3 && !a.paused && !b.paused) || now - tickStart > 3000)) rampStart = now;
    const fadeIn = rampStart ? Math.min(1, (now - rampStart) / 1500) : 0;
    a.style.opacity = crossfade(a) * fadeIn;
    b.style.opacity = crossfade(b) * fadeIn;
    requestAnimationFrame(tick);
  }

  // The two clips are the same ~20 MB file. While the hero is on screen they sit behind the four hero clips
  // and their dark shade, so they are not worth any bandwidth or decoder time: nothing is fetched or
  // played until the visitor scrolls past ~60% of the hero. (Idling at the top for a long while only
  // pre-buffers the file, without decoding or fading in, so the first scroll finds it ready.)
  let started = false;
  function attachBackground() {
    if (a.getAttribute("src")) return;
    [a, b].forEach((v) => { v.preload = "auto"; v.src = v.dataset.src; });
  }
  function startBackground() {
    if (started) return;
    started = true;
    attachBackground();
    Promise.all([whenReady(a), whenReady(b)]).then(() => {
      a.playbackRate = speed;
      b.playbackRate = speed;
      try { b.currentTime = a.duration / 2; } catch (e) {}
      // While the VSL plays everything else rests; the player's resume() starts these two again.
      if (!document.body.classList.contains("vsl-playing")) {
        a.play().catch(() => {});
        b.play().catch(() => {});
      }
      tickStart = performance.now();
      requestAnimationFrame(tick);
    });
  }
  const heroSection = document.getElementById("hero");
  function scheduleBackground() {
    if ("requestIdleCallback" in window) requestIdleCallback(startBackground, { timeout: 1000 });
    else setTimeout(startBackground, 200);
  }
  // Past ~60% of the hero = less than 40% of it is still on screen. Also true for a page that is opened
  // or reloaded part-way down, or that jumps straight to a section from the menu.
  function checkScrolledPastHero() {
    if (started) return;
    const r = heroSection ? heroSection.getBoundingClientRect() : null;
    if (!r || r.bottom < r.height * 0.4) {
      window.removeEventListener("scroll", checkScrolledPastHero);
      scheduleBackground();
    }
  }
  window.addEventListener("scroll", checkScrolledPastHero, { passive: true });
  if (document.readyState === "complete") checkScrolledPastHero();
  else window.addEventListener("load", checkScrolledPastHero, { once: true });
  // Still at the top after a long wait: pre-buffer only.
  setTimeout(() => {
    if (started) return;
    if ("requestIdleCallback" in window) requestIdleCallback(attachBackground, { timeout: 2000 });
    else attachBackground();
  }, 25000);
})();

/* ---------- Center the hero rule above “Fast turnaround” ---------- */
(function () {
  const rule = document.querySelector(".eyebrow-rule");
  const focus = document.querySelector(".eyebrow-focus");
  const content = document.querySelector(".hero-content");
  if (!rule || !focus || !content) return;

  function alignRule() {
    rule.style.marginLeft = "0px";
    const focusRect = focus.getBoundingClientRect();
    const ruleRect = rule.getBoundingClientRect();
    const offset = focusRect.left + focusRect.width / 2 - ruleRect.width / 2 - ruleRect.left;
    rule.style.marginLeft = `${Math.max(0, offset)}px`;
  }

  window.addEventListener("resize", alignRule);
  window.addEventListener("load", alignRule);
  if (document.fonts?.ready) document.fonts.ready.then(alignRule);
  alignRule();
})();

/* ---------- Keep hero call-to-action centered with the header ---------- */
(function () {
  const actions = document.querySelector(".hero-actions");
  if (!actions) return;

  function centerActions() {
    actions.style.transform = "translateX(0)";
    const rect = actions.getBoundingClientRect();
    actions.style.transform = `translateX(${window.innerWidth / 2 - (rect.left + rect.width / 2)}px)`;
  }

  window.addEventListener("resize", centerActions);
  window.addEventListener("load", centerActions);
  centerActions();
})();

/* ---------- Everything below the hero: set up once the hero clips are playing ----------
   The hero clips start by themselves (autoplay), but starting them needs the main thread, and building the
   page's cards, pricing, FAQ, menus and scroll effects takes a few hundred ms of it. So that work (initPage,
   which runs to the end of this file) waits until the clips have been playing for ~1 s - or the visitor's first
   touch / click / key / scroll, or 3.5 s at the latest, or a #link in the address (built at once) - instead of
   delaying the clips. Same page, built a moment later. */
function* initPage() {
/* ---------- Shared: autoplay preview videos as they scroll into view ---------- */
// Preview clips start with no file attached (data-src, preload="none") so nothing is downloaded at
// page load; this attaches the file the first time it is needed.
function attachLazySource(video, preload) {
  if (!video.dataset.src) return;
  video.preload = preload || "auto";
  video.src = video.dataset.src;
  delete video.dataset.src;
}
const scrollAutoplayObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting) {
      attachLazySource(video);
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.5 });
function registerAutoplayVideo(video) {
  scrollAutoplayObserver.observe(video);
}

const PORTFOLIO_BASE = "assets/portfolio/";

yield; // chunk boundary: the browser can draw video frames / handle input between chunks
/* ---------- Work grid data (real client work) ---------- */
const workItems = [
  { cats: ["ads"], label: "Ads", file: "ads/ad-1.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-2.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-3.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-4.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-5.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-6.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-7.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-8.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-9.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/office-vsl-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-1-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-4k-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-4-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-5-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-6-preview.mp4" },
  { cats: ["ai"], label: "AI Content", file: "ai-content/mastermind-ad-techy.mp4", hideFromAll: true },
  { cats: ["ai"], label: "AI Content", file: "ai-content/mastermind-cohort-4.mp4", hideFromAll: true },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-01.mp4", hideFromAll: true },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-1.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-2.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-3.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-4.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-5.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-6.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-7.mp4", hideFromAll: true },
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/betting-vlog-preview.mp4" },
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/vlog-01-preview.mp4" },
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/vlog-2-preview.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-1.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-2.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-3.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-4.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-5.mp4" },
];

/* ---------- Featured work: what the "All" tab shows ----------
   ORDER = DISPLAY ORDER IN THE "ALL" TAB - EDIT HERE.
   The "All" tab shows exactly these clips, left to right, top to bottom, in this order
   (each entry is a `file` value from workItems above). It ignores hideFromAll and the
   portrait/landscape check. Every other tab is unchanged and still lists its own clips.
   To add a clip, add its `file` value; to remove one, delete its line.
   If this list is left empty, "All" falls back to every portrait clip that is not hideFromAll. */
const featuredWork = [
  "shortform/video-4.mp4",           // man in blue t-shirt, "We've"
  "ads/ad-9.mp4",                    // "Meet Higgsfield"
  "shortform/video-2.mp4",           // "Investment portfolio isn't complete"
  "ads/ad-4.mp4",                    // self-tan mitt, "No outfit"
  "ai-content/mastermind-cohort-4.mp4", // "quote killed / 2 years lost"
  "ads/ad-6.mp4",                    // woman in white coat
  "shortform/video-3.mp4",           // five women at sunset
  "ads/ad-1.mp4",                    // "$100 per day on ads"
  "shortform/video-1.mp4",           // man in beige polo on a bench
];
const featuredRank = new Map(featuredWork.map((file, rank) => [file, rank]));
featuredWork.forEach((file) => {
  if (!workItems.some((item) => item.file === file)) console.warn("featuredWork: no workItems entry for", file);
});

const workGrid = document.getElementById("work-grid");
let activeWorkFilter = "all";
const workPosterLoaders = [];
// Single rule for "does this card belong in the All tab".
function shownInAll(card) {
  if (featuredRank.size) return card.dataset.featured !== undefined;
  return card.dataset.format !== "landscape" && card.dataset.hideFromAll !== "true";
}
// Cards are ordered with CSS `order` (the grid keeps DOM order otherwise): featured rank in the
// All tab, the original workItems position in every other tab.
function workCardOrder(card, filter) {
  return filter === "all" && featuredRank.size && card.dataset.featured !== undefined
    ? card.dataset.featured
    : card.dataset.index;
}
function setWorkCardFormat(card, isLandscape) {
  card.dataset.format = isLandscape ? "landscape" : "reel";
  card.classList.toggle("landscape", isLandscape);
  // Only the "all" view is decided from the format; shownInAll() also covers the
  // featured list and hideFromAll, so it is safe to both hide and unhide here.
  if (activeWorkFilter === "all") card.classList.toggle("hidden", !shownInAll(card));
}
workItems.forEach((item, index) => {
  const src = `${PORTFOLIO_BASE}${item.file}`;
  // The grid only ever shows these at thumbnail size, so the on-hover
  // preview plays a small muted proxy (640px wide, no audio) instead of
  // the full 1080p file - that's what was making hover playback take ages
  // to start. Clicking through to the lightbox still loads the real,
  // full-quality clip via `src`.
  const gridSrc = src.replace(/\.mp4$/, "-grid.mp4");
  const posterName = item.file.split("/").pop().replace(/\.mp4$/, ".jpg");
  const poster = `${PORTFOLIO_BASE}posters/${posterName}`;
  const card = document.createElement("div");
  card.className = "work-card reveal";
  card.dataset.cat = item.cats.join(" ");
  card.dataset.index = index;
  if (featuredRank.has(item.file)) card.dataset.featured = featuredRank.get(item.file);
  if (item.hideFromAll) card.dataset.hideFromAll = "true";
  // Set synchronously at creation, not through applyWorkFilter (which only runs on a
  // tab click) - otherwise cards that do not belong in the default "All" view would show
  // up for a moment before anything hides them, and the featured cards would flash in the
  // wrong order. Clicking their actual category tab still reveals them normally.
  if (!shownInAll(card)) card.classList.add("hidden");
  card.style.order = workCardOrder(card, activeWorkFilter);
  // Nothing for this card is downloaded at page load: the poster still is fetched later by
  // loadWorkPosters() (below), and the preview clip only when the visitor first hovers the card.
  card.innerHTML = `
    <video muted loop playsinline preload="none" data-src="${gridSrc}"></video>
    <span class="work-card-tag">${item.label}</span>
  `;
  const video = card.querySelector("video");
  // The card's shape comes from the poster still (same shape as the clip), so no video
  // file has to be opened just to find out whether it is a reel or landscape.
  workPosterLoaders.push(() => {
    const still = new Image();
    still.decoding = "async";
    still.onload = () => {
      video.poster = poster;
      setWorkCardFormat(card, still.naturalWidth >= still.naturalHeight);
    };
    still.onerror = () => {
      // Poster could not be read: fall back to opening the preview clip, as the grid used to.
      video.poster = poster;
      video.addEventListener("loadedmetadata", () => setWorkCardFormat(card, video.videoWidth >= video.videoHeight), { once: true });
      attachLazySource(video, "metadata");
    };
    still.src = poster;
  });
  // Preview plays only on hover, not on scroll-into-view — with 21 cards in
  // this grid, autoplaying every card that scrolls 50% into view meant
  // several 1080p videos could be decoding at once, which is what caused
  // the stutter/lag.
  card.addEventListener("mouseenter", () => { attachLazySource(video); video.currentTime = 0; video.play().catch(() => {}); });
  card.addEventListener("mouseleave", () => { video.pause(); video.currentTime = 0; });
  card.addEventListener("click", () => openLightbox(src));
  workGrid.appendChild(card);
});

// Fetch the poster stills (and so set every card's shape) once Our Work is about to come into view.
let workPostersRequested = false;
function loadWorkPosters() {
  if (workPostersRequested) return;
  workPostersRequested = true;
  workPosterLoaders.forEach((load) => load());
}
const workSectionEl = document.getElementById("work");
if (workSectionEl && "IntersectionObserver" in window) {
  const workNearObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      workNearObserver.disconnect();
      loadWorkPosters();
    }
  }, { rootMargin: "1200px 0px" });
  workNearObserver.observe(workSectionEl);
} else {
  loadWorkPosters();
}

const filterTabs = document.querySelectorAll(".filter-tab");

function applyWorkFilter(filter) {
  document.querySelectorAll(".work-card").forEach(card => {
    const matches = filter === "all"
      ? shownInAll(card)
      : card.dataset.cat.split(" ").includes(filter);
    card.classList.toggle("hidden", !matches);
    card.style.order = workCardOrder(card, filter);
  });
}

filterTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    filterTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const filter = tab.dataset.filter;
    activeWorkFilter = filter;
    applyWorkFilter(filter);
  });
});

yield;
/* ---------- Services ---------- */
const services = [
  { tag: "Content Production", title: "Video Editing", desc: "Scroll-stopping edits built for stronger pacing, clarity, and retention." },
  { tag: "Content Production", title: "AI Content Creation<br>and Editing", desc: "Concepts and content produced with AI to help you move faster without losing your voice." },
  { tag: "Design & Motion", title: "Graphic Design", desc: "Thumbnails, covers, and visual assets that make your content instantly recognisable." },
  { tag: "Growth & Distribution", title: "Social Media Management", desc: "A dependable content system for planning, publishing, and growing your presence." },
];
const servicesList = document.getElementById("services-list");
services.forEach((s, i) => {
  const row = document.createElement("div");
  row.className = "service-row";
  row.innerHTML = `
    <div class="service-index">0${i + 1}</div>
    <div class="service-title-wrap">
      <span class="service-tag">${s.tag}</span>
      <h3 class="${i === 0 ? "service-title-nowrap" : i === 1 ? "service-title-ai" : ""}">${s.title}</h3>
    </div>
    <p class="service-desc">${s.desc}</p>
  `;
  servicesList.appendChild(row);
});

/* Services carousel: stable scroll stages with a small dead zone at each
   boundary, so a resting scroll position cannot make cards flip back/forth. */
(function () {
  const section = document.getElementById("services");
  const cards = Array.from(document.querySelectorAll(".service-row"));
  const dotsHost = document.getElementById("services-dots");
  const counter = document.getElementById("service-current");
  if (!section || !cards.length || !dotsHost || !counter) return;

  const n = cards.length;
  const dots = cards.map(() => {
    const dot = document.createElement("span");
    dot.className = "services-dot";
    dotsHost.appendChild(dot);
    return dot;
  });

  const isDesktop = () => window.innerWidth > 900;
  const DEAD_ZONE = .035;
  let activeIndex = 0;

  function render(index) {
    cards.forEach((card, i) => {
      card.style.opacity = "";
      card.style.transform = "";
      card.style.zIndex = "";
      card.classList.toggle("active", i === index);
      card.classList.toggle("previous", i === index - 1);
      card.classList.toggle("next", i === index + 1);
      card.classList.toggle("service-row--glass", i === index);
    });
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    counter.textContent = String(index + 1).padStart(2, "0");
  }

  function resetInlineStyles() {
    cards.forEach(card => {
      card.style.opacity = "";
      card.style.transform = "";
      card.style.filter = "";
      card.style.zIndex = "";
    });
  }

  let scrollRaf = null;
  function updateTarget() {
    scrollRaf = null;
    if (!isDesktop()) {
      resetInlineStyles();
      return;
    }
    const distance = section.offsetHeight - window.innerHeight;
    const progress = distance > 0 ? Math.max(0, Math.min(1, (window.scrollY - section.offsetTop) / distance)) : 0;
    while (activeIndex < n - 1 && progress >= ((activeIndex + 1) / n) + DEAD_ZONE) activeIndex++;
    while (activeIndex > 0 && progress < (activeIndex / n) - DEAD_ZONE) activeIndex--;
    render(activeIndex);
  }

  function requestUpdateTarget() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(updateTarget);
  }

  window.addEventListener("scroll", requestUpdateTarget, { passive: true });
  window.addEventListener("resize", requestUpdateTarget);
  render(activeIndex);
  updateTarget();
})();

/* MOBILE: What We Do - the same pinned scroll carousel on tablets and phones (900px and below).
   The desktop code above stops at 900px; this one takes over there. The stage is the section's sticky
   one-screen box, so how far the visitor is through the pin is  -section.top / (section height - stage height)
   (0 to 1). That is NOT put on the cards directly: one flick of the thumb can cover most of the pin in a few
   frames, and cards that follow the raw scroll then jump several at once and have no time to move.
   Instead:
   - "goal" = where the scroll says the cards are (each card holds for a stretch of scroll, then the next turns
     in), "shown" = the position actually drawn. Shown chases the goal with a critically damped spring and is
     only ever aimed ONE card ahead, so a flick plays as a quick cascade, every card in order (about half a
     second each), while a slow drag simply follows the finger;
   - cards are drawn at fractional positions: each pose (side shift, depth, turn, scale, opacity) is blended
     between the same poses the CSS gives .previous / .active / .next, so the frames in between are smooth and
     the resting frames are exactly the desktop look;
   - when scrolling stops between two cards, shown eases to the nearer one;
   - prefers-reduced-motion: the cards still follow the scroll but swap instantly (no spring, no blending).
   The pose goes out as custom properties (--svc-t / --svc-o / --svc-i, used by .is-glide in styles.css), because
   the desktop code above clears inline transform / opacity / z-index on every scroll event below 900px. */
(function () {
  const section = document.getElementById("services");
  const cards = Array.from(document.querySelectorAll(".service-row"));
  const dots = Array.from(document.querySelectorAll(".services-dot"));
  const counter = document.getElementById("service-current");
  const stage = section && section.querySelector(".section-inner");
  const list = document.getElementById("services-list");
  if (!stage || !list || !cards.length || !counter) return;

  const n = cards.length;
  const mobile = window.matchMedia("(max-width: 900px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const HOLD = .2;        // each card holds for this share of the scroll between two cards (at both ends of it)
  const OMEGA = 9;        // spring speed (rad/s): about half a second per card in a cascade
  const LEAD = .06;       // shown may be aimed at the card after the next one once it is this close to the next
  const SETTLE_MS = 140;  // scrolling stopped this long (no finger down): ease to the nearer card
  const DEAD_ZONE = .06;  // how far past the half-way point (in cards) before the front card swaps
  // The pose of a card d places from the front one, d = -2 ... +2: [side shift in card widths, side shift in px,
  // depth px, turn deg, scale, opacity] - the CSS poses of .previous (-1), .active (0) and .next (+1), and the hidden one.
  const POSES = [
    [0, 0, -460, -58, .72, 0],
    [-.93, -13, -210, 20, .77, .24],
    [0, 0, 0, 0, 1, 1],
    [.93, 13, -190, -20, .77, .24],
    [0, 0, -460, -58, .72, 0],
  ];

  let shown = 0, vel = 0;               // the drawn position (in cards, 0 ... n-1) and its speed
  let shownIdx = -1, paintedShown = NaN, paintedW = 0;
  let cardW = 0, rmIdx = 0, last = 0, lastScroll = -1e9, lastVW = window.innerWidth;
  let engaged = false, snap = true, touching = false, raf = 0;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // scroll position (0 ... n-1 cards) -> goal: every card holds, then the next one turns in (ease in and out)
  function goalFor(raw) {
    const k = Math.min(Math.floor(raw), n - 2);
    const t = clamp01((raw - k - HOLD) / (1 - 2 * HOLD));
    return k + t * t * (3 - 2 * t);
  }

  // Exact step of a critically damped spring (same maths as the stat bar's glide), so it is smooth at any frame rate.
  function spring(offset, v, dt) {
    if (offset * (v + OMEGA * offset) < 0) v = -OMEGA * offset; // never carry past the aim
    const b = v + OMEGA * offset;
    const decay = Math.exp(-OMEGA * dt);
    return [(offset + b * dt) * decay, (b - OMEGA * (offset + b * dt)) * decay];
  }

  function paint() {
    if (shown !== paintedShown || cardW !== paintedW) {
      paintedShown = shown;
      paintedW = cardW;
      cards.forEach((card, i) => {
        const d = Math.max(-2, Math.min(2, i - shown)) + 2;
        const k = Math.min(Math.floor(d), 3), f = d - k;
        const a = POSES[k], b = POSES[k + 1];
        const v = j => a[j] + (b[j] - a[j]) * f;
        card.style.setProperty("--svc-t", `translate3d(${(v(0) * cardW + v(1)).toFixed(2)}px, 0, ${v(2).toFixed(1)}px) rotateY(${v(3).toFixed(2)}deg) scale(${v(4).toFixed(4)})`);
        card.style.setProperty("--svc-o", v(5).toFixed(3));
        card.style.setProperty("--svc-i", String(Math.round(30 - Math.abs(i - shown) * 10)));
      });
    }
    // the front card (the class poses, glass, dots and counter follow it); a small dead zone past the half-way point
    // so a position resting there cannot flip it back and forth
    const idx = shownIdx >= 0 && Math.abs(shown - shownIdx) <= .5 + DEAD_ZONE ? shownIdx : Math.round(shown);
    if (idx === shownIdx) return;
    shownIdx = idx;
    cards.forEach((card, i) => {
      card.classList.toggle("active", i === idx);
      card.classList.toggle("previous", i === idx - 1);
      card.classList.toggle("next", i === idx + 1);
      card.classList.toggle("service-row--glass", i === idx);
    });
    dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
    counter.textContent = String(idx + 1).padStart(2, "0");
  }

  // back to the desktop: drop the gliding poses (the desktop code above takes over)
  function release() {
    if (!engaged) return;
    engaged = false;
    shownIdx = -1;
    paintedShown = NaN;
    vel = 0;
    last = 0;
    list.classList.remove("is-glide");
    cards.forEach(card => ["--svc-t", "--svc-o", "--svc-i"].forEach(p => card.style.removeProperty(p)));
  }

  function frame(now) {
    raf = 0;
    if (!mobile.matches) { release(); return; }
    const rect = section.getBoundingClientRect();
    const dist = section.offsetHeight - stage.offsetHeight;
    const raw = (dist > 0 ? clamp01(-rect.top / dist) : 0) * (n - 1);
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    cardW = cards[0].offsetWidth;
    const settled = (!touching || now - lastScroll > 1200) && now - lastScroll > SETTLE_MS;
    let goal = goalFor(raw);
    if (settled) goal = Math.round(goal);
    let target = goal;
    if (reduced.matches) {
      // no glide: the front card swaps instantly (with a small dead zone so a resting position cannot flip back and forth)
      if (snap) rmIdx = Math.round(goalFor(raw));
      while (rmIdx < n - 1 && raw >= rmIdx + .5 + DEAD_ZONE) rmIdx++;
      while (rmIdx > 0 && raw < rmIdx - .5 - DEAD_ZONE) rmIdx--;
      shown = target = rmIdx;
      vel = 0;
    } else if (snap || !onScreen) {
      shown = goal; // first frame, a resize, or the section is off screen: nothing to animate
      vel = 0;
    } else {
      // aim at most ONE card ahead of the one shown, so the cards in between always get their turn
      let aim = goal;
      if (goal > shown) aim = Math.min(goal, Math.floor(shown + LEAD) + 1);
      else if (goal < shown) aim = Math.max(goal, Math.ceil(shown - LEAD) - 1);
      const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60;
      const [offset, v] = spring(shown - aim, vel, dt);
      shown = aim + offset;
      vel = v;
      if (Math.abs(shown - goal) < .002 && Math.abs(vel) < .02) { shown = goal; vel = 0; }
    }
    snap = false;
    paint();
    if (!engaged) { engaged = true; list.classList.add("is-glide"); } // after the first paint, so the cards never show un-posed
    if (shown !== target || vel !== 0 || now - lastScroll < SETTLE_MS + 60) {
      last = now;
      raf = requestAnimationFrame(frame);
    } else {
      last = 0;
    }
  }

  function request() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function onScroll() {
    lastScroll = performance.now();
    if (mobile.matches) request();
  }
  function onTouchEnd() {
    touching = false;
    lastScroll = performance.now();
    if (mobile.matches) request();
  }
  function onResize() {
    // only a change of WIDTH (rotation, real resize) re-seats the cards at once; the browser bars sliding away
    // while scrolling also resize the window, and that must not make the cards jump
    if (window.innerWidth !== lastVW) { lastVW = window.innerWidth; snap = true; }
    request();
  }
  function onMode() { snap = true; request(); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("touchstart", () => { touching = true; }, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  [mobile, reduced].forEach(mq => {
    if (mq.addEventListener) mq.addEventListener("change", onMode);
    else if (mq.addListener) mq.addListener(onMode);
  });
  frame(performance.now());
})();

yield;
/* ---------- Header services menu (desktop dropdown + mobile accordion) ---------- */
// The four options are the What We Do cards, in the same order (the card's line break becomes a space).
const serviceLabels = services.map(s => s.title.replace(/<br\s*\/?>/g, " "));

// Scroll to What We Do and land on the chosen card. On desktop the section is a tall pinned track in
// which each card is the active one around scroll progress (i + 0.5) / n, so aim for the middle of
// that stretch rather than a boundary. Tablets and phones (900px and below) pin the section the same way
// (see "MOBILE: What We Do" above), measured against the section's own one-screen sticky box; there the
// cards hold at i / (cards - 1) of the pin instead (the glide logic above).
function scrollToService(index) {
  const section = document.getElementById("services");
  let top;
  if (window.innerWidth > 900) {
    const distance = section.offsetHeight - window.innerHeight;
    top = section.offsetTop + ((index + 0.5) / services.length) * distance;
  } else {
    // MOBILE: What We Do - card i holds at pin progress i / (cards - 1) (first card at the start, last at the end);
    // aim a little inside both ends so the pinned screen is certainly on show
    const distance = section.offsetHeight - section.querySelector(".section-inner").offsetHeight;
    const progress = Math.min(0.97, Math.max(0.03, index / (services.length - 1)));
    top = section.getBoundingClientRect().top + window.scrollY + progress * distance;
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduceMotion ? "instant" : "smooth" });
}

const servicesWrap = document.getElementById("services-dropdown-wrap");
const servicesTrigger = document.getElementById("services-trigger");
const servicesDropdown = document.getElementById("services-dropdown");
const mobileServicesToggle = document.getElementById("mobile-services-toggle");
const mobileServicesList = document.getElementById("mobile-services-list");

// Hover opens the dropdown. Clicking "Services" (or Enter / Space / Arrow Down) pins it open until it is
// clicked again, an option is chosen, Esc is pressed, or the visitor clicks or tabs away.
let servicesPinned = false;
let servicesCloseTimer = null;
function setServicesOpen(open) {
  clearTimeout(servicesCloseTimer);
  servicesWrap.classList.toggle("open", open);
  servicesTrigger.setAttribute("aria-expanded", String(open));
  if (!open) servicesPinned = false;
}

function chooseService(index) {
  const focusWasInDropdown = servicesWrap.contains(document.activeElement);
  setServicesOpen(false);
  if (focusWasInDropdown) servicesTrigger.focus({ preventScroll: true });
  mobileMenu.classList.remove("open");
  scrollToService(index);
}

function buildServiceList(list, isMenu) {
  serviceLabels.forEach((label, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (isMenu) {
      item.setAttribute("role", "none");
      button.setAttribute("role", "menuitem");
    }
    button.addEventListener("click", () => chooseService(index));
    item.appendChild(button);
    list.appendChild(item);
  });
}
buildServiceList(servicesDropdown, true);
buildServiceList(mobileServicesList, false);

servicesWrap.addEventListener("mouseenter", () => setServicesOpen(true));
servicesWrap.addEventListener("mouseleave", () => {
  if (servicesPinned) return;
  clearTimeout(servicesCloseTimer);
  servicesCloseTimer = setTimeout(() => setServicesOpen(false), 180);
});
servicesTrigger.addEventListener("click", () => {
  if (servicesPinned) {
    setServicesOpen(false);
  } else {
    setServicesOpen(true);
    servicesPinned = true;
  }
});
servicesWrap.addEventListener("keydown", (e) => {
  const items = Array.from(servicesDropdown.querySelectorAll("button"));
  const current = items.indexOf(document.activeElement);
  const last = items.length - 1;
  let next;
  if (e.key === "Escape") {
    if (!servicesWrap.classList.contains("open")) return;
    setServicesOpen(false);
    servicesTrigger.focus();
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowDown") next = current < last ? current + 1 : 0;
  else if (e.key === "ArrowUp") next = current > 0 ? current - 1 : last;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = last;
  else return;
  e.preventDefault();
  if (!servicesWrap.classList.contains("open")) {
    setServicesOpen(true);
    servicesPinned = true;
  }
  items[next].focus();
});
servicesWrap.addEventListener("focusout", (e) => {
  if (e.relatedTarget && !servicesWrap.contains(e.relatedTarget)) setServicesOpen(false);
});
document.addEventListener("pointerdown", (e) => {
  if (servicesWrap.classList.contains("open") && !servicesWrap.contains(e.target)) setServicesOpen(false);
});

mobileServicesToggle.addEventListener("click", () => {
  const open = mobileServicesToggle.classList.toggle("open");
  mobileServicesList.classList.toggle("open", open);
  mobileServicesToggle.setAttribute("aria-expanded", String(open));
});

yield;
/* ---------- How it works ---------- */
const steps = [
  { title: "Discovery Call", desc: "We look at what you're producing now, where it's breaking down, and what your output actually needs to be. Twenty minutes, no obligation." },
  { title: "Style Calibration", desc: "Before we touch volume, we lock your style: pacing, caption treatment, graphics, tone. You approve it once, and every edit after that matches it." },
  { title: "Your Pipeline Goes Live", desc: "You send footage. We handle everything from raw file to finished asset — edit, revisions, and delivery — inside your agreed turnaround window." },
  { title: "Scale", desc: "Volume goes up, quality doesn't move. Adding formats or doubling output doesn't mean re-briefing a new editor every time." },
];
const howSteps = document.getElementById("how-steps");
const howPreview = document.getElementById("how-preview");
const howPreviewCount = document.getElementById("how-preview-count");
const howPreviewKicker = document.getElementById("how-preview-kicker");
const howPreviewTitle = document.getElementById("how-preview-title");
const howPreviewDesc = document.getElementById("how-preview-desc");
const howPreviewProgress = document.getElementById("how-preview-progress");
const stepEls = [];
const howStepBubble = document.createElement("div");
howStepBubble.className = "how-step-bubble";
howStepBubble.setAttribute("aria-hidden", "true");
howSteps.appendChild(howStepBubble);

function positionHowStepBubble(index) {
  const step = stepEls[index];
  if (!step) return;
  howSteps.style.setProperty("--how-bubble-y", `${step.offsetTop}px`);
  howSteps.style.setProperty("--how-bubble-h", `${step.offsetHeight}px`);
}

function setActiveHowStep(index) {
  const step = steps[index];
  stepEls.forEach((el, i) => {
    el.classList.toggle("active", i === index);
    el.setAttribute("aria-pressed", String(i === index));
  });
  howPreviewCount.textContent = `0${index + 1} / 04`;
  howPreviewKicker.textContent = `STEP 0${index + 1}`;
  howPreviewTitle.textContent = step.title;
  howPreviewDesc.textContent = step.desc;
  howPreviewProgress.style.width = `${(index + 1) * 25}%`;
  howPreview.dataset.step = String(index + 1);
  positionHowStepBubble(index);
}

steps.forEach((s, i) => {
  const el = document.createElement("div");
  el.className = "how-step reveal";
  el.innerHTML = `
    <div class="how-step-num">0${i + 1}</div>
    <div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
  `;
  howSteps.appendChild(el);
  stepEls.push(el);
});
setActiveHowStep(0);

// Scroll through the process one deliberate stage at a time while this
// section is pinned, matching the stable staged behaviour of the services
// carousel without hijacking the user's wheel input.
const howSection = document.getElementById("how");
let howScrollRaf = null;
let scrollHowIndex = 0;
function updateHowFromScroll() {
  howScrollRaf = null;
  if (window.innerWidth <= 900) return;
  const distance = howSection.offsetHeight - window.innerHeight;
  const progress = distance > 0
    ? Math.max(0, Math.min(1, (window.scrollY - howSection.offsetTop) / distance))
    : 0;
  const nextIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length));
  if (nextIndex !== scrollHowIndex) {
    scrollHowIndex = nextIndex;
    setActiveHowStep(nextIndex);
  }
}
function requestHowScrollUpdate() {
  if (howScrollRaf) return;
  howScrollRaf = requestAnimationFrame(updateHowFromScroll);
}
window.addEventListener("scroll", requestHowScrollUpdate, { passive: true });
window.addEventListener("resize", () => {
  positionHowStepBubble(scrollHowIndex);
  requestHowScrollUpdate();
});
requestHowScrollUpdate();

/* MOBILE: How It Works scroll-follow
   Tablets and phones (900px and below): the section is not pinned there (the four steps are a plain stack of boxes with the
   preview card under them), so the pinned-track maths above stops at 900px (its early return) and this takes over. The step
   whose box is nearest the vertical middle of the screen becomes the active one, set through the very same setActiveHowStep()
   the desktop uses (so the highlight, the preview card's title and text, the "0X / 04" counter and the progress bar behave
   exactly as on the desktop). Scrolling up reverses it. Nothing is pinned and no size changes: only the active state does.
   scrollHowIndex is kept in step with what is showing, so switching back to a wide window leaves the desktop code in the
   right state. */
const howMobile = window.matchMedia("(max-width: 900px)");
const HOW_MOBILE_HYSTERESIS = 24; // px: the next step must be this much nearer the middle than the current one before it takes over
let howMobileRaf = null;
function updateHowFromScrollMobile() {
  howMobileRaf = null;
  if (!howMobile.matches) return; // on desktop the code above does this
  // measured with offsetTop / offsetHeight (not getBoundingClientRect) so the steps' fade-in slide never moves the answer
  const stackTop = howSteps.getBoundingClientRect().top;
  const middle = window.innerHeight / 2;
  const away = stepEls.map(el => Math.abs(stackTop + el.offsetTop + el.offsetHeight / 2 - middle));
  let nearest = 0;
  away.forEach((d, i) => { if (d < away[nearest]) nearest = i; });
  if (nearest === scrollHowIndex || away[nearest] > away[scrollHowIndex] - HOW_MOBILE_HYSTERESIS) return;
  scrollHowIndex = nearest;
  setActiveHowStep(nearest);
}
function requestHowMobileUpdate() {
  if (howMobileRaf || !howMobile.matches) return;
  howMobileRaf = requestAnimationFrame(updateHowFromScrollMobile);
}
function onHowMobileChange() {
  if (howMobile.matches) { requestHowMobileUpdate(); return; }
  positionHowStepBubble(scrollHowIndex); // back to a wide window: hand over to the desktop code with its highlight box in the right place
  requestHowScrollUpdate();
}
window.addEventListener("scroll", requestHowMobileUpdate, { passive: true });
window.addEventListener("resize", requestHowMobileUpdate);
window.addEventListener("orientationchange", requestHowMobileUpdate);
window.addEventListener("load", requestHowMobileUpdate);
if (howMobile.addEventListener) howMobile.addEventListener("change", onHowMobileChange);
else if (howMobile.addListener) howMobile.addListener(onHowMobileChange);
requestHowMobileUpdate();

yield;
/* ---------- Pricing packages ---------- */
// Feature icons: 24x24 line icons drawn with currentColor; "spark" is a small filled four-point star.
const pricingIcons = {
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  captions: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6"/>',
  broll: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
  spark: '<path class="pricing-icon-fill" d="M12 4l2.2 5.8L20 12l-5.8 2.2L12 20l-2.2-5.8L4 12l5.8-2.2z"/>',
};

// To edit prices, badges or feature lines, change the plain data below (total = videos x perVideo).
const pricingPlans = {
  standard: {
    label: "Standard Editing",
    intro: "For polished, retention-focused short-form content.",
    features: [
      { icon: "spark", text: "Up to 90 seconds per video" },
      { icon: "spark", text: "2 rounds of revisions per video" },
      { icon: "spark", text: "48–72 hour turnaround per video" },
    ],
    plans: [
      { name: "Starter", videos: 5, perVideo: 60, total: 300, best: "Ideal for getting a reliable content rhythm in place." },
      { name: "Growth", videos: 10, perVideo: 50, total: 500, badge: "17% OFF", best: "Best for creators and brands publishing every week." },
      { name: "Scale", videos: 20, perVideo: 40, total: 800, badge: "33% OFF", best: "Built for consistent, high-volume content engines." },
    ],
  },
  advanced: {
    label: "Advanced Editing",
    intro: "For content requiring deeper production and visual work.",
    features: [
      { icon: "spark", text: "Up to 90 seconds per video" },
      { icon: "spark", text: "Detailed motion graphics & custom visual elements" },
      { icon: "spark", text: "Advanced animation, masking & compositing" },
      { icon: "spark", text: "Unlimited revisions until approved" },
    ],
    plans: [
      { name: "Starter", videos: 5, perVideo: 85, total: 425, best: "Ideal for elevated content with a stronger visual story." },
      { name: "Growth", videos: 10, perVideo: 75, total: 750, badge: "12% OFF", best: "Best for brands producing premium content every week." },
      { name: "Scale", videos: 20, perVideo: 65, total: 1300, badge: "24% OFF", best: "Made for serious output with premium production value." },
    ],
  },
};

const pricingGrid = document.getElementById("pricing-grid");
const pricingToggleOptions = Array.from(document.querySelectorAll(".pricing-toggle-option"));
function pricingFeatureHtml({ icon, text }) {
  return `<li><svg class="pricing-icon" viewBox="0 0 24 24" aria-hidden="true">${pricingIcons[icon]}</svg><span>${text}</span></li>`;
}
function renderPricing(tier) {
  const { label, plans, features } = pricingPlans[tier];
  pricingGrid.innerHTML = plans.map(plan => `
    <article class="pricing-card ${plan.badge ? "pricing-card--featured" : ""}">
      <div class="pricing-card-topline">
        <span>${label}</span>
        ${plan.badge ? `<span class="pricing-badge">${plan.badge}</span>` : ""}
      </div>
      <h3>${plan.name}</h3>
      <p class="pricing-videos">${plan.videos} video package</p>
      <div class="pricing-price"><strong>$${plan.perVideo}</strong><span>/ video</span></div>
      <div class="pricing-total"><span>Total package</span><strong>$${plan.total.toLocaleString("en-US")}</strong></div>
      <p class="pricing-best">${plan.best}</p>
      <p class="pricing-includes-title">Includes <span class="pricing-includes-tier">(${label})</span></p>
      <ul class="pricing-features">${features.map(pricingFeatureHtml).join("")}</ul>
      <div class="pricing-actions">
        <a class="btn ${plan.badge ? "btn-solid btn-glass" : "btn-glass"}" href="#book" data-tier="${tier}" data-plan="${plan.name}" aria-haspopup="dialog">Get Started${plan.badge ? `<span class="btn-beam" aria-hidden="true"></span>` : ""}</a>
      </div>
    </article>`).join("");
  pricingGrid.dataset.tier = tier;
  pricingToggleOptions.forEach(option => {
    const active = option.dataset.tier === tier;
    option.classList.toggle("active", active);
    option.setAttribute("aria-selected", String(active));
  });
}
pricingToggleOptions.forEach(option => option.addEventListener("click", () => renderPricing(option.dataset.tier)));
renderPricing("standard");

/* ---------- Get Started chooser: a small chat-style dialog ---------- */
// Clicking "Get Started" on a package opens this instead of scrolling away. It offers WhatsApp,
// a booking call and a payment-link request. The request is a short in-dialog details step that
// opens WhatsApp with a ready message; the payment link itself is then sent by hand in that chat.
// (Nothing the visitor types is stored or sent anywhere except into that WhatsApp message.)
const WHATSAPP_NUMBER = "923181183581";
const BOOKING_URL = "https://calendly.com/contentgrownn/15mincall";
const chooseSvg = {
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01"/></svg>',
  card: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 12.5l3.7 3.7 7.3-7.9"/></svg>',
};
let chooseEl = null;      // the overlay; created on the first click
let chooseTrigger = null; // the Get Started button that opened it, so focus can go back there
let choosePressedInside = false;
let choosePack = null;    // the package the dialog is currently about: { label, plan, videos, total }
let chooseInputs = null;  // { name, email, phone }: the three fields of the details step

function buildChooser() {
  chooseEl = document.createElement("div");
  chooseEl.className = "choose";
  chooseEl.innerHTML = `
    <div class="choose-dialog" role="dialog" aria-modal="true" aria-labelledby="choose-title" aria-describedby="choose-msg" tabindex="-1">
      <div class="choose-head">
        <span class="choose-avatar"><img src="assets/favicon-192.png" alt="" width="96" height="96"></span>
        <strong class="choose-name" id="choose-title">CONTENTGROWN</strong>
        <button class="choose-close" type="button" aria-label="Close">${chooseSvg.close}</button>
      </div>
      <div class="choose-body">
        <div class="choose-step" data-step="options" data-desc="choose-msg">
          <p class="choose-bubble" id="choose-msg"></p>
          <p class="choose-summary"></p>
          <div class="choose-options"></div>
        </div>
        <div class="choose-step" data-step="details" data-desc="choose-details-msg" hidden>
          <p class="choose-bubble" id="choose-details-msg" tabindex="-1">Great! Just a few quick details and we'll send your payment link.</p>
          <p class="choose-pack"></p>
          <form class="choose-form" novalidate>
            <div class="choose-field">
              <label for="choose-name">Full name</label>
              <input id="choose-name" name="name" type="text" autocomplete="name" maxlength="60" required>
              <p class="choose-error" id="choose-name-error" hidden></p>
            </div>
            <div class="choose-field">
              <label for="choose-email">Email address</label>
              <input id="choose-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="254" required>
              <p class="choose-error" id="choose-email-error" hidden></p>
            </div>
            <div class="choose-field">
              <label for="choose-phone">WhatsApp number (with country code)</label>
              <input id="choose-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+1 555 123 4567" maxlength="30" required>
              <p class="choose-error" id="choose-phone-error" hidden></p>
            </div>
            <div class="choose-actions">
              <button class="choose-btn choose-btn--primary" type="submit">Send request on WhatsApp</button>
              <button class="choose-btn choose-btn--ghost choose-back" type="button">Back</button>
            </div>
            <p class="choose-privacy">Your details are only sent to us on WhatsApp.</p>
          </form>
        </div>
        <div class="choose-step choose-done" data-step="done" data-desc="choose-done-msg" hidden>
          <span class="choose-check">${chooseSvg.check}</span>
          <h3 class="choose-done-title" tabindex="-1">Your request is ready to send</h3>
          <p class="choose-done-text" id="choose-done-msg">WhatsApp should have opened with your details. Just press Send there and we'll reply with your secure payment link. Once payment is completed, we'll get your project started.</p>
          <p class="choose-fallback">WhatsApp didn't open? <a href="${chooseWhatsAppUrl("")}" target="_blank" rel="noopener">Tap here</a></p>
          <button class="choose-btn choose-btn--secondary choose-done-close" type="button">Close</button>
        </div>
      </div>
    </div>`;
  chooseInputs = {
    name: chooseEl.querySelector("#choose-name"),
    email: chooseEl.querySelector("#choose-email"),
    phone: chooseEl.querySelector("#choose-phone"),
  };
  Object.values(chooseInputs).forEach(input => input.addEventListener("input", () => {
    // Once a field has been flagged, re-check it as the visitor fixes it so the message clears itself.
    if (input.hasAttribute("aria-invalid")) setChooseError(input, chooseValidators[input.name](cleanChooseValue(input.value)));
  }));
  chooseEl.querySelector(".choose-form").addEventListener("submit", submitChooseRequest);
  // Close on the X or on a click that starts and ends on the dark overlay (so dragging a text
  // selection out of the dialog does not close it).
  chooseEl.addEventListener("pointerdown", (e) => { choosePressedInside = e.target !== chooseEl; });
  chooseEl.addEventListener("click", (e) => {
    const outside = e.target === chooseEl && !choosePressedInside;
    choosePressedInside = false;
    if (outside || e.target.closest(".choose-close, .choose-done-close") || e.target.closest("a.choose-opt")) closeChooser();
    else if (e.target.closest(".choose-opt--pay")) showChooseStep("details", chooseEl.querySelector("#choose-details-msg"));
    else if (e.target.closest(".choose-back")) showChooseStep("options", chooseEl.querySelector(".choose-opt--pay"));
  });
  document.body.appendChild(chooseEl);
}

function chooseWhatsAppUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// A link option opens in a new tab; with no href it is a button that stays inside the dialog.
function chooseOption(cls, href, icon, title, sub) {
  const el = document.createElement(href ? "a" : "button");
  el.className = `choose-opt ${cls}`;
  if (href) {
    el.href = href;
    el.target = "_blank";
    el.rel = "noopener";
  } else {
    el.type = "button";
  }
  el.innerHTML = `<span class="choose-opt-icon">${icon}</span><span class="choose-opt-text"><strong></strong><span></span></span><span class="choose-opt-arrow">${chooseSvg.arrow}</span>`;
  el.querySelector("strong").textContent = title;
  el.querySelector(".choose-opt-text > span").textContent = sub;
  return el;
}

// One tidy line: control characters and line breaks become spaces, runs of spaces collapse, ends are trimmed.
function cleanChooseValue(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").replace(/\s+/g, " ").trim();
}

// Each validator takes the cleaned value and returns a friendly message, or "" when the value is fine.
const chooseValidators = {
  name(value) {
    if (!value) return "Please enter your full name.";
    if (value.length < 2) return "Your name needs at least 2 characters.";
    if (value.length > 60) return "Please keep your name to 60 characters or fewer.";
    return "";
  },
  email(value) {
    if (!value) return "Please enter your email address.";
    if (value.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(value)) {
      return "That email doesn't look right. Try something like name@example.com.";
    }
    return "";
  },
  phone(value) {
    if (!value) return "Please enter your WhatsApp number with country code.";
    // Spaces, dashes and brackets are ignored, as is one leading + (or 00); what is left must be 8-15 digits.
    let digits = value.replace(/[\s\-()[\]]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    else if (digits.startsWith("00")) digits = digits.slice(2);
    if (!/^\d+$/.test(digits)) return "Please use digits only, with your country code, e.g. +1 555 123 4567.";
    if (digits.length < 8 || digits.length > 15) return "Please enter 8 to 15 digits, including your country code.";
    return "";
  },
};

function setChooseError(input, message) {
  const error = chooseEl.querySelector(`#${input.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

// Validates the details form; on success opens WhatsApp with the ready message and shows the confirmation.
// window.open runs right here in the submit handler (the visitor's own click / Enter press) so popup blockers allow it.
function submitChooseRequest(e) {
  e.preventDefault();
  const values = {};
  let firstInvalid = null;
  for (const [key, input] of Object.entries(chooseInputs)) {
    values[key] = cleanChooseValue(input.value);
    input.value = values[key];
    const message = chooseValidators[key](values[key]);
    setChooseError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  if (firstInvalid) { firstInvalid.focus(); return; }

  const url = chooseWhatsAppUrl([
    `Hi, I'd like to purchase the ${choosePack.plan} package.`,
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `WhatsApp: ${values.phone}`,
    `Package: ${choosePack.label} - ${choosePack.plan} - ${choosePack.videos} videos - $${choosePack.total}`,
    "Please send me the payment link.",
  ].join("\n"));
  window.open(url, "_blank", "noopener");
  chooseEl.querySelector(".choose-fallback a").href = url;
  showChooseStep("done", chooseEl.querySelector(".choose-done-title"));
}

// Swaps the dialog content between "options", "details" and "done" (same dialog, no page jump) and moves focus.
function showChooseStep(name, focusEl, animate = true) {
  const dialog = chooseEl.firstElementChild;
  chooseEl.querySelectorAll(".choose-step").forEach(step => {
    const active = step.dataset.step === name;
    step.hidden = !active;
    step.classList.toggle("choose-step--in", active && animate);
    if (active) dialog.setAttribute("aria-describedby", step.dataset.desc);
  });
  dialog.scrollTop = 0;
  if (focusEl) focusEl.focus({ preventScroll: true });
}

function chooserKeydown(e) {
  if (e.key === "Escape") { e.preventDefault(); closeChooser(); return; }
  if (e.key !== "Tab") return;
  // Keep Tab / Shift+Tab inside the dialog (only controls in the step that is showing count).
  const dialog = chooseEl.firstElementChild;
  const items = Array.from(dialog.querySelectorAll("a[href], button:not([disabled]), input:not([disabled])")).filter(el => !el.closest("[hidden]"));
  const first = items[0], last = items[items.length - 1], active = document.activeElement;
  if (!dialog.contains(active) || active === dialog) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function openChooser(tier, planName, trigger) {
  const set = pricingPlans[tier];
  const plan = set && set.plans.find(p => p.name === planName);
  if (!plan) return;
  if (!chooseEl) buildChooser();
  const total = plan.total.toLocaleString("en-US");
  chooseEl.querySelector("#choose-msg").innerHTML = `Hi! Great choice. How would you like to get started with <strong>${set.label} - ${plan.name}</strong>?`;
  chooseEl.querySelector(".choose-summary").textContent = `${plan.videos} videos · $${plan.perVideo}/video · $${total} total`;

  const waText = `Hi CONTENTGROWN! I'm interested in the ${plan.name} package (${set.label}, ${plan.videos} videos, $${total}). I'd like to get started.`;
  chooseEl.querySelector(".choose-options").replaceChildren(
    chooseOption("choose-opt--wa", chooseWhatsAppUrl(waText), chooseSvg.whatsapp, "Chat on WhatsApp", "Ask a question or start the conversation"),
    chooseOption("choose-opt--call", BOOKING_URL, chooseSvg.calendar, "Book a call", "Prefer to talk it through? Pick a time"),
    chooseOption("choose-opt--pay", "", chooseSvg.card, "Request payment link", "We'll send you a secure payment link"),
  );

  // Every opening starts fresh on the options step with an empty details form.
  choosePack = { label: set.label, plan: plan.name, videos: plan.videos, total };
  chooseEl.querySelector(".choose-pack").innerHTML = `<strong>${set.label} - ${plan.name}</strong> · ${plan.videos} videos · $${total}`;
  chooseEl.querySelector(".choose-form").reset();
  Object.values(chooseInputs).forEach(input => setChooseError(input, ""));
  showChooseStep("options", null, false);

  chooseTrigger = trigger || null;
  // Lock page scroll (body.scroll-locked); keep the page from jumping sideways when the scrollbar goes.
  document.body.style.setProperty("--scrollbar-gap", `${Math.max(0, window.innerWidth - document.documentElement.clientWidth)}px`);
  document.body.classList.add("scroll-locked");
  chooseEl.classList.add("open");
  document.addEventListener("keydown", chooserKeydown);
  chooseEl.firstElementChild.scrollTop = 0;
  chooseEl.firstElementChild.focus({ preventScroll: true });
}

function closeChooser() {
  if (!chooseEl || !chooseEl.classList.contains("open")) return;
  chooseEl.classList.remove("open");
  document.removeEventListener("keydown", chooserKeydown);
  document.body.classList.remove("scroll-locked");
  document.body.style.removeProperty("--scrollbar-gap");
  const trigger = chooseTrigger;
  chooseTrigger = null;
  if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
}

// One listener on the grid (the cards are re-rendered when the Standard / Advanced toggle changes).
pricingGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("a[data-plan]");
  if (!btn) return;
  e.preventDefault(); // href="#book" stays as the no-JS fallback
  openChooser(btn.dataset.tier, btn.dataset.plan, btn);
});

yield;
/* ---------- Proof / testimonials ---------- */
// Each card shows a small still (poster) until its muted preview plays; the previews
// only load and play while a card is on screen (preload="none" + registerAutoplayVideo).
const videoTestimonials = [
  { name: "Aaron", file: "assets/testimonials/videos/aaron-testimonial.mp4", poster: "assets/testimonials/posters/aaron.jpg" },
  { name: "Jaime", file: "assets/testimonials/videos/jaime-testimonial.mp4", poster: "assets/testimonials/posters/jaime.jpg" },
  { name: "Christian", file: "assets/testimonials/videos/christian-testimonial.mp4", poster: "assets/testimonials/posters/christian.jpg" },
  { name: "Billy", file: "assets/testimonials/videos/guest-testimonial.mp4", poster: "assets/testimonials/posters/guest.jpg" },
  { name: "Cacau", file: "assets/testimonials/videos/cacau-testimonial.mp4", poster: "assets/testimonials/posters/cacau.jpg" },
  { name: "Joe", file: "assets/testimonials/videos/joe-testimonial.mp4", poster: "assets/testimonials/posters/joe.jpg" },
  { name: "Ramses", file: "assets/testimonials/videos/ramses-testimonial.mp4", poster: "assets/testimonials/posters/ramses.jpg" },
];
const proofVideoGrid = document.getElementById("proof-video-grid");
// The portrait cards fade in together as one group. (The reveal class sits
// on the grid, not on each card, so the cards' own hover "pop" transform is never
// fighting the reveal transform, and a card scrolled in sideways on phones is
// never stuck invisible.)
proofVideoGrid.classList.add("reveal");
videoTestimonials.forEach(t => {
  const card = document.createElement("div");
  card.className = "proof-video-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Play ${t.name}'s video testimonial`);
  card.innerHTML = `
    <video muted loop playsinline preload="none" data-src="${t.file}"></video>
    <span class="proof-play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    <span class="proof-video-name">${t.name}</span>
  `;
  const video = card.querySelector("video");
  registerAutoplayVideo(video);
  card.addEventListener("click", () => openLightbox(t.file));
  card.addEventListener("keydown", (e) => {
    if (e.target !== card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(t.file);
    }
  });
  proofVideoGrid.appendChild(card);
});
// Nothing here is downloaded at page load: the poster stills are fetched once the testimonials are
// within ~1000px of the screen, and each preview clip when its card first scrolls into view
// (attachLazySource in the shared autoplay observer above).
(function () {
  const setPosters = () => {
    proofVideoGrid.querySelectorAll("video").forEach((v, i) => { v.poster = videoTestimonials[i].poster; });
  };
  if (!("IntersectionObserver" in window)) { setPosters(); return; }
  const near = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { near.disconnect(); setPosters(); }
  }, { rootMargin: "1000px 0px" });
  near.observe(proofVideoGrid);
})();

yield;
/* ---------- FAQ ---------- */
// Answers are our own trusted copy. A plain string is wrapped in a <p>;
// a string that starts with a tag (e.g. "<p>..</p><ul>..</ul>") is inserted as-is.
const faqs = [
  { q: "Do you provide creative direction?", a: "Yes, we provide creative direction as well. If you don't have brand fonts or guidelines, our team will use its own creative direction and pick the fonts and colours that look best for your content. We do need you to share references, though, so we can understand your vision and what you have in mind." },
  { q: "How many rounds of revisions do I get?", a: "Standard Editing includes two rounds of revisions per video, and Advanced Editing includes unlimited revisions until you approve the video. On Standard Editing, extra rounds beyond the two included may be charged, unless the change is needed because of a mistake on our side." },
  { q: "What counts as a revision?", a: "<p>Please label each piece of feedback as one of the following so we can turn it around quickly:</p><ul><li><strong>Correction:</strong> fixing errors such as typos, timing issues or small tweaks. Always free.</li><li><strong>Change:</strong> small creative updates to the edit that still fit your original brief, such as pacing, music or shot choices. Free within your included revision rounds.</li><li><strong>New scope:</strong> new ideas, or changes to motion design, scripts, structure, aspect ratios or the overall creative direction. Billed separately.</li></ul>" },
  { q: "Is there a deadline for sending revision feedback?", a: "Yes. You have 15 days after delivery to send your feedback. This lets us close each edit properly, keeps your projects moving, and helps you keep posting consistently without delays or a backlog." },
  { q: "What happens if my feedback is unclear or outside the brief?", a: "We may pause the edit and ask you to clarify before continuing. It keeps the result accurate and saves you from unnecessary extra rounds." },
  { q: "Is my footage safe with CONTENTGROWN?", a: "Yes. Your files are stored securely, and only the team members working on your project can access them. We never share your raw footage or personal information with third parties without your consent. The only material we ever feature on our social channels is the finished, edited version of your video, shared to showcase our editing work." },
  { q: "What if I'm not happy with the final video?", a: "Tell us what is off. Your package includes revision rounds for exactly this, and our editors will work through your feedback to get the video where you need it." },
];
const faqList = document.getElementById("faq-list");
faqs.forEach(f => {
  const item = document.createElement("div");
  item.className = "faq-item reveal";
  const answerHtml = /^\s*</.test(f.a) ? f.a : `<p>${f.a}</p>`;
  item.innerHTML = `
    <button class="faq-question">
      <span>${f.q}</span>
      <span class="faq-icon"></span>
    </button>
    <div class="faq-answer">${answerHtml}</div>
  `;
  const btn = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");
  // Height to animate to: the answer's full content height (scrollHeight, so
  // lists and wrapped lines are never clipped) plus a little for the padding.
  const fitHeight = () => answer.scrollHeight + 24 + "px";
  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    faqList.querySelectorAll(".faq-item.open").forEach(open => {
      open.classList.remove("open");
      open.querySelector(".faq-answer").style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add("open");
      answer.style.maxHeight = fitHeight();
    }
  });
  // If the window is resized while an answer is open the text re-wraps: re-measure.
  window.addEventListener("resize", () => {
    if (item.classList.contains("open")) answer.style.maxHeight = fitHeight();
  });
  faqList.appendChild(item);
});

yield;
/* ---------- Liquid bubble stat bar ---------- */
(function () {
  const section = document.getElementById("stat-bar-section");
  const scrollDriver = document.getElementById("problem") || section;
  const bar = document.getElementById("stat-bar");
  const bubble = document.getElementById("stat-bubble");
  if (!section || !bar || !bubble) return;

  const items = Array.from(bar.querySelectorAll(".stat-item"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = v => Math.max(0, Math.min(1, v));
  // MOBILE: stat bar - same breakpoint as the "MOBILE: stat bar" block in styles.css.
  const mobileMQ = window.matchMedia("(max-width: 900px)");
  const isDesktop = () => !mobileMQ.matches;
  // Phones stack the four stats (the bubble then slides up/down); tablets and desktop keep them in a row.
  const isStacked = () => !isDesktop() && items.length > 1 && items[1].offsetTop > items[0].offsetTop + 1;

  // activeIndex: the stat the bubble is gliding to. litIndex: the stat whose text is lit. On desktop they are always the
  // same; on mobile the text follows the bubble (see springTick), so a stat lights up as the bubble reaches it.
  let activeIndex = 0;
  let litIndex = 0;
  function setLit(index) {
    if (index === litIndex) return;
    litIndex = index;
    items.forEach((item, i) => item.classList.toggle("active", i === index));
  }
  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    setLit(index);
  }

  function syncBubbleWidth() {
    const w = items[0]?.getBoundingClientRect().width || 0;
    bar.style.setProperty("--bubble-w", `${w}px`);
  }

  // MOBILE: stat bar - the bubble's position runs along one axis: left->right in a row (--bubble-x, as on
  // desktop) or top->bottom when the stats are stacked (--bubble-y). These helpers pick the right one.
  function itemPos(index) {
    const item = items[index];
    if (!item) return 0;
    return (isStacked() ? item.offsetTop : item.offsetLeft) || 0;
  }
  function setBubblePos(px) {
    bar.style.setProperty(isStacked() ? "--bubble-y" : "--bubble-x", `${px}px`);
  }
  function syncStackedBubbleSize() {
    // stacked rows are all equally tall, so the bubble is as tall as the first one
    if (isStacked()) bar.style.setProperty("--bubble-h", `${items[0].getBoundingClientRect().height}px`);
    else bar.style.removeProperty("--bubble-h");
  }

  // MOBILE: stat bar - reduced motion. Desktop keeps what it always did: no spring, no scroll-pin, the bubble stays
  // parked on the first stat. Phones and tablets (<= 900px) still hold the bar and follow the scroll (many phones have
  // "remove animations" / "reduce motion" on, and the bar would be dead) - the bubble just jumps (see requestSpring).
  const parked = () => reducedMotion && isDesktop();
  function park() {
    setActive(0);
    items[0]?.classList.add("active");
    syncBubbleWidth();
    bar.style.setProperty("--bubble-x", `${items[0]?.offsetLeft || 0}px`);
  }

  // Glide: bubbleX eases toward the active item's position with a critically
  // damped spring - quick start, soft landing, and never any overshoot,
  // bounce or wobble (even if the target changes mid-flight).
  let bubbleX = items[0]?.offsetLeft || 0;
  let bubbleVel = 0;
  let springRaf = null;
  let lastTime = null;
  const OMEGA = 20; // glide speed (rad/s): settles in about a third of a second
  // MOBILE: stat bar - phones are scrolled with flicks that cover far more ground than a mouse-wheel notch, so on <= 900px the bar
  // runs slower and calmer than on desktop (desktop numbers above and in styles.css are untouched). Final tuning:
  //   pin length    240svh (styles.css, .problem-stage::after; was 120svh; desktop holds 118vh) = 60svh of scrolling per stat
  //   MOBILE_OMEGA  7 rad/s: a hop settles to 95% in ~0.68 s and to 99% in ~0.95 s (desktop OMEGA 20: 0.24 s / 0.33 s);
  //                 still critically damped - no overshoot, bounce or wobble
  //   colour fade   0.6 s (styles.css; desktop 0.35 s), and the text lights up when the bubble reaches it (nearestStat below)
  //   MOBILE_LEAD   0.25: when the scroll position is more than one stat away from where the bubble is heading, the target moves on
  //                 by ONE stat at a time, as soon as the bubble is within 0.25 of a stat's pitch of the current one. A hard flick
  //                 therefore carries the bubble smoothly through every stat in turn (~0.4 s each) instead of teleporting to the end.
  const MOBILE_OMEGA = 7;
  const MOBILE_LEAD = 0.25;
  let wantIndex = 0; // MOBILE: the stat the scroll position is on (activeIndex catches up with it one stat at a time)

  /* critical-spring-step:begin */
  // Exact (closed-form) step of a critically damped spring, so it is smooth
  // and identical at any frame rate. `offset` is the distance from the target.
  function criticalSpringStep(offset, vel, omega, dt) {
    // If the bubble is already heading for the target faster than a critically
    // damped glide would allow (target changed mid-flight), shed the extra
    // speed so it can never carry past the target.
    if (offset * (vel + omega * offset) < 0) vel = -omega * offset;
    const b = vel + omega * offset;
    const decay = Math.exp(-omega * dt);
    return [(offset + b * dt) * decay, (b - omega * (offset + b * dt)) * decay];
  }
  /* critical-spring-step:end */

  // MOBILE: stat bar - the stats are equally spaced, so the bubble's place among them is (position - first) / pitch.
  function statSpan() { return [itemPos(0), itemPos(1) - itemPos(0)]; }
  function nearestStat(px, first, pitch) {
    return pitch ? Math.max(0, Math.min(items.length - 1, Math.round((px - first) / pitch))) : 0;
  }
  // MOBILE: stat bar - moves the bubble's target (activeIndex) toward the stat the scroll is on (wantIndex): a single
  // stat away it goes there at once; further away it advances ONE stat at a time, only once the bubble is nearly on the
  // current one (or has to turn round), so the bubble passes through the stats in between instead of jumping past them.
  function stepTarget() {
    if (activeIndex === wantIndex) return;
    if (reducedMotion) { activeIndex = wantIndex; return; }
    const dir = wantIndex > activeIndex ? 1 : -1;
    if (Math.abs(wantIndex - activeIndex) > 1 && (itemPos(activeIndex) - bubbleX) * dir > Math.abs(statSpan()[1]) * MOBILE_LEAD) return;
    activeIndex += dir;
  }

  function springTick(now) {
    if (lastTime === null) lastTime = now;
    const dt = Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
    const mobile = !isDesktop();
    const [first, pitch] = mobile ? statSpan() : [0, 0];
    if (mobile) stepTarget();
    const target = itemPos(activeIndex);
    const [offset, vel] = criticalSpringStep(bubbleX - target, bubbleVel, mobile ? MOBILE_OMEGA : OMEGA, dt);
    bubbleX = target + offset;
    bubbleVel = vel;
    const dx = target - bubbleX;

    const stretch = clamp(1 + Math.min(Math.abs(bubbleVel) * 0.00028, 0.2));
    setBubblePos(bubbleX);
    bar.style.setProperty("--bubble-stretch", stretch.toFixed(3));
    if (mobile) setLit(nearestStat(bubbleX, first, pitch)); // the text lights up as the bubble reaches it

    if (Math.abs(dx) > 0.05 || Math.abs(bubbleVel) > 0.5 || (mobile && activeIndex !== wantIndex)) {
      springRaf = requestAnimationFrame(springTick);
    } else {
      bubbleX = target;
      bubbleVel = 0;
      setBubblePos(bubbleX);
      bar.style.setProperty("--bubble-stretch", "1");
      springRaf = null;
      lastTime = null;
    }
  }
  function requestSpring() {
    // MOBILE: stat bar - reduced motion: no glide, the bubble jumps straight onto the active stat
    if (reducedMotion) {
      bubbleX = itemPos(activeIndex);
      bubbleVel = 0;
      setBubblePos(bubbleX);
      bar.style.setProperty("--bubble-stretch", "1");
      setLit(activeIndex);
      return;
    }
    if (!springRaf) springRaf = requestAnimationFrame(springTick);
  }

  // Desktop: the pinned section's own scroll passage drives progress
  // (position: sticky handles the actual pin/release natively - no wheel
  // interception, no preventDefault, so scrolling stays completely native
  // and reverses correctly on its own).
  //
  // Mobile/tablet (<= 900px): the heading above the bar is too tall to pin on a
  // phone, so only the bar is pinned (CSS: position: sticky, with empty space
  // after it that is the distance the page scrolls while it is held - see the
  // "MOBILE: stat bar" block in styles.css). Progress is measured from where the
  // bar would naturally sit: 0 until it reaches its pin position, then 0 -> 1
  // over that distance - the same four equal steps as on desktop.
  let scrollRaf = null;
  function updateFromScroll() {
    scrollRaf = null;
    const dist = scrollDriver.offsetHeight - window.innerHeight;
    const progress = dist > 0 ? clamp((window.scrollY - scrollDriver.offsetTop) / dist) : 0;
    setActive(Math.min(items.length - 1, Math.floor(progress * items.length)));
    requestSpring();
  }

  // MOBILE: stat bar - the stat the scroll position is on
  function pinStatIndex() {
    const cs = getComputedStyle(section);
    // where the bar sticks, px from the top of the screen / how far the page scrolls while it sticks. The fallbacks
    // (same numbers as the CSS) are for a browser that does not report a resolved value for these two.
    const pinTop = parseFloat(cs.top) || Math.max(88, (window.innerHeight - section.offsetHeight) / 2);
    const travel = parseFloat(getComputedStyle(section.parentElement, "::after").height) || window.innerHeight * 2.4;
    const above = section.previousElementSibling; // the heading + copy above the bar
    const naturalTop = (above ? above.getBoundingClientRect().bottom : 0) + (parseFloat(cs.marginTop) || 0);
    const progress = travel > 0 ? clamp((pinTop - naturalTop) / travel) : 0;
    return Math.min(items.length - 1, Math.floor(progress * items.length));
  }
  function updateFromPin() {
    scrollRaf = null;
    wantIndex = pinStatIndex();
    stepTarget(); // the bubble's target follows, one stat at a time (springTick keeps it going)
    requestSpring();
  }
  function requestScrollUpdate() {
    if (scrollRaf || parked()) return;
    scrollRaf = requestAnimationFrame(isDesktop() ? updateFromScroll : updateFromPin);
  }

  // MOBILE: stat bar - the layout changed (resize, rotation, stats re-stacked, web font arrived). When the
  // bubble has to run along a different axis it jumps onto the active stat instead of gliding in from
  // the old one. On desktop this is just the old resize handler (re-measure the bubble, re-check scroll).
  let layoutKind = null;
  function onLayoutChange() {
    if (parked()) { layoutKind = "desktop"; park(); return; } // desktop + reduced motion: the bubble stays on the first stat
    syncBubbleWidth();
    syncStackedBubbleSize();
    const kind = isDesktop() ? "desktop" : isStacked() ? "stacked" : "row";
    if (kind !== layoutKind) {
      if (layoutKind !== null) {
        if (springRaf) { cancelAnimationFrame(springRaf); springRaf = null; }
        lastTime = null;
        bubbleVel = 0;
        if (kind !== "desktop") { wantIndex = pinStatIndex(); activeIndex = wantIndex; } // phone/tablet: land on the stat the scroll is on
        setLit(activeIndex);
        bubbleX = itemPos(activeIndex);
        bar.style.removeProperty("--bubble-x");
        bar.style.removeProperty("--bubble-y");
        bar.style.setProperty("--bubble-stretch", "1");
        setBubblePos(bubbleX);
      }
      layoutKind = kind;
    }
    requestScrollUpdate();
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", onLayoutChange);
  if (mobileMQ.addEventListener) mobileMQ.addEventListener("change", onLayoutChange);
  else if (mobileMQ.addListener) mobileMQ.addListener(onLayoutChange); // Safari before 14
  if ("ResizeObserver" in window) new ResizeObserver(() => { if (!isDesktop()) onLayoutChange(); }).observe(bar);
  items[0]?.classList.add("active");
  onLayoutChange();
})();

yield;
/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

/* ---------- Landing-page VSL player ---------- */
(function () {
  const player = document.getElementById("vsl-player");
  const video = document.getElementById("vsl-video");
  const playBtn = document.getElementById("vsl-play");
  if (!player || !video || !playBtn) return;
  const heavy = () => [...document.querySelectorAll(".bg-fixed-video, .hero-loop")];
  // While the VSL plays, rest every other video on the page so the player gets
  // the whole GPU (the blurred glass layers re-render on each background frame).
  function hush() {
    document.body.classList.add("vsl-playing");
    heavy().forEach((v) => v.pause());
  }
  function resume() {
    document.body.classList.remove("vsl-playing");
    // Only the background clips that already have their file (they are attached after the hero is
    // playing); a still-empty one must not start loading here.
    document.querySelectorAll(".bg-fixed-video[src]").forEach((v) => v.play().catch(() => {}));
    document.querySelectorAll(".hero-loop").forEach((v) => { heroVideoObserver.unobserve(v); heroVideoObserver.observe(v); });
  }
  function start() {
    video.controls = true;
    player.classList.add("playing");
    hush();
    video.play().catch(() => { video.controls = true; });
  }
  playBtn.addEventListener("click", start);
  video.addEventListener("click", () => { if (!video.controls) start(); });
  video.addEventListener("pause", () => { if (!video.ended) resume(); });
  video.addEventListener("play", hush);
  video.addEventListener("ended", () => { player.classList.remove("playing"); video.controls = false; video.load(); resume(); });
})();

/* ---------- Header scroll state ---------- */
const header = document.getElementById("site-header");
function onScroll() {
  header.classList.toggle("scrolled", window.scrollY > 40);
}
window.addEventListener("scroll", onScroll);
onScroll();

/* ---------- Mobile menu ---------- */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");
hamburger.addEventListener("click", () => mobileMenu.classList.toggle("open"));
mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("open")));

/* ---------- Sliding nav hover indicator ---------- */
const navEl = document.querySelector(".nav");
const navIndicator = document.getElementById("nav-indicator");
const navHoverLinks = document.querySelectorAll(".nav-links a, .nav-links .nav-dropdown-trigger");
function moveIndicatorTo(link) {
  const navRect = navEl.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  navIndicator.style.left = (linkRect.left - navRect.left) + "px";
  navIndicator.style.width = linkRect.width + "px";
  navIndicator.classList.add("visible");
}
navHoverLinks.forEach(link => {
  link.addEventListener("mouseenter", () => moveIndicatorTo(link));
});
navEl.addEventListener("mouseleave", () => navIndicator.classList.remove("visible"));

/* ---------- Nav scroll-spy (active pill state) ---------- */
const navLinkByTarget = {};
document.querySelectorAll("#nav-links [data-target]").forEach(a => {
  navLinkByTarget[a.dataset.target] = a;
});
const spySections = Object.keys(navLinkByTarget)
  .map(id => document.getElementById(id))
  .filter(Boolean);
const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const link = navLinkByTarget[entry.target.id];
    if (!link) return;
    if (entry.isIntersecting) {
      Object.values(navLinkByTarget).forEach(a => a.classList.remove("active"));
      link.classList.add("active");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
spySections.forEach(section => spyObserver.observe(section));

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxClose = document.getElementById("lightbox-close");
function openLightbox(src) {
  lightbox.classList.add("open");
  lightboxVideo.muted = false;
  lightboxVideo.src = src;
  lightboxVideo.load();
  const tryPlay = () => {
    const playPromise = lightboxVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay with sound was blocked — fall back to muted autoplay,
        // which browsers always allow, rather than staying paused.
        lightboxVideo.muted = true;
        lightboxVideo.play().catch(() => {});
      });
    }
  };
  if (lightboxVideo.readyState >= 2) {
    tryPlay();
  } else {
    lightboxVideo.addEventListener("loadedmetadata", tryPlay, { once: true });
  }
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightboxVideo.pause();
  lightboxVideo.removeAttribute("src");
  lightboxVideo.load();
}
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
} // end of initPage

// Runs initPage() (see the note above it) one chunk at a time: each `yield;` in it is a boundary where the
// browser gets the main thread back for a moment, so no single piece of set-up is long enough to be felt.
(function () {
  const chunks = initPage(); // a generator: nothing runs until the first next()
  const gestures = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"];
  let state = 0; // 0 waiting for the clips, 1 working through the chunks, 2 finished
  function done() {
    state = 2;
    gestures.forEach((name) => window.removeEventListener(name, finishNow));
  }
  // The visitor touched the page (or landed on a #section): everything that is left is built right now,
  // so a click / scroll / hover can never find a half-built page.
  function finishNow() {
    if (state === 2) return;
    done();
    while (!chunks.next().done) { /* run the remaining chunks */ }
  }
  function nextChunk() {
    if (state === 2) return;
    if (chunks.next().done) { done(); return; }
    if ("requestIdleCallback" in window) requestIdleCallback(nextChunk, { timeout: 100 });
    else setTimeout(nextChunk, 16);
  }
  function begin() {
    if (state) return;
    state = 1;
    nextChunk();
  }
  let scheduled = false;
  function afterPlaying() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(begin, 500); // let the clips settle into steady playback first
  }
  if (location.hash) { finishNow(); return; } // landing on a #section: it has to exist before the browser scrolls there
  gestures.forEach((name) => window.addEventListener(name, finishNow, { passive: true }));
  heroVideos.forEach((v) => v.addEventListener("playing", afterPlaying, { once: true }));
  if (heroVideos.some((v) => !v.paused && v.readyState >= 3)) afterPlaying();
  setTimeout(begin, 3500); // clips never started (autoplay blocked, slow link): never wait longer than this
})();
