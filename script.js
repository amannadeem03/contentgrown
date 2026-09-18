/* ---------- Smooth hero background video loop ---------- */
document.querySelectorAll(".hero-loop").forEach((v) => {
  v.addEventListener("ended", () => {
    v.currentTime = 0;
    v.play().catch(() => {});
  });
});

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

  function tick() {
    a.style.opacity = crossfade(a);
    b.style.opacity = crossfade(b);
    requestAnimationFrame(tick);
  }

  Promise.all([whenReady(a), whenReady(b)]).then(() => {
    a.playbackRate = speed;
    b.playbackRate = speed;
    try { b.currentTime = a.duration / 2; } catch (e) {}
    a.play().catch(() => {});
    b.play().catch(() => {});
    requestAnimationFrame(tick);
  });
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

/* ---------- Shared: autoplay preview videos as they scroll into view ---------- */
const scrollAutoplayObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting) {
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

/* ---------- Work grid data (real client work) ---------- */
const workItems = [
  { cats: ["ads"], label: "Ads", file: "ads/ad-1.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-2.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-3.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-4.mp4" },
  { cats: ["ads"], label: "Ads", file: "ads/ad-5.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/office-vsl-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-1-preview.mp4" },
  { cats: ["vsl"], label: "VSLs", file: "vsls/vsl-4k-preview.mp4" },
  { cats: ["short", "ai"], label: "AI Content", file: "ai-content/mastermind-ad-techy.mp4", hideFromAll: true },
  { cats: ["short", "ai"], label: "AI Content", file: "ai-content/mastermind-cohort-4.mp4", hideFromAll: true },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-01.mp4", hideFromAll: true },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-1.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-2.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-3.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-4.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-5.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-6.mp4" },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-7.mp4", hideFromAll: true },
  { cats: ["short"], label: "Short-Form", file: "shortform/video-8.mp4" },
  { cats: ["long", "vlogs"], label: "Vlogs", file: "vlogs/betting-vlog-preview.mp4" },
  { cats: ["long", "vlogs"], label: "Vlogs", file: "vlogs/vlog-01-preview.mp4" },
];

const workGrid = document.getElementById("work-grid");
let activeWorkFilter = "all";
workItems.forEach((item) => {
  const src = `${PORTFOLIO_BASE}${item.file}`;
  const posterName = item.file.split("/").pop().replace(/\.mp4$/, ".jpg");
  const poster = `${PORTFOLIO_BASE}posters/${posterName}`;
  const card = document.createElement("div");
  card.className = "work-card reveal";
  card.dataset.cat = item.cats.join(" ");
  if (item.hideFromAll) {
    card.dataset.hideFromAll = "true";
    // Set synchronously at creation, not through applyWorkFilter (which
    // only runs on a tab click) - otherwise these show up on the default
    // "All" view for a moment before anything hides them. Clicking their
    // actual category tab still reveals them normally.
    card.classList.add("hidden");
  }
  card.innerHTML = `
    <video muted loop playsinline preload="metadata" poster="${poster}">
      <source src="${src}" type="video/mp4">
    </video>
    <span class="work-card-tag">${item.label}</span>
  `;
  const video = card.querySelector("video");
  video.addEventListener("loadedmetadata", () => {
    const isLandscape = video.videoWidth >= video.videoHeight;
    card.dataset.format = isLandscape ? "landscape" : "reel";
    card.classList.toggle("landscape", isLandscape);
    // Only touch visibility for the "all" view, and only in the direction
    // of hiding landscape cards - never force-unhide, or this would undo
    // the permanent hideFromAll flag on cards that happen to be portrait.
    if (activeWorkFilter === "all" && isLandscape) card.classList.add("hidden");
  }, { once: true });
  // Preview plays only on hover, not on scroll-into-view — with 21 cards in
  // this grid, autoplaying every card that scrolls 50% into view meant
  // several 1080p videos could be decoding at once, which is what caused
  // the stutter/lag.
  card.addEventListener("mouseenter", () => { video.currentTime = 0; video.play().catch(() => {}); });
  card.addEventListener("mouseleave", () => { video.pause(); video.currentTime = 0; });
  card.addEventListener("click", () => openLightbox(src));
  workGrid.appendChild(card);
});

const filterTabs = document.querySelectorAll(".filter-tab");

function applyWorkFilter(filter) {
  document.querySelectorAll(".work-card").forEach(card => {
    const matches = filter === "all"
      ? card.dataset.format !== "landscape" && card.dataset.hideFromAll !== "true"
      : card.dataset.cat.split(" ").includes(filter);
    card.classList.toggle("hidden", !matches);
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

/* ---------- Services ---------- */
const services = [
  { tag: "Content Production", title: "Video Editing", desc: "Scroll-stopping edits built for stronger pacing, clarity, and retention." },
  { tag: "Content Production", title: "AI Content Creation", desc: "Concepts and content produced with AI to help you move faster without losing your voice." },
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
      <h3 class="${i === 0 ? "service-title-nowrap" : ""}">${s.title}</h3>
    </div>
    <p class="service-desc">${s.desc}</p>
  `;
  servicesList.appendChild(row);
});

/* Three-card Services carousel: continuously eases toward the scroll-driven
   card index every frame (same technique as the liquid stat bar below)
   instead of snapping between four CSS classes on a fixed-duration
   transition - that's what made it feel stepped/glitchy against fast or
   slow scrolling instead of tracking the gesture smoothly. */
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

  // Keyframes as [distance, value] pairs, piecewise-linear between them.
  // Opacity holds solid (glass effect intact) only very close to centre,
  // then falls off steeply - at the exact halfway point between two cards
  // each would only be ~.5 opacity instead of lingering near .85, so there
  // is never a stretch of scroll where two cards read as equally "the"
  // card. X is symmetric - previous and next both clear the active card by
  // the same amount, so both sides are visible instead of "next" sitting
  // almost on top of it.
  const KF_OPACITY = [[-2, 0], [-1, .2], [-.5, .5], [-.2, .92], [0, 1], [.2, .92], [.5, .5], [1, .2], [2, 0]];
  const KF_Z = [[-2, -460], [-1, -210], [0, 120], [1, -190], [2, -460]];
  const KF_ROTATE = [[-2, 58], [-1, 20], [0, 0], [1, -20], [2, -58]];
  const KF_SCALE = [[-2, .72], [-1, .77], [0, 1], [1, .77], [2, .72]];
  const KF_X = [[-2, 0], [-1, -103], [0, 0], [1, 100], [2, 0]];

  function interp(points, d) {
    if (d <= points[0][0]) return points[0][1];
    const last = points[points.length - 1];
    if (d >= last[0]) return last[1];
    for (let i = 0; i < points.length - 1; i++) {
      const [d0, v0] = points[i];
      const [d1, v1] = points[i + 1];
      if (d >= d0 && d <= d1) return v0 + (v1 - v0) * ((d - d0) / (d1 - d0));
    }
    return last[1];
  }

  function wrapDistance(d) {
    let w = ((d % n) + n) % n;
    if (w > n / 2) w -= n;
    return w;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => window.innerWidth > 900;

  let targetIndex = 0;
  let displayIndex = 0;
  let lastTime = null;
  let raf = null;
  let snapTimer = null;
  const EASE_RATE = 4.2; // lower = slower, more deliberate catch-up (matches the bubble's pace)
  const SNAP_DELAY = 160; // ms of no scrolling before committing to the nearest card

  function render(index) {
    const nearest = ((Math.round(index) % n) + n) % n;
    cards.forEach((card, i) => {
      const d = Math.max(-2, Math.min(2, wrapDistance(i - index)));
      const opacity = interp(KF_OPACITY, d);
      const tz = interp(KF_Z, d);
      const rot = interp(KF_ROTATE, d);
      const scale = interp(KF_SCALE, d);
      const x = interp(KF_X, d);
      const dim = Math.min(1, Math.abs(d));
      card.style.opacity = opacity;
      card.style.transform = `translate(calc(-50% + ${x}%), -50%) translate3d(0,0,${tz}px) rotateY(${rot}deg) scale(${scale})`;
      card.style.filter = dim < 0.02 ? "none" : `saturate(${1 - dim * .35}) brightness(${1 - dim * .28})`;
      card.style.zIndex = String(Math.round(100 - Math.abs(d) * 10));
    });
    dots.forEach((dot, i) => dot.classList.toggle("active", i === nearest));
    counter.textContent = String(nearest + 1).padStart(2, "0");
  }

  function resetInlineStyles() {
    cards.forEach(card => {
      card.style.opacity = "";
      card.style.transform = "";
      card.style.filter = "";
      card.style.zIndex = "";
    });
  }

  function tick(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const ease = 1 - Math.exp(-EASE_RATE * dt);
    displayIndex += (targetIndex - displayIndex) * ease;
    if (Math.abs(targetIndex - displayIndex) < 0.001) displayIndex = targetIndex;
    render(displayIndex);
    if (displayIndex !== targetIndex) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
      lastTime = null;
    }
  }

  function requestRender() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  function updateTarget() {
    if (!isDesktop()) {
      if (raf) { cancelAnimationFrame(raf); raf = null; lastTime = null; }
      if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
      resetInlineStyles();
      return;
    }
    const distance = section.offsetHeight - window.innerHeight;
    const progress = distance > 0 ? Math.max(0, Math.min(1, (window.scrollY - section.offsetTop) / distance)) : 0;
    targetIndex = Math.min(n - 1, progress * n);
    if (reducedMotion) {
      displayIndex = targetIndex;
      render(displayIndex);
      return;
    }
    requestRender();
    // While actively scrolling, cards can briefly blend so motion tracks the
    // gesture smoothly - but the moment scrolling stops, commit to whichever
    // card is nearest so exactly one card is ever clearly "the" one on
    // screen, instead of leaving two at similar prominence indefinitely.
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      targetIndex = Math.max(0, Math.min(n - 1, Math.round(targetIndex)));
      requestRender();
    }, SNAP_DELAY);
  }

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", updateTarget);
  displayIndex = 0;
  updateTarget();
  render(displayIndex);
})();

/* ---------- Header services dropdown (desktop hover/focus + mobile accordion) ---------- */
const serviceCategories = [...new Set(services.map(s => s.tag))];
function buildServiceLinks(container, extraClass) {
  serviceCategories.forEach(cat => {
    const col = document.createElement("div");
    col.className = extraClass;
    const items = services.filter(s => s.tag === cat)
      .map(s => `<a href="#services">${s.title}</a>`).join("");
    col.innerHTML = extraClass === "services-dropdown-col"
      ? `<span class="services-dropdown-heading">${cat}</span>${items}`
      : items;
    container.appendChild(col);
  });
}
const servicesDropdown = document.getElementById("services-dropdown");
buildServiceLinks(servicesDropdown, "services-dropdown-col");

const mobileServicesList = document.getElementById("mobile-services-list");
services.forEach(s => {
  const a = document.createElement("a");
  a.href = "#services";
  a.textContent = s.title;
  mobileServicesList.appendChild(a);
});

const servicesDropdownWrap = document.getElementById("services-dropdown-wrap");
let dropdownCloseTimer = null;
function openDropdown() {
  clearTimeout(dropdownCloseTimer);
  servicesDropdownWrap.classList.add("open");
}
function scheduleCloseDropdown() {
  clearTimeout(dropdownCloseTimer);
  dropdownCloseTimer = setTimeout(() => servicesDropdownWrap.classList.remove("open"), 180);
}
servicesDropdownWrap.addEventListener("mouseenter", openDropdown);
servicesDropdownWrap.addEventListener("mouseleave", scheduleCloseDropdown);
servicesDropdownWrap.addEventListener("focusin", openDropdown);
servicesDropdownWrap.addEventListener("focusout", (e) => {
  if (!servicesDropdownWrap.contains(e.relatedTarget)) scheduleCloseDropdown();
});

const mobileServicesToggle = document.getElementById("mobile-services-toggle");
mobileServicesToggle.addEventListener("click", () => {
  mobileServicesToggle.classList.toggle("open");
  mobileServicesList.classList.toggle("open");
});

/* ---------- How it works ---------- */
const steps = [
  { title: "Discovery Call", desc: "We look at what you're producing now, where it's breaking down, and what your output actually needs to be. Twenty minutes, no obligation." },
  { title: "Style Calibration", desc: "Before we touch volume, we lock your style: pacing, caption treatment, graphics, tone. You approve it once, and every edit after that matches it." },
  { title: "Your Pipeline Goes Live", desc: "You send footage. We handle everything from raw file to finished asset — edit, revisions, and delivery — inside your agreed turnaround window." },
  { title: "Scale", desc: "Volume goes up, quality doesn't move. Adding formats or doubling output doesn't mean re-briefing a new editor every time." },
];
const howSteps = document.getElementById("how-steps");
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
});

/* ---------- Why us ---------- */
const whyItems = [
  { title: "A Dedicated Team, Not a Rotating Freelancer", desc: "You're not resubmitting your brand guidelines every month. The same team edits your content, learns your style, and gets faster at it over time." },
  { title: "Consistency You Can Actually Plan Around", desc: "Same quality, same style, same turnaround — video after video. That's the difference between content that compounds and content that stalls." },
  { title: "Turnaround That Holds Under Volume", desc: "24–48 hours on short-form. Capacity for 300+ short-form videos a month. Your schedule doesn't slip because we got busy." },
  { title: "Built to Scale With You", desc: "Going from 8 videos a month to 40 shouldn't mean rebuilding your whole content process. With us, it doesn't." },
];
const whyGrid = document.getElementById("why-grid");
whyItems.forEach(w => {
  const el = document.createElement("div");
  el.className = "why-card reveal";
  el.innerHTML = `<h3>${w.title}</h3><p>${w.desc}</p>`;
  whyGrid.appendChild(el);
});

/* ---------- Proof / testimonials ---------- */
const videoTestimonials = [
  { name: "Aaron", file: "assets/testimonials/videos/aaron-testimonial.mp4" },
  { name: "Jaime", file: "assets/testimonials/videos/jaime-testimonial.mp4" },
  { name: "Ramses", file: "assets/testimonials/videos/ramses-testimonial.mp4" },
];
const proofVideoGrid = document.getElementById("proof-video-grid");
videoTestimonials.forEach(t => {
  const card = document.createElement("div");
  card.className = "proof-video-card reveal";
  card.innerHTML = `
    <video muted loop playsinline preload="metadata">
      <source src="${t.file}" type="video/mp4">
    </video>
    <span class="proof-play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    <span class="proof-video-name">${t.name}</span>
  `;
  const video = card.querySelector("video");
  registerAutoplayVideo(video);
  card.addEventListener("click", () => openLightbox(t.file));
  proofVideoGrid.appendChild(card);
});

const textTestimonialCount = 15;
const proofQuoteGrid = document.getElementById("proof-quote-grid");
for (let i = 1; i <= textTestimonialCount; i++) {
  const num = String(i).padStart(2, "0");
  const el = document.createElement("figure");
  el.className = "proof-quote-card reveal";
  el.innerHTML = `<img src="assets/testimonials/images/text-${num}.jpeg" alt="Client testimonial" loading="lazy">`;
  proofQuoteGrid.appendChild(el);
}

/* ---------- FAQ ---------- */
const faqs = [
  { q: "How is your pricing structured?", a: "We work on monthly retainers and packages, priced around your format mix and volume rather than a flat per-video rate. Most clients find a retainer costs less than a full-time editor and delivers more consistently. We'll walk you through the exact numbers on the call." },
  { q: "What's your turnaround time?", a: "Short-form: 24–48 hours. Long-form: 48–72 hours, up to 3–4 days for complex edits. Ads and VSLs: 3–4 days depending on complexity. Motion graphics: 48–72 hours. Turnaround times are agreed upfront and hold at volume." },
  { q: "Can you handle bulk content?", a: "Yes. Our current capacity is up to 300 short-form videos, 50–70 long-form videos, and 40–50 ads/VSLs per month. Volume doesn't change the turnaround or the quality." },
  { q: "Do you write scripts?", a: "Scripting is available as an add-on. Most clients bring their own scripts or outlines, but if you want that handled too, we can include it in your package." },
  { q: "How many revisions do I get?", a: "Three rounds of revisions are included on every deliverable. In practice most projects need one, because we lock your style during onboarding rather than discovering it through revisions." },
  { q: "What are your contract terms?", a: "Contract terms — pending. Ask on your call." },
  { q: "What do you need from me to get started?", a: "Your raw footage, any brand assets you have (fonts, colors, logos, existing content you like), and a rough sense of your publishing schedule. We handle the rest." },
  { q: "What if I don't like the style?", a: "That's what the calibration step is for. We lock your style before volume starts, so you're approving a direction once instead of correcting the same thing on every video." },
];
const faqList = document.getElementById("faq-list");
faqs.forEach(f => {
  const item = document.createElement("div");
  item.className = "faq-item reveal";
  item.innerHTML = `
    <button class="faq-question">
      <span>${f.q}</span>
      <span class="faq-icon"></span>
    </button>
    <div class="faq-answer"><p>${f.a}</p></div>
  `;
  const btn = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");
  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    faqList.querySelectorAll(".faq-item.open").forEach(open => {
      open.classList.remove("open");
      open.querySelector(".faq-answer").style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add("open");
      answer.style.maxHeight = answer.scrollHeight + 24 + "px";
    }
  });
  faqList.appendChild(item);
});

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
  const isDesktop = () => window.innerWidth > 900;

  let activeIndex = 0;
  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    items.forEach((item, i) => item.classList.toggle("active", i === index));
  }

  function syncBubbleWidth() {
    const w = items[0]?.getBoundingClientRect().width || 0;
    bar.style.setProperty("--bubble-w", `${w}px`);
  }

  if (reducedMotion) {
    // No spring, no scroll-pin - jump straight to whichever item is in
    // frame and stop there.
    items[0]?.classList.add("active");
    syncBubbleWidth();
    bar.style.setProperty("--bubble-x", `${items[0]?.offsetLeft || 0}px`);
    window.addEventListener("resize", () => {
      syncBubbleWidth();
      bar.style.setProperty("--bubble-x", `${items[activeIndex]?.offsetLeft || 0}px`);
    });
    return;
  }

  // Spring: bubbleX eases toward the active item's position with a touch
  // of overshoot before settling, rather than snapping or tweening linearly.
  let bubbleX = items[0]?.offsetLeft || 0;
  let bubbleVel = 0;
  let springRaf = null;
  let lastTime = null;
  const STIFFNESS = 210;
  const DAMPING = 21;

  function springTick(now) {
    if (lastTime === null) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const target = items[activeIndex]?.offsetLeft || 0;
    const dx = target - bubbleX;
    const accel = dx * STIFFNESS - bubbleVel * DAMPING;
    bubbleVel += accel * dt;
    bubbleX += bubbleVel * dt;

    const stretch = clamp(1 + Math.min(Math.abs(bubbleVel) * 0.00028, 0.2));
    bar.style.setProperty("--bubble-x", `${bubbleX}px`);
    bar.style.setProperty("--bubble-stretch", stretch.toFixed(3));

    if (Math.abs(dx) > 0.4 || Math.abs(bubbleVel) > 1) {
      springRaf = requestAnimationFrame(springTick);
    } else {
      bubbleX = target;
      bubbleVel = 0;
      bar.style.setProperty("--bubble-x", `${bubbleX}px`);
      bar.style.setProperty("--bubble-stretch", "1");
      springRaf = null;
      lastTime = null;
    }
  }
  function requestSpring() {
    if (!springRaf) springRaf = requestAnimationFrame(springTick);
  }

  // Desktop: the pinned section's own scroll passage drives progress
  // (position: sticky handles the actual pin/release natively - no wheel
  // interception, no preventDefault, so scrolling stays completely native
  // and reverses correctly on its own).
  //
  // Mobile/tablet has no pin - the bar itself is short and scrolls
  // *horizontally* instead (see the max-width:900px rules), so driving
  // the bubble off vertical page-scroll would make it jump straight to
  // the last item the moment the bar reaches a normal reading position.
  // Tying it to the bar's own horizontal scrollLeft instead makes the
  // bubble follow whichever item the visitor has actually swiped to.
  let scrollRaf = null;
  function updateFromScroll() {
    scrollRaf = null;
    const dist = scrollDriver.offsetHeight - window.innerHeight;
    const progress = dist > 0 ? clamp((window.scrollY - scrollDriver.offsetTop) / dist) : 0;
    setActive(Math.min(items.length - 1, Math.floor(progress * items.length)));
    requestSpring();
  }

  function updateFromBarScroll() {
    scrollRaf = null;
    const maxScroll = bar.scrollWidth - bar.clientWidth;
    const progress = maxScroll > 0 ? clamp(bar.scrollLeft / maxScroll) : 0;
    setActive(Math.min(items.length - 1, Math.round(progress * (items.length - 1))));
    requestSpring();
  }
  function requestScrollUpdate() {
    if (!isDesktop() || scrollRaf) return;
    scrollRaf = requestAnimationFrame(updateFromScroll);
  }
  function requestBarScrollUpdate() {
    if (isDesktop() || scrollRaf) return;
    scrollRaf = requestAnimationFrame(updateFromBarScroll);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  bar.addEventListener("scroll", requestBarScrollUpdate, { passive: true });
  window.addEventListener("resize", () => {
    syncBubbleWidth();
    if (isDesktop()) requestScrollUpdate(); else requestBarScrollUpdate();
  });
  items[0]?.classList.add("active");
  syncBubbleWidth();
  if (isDesktop()) requestScrollUpdate(); else requestBarScrollUpdate();
})();

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
const navHoverLinks = document.querySelectorAll(".nav-links a");
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
document.querySelectorAll("#nav-links a[data-target]").forEach(a => {
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

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Roaming border light on glass CTAs (header CTA uses its own continuous beam instead) ---------- */
if (finePointer) {
  document.querySelectorAll(".btn-glass:not(.nav-cta):not(.hero-cta)").forEach((btn) => {
    let queued = false;
    let mx = 0, my = 0;
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width) * 100;
      my = ((e.clientY - rect.top) / rect.height) * 100;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          btn.style.setProperty("--mx", mx + "%");
          btn.style.setProperty("--my", my + "%");
          queued = false;
        });
      }
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.setProperty("--mx", "50%");
      btn.style.setProperty("--my", "-30%");
    });
  });
}

/* ---------- Cursor-reactive card tilt ---------- */
// .work-card is deliberately excluded: those cards now play their video on
// hover, and skewing a *playing* video through a 3D perspective transform
// reads as glitchy rather than premium - it only looked good back when
// hover just showed a static poster frame.
if (finePointer) {
  const tiltMax = 10; // degrees
  document.querySelectorAll(".why-card, .proof-video-card").forEach((card) => {
    let queued = false;
    let rotX = 0, rotY = 0;
    card.style.transformStyle = "preserve-3d";
    card.style.willChange = "transform";
    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.06s linear";
    });
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotY = px * tiltMax * 2;
      rotX = -py * tiltMax * 2;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px) scale(1.03)`;
          queued = false;
        });
      }
    });
    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.transform = "";
    });
  });
}

/* ---------- Magnetic buttons ---------- */
if (finePointer) {
  const pullStrength = 0.35;
  const maxPull = 10; // px
  document.querySelectorAll(".btn").forEach((btn) => {
    let queued = false;
    let tx = 0, ty = 0;
    btn.addEventListener("mouseenter", () => {
      btn.style.transition = "transform 0.06s linear";
    });
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tx = Math.max(-maxPull, Math.min(maxPull, (e.clientX - cx) * pullStrength));
      ty = Math.max(-maxPull, Math.min(maxPull, (e.clientY - cy) * pullStrength));
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          btn.style.transform = `translate(${tx}px, ${ty}px)`;
          queued = false;
        });
      }
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      btn.style.transform = "";
    });
  });
}

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
