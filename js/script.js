(function () {
  "use strict";

  var PHOTO_COUNT = 10;
  // Tall (portrait-emphasis) tiles for a photographic masonry rhythm.
  var TALL_INDEXES = [1, 4, 6, 9];

  var ALT_OVERRIDES = {
    1: "Kría kafar úr lofti yfir svartri strönd",
    2: "Íslensk hyrna kind í háu grasi",
    4: "Tvær kríur á flugi í skýjuðum himni",
    6: "Göngufólk á Sólheimajökli",
    9: "Kajakræðarar undir jökulsporði"
  };

  var photos = [];
  for (var i = 1; i <= PHOTO_COUNT; i++) {
    photos.push({
      index: i,
      label: String(i).padStart(2, "0"),
      src: "images/" + i + ".jpg",
      alt: ALT_OVERRIDES[i] || ("Næsti — svarthvít ljósmynd " + i)
    });
  }

  var grid = document.getElementById("galleryGrid");
  photos.forEach(function (photo) {
    var fig = document.createElement("button");
    fig.type = "button";
    fig.className = "gallery-item" + (TALL_INDEXES.includes(photo.index) ? " tall" : "");
    fig.setAttribute("data-index", photo.index - 1);
    fig.setAttribute("aria-label", "Skoða mynd " + photo.label);

    var img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";

    var veil = document.createElement("span");
    veil.className = "item-veil";

    var num = document.createElement("span");
    num.className = "item-number";
    num.textContent = photo.label;

    fig.appendChild(img);
    fig.appendChild(veil);
    fig.appendChild(num);
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
    if (!item) return;
    openLightbox(parseInt(item.getAttribute("data-index"), 10));
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
