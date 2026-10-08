/* ---------- Smooth hero background video loop ---------- */
const heroVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const v = entry.target;
    if (entry.isIntersecting && !document.body.classList.contains("vsl-playing")) v.play().catch(() => {});
    else v.pause();
  });
}, { threshold: 0 });
document.querySelectorAll(".hero-loop").forEach((v) => {
  v.addEventListener("ended", () => {
    v.currentTime = 0;
    v.play().catch(() => {});
  });
  // Only decode the hero clips while the hero is on screen - four videos
  // playing out of sight were competing with the background for decoders.
  heroVideoObserver.observe(v);
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
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/betting-vlog-preview.mp4" },
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/vlog-01-preview.mp4" },
  { cats: ["vlogs"], label: "Vlogs", file: "vlogs/vlog-2-preview.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-1.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-2.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-3.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-4.mp4" },
  { cats: ["long"], label: "Long-Form", file: "longform/long-form-5.mp4" },
];

const workGrid = document.getElementById("work-grid");
let activeWorkFilter = "all";
workItems.forEach((item) => {
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
      <source src="${gridSrc}" type="video/mp4">
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
        <a class="btn ${plan.badge ? "btn-solid btn-glass" : "btn-glass"}" href="#book">Get Started</a>
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

/* ---------- Proof / testimonials ---------- */
const videoTestimonials = [
  { name: "Aaron", file: "assets/testimonials/videos/aaron-testimonial.mp4" },
  { name: "Jaime", file: "assets/testimonials/videos/jaime-testimonial.mp4" },
  { name: "Ramses", file: "assets/testimonials/videos/ramses-testimonial.mp4" },
];
const proofVideoGrid = document.getElementById("proof-video-grid");
// The three portrait cards fade in together as one group. (The reveal class sits
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
    <video muted loop playsinline preload="metadata">
      <source src="${t.file}" type="video/mp4">
    </video>
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
    document.querySelectorAll(".bg-fixed-video").forEach((v) => v.play().catch(() => {}));
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
