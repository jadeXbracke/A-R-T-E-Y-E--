/* Portfolio: laadt manifest.json + config.json en rendert raster, index,
   filters en lightbox, plus de editorial extra's (hero, cursor, preview). */
(function () {
  "use strict";

  var state = {
    series: [],
    activeSeries: "alles",
    view: "grid",
    photos: [], // platte lijst van de zichtbare foto's, voor de lightbox
    lightboxIndex: -1,
    slideshowTimer: null,
    protectImages: true,
  };

  var gridEl = document.querySelector(".grid");
  var indexEl = document.querySelector(".index");
  var seriesNavEl = document.querySelector(".series-nav");
  var viewToggleEl = document.querySelector(".view-toggle");
  var lightboxEl = document.querySelector(".lightbox");
  var headerEl = document.querySelector(".site-header");
  var heroEl = document.querySelector(".hero");
  var previewEl = document.querySelector(".index-preview");
  var cursorEl = document.querySelector(".cursor");

  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fetchJson(url) {
    return fetch(url + "?t=" + Date.now()).then(function (res) {
      if (!res.ok) throw new Error(url + ": " + res.status);
      return res.json();
    });
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* ---------- header: verdwijnt bij omlaag scrollen ---------- */

  function bindHeaderScroll() {
    if (!headerEl) return;
    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      if (y < 60) {
        headerEl.classList.remove("is-hidden");
      } else if (y > lastY + 4) {
        headerEl.classList.add("is-hidden");
      } else if (y < lastY - 4) {
        headerEl.classList.remove("is-hidden");
      }
      if (heroEl) {
        var passed = y > heroEl.offsetHeight * 0.55;
        headerEl.classList.toggle("past-hero", passed);
      }
      lastY = y;
      ticking = false;
    }

    onScroll();
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    }, { passive: true });
  }

  /* ---------- hero: lokale tijd ---------- */

  function bindHero() {
    if (!heroEl) return;
    var timeEl = heroEl.querySelector(".hero-time");
    if (timeEl) {
      var tick = function () {
        var now = new Date();
        timeEl.textContent = "Local time " + pad(now.getHours()) + ":" + pad(now.getMinutes());
      };
      tick();
      window.setInterval(tick, 15000);
    }
  }

  /* ---------- eigen cursor ---------- */

  function bindCursor() {
    if (!cursorEl || !finePointer) return;
    document.body.classList.add("has-fine-pointer");
    document.addEventListener("mousemove", function (e) {
      cursorEl.style.left = e.clientX + "px";
      cursorEl.style.top = e.clientY + "px";
      var overTarget = e.target.closest &&
        e.target.closest(".grid figure, .index-row");
      cursorEl.classList.toggle("is-hover", !!overTarget);
    }, { passive: true });
  }

  /* ---------- zwevende preview in de indexweergave ---------- */

  var previewState = { x: 0, y: 0, tx: 0, ty: 0, raf: null };

  function movePreview() {
    previewState.x += (previewState.tx - previewState.x) * 0.16;
    previewState.y += (previewState.ty - previewState.y) * 0.16;
    previewEl.style.left = previewState.x + "px";
    previewEl.style.top = previewState.y + "px";
    previewState.raf = window.requestAnimationFrame(movePreview);
  }

  function bindPreview() {
    if (!previewEl || !finePointer) return;
    document.addEventListener("mousemove", function (e) {
      previewState.tx = e.clientX;
      previewState.ty = e.clientY;
      if (reducedMotion) {
        previewState.x = e.clientX;
        previewState.y = e.clientY;
        previewEl.style.left = previewState.x + "px";
        previewEl.style.top = previewState.y + "px";
      }
    }, { passive: true });
    if (!reducedMotion) movePreview();
  }

  function showPreview(src) {
    if (!previewEl || !finePointer) return;
    previewEl.querySelector("img").src = src;
    previewEl.classList.add("is-visible");
  }

  function hidePreview() {
    if (!previewEl) return;
    previewEl.classList.remove("is-visible");
  }

  /* ---------- config (naam, contact) ---------- */

  function applyConfig(config) {
    if (config.rechtsklik_beveiliging === false) state.protectImages = false;
    document.querySelectorAll("[data-config]").forEach(function (el) {
      var key = el.getAttribute("data-config");
      if (!config[key]) return;
      if (key === "email") {
        el.textContent = config.email;
        el.setAttribute("href", "mailto:" + config.email);
      } else if (key === "instagram") {
        var handle = config.instagram.replace(/^@/, "");
        el.textContent = "Small talk — @" + handle;
        el.setAttribute("href", "https://www.instagram.com/" + handle + "/");
        el.closest("[data-config-row]") &&
          el.closest("[data-config-row]").removeAttribute("hidden");
      } else if (key === "over") {
        el.innerHTML = "";
        String(config.over)
          .split(/\n\s*\n/)
          .forEach(function (alinea) {
            var p = document.createElement("p");
            p.textContent = alinea.trim();
            el.appendChild(p);
          });
      } else {
        el.textContent = config[key];
      }
    });
    if (config.email) {
      document.querySelectorAll("[data-cta]").forEach(function (el) {
        el.setAttribute("href", "mailto:" + config.email);
      });
    }
    if (config.naam) {
      document.title = document.title.replace("Jade Bracke", config.naam);
    }
    return config;
  }

  /* ---------- raster ---------- */

  var revealObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -5% 0px" })
    : null;

  function visiblePhotos() {
    var list = [];
    state.series.forEach(function (serie) {
      if (state.activeSeries !== "alles" && serie.slug !== state.activeSeries) return;
      serie.photos.forEach(function (photo) {
        list.push({ photo: photo, serie: serie });
      });
    });
    return list;
  }

  function setActiveSeries(slug, updateHash) {
    state.activeSeries = slug;
    if (updateHash) {
      if (slug === "alles") {
        history.replaceState(null, "", location.pathname + location.search);
      } else {
        history.replaceState(null, "", "#series=" + encodeURIComponent(slug));
      }
    }
    renderSeriesNav();
    renderWork();
  }

  function seriesFromHash() {
    var match = location.hash.match(/series?=([^&]+)/);
    if (!match) return "alles";
    var slug = decodeURIComponent(match[1]);
    return state.series.some(function (s) { return s.slug === slug; }) ? slug : "alles";
  }

  function renderSeriesNav() {
    if (!seriesNavEl) return;
    seriesNavEl.innerHTML = "";
    if (state.series.length < 2) return;

    var items = [{ slug: "alles", title: "All" }].concat(state.series);
    items.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.title;
      if (item.slug === state.activeSeries) btn.classList.add("is-active");
      btn.addEventListener("click", function () {
        setActiveSeries(item.slug, true);
      });
      seriesNavEl.appendChild(btn);
    });
  }

  /* ---------- weergave: grid of index ---------- */

  function setView(view) {
    state.view = view;
    try { localStorage.setItem("portfolio-view", view); } catch (err) {}
    if (viewToggleEl) {
      viewToggleEl.querySelectorAll("button").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-view") === view);
      });
    }
    renderWork();
  }

  function bindViewToggle() {
    if (!viewToggleEl) return;
    var saved = null;
    try { saved = localStorage.getItem("portfolio-view"); } catch (err) {}
    if (saved === "index" || saved === "grid") state.view = saved;
    viewToggleEl.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-view") === state.view);
      btn.addEventListener("click", function () {
        setView(btn.getAttribute("data-view"));
      });
    });
  }

  function renderWork() {
    state.photos = visiblePhotos();
    if (!gridEl || !indexEl) return;
    hidePreview();
    if (state.view === "index") {
      gridEl.hidden = true;
      indexEl.hidden = false;
      renderIndex();
    } else {
      indexEl.hidden = true;
      gridEl.hidden = false;
      renderGrid();
    }
  }

  function renderGrid() {
    gridEl.innerHTML = "";

    if (!state.photos.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        "The film is still developing — add images in docs/portfolio/photos/ (see HANDLEIDING.md).";
      gridEl.appendChild(empty);
      return;
    }

    state.photos.forEach(function (entry, index) {
      var figure = document.createElement("figure");
      var frame = document.createElement("div");
      frame.className = "frame";
      if (entry.photo.width && entry.photo.height) {
        frame.style.aspectRatio = entry.photo.width + " / " + entry.photo.height;
      }

      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = entry.photo.src;
      img.alt = entry.photo.caption || entry.serie.title;
      img.draggable = false;
      img.addEventListener("load", function () {
        img.classList.add("is-loaded");
        frame.style.aspectRatio = "";
      });
      frame.appendChild(img);
      figure.appendChild(frame);

      var cap = document.createElement("figcaption");
      var num = document.createElement("span");
      num.className = "cap-num";
      num.textContent = pad(index + 1);
      cap.appendChild(num);
      if (entry.photo.caption) {
        var text = document.createElement("span");
        text.className = "cap-text";
        text.textContent = entry.photo.caption;
        cap.appendChild(text);
      }
      figure.appendChild(cap);

      figure.addEventListener("click", function () {
        openLightbox(index);
      });

      if (revealObserver) {
        figure.classList.add("reveal");
        revealObserver.observe(figure);
      }
      gridEl.appendChild(figure);
    });
  }

  function renderIndex() {
    indexEl.innerHTML = "";

    if (!state.photos.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        "The film is still developing — add images in docs/portfolio/photos/ (see HANDLEIDING.md).";
      indexEl.appendChild(empty);
      return;
    }

    state.photos.forEach(function (entry, index) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "index-row";

      var num = document.createElement("span");
      num.className = "index-num";
      num.textContent = pad(index + 1);

      var title = document.createElement("span");
      title.className = "index-title";
      title.textContent = entry.photo.caption || entry.serie.title;

      var serie = document.createElement("span");
      serie.className = "index-serie";
      serie.textContent = entry.serie.title;

      row.appendChild(num);
      row.appendChild(title);
      row.appendChild(serie);

      row.addEventListener("mouseenter", function () {
        showPreview(entry.photo.src);
      });
      row.addEventListener("mouseleave", hidePreview);
      row.addEventListener("click", function () {
        hidePreview();
        openLightbox(index);
      });

      indexEl.appendChild(row);
    });
  }

  /* ---------- lightbox ---------- */

  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    lightboxEl.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    stopSlideshow();
    lightboxEl.classList.remove("is-open");
    document.body.style.overflow = "";
    state.lightboxIndex = -1;
  }

  function stepLightbox(delta) {
    var n = state.photos.length;
    state.lightboxIndex = (state.lightboxIndex + delta + n) % n;
    updateLightbox();
  }

  function preload(index) {
    var n = state.photos.length;
    if (!n) return;
    var entry = state.photos[((index % n) + n) % n];
    if (entry) new Image().src = entry.photo.src;
  }

  function updateLightbox() {
    var entry = state.photos[state.lightboxIndex];
    if (!entry) return;
    var img = lightboxEl.querySelector(".lightbox-stage img");
    img.src = entry.photo.src;
    img.alt = entry.photo.caption || entry.serie.title;
    lightboxEl.querySelector(".lightbox-caption").textContent =
      entry.photo.caption || entry.serie.title;
    lightboxEl.querySelector(".lightbox-counter").textContent =
      pad(state.lightboxIndex + 1) + " / " + pad(state.photos.length);
    preload(state.lightboxIndex + 1);
    preload(state.lightboxIndex - 1);
  }

  /* ---------- diavoorstelling ---------- */

  function startSlideshow() {
    var btn = lightboxEl.querySelector(".lightbox-play");
    state.slideshowTimer = window.setInterval(function () {
      stepLightbox(1);
    }, 3500);
    btn.textContent = "Pause";
    btn.classList.add("is-playing");
  }

  function stopSlideshow() {
    if (state.slideshowTimer) {
      window.clearInterval(state.slideshowTimer);
      state.slideshowTimer = null;
    }
    var btn = lightboxEl.querySelector(".lightbox-play");
    if (btn) {
      btn.textContent = "Play";
      btn.classList.remove("is-playing");
    }
  }

  function toggleSlideshow() {
    if (state.slideshowTimer) stopSlideshow();
    else startSlideshow();
  }

  function bindLightbox() {
    if (!lightboxEl) return;
    lightboxEl.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightboxEl.querySelector(".lightbox-arrow.prev").addEventListener("click", function () {
      stopSlideshow();
      stepLightbox(-1);
    });
    lightboxEl.querySelector(".lightbox-arrow.next").addEventListener("click", function () {
      stopSlideshow();
      stepLightbox(1);
    });
    var playBtn = lightboxEl.querySelector(".lightbox-play");
    if (playBtn) playBtn.addEventListener("click", toggleSlideshow);

    document.addEventListener("keydown", function (e) {
      if (!lightboxEl.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") { stopSlideshow(); stepLightbox(-1); }
      if (e.key === "ArrowRight") { stopSlideshow(); stepLightbox(1); }
      if (e.key === " ") { e.preventDefault(); toggleSlideshow(); }
    });

    // vegen op aanraakschermen
    var touchX = null;
    lightboxEl.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) touchX = e.touches[0].clientX;
    }, { passive: true });
    lightboxEl.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 45) return;
      stopSlideshow();
      stepLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- kopieerbescherming (instelbaar in config.json) ---------- */

  function bindProtection() {
    document.addEventListener("contextmenu", function (e) {
      if (state.protectImages && e.target && e.target.tagName === "IMG") {
        e.preventDefault();
      }
    });
  }

  /* ---------- terug naar boven ---------- */

  function bindFooter() {
    var topBtn = document.querySelector(".footer-top");
    if (topBtn) {
      topBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      });
    }
  }

  /* ---------- init ---------- */

  bindHeaderScroll();
  bindProtection();
  bindCursor();
  bindFooter();

  var configReady = fetchJson("config.json")
    .then(applyConfig)
    .catch(function () { return {}; });

  configReady.then(bindHero);

  if (gridEl) {
    bindLightbox();
    bindViewToggle();
    bindPreview();
    Promise.all([configReady, fetchJson("manifest.json")])
      .then(function (results) {
        var manifest = results[1];
        state.series = (manifest.series || []).filter(function (s) {
          return s.photos && s.photos.length;
        });
        state.activeSeries = seriesFromHash();
        renderSeriesNav();
        renderWork();
        window.addEventListener("hashchange", function () {
          setActiveSeries(seriesFromHash(), false);
        });
      })
      .catch(function () {
        renderWork();
      });
  }
})();
