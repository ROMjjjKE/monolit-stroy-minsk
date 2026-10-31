/* МОНОЛИТ — взаимодействия: скролл-сцена с видео, появления, счётчики, форма. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var html = document.documentElement;
  if (reduce.matches) html.classList.add('no-motion');

  /* ---------- 1. Появления блоков ---------- */
  var revealItems = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealItems.forEach(function (el, i) {
      el.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1) ' + (i % 4) * 50 + 'ms, transform .8s cubic-bezier(.16,1,.3,1) ' + (i % 4) * 50 + 'ms';
      io.observe(el);
    });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 2. Хедер прилипает ---------- */
  var hdr = document.getElementById('hdr');
  var onScrollHdr = function () {
    hdr.classList.toggle('is-stuck', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScrollHdr, { passive: true });
  onScrollHdr();

  /* ---------- 3. Счётчики метрик ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  var animateCount = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    var t0 = null, dur = 900;
    var tick = function (ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window && !reduce.matches) {
    var ioC = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        ioC.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { ioC.observe(c); });
  }

  /* ---------- 4. Скролл-сцена: видео-скраб по прокрутке ---------- */
  var stage = document.getElementById('stage');
  var vid = document.getElementById('buildVideo');
  var bar = document.getElementById('stageBar');
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var videoReady = false;
  var lastSeek = 0;

  var setProgress = function (p) {
    p = Math.max(0, Math.min(1, p));
    if (bar) bar.style.width = (p * 100).toFixed(2) + '%';

    var active = Math.min(steps.length - 1, Math.floor(p * steps.length + 0.0001));
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i === active); });

    if (!videoReady || reduce.matches) return;
    var t = p * (vid.duration || 0);
    if (Math.abs(t - lastSeek) < 0.033) return;   // не дёргаем декодер зря
    lastSeek = t;
    try { vid.currentTime = t; } catch (err) { /* ещё не готов */ }
  };

  var seekTo0 = function () {
    try { vid.currentTime = 0.001; } catch (e) {}
  };

  if (vid) {
    var markReady = function () {
      videoReady = true;
      vid.pause();
    };
    if (vid.readyState >= 2) markReady();
    vid.addEventListener('loadeddata', markReady, { once: true });
    vid.addEventListener('canplay', markReady, { once: true });

    // iOS/Safari: без пользовательского жеста видео иногда не буферизуется для seek
    var prime = function () {
      if (!vid.paused) return;
      var p = vid.play();
      if (p && p.then) p.then(function () { vid.pause(); }).catch(function () {});
      document.removeEventListener('touchstart', prime);
      document.removeEventListener('click', prime);
    };
    document.addEventListener('touchstart', prime, { passive: true, once: true });
    document.addEventListener('click', prime, { once: true });
  }

  // Пин-сцена на десктопе, обычный скролл на мобиле
  var wide = window.matchMedia('(min-width: 721px)');
  var st = null;

  var buildStage = function () {
    if (!stage || reduce.matches) { setProgress(0); return; }
    if (window.gsap && window.ScrollTrigger && wide.matches) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      st = window.ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: '+=180%',
        pin: '.stage__pin',
        pinSpacing: true,
        scrub: 0.6,
        onUpdate: function (self) { setProgress(self.progress); }
      });
      setProgress(0);
      return;
    }
    // Фолбэк без GSAP: прогресс считаем от положения секции в окне
    var fallback = function () {
      var r = stage.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.2;
      var p = total > 0 ? (0 - r.top) / total : 0;
      setProgress(p);
    };
    window.addEventListener('scroll', fallback, { passive: true });
    window.addEventListener('resize', fallback);
    fallback();
  };

  buildStage();

  wide.addEventListener('change', function () {
    if (st) { st.kill(true); st = null; }
    buildStage();
  });

  seekTo0();

  /* ---------- 5. Форма (демо) ---------- */
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

  /* ---------- 6. Плавное появление видео ---------- */
  if (vid) {
    vid.style.opacity = '0';
    vid.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1)';
    var show = function () { vid.style.opacity = '1'; };
    if (vid.readyState >= 2) show();
    else vid.addEventListener('loadeddata', show, { once: true });
  }
})();
