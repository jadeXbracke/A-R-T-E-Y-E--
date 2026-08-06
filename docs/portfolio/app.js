/* Portfolio: laadt manifest.json + config.json en rendert raster, filters en lightbox. */
(function () {
  "use strict";

  var state = {
    series: [],
    activeSeries: "alles",
    photos: [], // platte lijst van de zichtbare foto's, voor de lightbox
    lightboxIndex: -1,
    slideshowTimer: null,
    protectImages: true,
  };

  var gridEl = document.querySelector(".grid");
  var seriesNavEl = document.querySelector(".series-nav");
  var lightboxEl = document.querySelector(".lightbox");
  var headerEl = document.querySelector(".site-header");

  function fetchJson(url) {
    return fetch(url + "?t=" + Date.now()).then(function (res) {
      if (!res.ok) throw new Error(url + ": " + res.status);
      return res.json();
    });
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
      lastY = y;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    }, { passive: true });
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
        el.textContent = "Instagram — @" + handle;
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
    if (config.naam) {
      document.title = document.title.replace("Jade Bracke", config.naam);
    }
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
        history.replaceState(null, "", "#serie=" + encodeURIComponent(slug));
      }
    }
    renderSeriesNav();
    renderGrid();
  }

  function seriesFromHash() {
    var match = location.hash.match(/serie=([^&]+)/);
    if (!match) return "alles";
    var slug = decodeURIComponent(match[1]);
    return state.series.some(function (s) { return s.slug === slug; }) ? slug : "alles";
  }

  function renderSeriesNav() {
    if (!seriesNavEl) return;
    seriesNavEl.innerHTML = "";
    if (state.series.length < 2) return;

    var items = [{ slug: "alles", title: "Alles" }].concat(state.series);
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

  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    state.photos = visiblePhotos();

    if (!state.photos.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        "Nog geen foto's — voeg afbeeldingen toe in docs/portfolio/photos/ (zie HANDLEIDING.md).";
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

      if (entry.photo.caption) {
        var cap = document.createElement("figcaption");
        cap.textContent = entry.photo.caption;
        figure.appendChild(cap);
      }

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
      state.lightboxIndex + 1 + " / " + state.photos.length;
    preload(state.lightboxIndex + 1);
    preload(state.lightboxIndex - 1);
  }

  /* ---------- diavoorstelling ---------- */

  function startSlideshow() {
    var btn = lightboxEl.querySelector(".lightbox-play");
    state.slideshowTimer = window.setInterval(function () {
      stepLightbox(1);
    }, 3500);
    btn.textContent = "Pauze";
    btn.classList.add("is-playing");
  }

  function stopSlideshow() {
    if (state.slideshowTimer) {
      window.clearInterval(state.slideshowTimer);
      state.slideshowTimer = null;
    }
    var btn = lightboxEl.querySelector(".lightbox-play");
    if (btn) {
      btn.textContent = "Afspelen";
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

  /* ---------- init ---------- */

  bindHeaderScroll();
  bindProtection();

  var configReady = fetchJson("config.json").then(applyConfig).catch(function () {});

  if (gridEl) {
    bindLightbox();
    Promise.all([configReady, fetchJson("manifest.json")])
      .then(function (results) {
        var manifest = results[1];
        state.series = (manifest.series || []).filter(function (s) {
          return s.photos && s.photos.length;
        });
        state.activeSeries = seriesFromHash();
        renderSeriesNav();
        renderGrid();
        window.addEventListener("hashchange", function () {
          setActiveSeries(seriesFromHash(), false);
        });
      })
      .catch(function () {
        renderGrid();
      });
  }
})();
