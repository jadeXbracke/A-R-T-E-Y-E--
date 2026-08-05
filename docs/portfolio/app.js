/* Portfolio: laadt manifest.json + config.json en rendert raster, filters en lightbox. */
(function () {
  "use strict";

  var state = {
    series: [],
    activeSeries: "alles",
    photos: [], // platte lijst van de zichtbare foto's, voor de lightbox
    lightboxIndex: -1,
  };

  var gridEl = document.querySelector(".grid");
  var seriesNavEl = document.querySelector(".series-nav");
  var lightboxEl = document.querySelector(".lightbox");

  function fetchJson(url) {
    return fetch(url + "?t=" + Date.now()).then(function (res) {
      if (!res.ok) throw new Error(url + ": " + res.status);
      return res.json();
    });
  }

  /* ---------- config (naam, contact) ---------- */

  function applyConfig(config) {
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
        state.activeSeries = item.slug;
        renderSeriesNav();
        renderGrid();
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
    lightboxEl.classList.remove("is-open");
    document.body.style.overflow = "";
    state.lightboxIndex = -1;
  }

  function stepLightbox(delta) {
    var n = state.photos.length;
    state.lightboxIndex = (state.lightboxIndex + delta + n) % n;
    updateLightbox();
  }

  function updateLightbox() {
    var entry = state.photos[state.lightboxIndex];
    if (!entry) return;
    lightboxEl.querySelector(".lightbox-stage img").src = entry.photo.src;
    lightboxEl.querySelector(".lightbox-caption").textContent =
      entry.photo.caption || entry.serie.title;
    lightboxEl.querySelector(".lightbox-counter").textContent =
      state.lightboxIndex + 1 + " / " + state.photos.length;
  }

  function bindLightbox() {
    if (!lightboxEl) return;
    lightboxEl.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightboxEl.querySelector(".lightbox-arrow.prev").addEventListener("click", function () {
      stepLightbox(-1);
    });
    lightboxEl.querySelector(".lightbox-arrow.next").addEventListener("click", function () {
      stepLightbox(1);
    });
    document.addEventListener("keydown", function (e) {
      if (!lightboxEl.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  /* ---------- init ---------- */

  fetchJson("config.json").then(applyConfig).catch(function () {});

  if (gridEl) {
    bindLightbox();
    fetchJson("manifest.json")
      .then(function (manifest) {
        state.series = (manifest.series || []).filter(function (s) {
          return s.photos && s.photos.length;
        });
        renderSeriesNav();
        renderGrid();
      })
      .catch(function () {
        renderGrid();
      });
  }
})();
