/* Les pièces en 3D : une par procédé, construites en géométrie, aucun modèle chargé.
   Lentes, et faites pour montrer comment la pièce est fabriquée. Au doigt ou à la
   souris, la pièce se tourne ; le thème change la lumière du studio. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const STILL = /[?&]still=1/.test(location.search);
const reduce = STILL || matchMedia('(prefers-reduced-motion: reduce)').matches;
const GL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!GL) document.documentElement.classList.add('no-gl');
const isDark = () => (window.MOTION ? window.MOTION.isDark() : matchMedia('(prefers-color-scheme: dark)').matches);

const STEEL = new THREE.MeshStandardMaterial({ color:0xd9dde0, metalness:1, roughness:.28 });
const STEEL2 = new THREE.MeshStandardMaterial({ color:0xd9dde0, metalness:1, roughness:.3, side:THREE.DoubleSide });
const DIE = new THREE.MeshStandardMaterial({ color:0x9aa1a7, metalness:.95, roughness:.38 });
const DARK = new THREE.MeshStandardMaterial({ color:0x3b4248, metalness:.9, roughness:.4 });
const INK = new THREE.LineBasicMaterial({ color:0x15181b });
const PI = Math.PI;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

class BendPath extends THREE.Curve {
  constructor(R, a, feed, lead){ super(); this.R = R; this.a = a; this.feed = feed; this.lead = lead; }
  getPoint(t, out = new THREE.Vector3()){
    const R = this.R, a = Math.max(this.a, 1e-4), arc = R * a, L = this.feed + arc + this.lead, s = t * L;
    if (s <= this.feed) return out.set(-this.feed + s, -R, 0);
    if (s <= this.feed + arc){ const th = (s - this.feed) / R; return out.set(R * Math.sin(th), -R * Math.cos(th), 0); }
    const u = s - this.feed - arc;
    return out.set(R * Math.sin(a) + u * Math.cos(a), -R * Math.cos(a) + u * Math.sin(a), 0);
  }
}
function trace(x, y){
  const p = [new THREE.Vector2(x, y)];
  const t = {
    l(x2, y2, n = 6){ const a = p[p.length - 1]; for (let i = 1; i <= n; i++) p.push(new THREE.Vector2(a.x + (x2 - a.x) * i / n, a.y + (y2 - a.y) * i / n)); return t; },
    a(cx, cy, r, a0, a1, n = 18){ for (let i = 1; i <= n; i++){ const th = a0 + (a1 - a0) * i / n; p.push(new THREE.Vector2(cx + r * Math.cos(th), cy + r * Math.sin(th))); } return t; },
    pts: p
  };
  return t;
}
const curve = pts3 => new THREE.CatmullRomCurve3(pts3, false, 'catmullrom', 0);
function centered(inner){
  const g = new THREE.Group(); g.add(inner);
  const box = new THREE.Box3().setFromObject(inner);
  inner.position.sub(box.getCenter(new THREE.Vector3()));
  const sz = box.getSize(new THREE.Vector3());
  return { g, r:sz.length() / 2, size:sz, floor:-sz.y / 2 - .04, drag:0 };
}
const turn = (p, k = .00016) => now => { p.g.rotation.y = (p.base || 0) + p.drag + (reduce ? .5 : now * k); };
const sway = (p, amp = .5) => now => { p.g.rotation.y = (p.base || 0) + p.drag + (reduce ? 0 : Math.sin(now * .00028) * amp); };

function bender(el, opts){
  const R = 1.25, r = .2, TOTAL = 7.2, rig = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(R - r, R - r, r * 2.1, 96), DIE); core.rotation.x = PI / 2; rig.add(core);
  [-1, 1].forEach(sd => { const fl = new THREE.Mesh(new THREE.CylinderGeometry(R + r * .45, R + r * .45, r * .55, 96), DIE); fl.rotation.x = PI / 2; fl.position.z = sd * r * 1.32; rig.add(fl); });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, r * 3.4, 48), DARK); hub.rotation.x = PI / 2; rig.add(hub);
  [.62, .86].forEach(rr => [-1, 1].forEach(sd => { const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, .012, 8, 120), DARK); ring.position.z = sd * (r * 1.32 + r * .275 + .002); rig.add(ring); }));
  let tube, arc;
  function setAngle(a){
    const lead = 1.6, g = new THREE.TubeGeometry(new BendPath(R, a, TOTAL - lead - R * a, lead), 160, r, 32, false);
    if (tube){ tube.geometry.dispose(); tube.geometry = g; } else { tube = new THREE.Mesh(g, STEEL); rig.add(tube); }
    const pts = []; for (let i = 0; i <= 40; i++){ const th = a * i / 40; pts.push(new THREE.Vector3(Math.sin(th) * (R + .55), -Math.cos(th) * (R + .55), r * 1.4)); }
    const ag = new THREE.BufferGeometry().setFromPoints(pts);
    if (arc){ arc.geometry.dispose(); arc.geometry = ag; } else { arc = new THREE.Line(ag, INK); rig.add(arc); }
  }
  rig.rotation.set(-.32, -.78, 0);
  setAngle(PI / 2);
  const p = centered(rig);
  let a = reduce ? PI / 2 : 0; setAngle(a);
  const dim = el.querySelector('.dim'); if (dim) dim.hidden = false;
  const tmp = new THREE.Vector3();
  p.label = { el:dim, at(){ const m = a / 2; return rig.localToWorld(tmp.set(Math.sin(m) * (R + .95), -Math.cos(m) * (R + .95), r * 1.4)); }, text(){ return Math.round(a * 180 / PI) + '°'; } };
  p.px = p.py = p.tx = p.ty = 0;
  p.tick = now => {
    if (!reduce){
      const k = now - p.t0 - 500; let na;
      if (!opts.loop) na = easeOut(Math.min(Math.max(k / 3600, 0), 1)) * PI / 2;
      else { const c = ((k % 9200) + 9200) % 9200; na = c < 3600 ? easeOut(c / 3600) * PI / 2 : c < 6200 ? PI / 2 : c < 8200 ? (1 - easeInOut((c - 6200) / 2000)) * PI / 2 : 0; }
      if (Math.abs(na - a) > 1e-4){ a = na; setAngle(a); }
    }
    if (opts.parallax){ p.px += (p.tx - p.px) * .04; p.py += (p.ty - p.py) * .04; }
    p.g.rotation.y = p.px * .18 + p.drag; p.g.rotation.x = p.py * .08;
  };
  return p;
}
function beam(){
  const w = .7, h = .9, tf = .12, tw = .1;
  const shape = swap => { const s = new THREE.Shape(), P = (x, y) => swap ? [y, x] : [x, y];
    const pts = [[-w/2,-h/2],[w/2,-h/2],[w/2,-h/2+tf],[tw/2,-h/2+tf],[tw/2,h/2-tf],[w/2,h/2-tf],[w/2,h/2],[-w/2,h/2],[-w/2,h/2-tf],[-tw/2,h/2-tf],[-tw/2,-h/2+tf],[-w/2,-h/2+tf]].map(q => P(q[0], q[1]));
    s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => s.lineTo(q[0], q[1])); s.closePath(); return s; };
  const path = curve(Array.from({ length:30 }, (_, i) => { const th = -.75 + 1.5 * i / 29; return new THREE.Vector3(Math.sin(th) * 4.2, Math.cos(th) * 4.2 - 2.6, 0); }));
  const ways = [false, true].map(sw => new THREE.Mesh(new THREE.ExtrudeGeometry(shape(sw), { steps:160, bevelEnabled:false, extrudePath:path }), STEEL));
  const inner = new THREE.Group(); ways.forEach(m => inner.add(m)); ways[1].visible = false;
  const p = centered(inner); p.base = -.85; p.el = .38; p.way = 0; p.ts = 0;
  p.setWay = k => { p.way = k; ways.forEach((m, i) => m.visible = i === k); p.ts = performance.now(); };
  p.tick = now => { sway(p, .3)(now); const s = reduce ? 1 : .9 + .1 * easeOut(Math.min((now - p.ts) / 900, 1)); p.g.scale.setScalar(s); };
  return p;
}
function helix(){
  class H extends THREE.Curve { getPoint(t, o = new THREE.Vector3()){ const th = t * PI * 2 * 5.5; return o.set(Math.cos(th) * 1.25, -1.6 + t * 3.4, Math.sin(th) * 1.25); } }
  const p = centered(new THREE.Mesh(new THREE.TubeGeometry(new H(), 900, .14, 24), STEEL)); p.tick = turn(p); return p;
}
function endForm(){
  const ro = .55, wall = .08, n = 150, y0 = -2.4, y1 = 2.2, out = [], inn = [];
  const flare = y => y > 1.4 ? Math.pow((y - 1.4) / .8, 2) * .45 : 0;
  for (let i = 0; i <= n; i++){ const y = y0 + (y1 - y0) * i / n; const thr = y < -1.25 ? .05 * (1 - Math.abs(((y * 11) % 1 + 1) % 1 * 2 - 1)) : 0;
    out.push(new THREE.Vector2(ro + flare(y) + thr, y)); inn.push(new THREE.Vector2(ro - wall + flare(y), y)); }
  const prof = out.concat(inn.reverse()); prof.push(out[0].clone());
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), STEEL2); m.rotation.z = -PI / 2.6;
  const p = centered(m); p.tick = turn(p, .00014); return p;
}
function boiler(){
  const t = trace(.4, 2.8).l(2, 2.8).a(2, 2.4, .4, PI / 2, 0).l(2.4, 1.4).a(2.8, 1.4, .4, PI, PI * 1.5).l(4.2, 1).a(4.2, 1.4, .4, -PI / 2, 0).l(4.6, 3);
  const pts = t.pts.map(v => new THREE.Vector3(v.x - 2.5, 0, v.y - 2));
  const inner = new THREE.Group(), R = .11;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve(pts), 400, R, 24), STEEL); inner.add(tube);
  const g = []; for (let x = -2.8; x <= 2.81; x += .4) g.push(x, 0, -1.6, x, 0, 1.6); for (let z = -1.6; z <= 1.61; z += .4) g.push(-2.8, 0, z, 2.8, 0, z);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(g, 3));
  inner.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color:0x15181b, transparent:true, opacity:.14 })));
  const lay = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(v => new THREE.Vector3(v.x, .004, v.z))), new THREE.LineDashedMaterial({ color:0x15181b, dashSize:.12, gapSize:.07 }));
  lay.computeLineDistances(); inner.add(lay);
  const p = centered(inner); p.el = .95; p.floor = -.05;
  p.tick = now => { const k = reduce ? 1 : easeOut(Math.min(Math.max((now - p.t0 - 400) / 2800, 0), 1)); tube.position.y = R + (1 - k) * 1.3; p.g.rotation.y = .3 + p.drag + (reduce ? 0 : Math.sin(now * .00022) * .25); };
  return p;
}
function panel(){
  const inner = new THREE.Group(), n = 7, s = .38, r = .14, H = 3.6;
  for (let i = 0; i < n; i++){ const x = (i - (n - 1) / 2) * s;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 32, 1, true), STEEL2); c.position.x = x; inner.add(c);
    if (i < n - 1){ const b = new THREE.Mesh(new THREE.BoxGeometry(s - r * 1.6, H, .05), STEEL); b.position.x = x + s / 2; inner.add(b); } }
  const p = centered(inner); p.base = -.6; p.tick = sway(p, .55); return p;
}
function pressure(){
  const inner = new THREE.Group();
  [-2.4, 2.4].forEach(x => { const h = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, 3.2, 40), DIE); h.position.x = x; inner.add(h); });
  const t = trace(-2.2, 1.2).l(1.7, 1.2, 10).a(1.7, .9, .3, PI / 2, -PI / 2).l(-1.7, .6, 10).a(-1.7, .3, .3, PI / 2, PI * 1.5).l(1.7, 0, 10).a(1.7, -.3, .3, PI / 2, -PI / 2).l(-1.7, -.6, 10).a(-1.7, -.9, .3, PI / 2, PI * 1.5).l(2.2, -1.2, 10);
  inner.add(new THREE.Mesh(new THREE.TubeGeometry(curve(t.pts.map(v => new THREE.Vector3(v.x, v.y, 0))), 600, .075, 20), STEEL));
  const p = centered(inner); p.base = -.4; p.tick = sway(p, .5); return p;
}
function fab(){
  const R = 1.4, lead = 1.6, feed = 2, inner = new THREE.Group();
  inner.add(new THREE.Mesh(new THREE.TubeGeometry(new BendPath(R, PI / 2, feed, lead), 200, .22, 32), STEEL));
  const flange = (pos, rotZ) => { const f = new THREE.Group(); f.add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .1, 64), DIE));
    for (let i = 0; i < 8; i++){ const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .18, 12), DARK); const th = i / 8 * PI * 2; b.position.set(Math.cos(th) * .38, 0, Math.sin(th) * .38); f.add(b); }
    f.position.copy(pos); f.rotation.z = rotZ; inner.add(f); };
  flange(new THREE.Vector3(-feed, -R, 0), PI / 2); flange(new THREE.Vector3(R, lead, 0), 0);
  const p = centered(inner); p.base = -.5; p.tick = sway(p, .6); return p;
}
const B = { 'roulage-de-charpente':beam, 'serpentins':helix, 'formage-de-bout':endForm, 'tubes-de-chaudiere':boiler, 'panneaux-de-tubes':panel, 'appareils-sous-pression':pressure, 'fabrication-sur-mesure':fab };
const build = (s, el, opts) => s === 'cintrage-de-precision' ? bender(el, opts || { loop:true }) : B[s]();

/* une scène : rendu, lumière de studio, ombre de contact, cadrage par la boîte */
function stage(el){
  const canvas = document.createElement('canvas'); el.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, preserveDrawingBuffer:STILL });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 5);
  const amb = new THREE.AmbientLight(0xffffff, .25); scene.add(key, amb);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c2 = cv.getContext('2d'), grd = c2.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.32)'); grd.addColorStop(.55, 'rgba(0,0,0,.1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  c2.fillStyle = grd; c2.fillRect(0, 0, 256, 256);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(cv), transparent:true, depthWrite:false }));
  ground.rotation.x = -PI / 2; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
  let W = 0, H = 0, raf = 0, vis = true, cur = null;
  const v = new THREE.Vector3();
  function theme(){ const d = isDark(); renderer.toneMappingExposure = d ? .78 : 1.05; key.intensity = d ? 1.1 : 1.6; amb.intensity = d ? .12 : .25; INK.color.set(d ? 0xe6e9ec : 0x15181b); ground.material.opacity = d ? .9 : 1; kick(); }
  function frameCam(){
    if (!cur || !W) return;
    const s = cur.size, hx = Math.max(s.x, s.z) / 2, hy = s.y / 2, t = Math.tan(THREE.MathUtils.degToRad(15));
    const el2 = cur.el || .22, ang = Math.atan(el2), vert = hy * Math.cos(ang) + hx * Math.sin(ang);
    const d = (Math.max(vert / t, hx / (t * camera.aspect)) + hx) * (cur.fit || 1.1);
    v.set(0, el2, 1).normalize().multiplyScalar(d); camera.position.copy(v); camera.lookAt(0, 0, 0);
    ground.position.set(0, cur.floor, 0); ground.scale.set(hx * 2.6, hx * 1.1, 1);
  }
  function size(){ const b = el.getBoundingClientRect(); W = b.width; H = b.height; if (!W || !H) return; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); frameCam(); }
  function loop(now){
    raf = 0; if (!W) size();
    if (cur && cur.tick) cur.tick(now);
    if (cur && cur.label && cur.label.el){ const q = cur.label.at().project(camera); cur.label.el.style.left = ((q.x + 1) / 2 * W) + 'px'; cur.label.el.style.top = ((1 - q.y) / 2 * H) + 'px'; cur.label.el.textContent = cur.label.text(); }
    renderer.render(scene, camera);
    if (vis && !reduce && !document.hidden) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const ro = new ResizeObserver(() => { size(); kick(); }); ro.observe(el);
  const io = new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; if (vis) kick(); }); io.observe(el);
  document.addEventListener('visibilitychange', kick);
  addEventListener('themechange', theme); theme();
  /* au doigt ou à la souris : la pièce se tourne, puis reprend son mouvement */
  let down = null;
  const pd = e => { if (!cur) return; down = { x:e.clientX, d:cur.drag }; el.setPointerCapture && el.setPointerCapture(e.pointerId); };
  const pm = e => { if (!down || !cur) return; cur.drag = down.d + (e.clientX - down.x) * .008; kick(); };
  const pu = () => { down = null; };
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
  el.style.touchAction = 'pan-y'; el.style.cursor = 'grab';
  return {
    set(p){ if (cur === p) return; if (cur) scene.remove(cur.g); cur = p; scene.add(p.g); p.t0 = performance.now(); frameCam(); kick(); },
    kick, get cur(){ return cur; },
    dispose(){ cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', kick); removeEventListener('themechange', theme); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); }
  };
}

function mount(root){
  if (!GL) return null;
  const stops = [];
  root.querySelectorAll('.part[data-part]').forEach(el => {
    const kind = el.dataset.part, st = stage(el);
    stops.push(st.dispose);
    if (kind === 'hero'){
      const p = bender(el, { loop:false, parallax:!reduce }); p.el = .18; p.fit = 1.02;
      const mv = e => { p.tx = e.clientX / innerWidth - .5; p.ty = e.clientY / innerHeight - .5; };
      addEventListener('pointermove', mv, { passive:true }); stops.push(() => removeEventListener('pointermove', mv));
      st.set(p); return;
    }
    const p = build(kind, el, { loop:true }); p.fit = 1.0; st.set(p);
    if (p.setWay){ const on = e => { p.setWay(+e.detail); st.kick(); }; addEventListener('setway', on); stops.push(() => removeEventListener('setway', on)); }
  });
  return () => stops.forEach(f => f());
}
window.PARTS3D = { mount };
dispatchEvent(new Event('parts3d-ready'));
