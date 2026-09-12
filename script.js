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

const VIDEO_BASE = "https://content-grown.vercel.app/work/";
const samples = [
  { file: "hero-1", poster: "hero-1-poster.jpg" },
  { file: "hero-2", poster: "hero-2-poster.jpg" },
  { file: "hero-3", poster: "hero-3-poster.jpg" },
  { file: "hero-4", poster: "hero-4-poster.jpg" },
];

/* ---------- Work grid data ---------- */
const workItems = [
  { cat: "short", label: "Short-Form" },
  { cat: "short", label: "Short-Form" },
  { cat: "short", label: "Short-Form" },
  { cat: "short", label: "Short-Form" },
  { cat: "long", label: "Long-Form" },
  { cat: "long", label: "Long-Form" },
  { cat: "long", label: "Long-Form" },
  { cat: "ads", label: "Ads & VSLs" },
  { cat: "ads", label: "Ads & VSLs" },
  { cat: "motion", label: "Motion Graphics" },
  { cat: "motion", label: "Motion Graphics" },
  { cat: "motion", label: "Motion Graphics" },
  { cat: "motion", label: "Motion Graphics" },
];

const workGrid = document.getElementById("work-grid");
workItems.forEach((item, i) => {
  const s = samples[i % samples.length];
  const card = document.createElement("div");
  card.className = "work-card reveal";
  card.dataset.cat = item.cat;
  card.innerHTML = `
    <video muted loop playsinline preload="metadata" poster="${VIDEO_BASE}${s.poster}">
      <source src="${VIDEO_BASE}${s.file}.mp4" type="video/mp4">
    </video>
    <span class="work-card-tag">${item.label}</span>
  `;
  const video = card.querySelector("video");
  registerAutoplayVideo(video);
  card.addEventListener("click", () => openLightbox(`${VIDEO_BASE}${s.file}.mp4`));
  workGrid.appendChild(card);
});

const filterTabs = document.querySelectorAll(".filter-tab");
filterTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    filterTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const filter = tab.dataset.filter;
    document.querySelectorAll(".work-card").forEach(card => {
      card.classList.toggle("hidden", filter !== "all" && card.dataset.cat !== filter);
    });
  });
});

/* ---------- Services ---------- */
const services = [
  { tag: "Content Editing", title: "Short-Form Content", desc: "Reels, Shorts, and TikToks edited for hooks, pacing, and retention." },
  { tag: "Content Editing", title: "Long-Form Content", desc: "YouTube videos edited for structure and watch time." },
  { tag: "Content Editing", title: "Ads & VSLs", desc: "Direct-response video built around a single conversion goal." },
  { tag: "Design & Motion", title: "Motion Graphics", desc: "Animation, kinetic type, and branded visual elements." },
  { tag: "Design & Motion", title: "Graphic Design", desc: "Thumbnails, covers, and static assets that match your video work." },
  { tag: "Systems & Management", title: "Social Media Management", desc: "Scheduling, publishing, and platform-side execution." },
  { tag: "Systems & Management", title: "Content Systems", desc: "The workflow behind it all: intake, feedback, approvals, and delivery, running on a fixed schedule." },
];
const servicesList = document.getElementById("services-list");
services.forEach((s, i) => {
  const row = document.createElement("div");
  row.className = "service-row reveal";
  row.innerHTML = `
    <div class="service-index">0${i + 1}</div>
    <div class="service-title-wrap">
      <h3>${s.title}</h3>
      <span class="service-tag">${s.tag}</span>
    </div>
    <p class="service-desc">${s.desc}</p>
  `;
  servicesList.appendChild(row);
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

/* ---------- Stats count-up ---------- */
const statEls = document.querySelectorAll(".stat-number");
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    statObserver.unobserve(el);
  });
}, { threshold: 0.4 });
statEls.forEach(el => statObserver.observe(el));

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

/* ---------- Cursor spotlight (throttled, subtle) ---------- */
const spotlight = document.querySelector(".spotlight");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let spotlightQueued = false;
let lastX = 0, lastY = 0;
if (finePointer) {
  window.addEventListener("pointermove", (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!spotlightQueued) {
      spotlightQueued = true;
      requestAnimationFrame(() => {
        spotlight.style.setProperty("--x", lastX + "px");
        spotlight.style.setProperty("--y", lastY + "px");
        spotlight.classList.add("active");
        spotlightQueued = false;
      });
    }
  });
  window.addEventListener("pointerleave", () => spotlight.classList.remove("active"));
}

/* ---------- Roaming border light on glass CTAs ---------- */
if (finePointer) {
  document.querySelectorAll(".btn-glass").forEach((btn) => {
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
