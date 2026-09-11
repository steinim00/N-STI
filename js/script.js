(function () {
  "use strict";

  // Slots that are shot: real photographs, shown at their own aspect ratio.
  // Everything else is an honest "not shot yet" placeholder — no AI imagery.
  var SLOTS = [
    { index: 1, real: true, alt: "Kría kafar úr lofti yfir svartri strönd" },
    { index: 2, real: true, alt: "Íslensk hyrna kind í háu grasi" },
    { index: 3, real: false },
    { index: 4, real: true, alt: "Tvær kríur á flugi í skýjuðum himni" },
    { index: 5, real: false },
    { index: 6, real: true, alt: "Göngufólk á Sólheimajökli" },
    { index: 7, real: false },
    { index: 8, real: false },
    { index: 9, real: true, alt: "Kajakræðarar undir jökulsporði" },
    { index: 10, real: false }
  ];

  var photos = []; // only real photos — this is what the lightbox navigates.
  SLOTS.forEach(function (slot) {
    if (!slot.real) return;
    photos.push({
      label: String(slot.index).padStart(2, "0"),
      src: "images/" + slot.index + ".jpg",
      alt: slot.alt
    });
  });

  var grid = document.getElementById("galleryGrid");
  var photoCursor = 0;
  SLOTS.forEach(function (slot) {
    var label = String(slot.index).padStart(2, "0");

    if (!slot.real) {
      var placeholder = document.createElement("div");
      placeholder.className = "gallery-item placeholder";
      var num = document.createElement("span");
      num.className = "placeholder-number";
      num.textContent = label;
      placeholder.appendChild(num);
      grid.appendChild(placeholder);
      return;
    }

    var photoIndex = photoCursor++;
    var photo = photos[photoIndex];

    var fig = document.createElement("button");
    fig.type = "button";
    fig.className = "gallery-item";
    fig.setAttribute("data-photo-index", photoIndex);
    fig.setAttribute("aria-label", "Skoða mynd " + label);

    var img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";

    var veil = document.createElement("span");
    veil.className = "item-veil";

    var numEl = document.createElement("span");
    numEl.className = "item-number";
    numEl.textContent = label;

    fig.appendChild(img);
    fig.appendChild(veil);
    fig.appendChild(numEl);
    grid.appendChild(fig);
  });

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightboxImage");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var closeBtn = document.getElementById("lightboxClose");
  var prevBtn = document.getElementById("lightboxPrev");
  var nextBtn = document.getElementById("lightboxNext");
  var currentIndex = 0;
  var lastFocused = null;

  function openLightbox(idx) {
    currentIndex = (idx + photos.length) % photos.length;
    var photo = photos[currentIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = "Næsti — mynd " + photo.label;
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  grid.addEventListener("click", function (e) {
    var item = e.target.closest(".gallery-item");
    if (!item || item.classList.contains("placeholder")) return;
    openLightbox(parseInt(item.getAttribute("data-photo-index"), 10));
  });

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", function () { openLightbox(currentIndex - 1); });
  nextBtn.addEventListener("click", function () { openLightbox(currentIndex + 1); });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
  });

  /* Sticky header state */
  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  function updateHeader() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* Mobile nav */
  var siteNav = document.getElementById("siteNav");
  navToggle.addEventListener("click", function () {
    var open = siteNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });
  siteNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      siteNav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* Footer year */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
