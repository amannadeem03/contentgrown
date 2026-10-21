/* ==========================================================================================
   page.js - behaviour for the landing pages (short-form-video-editing/, vsl-editing/,
   youtube-video-editing/, video-ad-editing/). Plain JavaScript, no libraries, loaded with `defer`.

   It replaces the big homepage script.js on these pages (that file builds the homepage's own DOM).
   Every block below looks for its elements first and does nothing when a page does not have them,
   so the same file serves all four pages (a page with no pricing simply has no pricing tabs).

     1  Scroll reveal          .reveal blocks fade in (same calm stagger on phones as the homepage)
     2  Header                 scrolled state, hamburger menu, Services menu, hover indicator
     3  Modal helper           page lock + inert background, shared by the lightbox and the dialog
     4  Clips and lightbox     poster first; hover loads a small muted preview; click opens the full clip
     5  Pricing tabs           Standard / Advanced
     6  FAQ accordion          answers are in the HTML; this only opens and closes them
     7  Get Started dialog     WhatsApp / Book a call / payment-link request (same flow as the homepage)

   Nothing here downloads a video until a visitor hovers or clicks a clip.
   ========================================================================================== */
(function () {
  "use strict";

  const doc = document;
  const body = doc.body;
  const $ = (sel, root) => (root || doc).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || doc).querySelectorAll(sel));
  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
  const reduceMotion = mq("(prefers-reduced-motion: reduce)");
  const finePointer = mq("(hover: hover) and (pointer: fine)");
  const narrow = mq("(max-width: 900px)");

  const WHATSAPP_NUMBER = "923181183581";
  const BOOKING_URL = "https://calendly.com/contentgrownn/15mincall";

  /* ---------- 1. Scroll reveal ---------- */
  // On phones and tablets the blocks that come into view in the same frame are staggered top to bottom, as on
  // the homepage (styles.css reads --rd as the transition delay). Above 900px they simply fade in together.
  (function () {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in-view")); return; }
    const STAGGER = 0.12, STAGGER_MAX = 5;
    function stagger(entries) {
      const showing = entries.filter((e) => e.isIntersecting);
      if (showing.length < 2) return;
      showing.sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left));
      showing.forEach((e, i) => {
        const delay = Math.min(i, STAGGER_MAX) * STAGGER;
        if (!delay) return;
        e.target.style.setProperty("--rd", delay + "s");
        setTimeout(() => {
          e.target.style.removeProperty("--rd");
          if (!e.target.getAttribute("style")) e.target.removeAttribute("style");
        }, (delay + 1.5) * 1000);
      });
    }
    const io = new IntersectionObserver((entries) => {
      if (narrow.matches && !reduceMotion.matches) stagger(entries);
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  })();

  /* ---------- 2. Header ---------- */
  const header = $("#site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Hamburger menu (phones and tablets)
  const burger = $("#hamburger");
  const mobileMenu = $("#mobile-menu");
  function setMenu(open) {
    if (!mobileMenu || !burger) return;
    mobileMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  }
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
    $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    const closeOnWide = () => { if (!narrow.matches) setMenu(false); };
    if (narrow.addEventListener) narrow.addEventListener("change", closeOnWide);
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) { setMenu(false); burger.focus(); }
    });
  }

  // Services: desktop dropdown (hover opens; a click pins it open) and the phone accordion
  const servicesWrap = $("#services-dropdown-wrap");
  const servicesTrigger = $("#services-trigger");
  const servicesList = $("#services-dropdown");
  if (servicesWrap && servicesTrigger && servicesList) {
    let pinned = false;
    let closeTimer = null;
    const setOpen = (open) => {
      clearTimeout(closeTimer);
      servicesWrap.classList.toggle("open", open);
      servicesTrigger.setAttribute("aria-expanded", String(open));
      if (!open) pinned = false;
    };
    servicesWrap.addEventListener("mouseenter", () => setOpen(true));
    servicesWrap.addEventListener("mouseleave", () => {
      if (pinned) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => setOpen(false), 180);
    });
    servicesTrigger.addEventListener("click", () => {
      if (pinned) { setOpen(false); } else { setOpen(true); pinned = true; }
    });
    servicesWrap.addEventListener("keydown", (e) => {
      const links = $$("a", servicesList);
      const current = links.indexOf(doc.activeElement);
      const last = links.length - 1;
      let next;
      if (e.key === "Escape") {
        if (!servicesWrap.classList.contains("open")) return;
        setOpen(false);
        servicesTrigger.focus();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") next = current < last ? current + 1 : 0;
      else if (e.key === "ArrowUp") next = current > 0 ? current - 1 : last;
      else if (e.key === "Home" && current >= 0) next = 0;
      else if (e.key === "End" && current >= 0) next = last;
      else return;
      e.preventDefault();
      if (!servicesWrap.classList.contains("open")) { setOpen(true); pinned = true; }
      links[next].focus();
    });
    servicesWrap.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !servicesWrap.contains(e.relatedTarget)) setOpen(false);
    });
    doc.addEventListener("pointerdown", (e) => {
      if (servicesWrap.classList.contains("open") && !servicesWrap.contains(e.target)) setOpen(false);
    });
  }
  const mobileToggle = $("#mobile-services-toggle");
  const mobileList = $("#mobile-services-list");
  if (mobileToggle && mobileList) {
    mobileToggle.addEventListener("click", () => {
      const open = mobileToggle.classList.toggle("open");
      mobileList.classList.toggle("open", open);
      mobileToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Sliding hover indicator under the desktop nav
  const navEl = $(".nav");
  const indicator = $("#nav-indicator");
  if (navEl && indicator) {
    $$(".nav-links > li > a, .nav-links .nav-dropdown-trigger").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const navRect = navEl.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        indicator.style.left = (rect.left - navRect.left) + "px";
        indicator.style.width = rect.width + "px";
        indicator.classList.add("visible");
      });
    });
    navEl.addEventListener("mouseleave", () => indicator.classList.remove("visible"));
  }

  /* ---------- 3. Modal helper: lock the page and make everything behind a dialog inert ---------- */
  function lockPage(on) {
    [$("#site-header"), $("main"), $(".site-footer")].forEach((part) => { if (part) part.inert = on; });
    if (on) body.style.setProperty("--scrollbar-gap", Math.max(0, window.innerWidth - doc.documentElement.clientWidth) + "px");
    else body.style.removeProperty("--scrollbar-gap");
    body.classList.toggle("scroll-locked", on);
  }

  /* ---------- 4. Clips and lightbox ---------- */
  const lightbox = $("#lightbox");
  const lightboxVideo = $("#lightbox-video");
  const lightboxClose = $("#lightbox-close");
  let lightboxOpener = null;

  function openLightbox(src, label, opener) {
    if (!lightbox || !lightboxVideo) return;
    lightboxOpener = opener || null;
    lightboxVideo.setAttribute("aria-label", label || "Video player");
    lightbox.classList.add("open");
    lockPage(true);
    lightboxVideo.muted = false;
    lightboxVideo.src = src;
    lightboxVideo.load();
    const p = lightboxVideo.play();
    if (p && p.catch) {
      // Sound can be blocked by the browser; fall back to muted playback rather than staying paused.
      p.catch(() => { lightboxVideo.muted = true; const q = lightboxVideo.play(); if (q && q.catch) q.catch(() => {}); });
    }
    if (lightboxClose) lightboxClose.focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    lightbox.classList.remove("open");
    lockPage(false);
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    if (lightboxOpener && lightboxOpener.isConnected) lightboxOpener.focus({ preventScroll: true });
    lightboxOpener = null;
  }
  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  }

  // Hover preview: a small muted file (about 2 MB) is created and fetched the first time the pointer is over a clip.
  let previewing = null;
  function stopPreview(card) {
    if (!card) return;
    if (card._preview) { card._preview.pause(); try { card._preview.currentTime = 0; } catch (err) { /* not seekable yet */ } }
    card.parentNode.classList.remove("is-playing");
    if (previewing === card) previewing = null;
  }
  function startPreview(card) {
    if (previewing && previewing !== card) stopPreview(previewing);
    let v = card._preview;
    if (!v) {
      v = doc.createElement("video");
      v.className = "clip-video";
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.preload = "auto";
      v.setAttribute("aria-label", (card.getAttribute("data-label") || "Client work sample") + " (preview)");
      v.addEventListener("playing", () => { if (previewing === card) card.parentNode.classList.add("is-playing"); });
      v.src = card.getAttribute("data-preview");
      card.insertBefore(v, $(".clip-play", card));
      card._preview = v;
    }
    previewing = card;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }
  $$(".clip .work-card").forEach((card) => {
    card.addEventListener("mouseenter", () => { if (finePointer.matches && !reduceMotion.matches) startPreview(card); });
    card.addEventListener("mouseleave", () => stopPreview(card));
    card.addEventListener("click", () => {
      stopPreview(card);
      openLightbox(card.getAttribute("data-full"), card.getAttribute("data-label"), card);
    });
  });

  /* ---------- 5. Pricing tabs ---------- */
  (function () {
    const tabs = $$(".pricing-toggle-option");
    const panels = $$(".pricing-panel");
    if (!tabs.length || !panels.length) return;
    function select(tier, focus) {
      tabs.forEach((tab) => {
        const on = tab.getAttribute("data-tier") === tier;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.getAttribute("data-tier") === tier));
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab.getAttribute("data-tier")));
      tab.addEventListener("keydown", (e) => {
        let next = -1;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next < 0) return;
        e.preventDefault();
        select(tabs[next].getAttribute("data-tier"), true);
      });
    });
  })();

  /* ---------- 6. FAQ accordion ---------- */
  (function () {
    const items = $$(".faq-item");
    if (!items.length) return;
    const fit = (answer) => answer.scrollHeight + 24 + "px";
    function setOpen(item, open) {
      const btn = $(".faq-question", item);
      const answer = $(".faq-answer", item);
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      answer.inert = !open; // a closed answer is out of the tab order and the reading order
      answer.style.maxHeight = open ? fit(answer) : null;
    }
    items.forEach((item) => {
      $(".faq-answer", item).inert = true;
      $(".faq-question", item).addEventListener("click", () => {
        const wasOpen = item.classList.contains("open");
        items.forEach((other) => { if (other !== item && other.classList.contains("open")) setOpen(other, false); });
        setOpen(item, !wasOpen);
      });
    });
    window.addEventListener("resize", () => {
      items.forEach((item) => { if (item.classList.contains("open")) $(".faq-answer", item).style.maxHeight = fit($(".faq-answer", item)); });
    });
  })();

  /* ---------- 7. Get Started dialog ---------- */
  // The same small chat-style dialog as the homepage (its styles are .choose* in styles.css): WhatsApp, a booking call,
  // or a payment-link request. The request is a short in-dialog form that opens WhatsApp with a ready message; nothing the
  // visitor types is stored or sent anywhere except into that WhatsApp message.
  (function () {
    const triggers = $$("a[data-plan]");
    if (!triggers.length) return;

    const svg = {
      whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01"/></svg>',
      card: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      check: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 12.5l3.7 3.7 7.3-7.9"/></svg>',
    };
    let el = null;        // the overlay, created on the first click
    let opener = null;    // the Get Started button that opened it
    let pressedInside = false;
    let pack = null;      // { label, plan, videos, total } the dialog is about
    let inputs = null;    // { name, email, phone }

    const waUrl = (text) => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
    const clean = (value) => String(value).replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").replace(/\s+/g, " ").trim();
    const validators = {
      name(v) {
        if (!v) return "Please enter your full name.";
        if (v.length < 2) return "Your name needs at least 2 characters.";
        if (v.length > 60) return "Please keep your name to 60 characters or fewer.";
        return "";
      },
      email(v) {
        if (!v) return "Please enter your email address.";
        if (v.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(v)) return "That email doesn't look right. Try something like name@example.com.";
        return "";
      },
      phone(v) {
        if (!v) return "Please enter your WhatsApp number with country code.";
        let digits = v.replace(/[\s\-()[\]]/g, "");
        if (digits.startsWith("+")) digits = digits.slice(1);
        else if (digits.startsWith("00")) digits = digits.slice(2);
        if (!/^\d+$/.test(digits)) return "Please use digits only, with your country code, e.g. +1 555 123 4567.";
        if (digits.length < 8 || digits.length > 15) return "Please enter 8 to 15 digits, including your country code.";
        return "";
      },
    };

    function setError(input, message) {
      const error = $("#" + input.id + "-error", el);
      error.textContent = message;
      error.hidden = !message;
      if (message) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", error.id); }
      else { input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby"); }
    }

    function showStep(name, focusEl, animate) {
      const dialog = el.firstElementChild;
      $$(".choose-step", el).forEach((step) => {
        const active = step.dataset.step === name;
        step.hidden = !active;
        step.classList.toggle("choose-step--in", active && animate !== false);
        if (active) dialog.setAttribute("aria-describedby", step.dataset.desc);
      });
      dialog.scrollTop = 0;
      if (focusEl) focusEl.focus({ preventScroll: true });
    }

    function option(cls, href, icon, title, sub) {
      const node = doc.createElement(href ? "a" : "button");
      node.className = "choose-opt " + cls;
      if (href) { node.href = href; node.target = "_blank"; node.rel = "noopener"; } else { node.type = "button"; }
      node.innerHTML = '<span class="choose-opt-icon">' + icon + '</span><span class="choose-opt-text"><strong></strong><span></span></span><span class="choose-opt-arrow">' + svg.arrow + "</span>";
      $("strong", node).textContent = title;
      $(".choose-opt-text > span", node).textContent = sub;
      return node;
    }

    function submit(e) {
      e.preventDefault();
      const values = {};
      let firstInvalid = null;
      Object.keys(inputs).forEach((key) => {
        const input = inputs[key];
        values[key] = clean(input.value);
        input.value = values[key];
        const message = validators[key](values[key]);
        setError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      const url = waUrl([
        "Hi, I'd like to purchase the " + pack.plan + " package.",
        "Name: " + values.name,
        "Email: " + values.email,
        "WhatsApp: " + values.phone,
        "Package: " + pack.label + " - " + pack.plan + " - " + pack.videos + " videos - $" + pack.total,
        "Please send me the payment link.",
      ].join("\n"));
      window.open(url, "_blank", "noopener"); // inside the visitor's own submit, so popup blockers allow it
      $(".choose-fallback a", el).href = url;
      showStep("done", $(".choose-done-title", el));
    }

    function build() {
      el = doc.createElement("div");
      el.className = "choose";
      el.innerHTML =
        '<div class="choose-dialog" role="dialog" aria-modal="true" aria-labelledby="choose-title" aria-describedby="choose-msg" tabindex="-1">' +
          '<div class="choose-head">' +
            '<span class="choose-avatar"><img src="/assets/favicon-192.png" alt="" width="96" height="96"></span>' +
            '<strong class="choose-name" id="choose-title">CONTENTGROWN</strong>' +
            '<button class="choose-close" type="button" aria-label="Close">' + svg.close + "</button>" +
          "</div>" +
          '<div class="choose-body">' +
            '<div class="choose-step" data-step="options" data-desc="choose-msg">' +
              '<p class="choose-bubble" id="choose-msg"></p><p class="choose-summary"></p><div class="choose-options"></div>' +
            "</div>" +
            '<div class="choose-step" data-step="details" data-desc="choose-details-msg" hidden>' +
              '<p class="choose-bubble" id="choose-details-msg" tabindex="-1">Great! Just a few quick details and we\'ll send your payment link.</p>' +
              '<p class="choose-pack"></p>' +
              '<form class="choose-form" novalidate>' +
                '<div class="choose-field"><label for="choose-name">Full name</label><input id="choose-name" name="name" type="text" autocomplete="name" maxlength="60" required><p class="choose-error" id="choose-name-error" hidden></p></div>' +
                '<div class="choose-field"><label for="choose-email">Email address</label><input id="choose-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="254" required><p class="choose-error" id="choose-email-error" hidden></p></div>' +
                '<div class="choose-field"><label for="choose-phone">WhatsApp number (with country code)</label><input id="choose-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+1 555 123 4567" maxlength="30" required><p class="choose-error" id="choose-phone-error" hidden></p></div>' +
                '<div class="choose-actions"><button class="choose-btn choose-btn--primary" type="submit">Send request on WhatsApp</button><button class="choose-btn choose-btn--ghost choose-back" type="button">Back</button></div>' +
                '<p class="choose-privacy">Your details are only sent to us on WhatsApp.</p>' +
              "</form>" +
            "</div>" +
            '<div class="choose-step choose-done" data-step="done" data-desc="choose-done-msg" hidden>' +
              '<span class="choose-check">' + svg.check + "</span>" +
              '<h3 class="choose-done-title" tabindex="-1">Your request is ready to send</h3>' +
              '<p class="choose-done-text" id="choose-done-msg">WhatsApp should have opened with your details. Just press Send there and we\'ll reply with your secure payment link. Once payment is completed, we\'ll get your project started.</p>' +
              '<p class="choose-fallback">WhatsApp didn\'t open? <a href="' + waUrl("") + '" target="_blank" rel="noopener">Tap here</a></p>' +
              '<button class="choose-btn choose-btn--secondary choose-done-close" type="button">Close</button>' +
            "</div>" +
          "</div>" +
        "</div>";
      inputs = { name: $("#choose-name", el), email: $("#choose-email", el), phone: $("#choose-phone", el) };
      Object.keys(inputs).forEach((key) => inputs[key].addEventListener("input", () => {
        // once a field has been flagged, re-check it as the visitor fixes it, so the message clears itself
        if (inputs[key].hasAttribute("aria-invalid")) setError(inputs[key], validators[key](clean(inputs[key].value)));
      }));
      $(".choose-form", el).addEventListener("submit", submit);
      // close on the X or on a click that starts and ends on the dark overlay (so dragging a text selection out of the dialog does not close it)
      el.addEventListener("pointerdown", (e) => { pressedInside = e.target !== el; });
      el.addEventListener("click", (e) => {
        const outside = e.target === el && !pressedInside;
        pressedInside = false;
        if (outside || e.target.closest(".choose-close, .choose-done-close") || e.target.closest("a.choose-opt")) close();
        else if (e.target.closest(".choose-opt--pay")) showStep("details", $("#choose-details-msg", el));
        else if (e.target.closest(".choose-back")) showStep("options", $(".choose-opt--pay", el));
      });
      body.appendChild(el);
    }

    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(); } }

    function open(btn) {
      const d = btn.dataset;
      const label = d.tierLabel, plan = d.plan, videos = d.videos, per = d.per;
      const total = Number(d.total).toLocaleString("en-US");
      if (!label || !plan) return;
      if (!el) build();
      $("#choose-msg", el).innerHTML = "Hi! Great choice. How would you like to get started with <strong></strong>?";
      $("#choose-msg strong", el).textContent = label + " - " + plan;
      $(".choose-summary", el).textContent = videos + " videos · $" + per + "/video · $" + total + " total";
      const waText = "Hi CONTENTGROWN! I'm interested in the " + plan + " package (" + label + ", " + videos + " videos, $" + total + "). I'd like to get started.";
      $(".choose-options", el).replaceChildren(
        option("choose-opt--wa", waUrl(waText), svg.whatsapp, "Chat on WhatsApp", "Ask a question or start the conversation"),
        option("choose-opt--call", BOOKING_URL, svg.calendar, "Book a call", "Prefer to talk it through? Pick a time"),
        option("choose-opt--pay", "", svg.card, "Request payment link", "We'll send you a secure payment link")
      );
      pack = { label: label, plan: plan, videos: videos, total: total };
      $(".choose-pack", el).innerHTML = "<strong></strong> · " + videos + " videos · $" + total;
      $(".choose-pack strong", el).textContent = label + " - " + plan;
      $(".choose-form", el).reset();
      Object.keys(inputs).forEach((key) => setError(inputs[key], ""));
      showStep("options", null, false);
      opener = btn;
      lockPage(true);
      el.classList.add("open");
      doc.addEventListener("keydown", onKey);
      el.firstElementChild.scrollTop = 0;
      el.firstElementChild.focus({ preventScroll: true });
    }

    function close() {
      if (!el || !el.classList.contains("open")) return;
      el.classList.remove("open");
      doc.removeEventListener("keydown", onKey);
      lockPage(false);
      const back = opener;
      opener = null;
      if (back && back.isConnected) back.focus({ preventScroll: true });
    }

    doc.addEventListener("click", (e) => {
      const btn = e.target.closest("a[data-plan]");
      if (!btn) return;
      e.preventDefault(); // href="#book" stays as the no-JavaScript fallback
      open(btn);
    });
  })();

  // Escape also closes the lightbox (the Get Started dialog and the menus handle their own Escape).
  doc.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
})();
