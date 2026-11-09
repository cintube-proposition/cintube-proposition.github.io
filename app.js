/* Le site : routes par #, 25 pages en français et en anglais. Chaque page s'ouvre
   par la même parallaxe en couches ; les composants sont écrits ici, en code à nous. */
(function(){
var D = window.CINTUBE, UI = D.UI, M = window.MOTION;
var SEC = {
  fr:{procs:'procedes', sects:'secteurs', proj:'realisations', co:'entreprise', q:'qualite', plants:'usines', quote:'soumission'},
  en:{procs:'capabilities', sects:'industries', proj:'projects', co:'company', q:'quality', plants:'plants', quote:'quote'}
};
var NAV = ['procs','sects','proj','plants','co'];
var X = {
  fr:{ night:'Passer en mode nuit', day:'Passer en mode jour', seeProcs:'Voir les procédés', seeAll:'Tout voir',
       statsH:'Une entreprise privée, canadienne, fondée en 1955.',
       statsT:'Cintube Ltée cintre, roule et fabrique l’acier depuis 1955. Siège social à Lachine, usines à Lachine, Mississauga et Plattsburgh, appareils sous pression au code ASME. Les acheteurs sont des ingénieurs : ils envoient un plan, Cintube répond avec une pièce.',
       nums:[['1955','Fondation',0],['3','Usines',0],['60','Machines à cintrer',1],['200000','Pieds carrés d’atelier',1]],
       ctaH:'Envoyez le plan, on s’occupe du reste.', ctaP:'PDF, DWG ou STEP, avec le matériau, la forme et la quantité. La demande va à l’usine la plus près de votre chantier.',
       legal:'Maquette de proposition. Non publiée par Cintube Ltée.', rights:'Cintube Ltée. Tous droits réservés.', profile:'Profil d’un tube cintré : partie droite, arc, partie droite.',
       readMore:'Lire', phoneAt:'Téléphone', yourMail:'Votre courriel', yourMsg:'Votre message', optional:'facultatif', cont:'Poursuivre la demande', nextStep:'Vous préciserez la pièce et l’usine à l’étape suivante.', plantsLead:'Trois usines, une par marché. Pour une soumission, écrivez ou appelez la plus près de vous.' },
  en:{ night:'Switch to night mode', day:'Switch to day mode', seeProcs:'See the capabilities', seeAll:'See all',
       statsH:'A private Canadian company, founded in 1955.',
       statsT:'Cintube Ltd has been bending, rolling and fabricating steel since 1955. Head office in Lachine, plants in Lachine, Mississauga and Plattsburgh, pressure components to the ASME code. The buyers are engineers: they send a drawing, Cintube answers with a part.',
       nums:[['1955','Founded',0],['3','Plants',0],['60','Bending machines',1],['200000','Square feet of shop',1]],
       ctaH:'Send the drawing, we take it from there.', ctaP:'PDF, DWG or STEP, with the material, shape and quantity. The request goes to the plant nearest your job site.',
       legal:'Proposal mockup. Not published by Cintube Ltd.', rights:'Cintube Ltd. All rights reserved.', profile:'Profile of a bent tube: straight, arc, straight.',
       readMore:'Read', phoneAt:'Phone', yourMail:'Your email', yourMsg:'Your message', optional:'optional', cont:'Continue the request', nextStep:'You will specify the part and the plant at the next step.', plantsLead:'Three plants, one per market. For a quote, write or call the one nearest you.' }
};
var state = {files:[], email:'', msg:''}, cleanup = null;

function slugOf(it, L){ return L === 'en' && it.e ? it.e : it.s; }
function href(L, sec, it, q){
  var p = L === 'en' ? '#/en' : '#';
  if (sec && sec !== 'home') p += '/' + SEC[L][sec]; else if (L === 'fr') p = '#/';
  if (it) p += '/' + slugOf(it, L);
  return p + (q ? '?' + q : '');
}
function find(list, slug, L){ for (var i = 0; i < list.length; i++) if (slugOf(list[i], L) === slug || list[i].s === slug) return list[i]; return null; }
function byS(list, s){ return find(list, s, 'fr'); }
function parse(){
  var h = location.hash.replace(/^#\/?/, ''), q = {}, i = h.indexOf('?');
  if (i >= 0){ h.slice(i + 1).split('&').forEach(function(kv){ var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, i); }
  var parts = h.split('/').filter(Boolean), L = 'fr';
  if (parts[0] === 'en'){ L = 'en'; parts.shift(); }
  var sec = 'home';
  if (parts[0]){ sec = 'none'; for (var k in SEC[L]) if (SEC[L][k] === parts[0]) sec = k; }
  return {L:L, sec:sec, slug:parts[1], q:q};
}
var ARROW = '<svg class="ar" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
var FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17v-6M9 14l3-3 3 3"/></svg>';
var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 27V17A11 11 0 0 1 17 6h9" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round"/></svg>';
var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function tbc(L){ return '<span class="tbc">' + UI[L].tbc + '</span>'; }
function plantTel(p){ return '<a class="tel" href="tel:' + p.telh + '">' + p.tel + '</a>'; }

/* ═══ COMPOSANTS ═══ */
/* la tête de page : fond de points, titre, pièce devant, fondu ; même mouvement partout */
function plx(o){
  var crumbs = o.crumbs ? '<nav class="plx__crumbs" aria-label="' + (o.L === 'fr' ? 'Fil d’Ariane' : 'Breadcrumb') + '"><a href="' + href(o.L) + '">' + UI[o.L].home + '</a>' +
    o.crumbs.map(function(c){ return '<span aria-hidden="true">/</span>' + (c[1] ? '<a href="' + c[1] + '">' + c[0] + '</a>' : '<span>' + c[0] + '</span>'); }).join('') + '</nav>' : '';
  return '<section class="plx' + (o.short ? ' plx--short' : '') + (o.front ? '' : ' plx--bare') + '"><div class="plx__head"><div class="plx__vis"><div class="plx__layers" data-plx-layers>' +
    '<div class="plx__bg" data-plx-layer="1" data-mesh="' + (o.mesh || 1) + '" aria-hidden="true"></div>' +
    '<div class="plx__title" data-plx-layer="2">' + crumbs + '<h1 tabindex="-1">' + o.h1 + '</h1></div>' +
    (o.front ? '<div class="plx__front" data-plx-layer="3">' + o.front + '</div>' : '') +
    '</div><div class="plx__line" aria-hidden="true"></div><div class="plx__fade" aria-hidden="true"></div></div></div>' +
    '<div class="plx__content"><div class="plx__copy">' + (o.lead ? '<p class="plx__lead">' + o.lead + '</p>' : '') + (o.ctas ? '<div class="plx__ctas">' + o.ctas + '</div>' : '') + '</div></div></section>';
}
function part(kind, label, extra){ return '<div class="part" data-part="' + kind + '" role="img" aria-label="' + label + '">' + (extra || '') + '</div>'; }
function imgOf(s){ return 'img/' + s + '.webp'; }
function cards(L, list, sec, cls){
  return '<div class="cards' + (cls ? ' ' + cls : '') + '">' + list.map(function(p, i){
    var img = sec === 'procs' ? p.s : p.proc[0];
    return '<a class="card rv" data-drift="col" href="' + href(L, sec, p) + '"><img class="card__img" data-drift="-.09" src="' + imgOf(img) + '" alt="" loading="lazy" width="800" height="1000">' + ARROW +
      '<div class="card__body"><h3>' + p[L].h + '</h3><p>' + p[L].l + '</p></div></a>'; }).join('') + '</div>';
}
function words(t){ return t.split(' ').map(function(w){ return '<span class="w">' + w + '</span>'; }).join(' '); }
function statsHtml(L){
  var x = X[L];
  return '<div class="stats"><p class="stats__text" data-drift=".04">' + words(x.statsT) + '</p>' +
    '<svg class="profile" data-drift=".06" viewBox="0 0 900 220" role="img" aria-label="' + x.profile + '">' +
      '<path class="ax" d="M40 200H860M560 20V200"/><path class="ax" d="M560 200 L560 20 M560 200 A180 180 0 0 1 740 20"/>' +
      '<path class="p" pathLength="1" d="M40 200H560"/><path class="p" pathLength="1" d="M560 200a180 180 0 0 0 180-180"/><path class="p" pathLength="1" d="M740 20V0"/>' +
      '<path class="p" pathLength="1" d="M40 156H560"/><path class="p" pathLength="1" d="M560 156a136 136 0 0 0 136-136"/><path class="p" pathLength="1" d="M696 20V0"/>' +
      '<path class="p" pathLength="1" d="M560 200 L560 20"/><text x="572" y="112" font-family="ui-monospace,Menlo,monospace" font-size="13" fill="currentColor">R</text></svg>' +
    '<dl class="nums" data-drift="-.02">' + x.nums.map(function(n){ return '<div class="num rv"><b data-n="' + n[0] + '"' + (n[0] === '60' ? ' data-pre="+ "' : '') + '>' + n[0] + '</b><span>' + n[1] + (n[2] ? ' ' + tbc(L) : '') + '</span></div>'; }).join('') + '</dl></div>';
}
var DRAW = {
  'edifice-peter-b-lewis':'<path class="t" d="M30 230A170 170 0 0 1 270 230"/><path class="t" d="M60 230A120 120 0 0 1 240 230"/><path class="p" d="M60 230L75 160M75 160L105 120M105 120L120 96M120 96L150 80M150 80L180 96M180 96L195 120M195 120L225 160M225 160L240 230M75 160L52 192M52 192L105 120M105 120L87 136M120 96L150 110M150 110L180 96M195 120L213 136M225 160L248 192"/><path class="ax" d="M20 230H280"/>',
  'aeroport-pearson-transport-sureleve':'<path class="t" d="M20 250C120 110 180 110 280 40"/><path class="t" d="M20 290C120 150 180 150 280 80"/><path class="p" d="M60 212L62 250M110 170L116 206M160 150L166 186M210 128L220 162M258 90L270 126"/><path class="ax" d="M20 270C120 130 180 130 280 60"/>',
  'aeroport-pearson-aerogare-3':'<path class="t" d="M20 120A150 150 0 0 1 280 120"/><path class="t" d="M20 170A150 150 0 0 1 280 170"/><path class="t" d="M20 220A150 150 0 0 1 280 220"/><path class="p" d="M60 94V250M150 54V250M240 94V250"/><path class="ax" d="M10 250H290"/>',
  'casino-niagara-fallsview':'<path class="t" d="M60 270C60 170 150 190 150 110S240 70 240 20"/><path class="t" d="M110 270C110 190 200 210 200 140S290 90 290 50"/><path class="p" d="M40 270H300"/><path class="ax" d="M150 110V270M240 20V270"/>'
};
function fanHtml(L){
  var items = D.PROJ;
  return '<div class="fan" data-drift=".05" tabindex="0" aria-roledescription="carousel">' + items.map(function(p, i){ var pr = byS(D.PROC, p.proc);
    return '<article class="fan__card glass" aria-label="' + p[L].h + '"><svg viewBox="0 0 300 300" aria-hidden="true">' + (DRAW[p.s] || '') + '</svg><h3>' + p[L].h + '</h3><p>' + pr[L].h + '</p></article>'; }).join('') + '</div>' +
    '<div class="fan__nav"><button class="ico" type="button" data-fan="prev" aria-label="' + (L === 'fr' ? 'Précédent' : 'Previous') + '"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l-6 6 6 6"/></svg></button>' +
    '<div class="fan__dots" role="tablist">' + items.map(function(p, i){ return '<button type="button" aria-label="' + p[L].h + '"></button>'; }).join('') + '</div>' +
    '<button class="ico" type="button" data-fan="next" aria-label="' + (L === 'fr' ? 'Suivant' : 'Next') + '"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l6 6-6 6"/></svg></button></div>';
}
function folder(L, p, body){
  var who = p.who ? p.who.join(', ') : (L === 'fr' ? 'Ventes' : 'Sales');
  return '<a class="folder rv" href="' + href(L, 'plants', p) + '"><div class="folder__tab"></div><div class="folder__sheets" aria-hidden="true">' +
    '<div class="folder__sheet">' + p.tel + '</div><div class="folder__sheet">' + who + '</div><div class="folder__sheet">' + (p.mail || 'cintube.ca') + '</div></div>' +
    '<div class="folder__body glass rim">' + ARROW + '<h3>' + p.city + '</h3><p class="role">' + p[L].r + '</p><p class="adr">' + p[L].a.slice(0, 2).join('<br>') + '</p></div></a>';
}
function foldersHtml(L){ return '<div class="folders">' + D.PLANTS.map(function(p, i){ return folder(L, p).replace('class="folder rv"', 'class="folder rv" data-drift="col"'); }).join('') + '</div>'; }
function dropHtml(L, id, big){
  var u = UI[L], x = X[L];
  return '<form class="drop" id="' + id + '" novalidate><div class="folder__tab"></div><div class="folder__body glass rim">' +
    '<div class="drop__row">' + FILE + '<label class="t" for="' + id + '-f"><b>' + u.dropB + '</b><span class="fn">' + u.dropS + '</span></label>' +
    '<input class="vh" id="' + id + '-f" type="file" multiple accept=".pdf,.dwg,.dxf,.step,.stp">' +
    '<label class="pill pill--ghost pill--small" for="' + id + '-f">' + u.qtPick + '</label></div>' +
    '<div class="drop__fields"><div class="fld"><label for="' + id + '-m">' + x.yourMail + '</label><input id="' + id + '-m" name="email" type="email" autocomplete="email" inputmode="email"></div>' +
    '<div class="fld"><label for="' + id + '-t">' + x.yourMsg + ' <span class="opt">(' + x.optional + ')</span></label><textarea id="' + id + '-t" name="msg" rows="2"></textarea></div></div>' +
    '<div class="drop__send"><button class="pill" type="submit">' + x.cont + ARROW + '</button><p class="drop__note">' + x.nextStep + '</p></div></div></form>';
}
function ctaHtml(L){
  var x = X[L];
  return '<section class="sec"><div class="wrap"><div class="cta glass rim rv"><div data-drift=".03"><h2>' + x.ctaH + '</h2><p>' + x.ctaP + '</p></div><div data-drift="-.03">' + dropHtml(L, 'drop-cta', true) + '</div></div></div></section>';
}
function head(h2, p, center){ return '<div class="sec__head rv' + (center ? ' center' : '') + '" data-drift=".03"><h2>' + h2 + '</h2>' + (p ? '<p>' + p + '</p>' : '') + '</div>'; }

/* ═══ PAGES ═══ */
var P = {};
P.home = function(L){
  var u = UI[L], x = X[L];
  return {title:u.title, desc:u.desc, html:
    plx({L:L, h1:u.h1, lead:u.lede, mesh:1, front:part('hero', u.lede, '<span class="dim" hidden>0°</span>'),
      ctas:'<a class="pill" href="' + href(L, 'quote') + '">' + u.dropBtn + '</a><a class="pill pill--ghost" href="' + href(L, 'procs') + '">' + x.seeProcs + ARROW + '</a>'}) +
    '<section class="sec"><div class="wrap">' + head(u.procH, u.procI) + cards(L, D.PROC, 'procs') + '</div></section>' +
    '<section class="sec"><div class="wrap">' + head(x.statsH) + statsHtml(L) + '</div></section>' +
    '<section class="sec"><div class="wrap">' + head(u.nav[2], u.projL, true) + fanHtml(L) + '</div></section>' +
    '<section class="sec"><div class="wrap">' + head(u.plantsH, x.plantsLead) + foldersHtml(L) + '</div></section>' +
    ctaHtml(L)};
};
P.procs = function(L, r){
  var u = UI[L];
  if (r.slug){ var p = find(D.PROC, r.slug, L); if (!p) return P.procs(L, {}); return P.proc(L, p); }
  return {title:u.tProcs, desc:u.dProcs, html:plx({L:L, short:1, crumbs:[[u.nav[0]]], h1:u.procsH, lead:u.procsL, mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap">' + cards(L, D.PROC, 'procs') + '</div></section>' + ctaHtml(L)};
};
P.proc = function(L, p){
  var u = UI[L], t = p[L], i = D.PROC.indexOf(p), nx = D.PROC[(i + 1) % D.PROC.length], side = '';
  if (p.table) side = '<table class="spec"><caption>' + u.rollCap + '</caption><thead><tr><th scope="col">' + u.rollA + '</th><th scope="col">' + u.rollB + '</th></tr></thead><tbody>' +
    D.ROLL[L].map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>';
  else if (t.x) side = '<div class="xlist"><h3>' + t.xh + '</h3><ul>' + t.x.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
  var seg = p.s === 'roulage-de-charpente' ? '<div class="seg chips" role="group"><a href="#" class="glass" data-way="0" aria-pressed="true">' + (L === 'fr' ? 'Sens facile' : 'Easy way') + '</a><a href="#" class="glass" data-way="1" aria-pressed="false">' + (L === 'fr' ? 'Sens difficile' : 'Hard way') + '</a></div>' : '';
  return {title:t.t, desc:t.d, html:
    plx({L:L, short:1, crumbs:[[u.nav[0], href(L, 'procs')], [t.h]], h1:t.h, lead:t.l, mesh:.8, front:part(p.s, t.d, p.s === 'cintrage-de-precision' ? '<span class="dim" hidden>0°</span>' : ''),
      ctas:'<a class="pill" href="' + href(L, 'quote', null, 'p=' + p.s) + '">' + u.askProc + '</a>'}) +
    '<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="prose rv" data-drift="-.03">' + t.b.map(function(b){ return '<p>' + b + '</p>'; }).join('') + seg + '</div>' +
      (side ? '<div class="panel glass rim rv" data-drift=".04">' + side + '</div>' : '') + '</div></div></section>' +
    '<section class="sec sec--tight"><div class="wrap"><h3 class="h3 rv">' + u.sectFor + '</h3><div class="chips rv" style="margin-top:16px">' + p.sect.map(function(s){ var x = byS(D.SECT, s);
      return '<a class="glass" href="' + href(L, 'sects', x) + '">' + x[L].h + '</a>'; }).join('') + '</div>' +
    '<a class="next glass rim rv" data-drift=".04" href="' + href(L, 'procs', nx) + '"><div><span>' + u.next + '</span><b>' + nx[L].h + '</b></div>' + ARROW + '</a></div></section>'};
};
P.sects = function(L, r){
  var u = UI[L];
  if (r.slug){ var s = find(D.SECT, r.slug, L); if (!s) return P.sects(L, {}); return P.sect(L, s); }
  return {title:u.tSects, desc:u.dSects, html:plx({L:L, short:1, crumbs:[[u.nav[1]]], h1:u.sectH, lead:u.sectI, mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap">' + cards(L, D.SECT, 'sects', 'cards--3') + '<p class="rv" style="margin-top:28px;color:var(--ink-2)">' + u.sectMore + '</p></div></section>' + ctaHtml(L)};
};
P.sect = function(L, s){
  var u = UI[L], t = s[L], procs = s.proc.map(function(x){ return byS(D.PROC, x); }), proj = (s.proj || []).map(function(x){ return byS(D.PROJ, x); });
  return {title:t.t, desc:t.d, html:
    plx({L:L, short:1, crumbs:[[u.nav[1], href(L, 'sects')], [t.h]], h1:t.h, lead:t.l, mesh:.8, front:part(procs[0].s, procs[0][L].d),
      ctas:'<a class="pill" href="' + href(L, 'quote') + '">' + u.dropBtn + '</a>'}) +
    '<section class="sec sec--tight"><div class="wrap">' + head(u.procUsed) + cards(L, procs, 'procs', procs.length < 4 ? 'cards--3' : '') + '</div></section>' +
    (proj.length ? '<section class="sec sec--tight"><div class="wrap"><h3 class="h3 rv">' + u.projSee + '</h3><div class="chips rv" style="margin-top:16px">' + proj.map(function(p){
      return '<a class="glass" href="' + href(L, 'proj') + '">' + p[L].h + '</a>'; }).join('') + '</div></div></section>' : '')};
};
P.proj = function(L){
  var u = UI[L];
  return {title:u.tProj, desc:u.dProj, html:plx({L:L, short:1, crumbs:[[u.nav[2]]], h1:u.nav[2], lead:u.projL, mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap">' + fanHtml(L) + '</div></section>' +
    '<section class="sec sec--tight"><div class="wrap"><div class="cards cards--3">' + D.PROJ.map(function(p){ var pr = byS(D.PROC, p.proc);
      return '<a class="card rv" href="' + href(L, 'procs', pr) + '"><img class="card__img" src="' + imgOf(pr.s) + '" alt="" loading="lazy">' + ARROW + '<div class="card__body"><h3>' + p[L].h + '</h3><p>' + p[L].l + ' ' + pr[L].h + '.</p></div></a>'; }).join('') + '</div></div></section>' + ctaHtml(L)};
};
P.co = function(L){
  var u = UI[L], x = X[L];
  return {title:u.tCo, desc:u.dCo, html:plx({L:L, short:1, crumbs:[[u.nav[4]]], h1:u.coH, lead:u.co[1], mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap">' + statsHtml(L) + '</div></section>' +
    '<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="prose rv" data-drift="-.03">' + u.co.map(function(b){ return '<p>' + b + '</p>'; }).join('') +
    '<a class="pill pill--ghost" href="' + href(L, 'q') + '">' + u.qH.replace('.', '') + ARROW + '</a></div>' +
    '<div class="panel glass rim rv" data-drift=".04"><dl class="pf">' + u.facts.map(function(f){ return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + (f[2] ? ' ' + tbc(L) : '') + '</dd></div>'; }).join('') + '</dl></div></div></div></section>'};
};
P.q = function(L){
  var u = UI[L], ap = byS(D.PROC, 'appareils-sous-pression');
  return {title:u.tQ, desc:u.dQ, html:plx({L:L, short:1, crumbs:[[u.nav[4], href(L, 'co')], [u.qH.replace('.', '')]], h1:u.qH, lead:u.qL, mesh:.8, front:part('appareils-sous-pression', ap[L].d)}) +
    '<section class="sec sec--tight"><div class="wrap"><div class="panel glass rim rv" data-drift=".04"><dl class="codes">' + u.qCodes.map(function(c){ return '<div><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>'; }).join('') + '</dl></div></div></section>' +
    '<section class="sec sec--tight"><div class="wrap"><h3 class="h3 rv">' + u.qMfr + '</h3><ul class="cols rv" style="margin-top:16px">' + ap[L].x.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>' +
    '<p class="rv" style="margin-top:28px;color:var(--ink-2)">' + u.qCert + '</p><div class="chips rv" style="margin-top:16px">' + D.PLANTS.map(function(p){ return '<a class="glass" href="' + href(L, 'plants', p) + '">' + p.city + '</a>'; }).join('') + '</div></div></section>'};
};
P.plants = function(L, r){
  var u = UI[L], x = X[L];
  if (r.slug){ var p = find(D.PLANTS, r.slug, L); if (!p) return P.plants(L, {}); return P.plant(L, p); }
  return {title:u.tPlants, desc:u.dPlants, html:plx({L:L, short:1, crumbs:[[u.nav[3]]], h1:u.plantsH, lead:x.plantsLead, mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap">' + foldersHtml(L) + '</div></section>' + ctaHtml(L)};
};
P.plant = function(L, p){
  var u = UI[L], t = p[L];
  var f = '<dl class="pf"><div class="wide"><dt>' + u.addr + '</dt><dd>' + t.a.join('<br>') + '</dd></div>' +
    '<div><dt>' + u.tel + '</dt><dd>' + plantTel(p) + '</dd></div>' + (p.fax ? '<div><dt>' + u.fax + '</dt><dd>' + p.fax + '</dd></div>' : '') +
    (p.mail ? '<div><dt>' + u.mail + '</dt><dd><a href="mailto:' + p.mail + '">' + p.mail + '</a></dd></div>' : '') +
    (p.who ? '<div><dt>' + u.who + '</dt><dd>' + p.who.join(', ') + ' ' + tbc(L) + '</dd></div>' : '') + '</dl>';
  return {title:t.t, desc:t.d, html:plx({L:L, short:1, crumbs:[[u.nav[3], href(L, 'plants')], [p.city]], h1:p.city, lead:t.l, mesh:.8,
      ctas:'<a class="pill" href="' + href(L, 'quote', null, 'u=' + p.s) + '">' + u.askPlant + '</a>'}) +
    '<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="panel glass rim rv" data-drift=".04">' + f + '</div>' +
    '<div class="prose rv" data-drift="-.03"><p>' + t.d + '</p><p>' + t.r + '</p></div></div></div></section>' +
    '<section class="sec sec--tight"><div class="wrap"><h3 class="h3 rv" data-drift=".03">' + u.otherPlants + '</h3><div class="folders" style="margin-top:44px">' + D.PLANTS.filter(function(x){ return x !== p; }).map(function(x){ return folder(L, x); }).join('') + '</div></div></section>'};
};
P.quote = function(L, r){
  var u = UI[L], q = r.q || {}, pre = q.p ? find(D.PROC, q.p, L) : null, pu = q.u ? find(D.PLANTS, q.u, L) : null;
  function sel(id, label, opts, val, first){
    return '<div class="fld"><label for="' + id + '">' + label + '</label><select id="' + id + '" name="' + id + '">' + (first ? '<option value="">' + first + '</option>' : '') +
      opts.map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  }
  function inp(id, label, type, extra){ return '<div class="fld"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + type + '"' + (extra || '') + '></div>'; }
  var form = '<form class="qform" id="qform" novalidate>' +
    '<fieldset><legend>' + u.qtFiles + '</legend><div class="drop" id="zone" style="margin-top:18px"><div class="folder__tab"></div><div class="folder__body glass rim"><div class="drop__row">' + FILE + '<p class="t"><b>' + u.dropB + '</b><span>' + u.qtFilesS + '</span></p>' +
      '<label class="pill pill--ghost pill--small" for="qfiles">' + u.qtPick + '</label><input class="vh" id="qfiles" type="file" multiple accept=".pdf,.dwg,.dxf,.step,.stp"></div>' +
      '<ul class="flist" id="flist" aria-live="polite"></ul></div></div></fieldset>' +
    '<fieldset><legend>' + u.qtPart + '</legend><div class="grid">' +
      sel('proc', u.qtProc, D.PROC.map(function(p){ return [p.s, p[L].h]; }), pre ? pre.s : '', u.qtUnsure) +
      sel('mat', u.qtMat, u.mats.map(function(m){ return [m, m]; }).concat([[u.qtOther, u.qtOther]]), '', '…') +
      sel('form', u.qtForm, u.forms.map(function(m){ return [m, m]; }).concat([[u.qtOther, u.qtOther]]), '', '…') +
      inp('dim', u.qtDim, 'text', ' placeholder="' + u.qtDimP + '"') + inp('qty', u.qtQty, 'number', ' min="1" inputmode="numeric"') +
      sel('code', u.qtCode, u.codes.map(function(m){ return [m, m]; }).concat([[u.qtNoCode, u.qtNoCode]]), '', u.qtUnsure) + inp('due', u.qtDue, 'date') +
      sel('plant', u.qtPlant, D.PLANTS.map(function(p){ return [p.s, p.city]; }), pu ? pu.s : '', u.qtNear) + '</div></fieldset>' +
    '<fieldset><legend>' + u.qtYou + '</legend><div class="grid">' +
      inp('name', u.qtName, 'text', ' autocomplete="name"') + inp('company', u.qtCo, 'text', ' autocomplete="organization"') +
      inp('email', u.qtMail, 'email', ' autocomplete="email"') + inp('phone', u.qtTel, 'tel', ' autocomplete="tel"') +
      '<div class="fld wide"><label for="msg">' + u.qtMsg + '</label><textarea id="msg" name="msg" rows="4"></textarea></div></div></fieldset>' +
    '<div class="send"><button class="pill" type="submit">' + u.qtSend + '</button><p class="mock" id="qmock" role="status"></p></div></form>';
  return {title:u.tQt, desc:u.dQt, html:plx({L:L, short:1, crumbs:[[u.quote]], h1:u.qtH, lead:u.qtL, mesh:.8}) +
    '<section class="sec sec--tight"><div class="wrap"><div class="panel glass rim rv" data-drift=".03">' + form + '</div></div></section>'};
};

/* ═══ CHARPENTE ═══ */
function chrome(r){
  var L = r.L, u = UI[L], x = X[L], O = L === 'fr' ? 'en' : 'fr', cur = r.sec;
  var it = r.slug ? (cur === 'procs' ? find(D.PROC, r.slug, L) : cur === 'sects' ? find(D.SECT, r.slug, L) : cur === 'plants' ? find(D.PLANTS, r.slug, L) : null) : null;
  var other = href(O, cur === 'none' ? 'home' : cur, it, r.q && (r.q.p || r.q.u) ? (r.q.p ? 'p=' + r.q.p : 'u=' + r.q.u) : '');
  var links = NAV.map(function(k, i){ return '<a href="' + href(L, k) + '"' + (cur === k || (k === 'co' && cur === 'q') ? ' aria-current="page"' : '') + '>' + u.nav[i] + '</a>'; }).join('');
  var dark = M.isDark();
  document.getElementById('top').innerHTML =
    '<button class="skip" type="button">' + u.skip + '</button>' +
    '<a class="brand" href="' + href(L) + '">' + LOGO + 'Cintube</a>' +
    '<nav class="links" aria-label="' + (L === 'fr' ? 'Principale' : 'Main') + '">' + links + '</nav>' +
    '<div class="tools"><button class="ico theme" type="button" id="theme" aria-label="' + (dark ? x.day : x.night) + '" aria-pressed="' + dark + '">' + (dark ? SUN : MOON) + '</button>' +
    '<a class="ico lang" href="' + other + '" hreflang="' + O + '" lang="' + O + '" aria-label="' + u.otherName + '">' + u.other + '</a>' +
    '<a class="pill" href="' + href(L, 'quote') + '">' + u.quote + '</a>' +
    '<button class="ico menu" type="button" aria-expanded="false" aria-controls="drawer" aria-label="' + u.menu + '"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 7h14M3 13h14"/></svg></button></div>';
  document.getElementById('drawer').innerHTML = '<nav aria-label="' + u.menu + '">' + links.replace(/<a /g, '<a ') +
    '<a href="' + href(L, 'quote') + '">' + u.quote + ARROW + '</a><a class="small" href="' + other + '" hreflang="' + O + '" lang="' + O + '">' + u.otherName + '</a></nav>';
  var col = function(h, list){ return '<div><h2>' + h + '</h2><ul>' + list.join('') + '</ul></div>'; };
  var li = function(h, t){ return '<li><a href="' + h + '">' + t + '</a></li>'; };
  document.getElementById('foot').innerHTML = '<div class="wrap"><div class="fcols">' +
    col(u.nav[0], D.PROC.map(function(p){ return li(href(L, 'procs', p), p[L].h); })) +
    col(u.nav[1], D.SECT.map(function(s){ return li(href(L, 'sects', s), s[L].h); })) +
    col('Cintube', [li(href(L, 'proj'), u.nav[2]), li(href(L, 'co'), u.nav[4]), li(href(L, 'q'), u.qH.replace('.', '')), li(href(L, 'quote'), u.quote)]) +
    col(u.nav[3], D.PLANTS.map(function(p){ return '<li><a href="' + href(L, 'plants', p) + '">' + p.city + '</a></li>'; })) +
    col(x.phoneAt, D.PLANTS.map(function(p){ return '<li>' + plantTel(p) + '</li>'; })) +
    '</div><div class="fline"><p>' + x.legal + ' ' + x.rights + '</p><nav class="sel" aria-label="' + (L === 'fr' ? 'Langue' : 'Language') + '"><a href="' + (L === 'fr' ? href('fr', cur === 'none' ? 'home' : cur, it) : other) + '"' + (L === 'fr' ? ' aria-current="true"' : '') + '>Français</a><a href="' + (L === 'en' ? href('en', cur === 'none' ? 'home' : cur, it) : other) + '"' + (L === 'en' ? ' aria-current="true"' : '') + '>English</a></nav></div></div>';
  document.documentElement.lang = L === 'fr' ? 'fr-CA' : 'en-CA';
}
function setMenu(open){
  var b = document.querySelector('#top .menu'), d = document.getElementById('drawer');
  if (!b) return; b.setAttribute('aria-expanded', open ? 'true' : 'false'); d.hidden = !open;
  document.documentElement.classList.toggle('menu-open', open);
}
function meta(name, val, prop){
  var el = document.head.querySelector('meta[' + (prop ? 'property' : 'name') + '="' + name + '"]');
  if (!el){ el = document.createElement('meta'); el.setAttribute(prop ? 'property' : 'name', name); document.head.appendChild(el); }
  el.setAttribute('content', val);
}

/* ═══ FORMULAIRES : rien ne part, la maquette le dit ═══ */
function bind(root, r){
  var u = UI[r.L];
  root.querySelectorAll('form.drop').forEach(function(f){
    var inp = f.querySelector('input[type=file]'), fn = f.querySelector('.fn'), em = f.querySelector('input[name=email]'), ms = f.querySelector('textarea[name=msg]');
    var take = function(list){ if (list && list.length){ state.files = state.files.concat([].slice.call(list)); if (fn) fn.textContent = state.files.map(function(x){ return x.name; }).join(', '); } };
    if (em) em.value = state.email; if (ms) ms.value = state.msg;
    inp.addEventListener('change', function(){ take(inp.files); inp.value = ''; });
    ['dragenter','dragover'].forEach(function(e){ f.addEventListener(e, function(ev){ ev.preventDefault(); f.classList.add('over'); }); });
    ['dragleave','drop'].forEach(function(e){ f.addEventListener(e, function(ev){ ev.preventDefault(); f.classList.remove('over'); if (ev.dataTransfer) take(ev.dataTransfer.files); }); });
    f.addEventListener('submit', function(ev){ ev.preventDefault(); if (em) state.email = em.value.trim(); if (ms) state.msg = ms.value.trim(); navigate(href(r.L, 'quote')); });
  });
  var qf = root.querySelector('#qform');
  if (!qf) return;
  var zone = qf.querySelector('#zone'), qi = qf.querySelector('#qfiles'), fl = qf.querySelector('#flist');
  var qe = qf.querySelector('#email'), qm = qf.querySelector('#msg');
  if (qe && state.email) qe.value = state.email; if (qm && state.msg) qm.value = state.msg;
  if (qe) qe.addEventListener('input', function(){ state.email = qe.value; }); if (qm) qm.addEventListener('input', function(){ state.msg = qm.value; });
  function draw(){
    fl.innerHTML = state.files.length ? state.files.map(function(f, i){
      return '<li><span>' + f.name.replace(/</g, '&lt;') + '</span><small>' + Math.max(1, Math.round(f.size / 1024)) + ' Ko</small><button type="button" data-i="' + i + '" aria-label="' + (r.L === 'fr' ? 'Retirer ' : 'Remove ') + f.name.replace(/"/g, '') + '">×</button></li>'; }).join('')
      : '<li class="none">' + u.qtNone + '</li>';
  }
  function add(list){ state.files = state.files.concat([].slice.call(list || [])); draw(); }
  draw();
  qi.addEventListener('change', function(){ add(qi.files); qi.value = ''; });
  ['dragenter','dragover'].forEach(function(e){ zone.addEventListener(e, function(ev){ ev.preventDefault(); zone.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(e){ zone.addEventListener(e, function(ev){ ev.preventDefault(); zone.classList.remove('over'); if (ev.dataTransfer) add(ev.dataTransfer.files); }); });
  fl.addEventListener('click', function(ev){ var b = ev.target.closest('button'); if (!b) return; state.files.splice(+b.dataset.i, 1); draw(); });
  qf.addEventListener('submit', function(ev){ ev.preventDefault(); var m = qf.querySelector('#qmock'); m.textContent = ''; setTimeout(function(){ m.textContent = u.qtMock; }, 60); });
}

/* ═══ ROUTEUR : transition de page, et la position retrouvée au retour ═══ */
var main = document.getElementById('main'), first = true, idx = 0, positions = {}, pendingY = 0;
function mount(){
  var r = parse(), L = r.L;
  if (cleanup){ try { cleanup(); } catch(e){} cleanup = null; }
  var fn = r.sec === 'none' ? P.home : P[r.sec] || P.home;
  var pg = fn(L, r);
  chrome(r); setMenu(false);
  main.className = 'pg-' + (r.sec === 'none' ? 'home' : r.sec) + (r.slug ? ' detail' : '');
  main.innerHTML = pg.html;
  document.title = r.sec === 'home' || r.sec === 'none' ? pg.title : pg.title + ' | Cintube';
  meta('description', pg.desc); meta('og:title', document.title, 1); meta('og:description', pg.desc, 1); meta('og:locale', L === 'fr' ? 'fr_CA' : 'en_CA', 1);
  bind(main, r);
  var y = pendingY; pendingY = 0;
  var go = function(){ M.scrollTo(y); };
  go();
  var stops = [M.page(main)];
  /* le navigateur borne la position pendant que la page change : on la repose sur les images suivantes, la page est encore invisible */
  go(); requestAnimationFrame(go); setTimeout(go, 60); setTimeout(go, 200);
  var go3d = function(){ var s = window.PARTS3D && window.PARTS3D.mount(main); if (s) stops.push(s); };
  if (window.PARTS3D) go3d(); else addEventListener('parts3d-ready', go3d, { once:true });
  cleanup = function(){ removeEventListener('parts3d-ready', go3d); stops.forEach(function(f){ try { f(); } catch(e){} }); };
  var show = function(){ main.classList.add('in'); };
  requestAnimationFrame(function(){ requestAnimationFrame(show); }); setTimeout(show, 350);
  if (!first && !y){ var h = main.querySelector('h1'); if (h) h.focus({ preventScroll:true }); }
  first = false;
}
function render(){
  if (first || M.reduce){ mount(); return; }
  main.classList.remove('in'); main.classList.add('out');
  setTimeout(function(){ main.classList.remove('out'); mount(); }, 230);
}
/* chaque page visitée a son numéro dans l'historique ; on retient où l'on était avant de la quitter */
function leave(){ positions[idx] = scrollY; }
function navigate(hash){
  if (hash === location.hash) return;
  leave(); idx += 1; history.pushState({ i:idx }, '', hash); pendingY = 0; render();
}
addEventListener('popstate', function(ev){
  var st = ev.state && typeof ev.state.i === 'number' ? ev.state.i : null;
  leave();
  if (st === null){ idx += 1; history.replaceState({ i:idx }, '', location.href); pendingY = 0; }
  else { pendingY = positions[st] || 0; idx = st; }
  render();
});
addEventListener('hashchange', function(){ /* changement programmé (location.hash = …) : popstate l'a déjà traité */ });
document.addEventListener('click', function(ev){
  var a = ev.target.closest('a[href^="#"]');
  if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  if (a.closest('.seg')) return;
  var h = a.getAttribute('href'); if (h === '#') return;
  ev.preventDefault(); navigate(h);
});
document.addEventListener('click', function(ev){
  var t = ev.target;
  if (t.closest('.menu')){ setMenu(document.getElementById('drawer').hidden); return; }
  if (t.closest('.skip')){ var h = document.querySelector('#main h1'); if (h) h.focus(); return; }
  if (t.closest('#theme')){ var d = !M.isDark(); M.setTheme(d); var b = t.closest('#theme'), x = X[parse().L];
    b.innerHTML = d ? SUN : MOON; b.setAttribute('aria-label', d ? x.day : x.night); b.setAttribute('aria-pressed', d); return; }
  if (t.closest('#drawer a')) setMenu(false);
  var seg = t.closest('.seg a'); if (seg){ ev.preventDefault(); var w = +seg.dataset.way; seg.parentNode.querySelectorAll('a').forEach(function(a){ a.setAttribute('aria-pressed', a === seg ? 'true' : 'false'); });
    dispatchEvent(new CustomEvent('setway', { detail:w })); }
});
document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape') setMenu(false); });
history.replaceState({ i:0 }, '', location.href);
M.boot();
render();
})();
