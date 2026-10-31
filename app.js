/* МОНОЛИТ — интерфейс: появления, счётчики, этапы 3D-сцены, форма. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) document.documentElement.classList.add('no-motion');

  /* ---------- появления ---------- */
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1) ' + (i % 4) * 50 + 'ms, transform .8s cubic-bezier(.16,1,.3,1) ' + (i % 4) * 50 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- хедер ---------- */
  var hdr = document.getElementById('hdr');
  var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- счётчики ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length && 'IntersectionObserver' in window && !reduce.matches) {
    var ioC = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var to = parseInt(el.getAttribute('data-count'), 10) || 0;
        var t0 = null;
        var tick = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / 900);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        ioC.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { ioC.observe(c); });
  }

  /* ---------- этапы 3D-сцены ---------- */
  var bar = document.getElementById('stageBar');
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var heroText = document.querySelector('.stage__hero');

  window.__onSceneProgress = function (p) {
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';

    var idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 1.0001));
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i === idx); });

    // заголовок уступает место стройке: мягко уходит после 1/3 сцены
    if (heroText) {
      var k = Math.max(0, Math.min(1, (p - 0.16) / 0.2));
      heroText.style.opacity = String(1 - k);
      heroText.style.transform = 'translateY(' + (-14 * k).toFixed(1) + 'px)';
      heroText.style.pointerEvents = k > 0.5 ? 'none' : 'auto';
    }
  };

  /* ---------- форма (демо) ---------- */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var ok = true;
      [name, phone].forEach(function (f) {
        if (!f.value.trim()) { f.style.borderBottomColor = '#BE603A'; ok = false; }
        else { f.style.borderBottomColor = ''; }
      });
      if (!ok) return;
      document.getElementById('formOk').hidden = false;
      form.reset();
    });
  }
})();
