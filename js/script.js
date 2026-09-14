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

  /* Skeleton loading — mark a photo's container "is-loaded" once its <img>
     has actually decoded (or immediately if it was already cached). */
  var markLoadedWhenReady = function (img, container) {
    var reveal = function () { container.classList.add("is-loaded"); };
    if (img.complete && img.naturalWidth > 0) {
      reveal();
    } else {
      img.addEventListener("load", reveal);
      img.addEventListener("error", reveal);
    }
  };

  var buildGalleryItem = function (photoIndex) {
    var photo = photos[photoIndex];
    var fig = document.createElement("button");
    fig.type = "button";
    fig.className = "gallery-item";
    fig.setAttribute("data-photo-index", photoIndex);
    fig.setAttribute("aria-label", "Skoða mynd " + photo.label);

    var img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";
    markLoadedWhenReady(img, fig);

    var veil = document.createElement("span");
    veil.className = "item-veil";

    var numEl = document.createElement("span");
    numEl.className = "item-number";
    numEl.textContent = photo.label;

    fig.appendChild(img);
    fig.appendChild(veil);
    fig.appendChild(numEl);
    return fig;
  };

  var grid = document.getElementById("galleryGrid");
  if (grid) {
    var previewCount = parseInt(grid.getAttribute("data-preview"), 10);

    if (previewCount) {
      // Index page teaser: a handful of real photos only, no placeholders.
      var slides = [];
      photos.slice(0, previewCount).forEach(function (photo, photoIndex) {
        var slide = buildGalleryItem(photoIndex);
        slides.push(slide);
        grid.appendChild(slide);
      });
      if (slides.length) slides[0].classList.add("is-active");

      /* Slideshow controls — autoplay, arrows, dots */
      var dotsWrap = document.getElementById("slideDots");
      var prevBtn = document.getElementById("slidePrev");
      var nextBtn = document.getElementById("slideNext");
      var dots = slides.map(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slideshow-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", "Mynd " + (i + 1));
        if (dotsWrap) dotsWrap.appendChild(dot);
        return dot;
      });

      var activeSlide = 0;
      var AUTOPLAY_MS = 4500;
      var autoplayTimer = null;

      var showSlide = function (index) {
        activeSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === activeSlide);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === activeSlide);
        });
      };

      var startAutoplay = function () {
        window.clearInterval(autoplayTimer);
        autoplayTimer = window.setInterval(function () {
          showSlide(activeSlide + 1);
        }, AUTOPLAY_MS);
      };

      if (slides.length > 1) {
        if (prevBtn) prevBtn.addEventListener("click", function () {
          showSlide(activeSlide - 1);
          startAutoplay();
        });
        if (nextBtn) nextBtn.addEventListener("click", function () {
          showSlide(activeSlide + 1);
          startAutoplay();
        });
        dots.forEach(function (dot, i) {
          dot.addEventListener("click", function () {
            showSlide(i);
            startAutoplay();
          });
        });

        var slideshowWrap = grid.closest(".gallery-slideshow-wrap");
        if (slideshowWrap) {
          slideshowWrap.addEventListener("mouseenter", function () { window.clearInterval(autoplayTimer); });
          slideshowWrap.addEventListener("mouseleave", startAutoplay);
        }
        startAutoplay();
      } else {
        if (prevBtn) prevBtn.hidden = true;
        if (nextBtn) nextBtn.hidden = true;
      }
    } else {
      // Full gallery page: every slot, placeholders included, in order.
      var photoCursor = 0;
      SLOTS.forEach(function (slot) {
        if (!slot.real) {
          var placeholder = document.createElement("div");
          placeholder.className = "gallery-item placeholder";
          var num = document.createElement("span");
          num.className = "placeholder-number";
          num.textContent = String(slot.index).padStart(2, "0");
          placeholder.appendChild(num);
          grid.appendChild(placeholder);
          return;
        }
        grid.appendChild(buildGalleryItem(photoCursor++));
      });
    }
  }

  document.querySelectorAll(".hero-media, .about-media, .book-cover").forEach(function (container) {
    var img = container.querySelector("img");
    if (img) markLoadedWhenReady(img, container);
  });

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  if (grid && lightbox) {
    var lightboxImage = document.getElementById("lightboxImage");
    var lightboxCaption = document.getElementById("lightboxCaption");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");
    var currentIndex = 0;
    var lastFocused = null;

    var openLightbox = function (idx) {
      currentIndex = (idx + photos.length) % photos.length;
      var photo = photos[currentIndex];
      lightboxImage.src = photo.src;
      lightboxImage.alt = photo.alt;
      lightboxCaption.textContent = "Næsti — mynd " + photo.label;
      lastFocused = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

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
  }

  /* Sticky header state */
  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  var headerSolidThreshold = 40; // overridden below on the index page, once the hero title's own out-of-view point is known
  function updateHeader() {
    if (window.scrollY >= headerSolidThreshold) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* Hero title snaps from its big centered spot into the header's brand
     slot the instant it scrolls out of view behind the header — one and
     the same element the whole way, not a second logo fading in beside
     it. A quick CSS transition on .hero-title does the actual snapping;
     this just flips a class at the right moment rather than scrubbing
     the position continuously with scroll. Index-page only.

     A same-class, invisible clone stays behind in the hero's normal flow
     purely to hold that layout space and to measure the "start" rect from
     (always accurate at any viewport width, since it shares the exact
     responsive font-size rules). The real, visible <h1> is reparented to
     <body> and driven with position:fixed — reparenting is what lets its
     z-index be compared directly against the header instead of getting
     trapped inside .hero-overlay's own stacking context. */
  var heroTitle = document.getElementById("heroTitle");
  var brandWordTarget = document.getElementById("brandWordTarget");
  if (heroTitle && brandWordTarget) {
    var heroTitleSpacer = heroTitle.cloneNode(true);
    heroTitleSpacer.removeAttribute("id");
    heroTitleSpacer.setAttribute("aria-hidden", "true");
    heroTitleSpacer.style.visibility = "hidden";
    heroTitle.parentNode.insertBefore(heroTitleSpacer, heroTitle);

    heroTitle.style.position = "fixed";
    heroTitle.style.margin = "0";
    heroTitle.style.transformOrigin = "top left";
    heroTitle.style.zIndex = "150";
    heroTitle.style.pointerEvents = "none";
    document.body.appendChild(heroTitle);

    var flightStart = null;
    var flightEnd = null;

    var measureFlight = function () {
      flightStart = heroTitleSpacer.getBoundingClientRect();

      // Measure the target slot in the header's *scrolled* (compact-padding)
      // state, since that's what the title is actually docking against —
      // otherwise a title measured while unscrolled ends up a few pixels
      // off from where the header's word really sits once solid. Padding
      // is itself transitioned on that class, so briefly kill the
      // transition too — otherwise this measurement just catches frame
      // zero of that animation, still at the old padding.
      var wasScrolled = header.classList.contains("scrolled");
      var prevHeaderTransition = header.style.transition;
      header.style.transition = "none";
      header.classList.add("scrolled");
      void header.offsetHeight; // force layout with the new, untransitioned styles
      flightEnd = brandWordTarget.getBoundingClientRect();
      header.classList.toggle("scrolled", wasScrolled);
      void header.offsetHeight;
      header.style.transition = prevHeaderTransition;

      heroTitle.style.top = flightStart.top + "px";
      heroTitle.style.left = flightStart.left + "px";
      heroTitle.style.width = flightStart.width + "px";
      // The scroll position at which the title's natural top edge would
      // start passing behind the fixed header. Using the bottom edge
      // instead (wait for it to be *fully* gone) sounds more correct on
      // paper, but by then there's nothing left on screen to visibly snap
      // — the whole point of the motion is that the still-fully-visible
      // title suddenly shrinks into the corner right as it would start
      // disappearing, not that it reappears from nothing.
      headerSolidThreshold = Math.max(0, flightStart.top - header.getBoundingClientRect().height);
    };

    var wasDocked = null;

    var applyFlight = function () {
      if (!flightStart || !flightEnd) return;
      var docked = window.scrollY >= headerSolidThreshold;
      var justChanged = docked !== wasDocked;

      // Only the moment it crosses the docked/undocked boundary gets the
      // eased snap; every other update this same frame-loop is just the
      // title tracking scroll 1:1 like ordinary page content, which must
      // stay untransitioned or it'll lag behind and rubber-band.
      heroTitle.style.transition = justChanged ? "" : "none";

      if (docked) {
        var dx = flightEnd.left - flightStart.left;
        var dy = flightEnd.top - flightStart.top;
        var scale = flightEnd.height / flightStart.height;
        heroTitle.style.transform = "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")";
      } else {
        heroTitle.style.transform = "translateY(" + (-window.scrollY) + "px)";
      }
      heroTitle.classList.toggle("is-docked", docked);
      wasDocked = docked;
    };

    var initFlight = function () {
      measureFlight();
      updateHeader();
      applyFlight();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initFlight);
    } else {
      initFlight();
    }

    window.addEventListener("scroll", function () {
      updateHeader();
      applyFlight();
    }, { passive: true });
    window.addEventListener("resize", function () {
      measureFlight();
      updateHeader();
      applyFlight();
    });
  }

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
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Cart — items persisted client-side only (localStorage), no backend yet */
  var CART_KEY = "naestiCart";
  var cartCountEl = document.getElementById("cartCount");
  var formatIsk = function (amount) {
    return amount.toLocaleString("is-IS") + " kr";
  };
  var readCart = function () {
    try {
      var items = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  };
  var writeCart = function (items) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  };
  var cartQtyTotal = function (items) {
    return items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  };
  var renderCartBadge = function () {
    if (!cartCountEl) return;
    var total = cartQtyTotal(readCart());
    cartCountEl.textContent = total;
    cartCountEl.hidden = total <= 0;
  };
  var addToCart = function (product, qty) {
    var items = readCart();
    var existing = items.filter(function (item) { return item.id === product.id; })[0];
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ id: product.id, title: product.title, price: product.price, qty: qty });
    }
    writeCart(items);
    renderCartBadge();
  };
  renderCartBadge();

  /* Quantity stepper (Bókin) */
  var qtyInput = document.getElementById("bookQty");
  var qtyMinus = document.getElementById("qtyMinus");
  var qtyPlus = document.getElementById("qtyPlus");
  if (qtyInput && qtyMinus && qtyPlus) {
    var qtyMin = parseInt(qtyInput.min, 10) || 1;
    var qtyMax = parseInt(qtyInput.max, 10) || 20;
    var clampQty = function () {
      var value = parseInt(qtyInput.value, 10);
      if (isNaN(value)) value = qtyMin;
      qtyInput.value = Math.min(qtyMax, Math.max(qtyMin, value));
    };
    qtyMinus.addEventListener("click", function () {
      qtyInput.value = Math.max(qtyMin, (parseInt(qtyInput.value, 10) || qtyMin) - 1);
    });
    qtyPlus.addEventListener("click", function () {
      qtyInput.value = Math.min(qtyMax, (parseInt(qtyInput.value, 10) || qtyMin) + 1);
    });
    qtyInput.addEventListener("change", clampQty);
  }

  /* Add to cart (Bókin) — no backend yet, just confirms the click */
  var addToCartBtn = document.getElementById("addToCartBtn");
  var addToCartLabel = document.getElementById("addToCartLabel");
  if (addToCartBtn && addToCartLabel) {
    var defaultLabel = addToCartLabel.textContent;
    addToCartBtn.addEventListener("click", function () {
      var qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
      addToCart({ id: "ljosmyndabok", title: "Næsti — ljósmyndabókin", price: 9990 }, qty);
      addToCartLabel.textContent = "Bætt í körfu (" + qty + ") ✓";
      addToCartBtn.classList.add("is-added");
      window.clearTimeout(addToCartBtn._resetTimer);
      addToCartBtn._resetTimer = window.setTimeout(function () {
        addToCartLabel.textContent = defaultLabel;
        addToCartBtn.classList.remove("is-added");
      }, 2200);
    });
  }
  /* Contact form — no backend yet, just confirms the submit */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    var submitBtn = document.getElementById("contactSubmitBtn");
    var submitLabel = document.getElementById("contactSubmitLabel");
    var confirmation = document.getElementById("contactFormConfirmation");
    var defaultSubmitLabel = submitLabel.textContent;
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      submitLabel.textContent = "Sent ✓";
      submitBtn.classList.add("is-sent");
      confirmation.hidden = false;
      window.clearTimeout(contactForm._resetTimer);
      contactForm._resetTimer = window.setTimeout(function () {
        submitLabel.textContent = defaultSubmitLabel;
        submitBtn.classList.remove("is-sent");
        confirmation.hidden = true;
        contactForm.reset();
      }, 3000);
    });
  }

  /* Cart page (Karfa / ganga frá pöntun) */
  var cartItemsEl = document.getElementById("cartItems");
  var cartEmptyEl = document.getElementById("cartEmpty");
  var cartSummaryEl = document.getElementById("cartSummary");
  var cartTotalEl = document.getElementById("cartTotal");
  var checkoutBtn = document.getElementById("checkoutBtn");
  var clearCartBtn = document.getElementById("clearCartBtn");

  var cartViewEl = document.getElementById("cartView");
  var paymentViewEl = document.getElementById("paymentView");
  var orderCompleteViewEl = document.getElementById("orderCompleteView");
  var paymentTotalEl = document.getElementById("paymentTotal");
  var paymentBackBtn = document.getElementById("paymentBackBtn");
  var confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  var confirmPaymentLabel = document.getElementById("confirmPaymentLabel");

  var lastCartTotal = 0;

  var renderCartPage = function () {
    if (!cartItemsEl) return;
    var items = readCart();
    cartItemsEl.innerHTML = "";

    if (items.length === 0) {
      if (cartEmptyEl) cartEmptyEl.hidden = false;
      if (cartSummaryEl) cartSummaryEl.hidden = true;
      return;
    }
    if (cartEmptyEl) cartEmptyEl.hidden = true;
    if (cartSummaryEl) cartSummaryEl.hidden = false;

    var total = 0;
    items.forEach(function (item) {
      var lineTotal = item.price * item.qty;
      total += lineTotal;

      var row = document.createElement("div");
      row.className = "cart-item";

      var info = document.createElement("div");
      info.className = "cart-item-info";
      var title = document.createElement("p");
      title.className = "cart-item-title";
      title.textContent = item.title;
      var unitPrice = document.createElement("p");
      unitPrice.className = "cart-item-unit-price";
      unitPrice.textContent = formatIsk(item.price) + " / stk";
      info.appendChild(title);
      info.appendChild(unitPrice);

      var stepper = document.createElement("div");
      stepper.className = "quantity-stepper cart-item-stepper";
      var minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "qty-btn";
      minusBtn.setAttribute("aria-label", "Fækka");
      minusBtn.textContent = "−";
      var qtyDisplay = document.createElement("span");
      qtyDisplay.className = "qty-input";
      qtyDisplay.textContent = item.qty;
      var plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "qty-btn";
      plusBtn.setAttribute("aria-label", "Fjölga");
      plusBtn.textContent = "+";
      minusBtn.addEventListener("click", function () {
        updateCartItemQty(item.id, item.qty - 1);
      });
      plusBtn.addEventListener("click", function () {
        updateCartItemQty(item.id, item.qty + 1);
      });
      stepper.appendChild(minusBtn);
      stepper.appendChild(qtyDisplay);
      stepper.appendChild(plusBtn);

      var lineTotalEl = document.createElement("p");
      lineTotalEl.className = "cart-item-total";
      lineTotalEl.textContent = formatIsk(lineTotal);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "cart-item-remove";
      removeBtn.setAttribute("aria-label", "Fjarlægja úr körfu");
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", function () {
        updateCartItemQty(item.id, 0);
      });

      row.appendChild(info);
      row.appendChild(stepper);
      row.appendChild(lineTotalEl);
      row.appendChild(removeBtn);
      cartItemsEl.appendChild(row);
    });

    lastCartTotal = total;
    if (cartTotalEl) cartTotalEl.textContent = formatIsk(total);
  };

  var showCartStep = function (step) {
    if (cartViewEl) cartViewEl.hidden = step !== "cart";
    if (paymentViewEl) paymentViewEl.hidden = step !== "payment";
    if (orderCompleteViewEl) orderCompleteViewEl.hidden = step !== "complete";
  };

  var updateCartItemQty = function (id, qty) {
    var items = readCart();
    if (qty <= 0) {
      items = items.filter(function (item) { return item.id !== id; });
    } else {
      items.forEach(function (item) {
        if (item.id === id) item.qty = qty;
      });
    }
    writeCart(items);
    renderCartBadge();
    renderCartPage();
  };

  if (cartItemsEl) {
    renderCartPage();
    showCartStep("cart");

    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", function () {
        writeCart([]);
        renderCartBadge();
        renderCartPage();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function () {
        if (readCart().length === 0) return;
        if (paymentTotalEl) paymentTotalEl.textContent = formatIsk(lastCartTotal);
        showCartStep("payment");
      });
    }

    if (paymentBackBtn) {
      paymentBackBtn.addEventListener("click", function () {
        showCartStep("cart");
      });
    }

    if (confirmPaymentBtn && confirmPaymentLabel) {
      var defaultConfirmLabel = confirmPaymentLabel.textContent;
      confirmPaymentBtn.addEventListener("click", function () {
        confirmPaymentBtn.disabled = true;
        confirmPaymentLabel.textContent = "Vinnur úr sýndargreiðslu…";
        window.setTimeout(function () {
          writeCart([]);
          renderCartBadge();
          renderCartPage();
          showCartStep("complete");
          confirmPaymentBtn.disabled = false;
          confirmPaymentLabel.textContent = defaultConfirmLabel;
        }, 1100);
      });
    }
  }

  /* ---------------- Page-transition aperture overlay ---------------- */
  /* A 9-blade iris overlay covers the page on click, holds while the next
     page loads underneath, then sweeps open to reveal it — see the CSS
     comment above .aperture-overlay for how the blade geometry works. */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var APERTURE_DURATION = 400;

    var apertureOverlay = document.createElement("div");
    apertureOverlay.className = "aperture-overlay is-open";
    apertureOverlay.setAttribute("aria-hidden", "true");
    apertureOverlay.innerHTML =
      '<svg viewBox="0 0 200 200">' +
      '<polygon class="blade" points="100.00,0.00 100,100 164.28,23.40" style="transform-origin:100.00px 0.00px"/>' +
      '<polygon class="blade" points="164.28,23.40 100,100 198.48,82.64" style="transform-origin:164.28px 23.40px"/>' +
      '<polygon class="blade" points="198.48,82.64 100,100 186.60,150.00" style="transform-origin:198.48px 82.64px"/>' +
      '<polygon class="blade" points="186.60,150.00 100,100 134.20,193.97" style="transform-origin:186.60px 150.00px"/>' +
      '<polygon class="blade" points="134.20,193.97 100,100 65.80,193.97" style="transform-origin:134.20px 193.97px"/>' +
      '<polygon class="blade" points="65.80,193.97 100,100 13.40,150.00" style="transform-origin:65.80px 193.97px"/>' +
      '<polygon class="blade" points="13.40,150.00 100,100 1.52,82.64" style="transform-origin:13.40px 150.00px"/>' +
      '<polygon class="blade" points="1.52,82.64 100,100 35.72,23.40" style="transform-origin:1.52px 82.64px"/>' +
      '<polygon class="blade" points="35.72,23.40 100,100 100.00,0.00" style="transform-origin:35.72px 23.40px"/>' +
      "</svg>";
    document.body.appendChild(apertureOverlay);

    var apertureBlades = apertureOverlay.querySelectorAll(".blade");
    var ROTATE_TRANSITION = "transform 0.4s ease-in-out";

    // Bumped by every interaction that takes over the (shared) overlay, so
    // a delayed cleanup callback from an older interaction — e.g. the
    // page-load open sequence's own timer, if a nav link or "Stærðir" is
    // clicked while it's still pending — can tell it's been superseded and
    // skip touching classes a newer interaction now owns.
    var apertureGen = 0;

    // The very first time a visitor's browser loads the homepage, the
    // opening sweep runs slower (1s) so it reads as a proper entrance
    // rather than a quick flourish. Every other load — including later
    // visits to index.html itself — uses the normal, snappier duration.
    var FIRST_INDEX_FLAG = "naestiIndexVisited";
    var pathname = window.location.pathname;
    var isIndexPage = pathname === "/" || pathname === "" || /\/index\.html$/.test(pathname);
    var openTransition = ROTATE_TRANSITION;
    var openDuration = APERTURE_DURATION;
    if (isIndexPage && !localStorage.getItem(FIRST_INDEX_FLAG)) {
      openTransition = "transform 1s ease-in-out";
      openDuration = 1000;
    }
    if (isIndexPage) localStorage.setItem(FIRST_INDEX_FLAG, "1");

    // Every page load starts fully closed and opaque, then sweeps the
    // blades open — whether this load followed a navigation we intercepted
    // or the visitor arrived directly (typed URL, refresh, first visit).
    // Rotation alone doesn't retract the blades fully out of frame, so once
    // the rotation timer completes the overlay is hidden with a hard,
    // untransitioned cut rather than a fade — a snap, not a dissolve.
    var loadGen = ++apertureGen;
    apertureOverlay.style.transition = "none";
    apertureBlades.forEach(function (blade) { blade.style.transition = "none"; });
    apertureOverlay.classList.remove("is-open");
    apertureOverlay.classList.add("is-visible");
    void apertureOverlay.offsetHeight;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (apertureGen !== loadGen) return;
        apertureBlades.forEach(function (blade) { blade.style.transition = openTransition; });
        apertureOverlay.classList.add("is-open");
      });
    });
    window.setTimeout(function () {
      if (apertureGen !== loadGen) return;
      apertureOverlay.style.transition = "none";
      apertureOverlay.classList.remove("is-visible");
    }, openDuration + 60);

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest("a[href]");
      if (!link || (link.target && link.target !== "_self")) return;
      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      apertureGen++;
      // Closing: snap the overlay opaque instantly (its own content is just
      // the blade shapes, so there's nothing to fade in) and let the blade
      // rotation itself — visible from frame one — be the entire motion.
      apertureOverlay.style.transition = "none";
      apertureBlades.forEach(function (blade) { blade.style.transition = "none"; });
      apertureOverlay.classList.add("is-visible");
      void apertureOverlay.offsetHeight;
      apertureBlades.forEach(function (blade) { blade.style.transition = ROTATE_TRANSITION; });
      apertureOverlay.classList.remove("is-open");
      window.setTimeout(function () {
        window.location.href = link.href;
      }, APERTURE_DURATION);
    });

    // "Stærðir" jumps to a same-page section — no navigation, just a scroll —
    // so it was excluded from the click handler above entirely. It closes
    // the same black aperture at the same speed, jumps the scroll position
    // underneath while hidden, but then — instead of auto-opening on a
    // timer — stays closed until the visitor scrolls: their own scroll
    // input (wheel, touch, or keyboard) drives the blades open directly,
    // like turning a focus ring, rather than playing a canned animation.
    var SCROLL_TO_OPEN = 1100; // px of accumulated downward scroll input to fully open
    document.querySelectorAll('a[href$="#sizes"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var url;
        try {
          url = new URL(link.href, window.location.href);
        } catch (err) {
          return;
        }
        if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
        var target = document.getElementById(url.hash.slice(1));
        if (!target) return;

        e.preventDefault();
        apertureGen++;
        var html = document.documentElement;
        var prevScrollBehavior = html.style.scrollBehavior;

        apertureOverlay.style.transition = "none";
        apertureBlades.forEach(function (blade) { blade.style.transition = "none"; });
        apertureOverlay.classList.add("is-visible");
        void apertureOverlay.offsetHeight;
        apertureBlades.forEach(function (blade) { blade.style.transition = ROTATE_TRANSITION; });
        apertureOverlay.classList.remove("is-open");

        window.setTimeout(function () {
          html.style.scrollBehavior = "auto";
          target.scrollIntoView({ block: "start" });
          html.style.scrollBehavior = prevScrollBehavior;

          // Closed and jumped — now wait for the visitor's own scroll to
          // drive it open. No CSS transition here: the target progress
          // jumps straight to wherever the input says, but the displayed
          // progress eases toward it a little every frame (instead of
          // snapping straight there), so quick or jerky wheel/touch ticks
          // come out as one smooth, slightly trailing motion — and it keeps
          // gliding for a few frames after the input stops, like momentum.
          apertureBlades.forEach(function (blade) { blade.style.transition = "none"; });

          var targetProgress = 0; // 0 = closed, 1 = fully open
          var shownProgress = 0;
          var ticking = false;
          var tick = function () {
            shownProgress += (targetProgress - shownProgress) * 0.16;
            if (targetProgress >= 1 && 1 - shownProgress < 0.003) shownProgress = 1;
            var angle = 110 * shownProgress;
            var t = "rotate(" + angle + "deg)";
            apertureBlades.forEach(function (blade) { blade.style.transform = t; });
            if (shownProgress >= 1) {
              ticking = false;
              finish();
              return;
            }
            window.requestAnimationFrame(tick);
          };
          var addProgress = function (delta) {
            if (delta <= 0) return;
            targetProgress = Math.min(1, targetProgress + delta / SCROLL_TO_OPEN);
            if (!ticking) {
              ticking = true;
              window.requestAnimationFrame(tick);
            }
          };

          var onWheel = function (e) {
            e.preventDefault();
            addProgress(e.deltaY);
          };
          var touchY = null;
          var onTouchStart = function (e) { touchY = e.touches[0].clientY; };
          var onTouchMove = function (e) {
            e.preventDefault();
            if (touchY === null) return;
            var y = e.touches[0].clientY;
            addProgress(touchY - y);
            touchY = y;
          };
          var onKeydown = function (e) {
            if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
              e.preventDefault();
              addProgress(SCROLL_TO_OPEN / 3);
            } else if (e.key === "End") {
              e.preventDefault();
              addProgress(SCROLL_TO_OPEN);
            }
          };

          var finish = function () {
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("keydown", onKeydown);
            apertureBlades.forEach(function (blade) { blade.style.transform = ""; blade.style.transition = ""; });
            apertureOverlay.style.transition = "none";
            apertureOverlay.classList.add("is-open");
            apertureOverlay.classList.remove("is-visible");
          };

          window.addEventListener("wheel", onWheel, { passive: false });
          window.addEventListener("touchstart", onTouchStart, { passive: true });
          window.addEventListener("touchmove", onTouchMove, { passive: false });
          window.addEventListener("keydown", onKeydown);
        }, APERTURE_DURATION);
      });
    });
  }
})();
