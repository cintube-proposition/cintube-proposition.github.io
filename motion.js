/* Mouvement du site : défilement inertiel, parallaxe en couches sur chaque page,
   sol de points, révélations, chiffres, éventail. Tout respecte le mode réduit. */
window.MOTION = (function(){
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var coarse = !matchMedia('(hover: hover) and (pointer: fine)').matches;
var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };
var lenis = null;

/* ── Lenis + GSAP : un seul ticker ── */
function boot(){
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis && !coarse){
    lenis = new Lenis({ lerp:.09, wheelMultiplier:1, smoothWheel:true, syncTouch:false });
    window.__lenis = lenis;
    if (window.gsap){
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else { var tick = function(t){ lenis.raf(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  }
  try { history.scrollRestoration = 'manual'; } catch(e){}
  var ready = function(){ document.documentElement.classList.add('is-ready'); };
  requestAnimationFrame(function(){ requestAnimationFrame(ready); }); setTimeout(ready, 400);
  var top = document.getElementById('top');
  var nav = function(){ if (top) top.classList.toggle('solid', scrollY > 24); };
  addEventListener('scroll', nav, { passive:true }); nav();
}
function scrollTo(y){
  y = y || 0; window.scrollTo(0, y);
  if (lenis){ lenis.scrollTo(y, { immediate:true, force:true }); lenis.scrollTo(y, { immediate:true, force:true }); }
  window.scrollTo(0, y);
}
function scrollTop(){ scrollTo(0); }
function isDark(){ var t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function setTheme(dark){
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('ct-theme', dark ? 'dark' : 'light'); } catch(e){}
  dispatchEvent(new CustomEvent('themechange', { detail:{ dark:dark } }));
}

/* ── sol de points en perspective : houle lente, bosse sous le pointeur, onde au clic ── */
function waveMesh(host, opts){
  opts = opts || {};
  var canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
  var ctx = canvas.getContext('2d'); if (!ctx) return function(){ canvas.remove(); };
  var dpr = Math.min(devicePixelRatio || 1, 2), CAM = .62, NEAR = .35, FAR = 3.4;
  var W = 0, H = 0, cols = 0, rows = 0, f = 0, hz = 0, raf = 0, visible = true, last = 0, t0 = performance.now();
  var ptr = { x:0, z:1.4, s:0, tx:0, tz:1.4, ts:0 }, rings = [];
  var strength = opts.strength == null ? 1 : opts.strength;
  function rgb(){ return getComputedStyle(document.documentElement).getPropertyValue('--dot').trim() || '21,24,27'; }
  var dot = rgb();
  addEventListener('themechange', function(){ dot = rgb(); if (reduce) frame(3); });
  function resize(){
    var w = host.clientWidth, h = host.clientHeight; if (!w || !h || (w === W && h === H)) return;
    W = w; H = h; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f = Math.max(W, H * 1.2) * .55; hz = H * (opts.horizon || .34);
    cols = Math.round(clamp(W / 10, 48, 140)); rows = Math.round(clamp(H / 10, 40, 84));
  }
  var half = function(){ return (W / 2 / f) * FAR * 1.05; };
  function height(x, z, t){
    var y = .085 * Math.sin(x * 2.2 + t * .7) + .07 * Math.sin(z * 2.9 - t * .9 + x * .8) + .03 * Math.sin((x + z) * 6.1 + t * 1.6);
    if (ptr.s > .01){ var d2 = (x - ptr.x) * (x - ptr.x) + (z - ptr.z) * (z - ptr.z); y += .24 * ptr.s * Math.exp(-d2 / .07); }
    for (var i = 0; i < rings.length; i++){ var r = rings[i], age = t - r.t, d = Math.hypot(x - r.x, z - r.z), front = age * 1.15;
      y += .2 * Math.exp(-((d - front) * (d - front)) / .014) * Math.exp(-age * .75); }
    return y;
  }
  function frame(t){
    ctx.clearRect(0, 0, W, H);
    ptr.x += (ptr.tx - ptr.x) * .1; ptr.z += (ptr.tz - ptr.z) * .1; ptr.s += (ptr.ts - ptr.s) * .06;
    while (rings.length && t - rings[0].t > 5) rings.shift();
    var hw = half();
    for (var j = 0; j < rows; j++){
      var z = FAR * Math.pow(NEAR / FAR, j / (rows - 1)), fog = Math.pow(1 - (z - NEAR) / (FAR - NEAR), 1.25);
      var size = clamp(2.2 / z, .8, 3);
      ctx.fillStyle = 'rgba(' + dot + ',' + ((.06 + fog * .5) * strength).toFixed(3) + ')';
      for (var i = 0; i < cols; i++){
        var x = -hw + (i / (cols - 1)) * hw * 2, y = height(x, z, t), sx = W / 2 + (x / z) * f;
        if (sx < -4 || sx > W + 4) continue;
        var sy = hz + ((CAM - y) / z) * f;
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
    }
  }
  var now = function(){ return (performance.now() - t0) / 1000; };
  function loop(ms){
    if (!visible || document.hidden){ raf = 0; return; }
    raf = requestAnimationFrame(loop);
    if (coarse && ms - last < 30) return; last = ms;
    resize(); frame(now());
  }
  function wake(){ if (!reduce && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
  function ground(e){
    var r = host.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (sx < 0 || sy < 0 || sx > r.width || sy > r.height || sy <= hz + 4) return null;
    var z = clamp((CAM * f) / (sy - hz), NEAR, FAR); return { x:((sx - W / 2) * z) / f, z:z };
  }
  function onMove(e){ var g = ground(e); if (g){ ptr.tx = g.x; ptr.tz = g.z; if (ptr.s < .05){ ptr.x = g.x; ptr.z = g.z; } } ptr.ts = g ? 1 : 0; }
  function onDown(e){ var g = ground(e); if (g) rings.push({ x:g.x, z:g.z, t:now() }); }
  resize(); frame(reduce ? 3 : 0);
  var io = new IntersectionObserver(function(es){ visible = es[0].isIntersecting; wake(); }); io.observe(host);
  var ro = new ResizeObserver(function(){ resize(); if (reduce) frame(3); }); ro.observe(host);
  document.addEventListener('visibilitychange', wake);
  if (!reduce){ wake(); if (!coarse) addEventListener('pointermove', onMove, { passive:true }); addEventListener('pointerdown', onDown, { passive:true }); }
  return function(){ cancelAnimationFrame(raf); raf = 0; io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', wake);
    removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); canvas.remove(); };
}

/* ── parallaxe en couches : progression calculée à chaque défilement, mesures fraîches ── */
function parallax(root){
  var layersEl = root.querySelector('[data-plx-layers]'); if (!layersEl || reduce) return function(){};
  var narrow = matchMedia('(max-width: 900px)');
  var speeds = function(){ return narrow.matches ? { 1:60, 2:44, 3:10 } : { 1:70, 2:62, 3:14 }; };
  var layers = [].map.call(layersEl.querySelectorAll('[data-plx-layer]'), function(el){ return { el:el, pct:0, h:0 }; });
  var range = 1, last = -1;
  function measure(){ range = Math.max(1, layersEl.offsetHeight); var sp = speeds(); layers.forEach(function(l){ l.h = l.el.offsetHeight; l.pct = sp[l.el.dataset.plxLayer] || 0; }); last = -1; }
  function render(){ var p = clamp((scrollY || 0) / range, 0, 1); if (p === last) return; last = p;
    layers.forEach(function(l){ l.el.style.transform = 'translate3d(0,' + (l.h * l.pct / 100 * p).toFixed(2) + 'px,0)'; }); }
  measure(); render();
  var rz; var onRz = function(){ clearTimeout(rz); rz = setTimeout(function(){ measure(); render(); }, 100); };
  addEventListener('scroll', render, { passive:true }); addEventListener('resize', onRz);
  if (lenis) lenis.on('scroll', render);
  return function(){ removeEventListener('scroll', render); removeEventListener('resize', onRz); if (lenis) lenis.off('scroll', render); };
}


/* ── dérive : chaque élément marqué glisse à sa propre vitesse sur toute la page.
   k > 0 : plus lent que la page (arrière-plan) ; k < 0 : plus vite (avant-plan). ── */
function drift(root){
  var els = [].slice.call(root.querySelectorAll('[data-drift]')); if (!els.length || reduce) return function(){};
  var narrow = matchMedia('(max-width: 900px)'), items = [], vh = innerHeight;
  function measure(){
    vh = innerHeight; var f = narrow.matches ? .6 : 1;
    var KCOL = [.03, -.02, .02, -.03];
    items = els.map(function(el){ el.style.setProperty('--dy', '0px'); var r = el.getBoundingClientRect(), k;
      if (el.dataset.drift === 'col'){ /* vitesse par colonne réelle : les cartes d'une même colonne glissent ensemble */
        var lefts = []; [].forEach.call(el.parentNode.children, function(c){ var x = Math.round(c.getBoundingClientRect().left); if (lefts.indexOf(x) < 0) lefts.push(x); });
        lefts.sort(function(a, b){ return a - b; }); k = KCOL[lefts.indexOf(Math.round(r.left)) % 4] * f; }
      else k = (parseFloat(el.dataset.drift) || 0) * f;
      return { el:el, top:r.top + scrollY, h:r.height, k:k, last:null }; });
  }
  function render(){
    var y = scrollY, mid = vh / 2;
    for (var i = 0; i < items.length; i++){ var it = items[i], c = it.top + it.h / 2 - y;
      if (c < -vh || c > vh * 2){ continue; }
      var d = Math.round((mid - c) * it.k * 10) / 10;
      if (d !== it.last){ it.last = d; it.el.style.setProperty('--dy', d + 'px'); } }
  }
  var rz; var onRz = function(){ clearTimeout(rz); rz = setTimeout(function(){ measure(); render(); }, 120); };
  measure(); render();
  addEventListener('scroll', render, { passive:true }); addEventListener('resize', onRz); addEventListener('load', onRz);
  if (lenis) lenis.on('scroll', render);
  var t = setTimeout(function(){ measure(); render(); }, 700);
  return function(){ clearTimeout(t); removeEventListener('scroll', render); removeEventListener('resize', onRz); removeEventListener('load', onRz); if (lenis) lenis.off('scroll', render); };
}

/* ── révélations : une seule fois, en entrant ── */
function reveals(root){
  var els = root.querySelectorAll('.rv'); if (!els.length) return function(){};
  if (reduce){ els.forEach(function(e){ e.classList.add('in'); }); return function(){}; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin:'0px 0px -8% 0px', threshold:.05 });
  els.forEach(function(e, i){ e.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms'; io.observe(e); });
  return function(){ io.disconnect(); };
}

/* ── chiffres : mots qui s'allument, nombres qui comptent, profil qui se trace ── */
function stats(root){
  var sec = root.querySelector('.stats'); if (!sec || !window.gsap) return function(){};
  var txt = sec.querySelector('.stats__text'), words = txt ? txt.querySelectorAll('.w') : [];
  var trigs = [];
  if (words.length && !reduce){
    var st = ScrollTrigger.create({ trigger:txt, start:'top 80%', end:'bottom 45%', scrub:.3, onUpdate:function(self){
      var n = Math.round(self.progress * words.length); words.forEach(function(w, i){ w.classList.toggle('on', i < n); }); } });
    trigs.push(st);
  } else words.forEach(function(w){ w.classList.add('on'); });
  sec.querySelectorAll('.num b[data-n]').forEach(function(b){
    var end = +b.dataset.n, suf = b.dataset.suf || '', pre = b.dataset.pre || '', fmt = function(v){ return pre + Math.round(v).toLocaleString(document.documentElement.lang.slice(0, 2) === 'fr' ? 'fr-CA' : 'en-CA').replace(/ /g, ' ') + suf; };
    if (reduce){ b.textContent = fmt(end); return; }
    var o = { v:0 }; b.textContent = fmt(0);
    trigs.push(ScrollTrigger.create({ trigger:b, start:'top 88%', once:true, onEnter:function(){ gsap.to(o, { v:end, duration:1.6, ease:'power3.out', onUpdate:function(){ b.textContent = fmt(o.v); } }); } }));
  });
  var prof = sec.querySelector('.profile');
  if (prof){ var paths = prof.querySelectorAll('.p');
    if (reduce){ paths.forEach(function(p){ p.style.strokeDashoffset = 0; }); prof.classList.add('in'); }
    else { var tl = gsap.timeline({ scrollTrigger:{ trigger:prof, start:'top 90%', end:'bottom 45%', scrub:.4, onEnter:function(){ prof.classList.add('in'); } } });
      tl.to(paths, { strokeDashoffset:0, duration:1, ease:'none', stagger:.12 }); trigs.push(tl.scrollTrigger); } }
  return function(){ trigs.forEach(function(t){ t.kill(); }); };
}

/* ── éventail de cartes : la carte du centre se redresse, flèches, points, glissement ── */
function fan(root){
  var el = root.querySelector('.fan'); if (!el) return function(){};
  var cards = [].slice.call(el.querySelectorAll('.fan__card')), n = cards.length, cur = Math.floor((n - 1) / 2);
  var dots = root.querySelectorAll('.fan__dots button'), prev = root.querySelector('[data-fan="prev"]'), next = root.querySelector('[data-fan="next"]');
  function lay(){
    var narrow = innerWidth < 700, spread = narrow ? 11 : 13, shift = narrow ? 44 : 70;
    cards.forEach(function(c, i){
      var d = i - cur, a = d * spread, x = d * shift, y = Math.abs(d) * 14, s = d === 0 ? 1 : 1 - Math.abs(d) * .05;
      c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + a + 'deg) scale(' + s + ')';
      c.style.zIndex = String(n - Math.abs(d)); c.style.opacity = Math.abs(d) > 3 ? 0 : 1;
      c.classList.toggle('is-active', d === 0); c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true'); c.tabIndex = d === 0 ? 0 : -1;
    });
    dots.forEach(function(b, i){ b.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
  }
  function go(k){ cur = (k + n) % n; lay(); }
  var onPrev = function(){ go(cur - 1); }, onNext = function(){ go(cur + 1); };
  if (prev) prev.addEventListener('click', onPrev); if (next) next.addEventListener('click', onNext);
  dots.forEach(function(b, i){ b.addEventListener('click', function(){ go(i); }); });
  var onCard = function(e){ var c = e.target.closest('.fan__card'); if (!c) return; var i = cards.indexOf(c); if (i !== cur){ e.preventDefault(); go(i); } };
  el.addEventListener('click', onCard);
  var sx = 0; var ts = function(e){ sx = e.touches[0].clientX; }, te = function(e){ var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); };
  el.addEventListener('touchstart', ts, { passive:true }); el.addEventListener('touchend', te, { passive:true });
  var onKey = function(e){ if (e.key === 'ArrowLeft') onPrev(); if (e.key === 'ArrowRight') onNext(); };
  el.addEventListener('keydown', onKey);
  addEventListener('resize', lay); lay();
  return function(){ removeEventListener('resize', lay); };
}

/* ── une page : tout brancher, tout rendre ── */
function page(root){
  var stops = [];
  root.querySelectorAll('.plx').forEach(function(p){ stops.push(parallax(p)); });
  root.querySelectorAll('[data-mesh]').forEach(function(m){ stops.push(waveMesh(m, { strength:+m.dataset.mesh || 1 })); });
  stops.push(reveals(root), stats(root), fan(root), drift(root));
  if (window.ScrollTrigger) ScrollTrigger.refresh();
  return function(){ stops.forEach(function(f){ try { f(); } catch(e){} }); };
}
return { boot:boot, page:page, scrollTop:scrollTop, scrollTo:scrollTo, isDark:isDark, setTheme:setTheme, reduce:reduce };
})();
