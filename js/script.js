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
      photos.slice(0, previewCount).forEach(function (photo, photoIndex) {
        grid.appendChild(buildGalleryItem(photoIndex));
      });
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
})();
