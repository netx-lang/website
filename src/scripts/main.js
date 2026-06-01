/* ==========================================================================
   NetX homepage — interactivity
   (Syntax highlighting is done at build time by Shiki; see src/shiki.)
   ========================================================================== */
(function () {
  "use strict";

  /* Tabs (each [data-tabs] group is independent) */
  document.querySelectorAll("[data-tabs]").forEach(function (tabsRoot) {
    var buttons = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tabpanel"]'));
    var active = 0;
    var stopAuto = function () {}; /* replaced below when autoplay is enabled */

    function show(i) {
      active = (i + buttons.length) % buttons.length;
      var name = buttons[active].getAttribute("data-tab");
      buttons.forEach(function (b, n) {
        b.setAttribute("aria-selected", n === active ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== name;
      });
    }

    function showName(name) {
      buttons.forEach(function (b, n) {
        if (b.getAttribute("data-tab") === name) show(n);
      });
    }

    var initial = decodeURIComponent((window.location.hash || "").replace("#", ""));
    if (initial && buttons.some(function (b) { return b.getAttribute("data-tab") === initial; })) {
      showName(initial);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var name = b.getAttribute("data-tab");
        showName(name);
        stopAuto();
        try {
          if (history.replaceState) history.replaceState(null, "", "#" + name);
        } catch (err) { /* file:// or sandboxed contexts may disallow this */ }
      });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var i = buttons.indexOf(b);
        var next = e.key === "ArrowRight"
          ? (i + 1) % buttons.length
          : (i - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
        show(next);
        stopAuto();
        e.preventDefault();
      });
    });

    /* Autoplay: opt-in via data-autoplay="<ms>". It runs one full cycle, pauses
       on hover/focus, only runs while the tab strip is on screen, and stops for
       good as soon as the reader picks a tab. */
    var delay = parseInt(tabsRoot.getAttribute("data-autoplay"), 10);
    if (!(delay > 0)) return;

    var toggle = tabsRoot.querySelector("[data-autoplay-toggle]");
    var strip = tabsRoot.querySelector(".tablist") || tabsRoot;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;
    var left = buttons.length;      /* advances until the cycle is back at the start */
    var playing = !reduceMotion;
    var inView = false;
    var hovered = false;
    var focused = false;

    function render() {
      if (!toggle) return;
      var paused = !playing;
      toggle.dataset.state = paused ? "paused" : "playing";
      var label = paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause;
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
    }

    function clear() {
      if (timer) { clearTimeout(timer); timer = null; }
    }

    function schedule() {
      clear();
      if (!playing || !inView || hovered || focused || document.hidden || left <= 0) return;
      timer = setTimeout(function () {
        left -= 1;
        show(active + 1);
        if (left <= 0) playing = false;   /* one full cycle, then stop */
        render();
        schedule();
      }, delay);
    }

    stopAuto = function () {
      playing = false;
      left = 0;
      clear();
      render();
    };

    if (toggle) {
      toggle.addEventListener("click", function () {
        if (playing) { stopAuto(); return; }
        playing = true;
        left = buttons.length;
        render();
        schedule();
      });
    }

    tabsRoot.addEventListener("mouseenter", function () { hovered = true; clear(); });
    tabsRoot.addEventListener("mouseleave", function () { hovered = false; schedule(); });
    tabsRoot.addEventListener("focusin", function () { focused = true; clear(); });
    tabsRoot.addEventListener("focusout", function () { focused = false; schedule(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clear(); else schedule();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { inView = e.intersectionRatio >= 0.5; });
        schedule();
      }, { threshold: [0, 0.5, 1] }).observe(strip);
    } else {
      inView = true;
      schedule();
    }

    render();
  });

  /* Docs sidebar: section toggles + scroll spy */
  var docsSidebar = document.querySelector(".docs-sidebar");
  if (docsSidebar) {
    docsSidebar.querySelectorAll(".docs-nav-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", expanded ? "false" : "true");
        var list = document.getElementById(btn.getAttribute("aria-controls"));
        if (list) list.hidden = expanded;
      });
    });

    var currentSub = docsSidebar.querySelector(".docs-nav-sub:not([hidden])");
    if (currentSub) {
      var subLinks = {};
      currentSub.querySelectorAll('a[href*="#"]').forEach(function (a) {
        var id = decodeURIComponent((a.getAttribute("href").split("#")[1] || ""));
        if (id) subLinks[id] = a;
      });
      var subHeads = Object.keys(subLinks)
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
      var marked = null;

      function mark(id) {
        if (id === marked) return;
        marked = id;
        currentSub.querySelectorAll("a").forEach(function (a) { a.classList.remove("current"); });
        if (subLinks[id]) subLinks[id].classList.add("current");
      }

      function spy() {
        if (!subHeads.length) return;
        var best = subHeads[0].id;
        for (var i = 0; i < subHeads.length; i++) {
          if (subHeads[i].getBoundingClientRect().top <= 100) best = subHeads[i].id;
        }
        mark(best);
      }

      window.addEventListener("scroll", spy, { passive: true });
      window.addEventListener("hashchange", spy);
      spy();
    }
  }

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Language dropdown: close when clicking outside */
  document.addEventListener("click", function (e) {
    document.querySelectorAll("details.lang-menu[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });

  /* Header shadow on scroll */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Reveal on scroll */
  var selectors = [".feature"];
  var targets = document.querySelectorAll(selectors.join(","));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduce && "IntersectionObserver" in window) {
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Footer year */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
