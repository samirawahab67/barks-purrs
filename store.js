/* Barks & Purrs Co. — store front-end (vanilla JS, hash routing).
   Catalogue: catalog.js (BP_CATALOG). Bag, wishlist, recently viewed and demo orders persist in localStorage.
   Not connected: inventory, shipping rates, payments, order processing, accounts, newsletter — each is shown
   as a clearly labelled demo state. See BP_CATALOG.INTEGRATIONS for the integration points. */
(function () {
  'use strict';
  const K = window.BP_CATALOG, P = K.PRODUCTS, CF = K.CONFIG;
  const KEY = 'bp-store-v1';
  const APP_URL = 'https://claude.ai/artifact/4CJAnGY4j6wejphPJLQGeA'; // the Barks & Purrs app prototype
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IMG = (id) => `img/${id}.webp`, VID = (id) => `vid/${id}.mp4`, POS = (id) => `vid/${id}.webp`;
  const money = (n) => `EGP ${Math.round(n).toLocaleString('en-US')}`;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const prod = (id) => P.find((p) => p.id === id);
  const catOf = (id) => K.CATEGORIES.find((c) => c.id === id);
  const NAME_RE = /^[\p{L}][\p{L} .'\-]*$/u;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNew = (p) => p.added >= '2026-08-01';

  /* ---------- state ---------- */
  let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } })() || {};
  S = Object.assign({ bag: [], wish: [], recent: [], orders: [], news: '' }, S);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('This browser couldn’t save your bag.'); } };
  const UI = { route: '', q: {}, cf: null, gi: 0, qv: null, undo: null };

  /* ---------- icons ---------- */
  const sv = (d, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    menu: sv('<path d="M4 7h16M4 12h16M4 17h10"/>'), search: sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'), user: sv('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/>'),
    bag: sv('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'), theme: sv('<g class="moon"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></g><g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g>'), heart: sv('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    close: sv('<path d="m6 6 12 12M18 6 6 18"/>'), arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'), back: sv('<path d="M15 5l-7 7 7 7"/>'), chev: sv('<path d="m9 6 6 6-6 6"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'), play: sv('<path d="M8 5.5v13l10-6.5z"/>'), filter: sv('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    check: sv('<path d="m6 12.5 4 4L18 8"/>', 2), ext: sv('<path d="M8 16 16 8M10 8h6v6"/>'), phone: sv('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'), pen: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>')
  };
  const mk = (w, extra) => `<span class="mark" style="width:${w}px;${extra || ''}" aria-hidden="true"></span>`;

  /* ---------- shell ---------- */
  const app = document.getElementById('app');
  const NAV = [['#/shop', 'Shop All'], ['#/dogs', 'Dogs', 'Bark Co.'], ['#/cats', 'Cats', 'Purr Co.'], ['#/personalised', 'Personalised'], ['#/new', 'New Arrivals']];
  app.innerHTML = `
    <div class="announce" role="region" aria-label="Announcement"><span id="ann">Engraved to order, with their name.</span></div>
    <header class="hdr" id="hdr"><div class="wrap">
      <div class="left"><button class="ibtn" data-act="menu" aria-label="Open menu">${I.menu}</button><button class="ibtn" data-act="search" aria-label="Search">${I.search}</button></div>
      <a class="logo" href="#/" aria-label="Barks &amp; Purrs Co. home"><span class="wordmark"></span></a>
      <nav class="main" aria-label="Main">${NAV.map(([h, l, s]) => `<a href="${h}">${l}${s ? ` <small>· ${s}</small>` : ''}</a>`).join('')}<a class="appnav" href="${APP_URL}" target="_blank" rel="noopener">The App ${I.ext}</a></nav>
      <div class="right"><button class="ibtn themebtn" data-act="theme" aria-label="Switch between light and dark mode">${I.theme}</button><button class="ibtn acct-s" data-act="search" aria-label="Search" style="display:none">${I.search}</button><a class="ibtn acct" href="#/account" aria-label="Account">${I.user}</a><a class="ibtn" href="#/wishlist" aria-label="Wishlist" id="wishbtn">${I.heart}</a><button class="ibtn" data-act="bag" aria-label="Shopping bag" id="bagbtn">${I.bag}</button></div>
    </div></header>
    <main id="view" tabindex="-1"></main>
    <footer id="foot"></footer>
    <div class="scrim" id="scrim" data-act="closeall"></div>
    <aside class="drawer left" id="menu" aria-label="Menu" aria-hidden="true"></aside>
    <aside class="drawer right" id="bagd" aria-label="Shopping bag" aria-hidden="true"></aside>
    <div class="searchpanel" id="search" role="dialog" aria-label="Search" aria-hidden="true"></div>
    <div class="modal" id="modal" role="dialog" aria-modal="true" aria-hidden="true"></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  const $ = (id) => document.getElementById(id);
  (function initTheme() { let t = null; try { t = localStorage.getItem('bp-store-theme'); } catch (e) { /* ignore */ } if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; })();
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const view = $('view');
  if (matchMedia('(min-width:1100px)').matches) document.querySelector('.acct-s').style.display = 'grid';
  matchMedia('(min-width:1100px)').addEventListener('change', (m) => { document.querySelector('.acct-s').style.display = m.matches ? 'grid' : 'none'; });
  addEventListener('scroll', () => $('hdr').classList.toggle('scrolled', scrollY > 10), { passive: true });
  const anns = ['Engraved to order, with their name.', 'Two Natures. One House.'];
  let ai = 0; setInterval(() => { const a = $('ann'); a.style.opacity = 0; setTimeout(() => { ai = (ai + 1) % anns.length; a.textContent = anns[ai]; a.style.opacity = .9; }, 400); }, 6000);
  $('ann').style.transition = 'opacity .4s';

  function counts() {
    const n = S.bag.reduce((a, b) => a + b.qty, 0);
    $('bagbtn').innerHTML = `${I.bag}${n ? `<span class="count">${n}</span>` : ''}`; $('bagbtn').setAttribute('aria-label', `Shopping bag${n ? `, ${n} item${n > 1 ? 's' : ''}` : ''}`);
    $('wishbtn').innerHTML = `${I.heart}${S.wish.length ? `<span class="count">${S.wish.length}</span>` : ''}`;
  }

  /* ---------- toast / overlays ---------- */
  let tt;
  function toast(msg, undo) { const t = $('toast'); t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-act="undo">Undo</button>' : ''}`; UI.undo = undo || null; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), undo ? 5000 : 2800); }
  let lastFocus = null;
  function openLayer(id) {
    closeAll(true); lastFocus = document.activeElement; const el = $(id); el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); $('scrim').classList.add('on'); document.body.classList.add('lock');
    setTimeout(() => { const f = el.querySelector('input,button,a,select'); if (f) f.focus(); }, 60);
  }
  function closeAll(silent) {
    ['menu', 'bagd', 'search', 'modal'].forEach((id) => { const el = $(id); if (el.classList.contains('on')) { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); } });
    $('scrim').classList.remove('on'); document.body.classList.remove('lock');
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  function menuHTML() {
    return `<div class="dh"><span class="wordmark" style="width:150px" aria-hidden="true"></span><button class="ibtn" data-act="closeall" aria-label="Close menu">${I.close}</button></div>
      <div class="db"><nav class="mnav" aria-label="Mobile">${NAV.map(([h, l, s]) => `<a href="${h}">${l}${s ? `<small>${s}</small>` : I.chev.replace('<svg', '<svg width="18"')}</a>`).join('')}
        <a href="#/create">Create Your Piece<small>Configurator</small></a><a href="${APP_URL}" target="_blank" rel="noopener">The App<small>Opens in a new tab ↗</small></a></nav>
        <div style="margin-top:28px" class="eyebrow">Categories</div>
        <div class="mnav" style="margin-top:6px">${K.CATEGORIES.filter((c) => P.some((p) => p.category === c.id)).map((c) => `<a href="#/c/${c.id}" style="font-size:16px">${c.name}<small>${P.filter((p) => p.category === c.id).length}</small></a>`).join('')}</div></div>
      <div class="df"><div class="row" style="justify-content:space-between"><a href="#/account" class="row" style="gap:8px">${I.user.replace('<svg', '<svg width="20"')} Account</a><a href="#/wishlist" class="row" style="gap:8px">${I.heart.replace('<svg', '<svg width="20"')} Wishlist (${S.wish.length})</a></div></div>`;
  }

  /* ---------- bag ---------- */
  const subtotal = () => S.bag.reduce((a, b) => a + b.price * b.qty, 0);
  function bagItem(b, i, compact) {
    const p = prod(b.pid);
    return `<div class="bi"><a href="#/p/${b.pid}"><img src="${IMG(b.img)}" alt=""></a><div class="b">
      <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><a href="#/p/${b.pid}"><b>${esc(b.name)}</b></a><span class="num small">${money(b.price * b.qty)}</span></div>
      ${b.opts ? `<span class="cfgline">${esc(b.opts)}</span>` : ''}
      ${b.pers ? `<span class="pers">${esc(b.pers.summary)}</span>${b.pers.lines ? `<span class="cfgline">${esc(b.pers.lines)}</span>` : ''}` : ''}
      <div class="row" style="justify-content:space-between;margin-top:6px"><div class="qty sm"><button data-act="bqty" data-i="${i}" data-n="-1" aria-label="Decrease quantity">−</button><span class="num">${b.qty}</span><button data-act="bqty" data-i="${i}" data-n="1" aria-label="Increase quantity">+</button></div>
        <span class="row small" style="gap:14px">${b.pers && b.pers.type !== 'label' ? `<a class="link" href="#/create?edit=${b.key}" data-act="closeall">Edit</a>` : (p && (p.sizes.length > 1 || p.colours.length > 1 || b.pers)) ? `<button class="link" data-act="bedit" data-i="${i}">Edit</button>` : ''}<button class="link" data-act="brm" data-i="${i}">Remove</button></span></div></div></div>`;
  }
  function bagHTML() {
    const sub = subtotal();
    return `<div class="dh"><h2>Your bag</h2><button class="ibtn" data-act="closeall" aria-label="Close bag">${I.close}</button></div>
      <div class="db">${S.bag.length ? S.bag.map((b, i) => bagItem(b, i)).join('') : `<div class="empty" style="margin-top:10px">${mk(40)}<p>Your bag is empty. Considered pieces are waiting.</p><a class="btn sm" href="#/shop" data-act="closeall">Shop the collection</a></div>`}</div>
      ${S.bag.length ? `<div class="df"><div class="tot"><div><span class="muted">Subtotal</span><span>${money(sub)}</span></div><div class="small muted"><span>Delivery</span><span>At checkout</span></div></div>
        <a class="btn block" href="#/checkout" data-act="closeall">Checkout · ${money(sub)}</a><a class="btn ghost block" href="#/bag" data-act="closeall">View bag</a><span class="hint" style="text-align:center;font-size:12px">Sample prices · demo checkout</span></div>` : ''}`;
  }
  function addToBag(item) {
    const same = S.bag.find((b) => !item.pers && !b.pers && b.pid === item.pid && b.opts === item.opts);
    if (same) same.qty = Math.min(9, same.qty + item.qty); else S.bag.push(Object.assign({ key: uid() }, item));
    save(); counts(); $('bagd').innerHTML = bagHTML(); openLayer('bagd');
  }

  /* ---------- product card ---------- */
  function swatches(p) {
    if (p.colours.length) return `<span class="sws" aria-label="${p.colours.length} colour${p.colours.length > 1 ? 's' : ''}">${p.colours.slice(0, 4).map((c) => `<i style="background:${c.hex}" title="${esc(c.name)}"></i>`).join('')}${p.sizes.length > 1 ? `<small>${p.sizes.length} sizes</small>` : ''}</span>`;
    return p.sizes.length > 1 ? `<small class="muted">${p.sizes.length} sizes</small>` : '';
  }
  function card(p) {
    const w = S.wish.includes(p.id), conf = p.personalise && p.personalise !== 'label', badge = p.personalise ? 'Personalised' : isNew(p) ? 'New' : '';
    return `<article class="pc fade">
      <div class="pimg"><a class="ph" href="#/p/${p.id}" aria-label="${esc(p.name)}"><img src="${IMG(p.img)}" alt="" loading="lazy">${p.hover ? `<img class="h" src="${IMG(p.hover)}" alt="" loading="lazy">` : ''}</a>
      <button class="wish" data-act="wish" data-id="${p.id}" aria-pressed="${w}" aria-label="${w ? 'Remove from' : 'Add to'} wishlist">${I.heart.replace('<svg', '<svg width="17" height="17"')}</button>
      <button class="qa" data-act="quick" data-id="${p.id}" aria-label="${conf ? 'Personalise' : 'Quick add'} ${esc(p.name)}">${conf ? 'Personalise' : 'Quick add'}</button></div>
      <a href="#/p/${p.id}" class="pc-t">${badge ? `<span class="badge">${badge}</span>` : ''}<span class="nm">${esc(p.name)}</span><span class="det">${esc(p.detail)}</span><span class="pr num">${conf ? 'From ' : ''}${money(p.price)}${p.colours.length > 1 ? `<span class="sws">${p.colours.slice(0, 4).map((c) => `<i style="background:${c.hex}" title="${esc(c.name)}"></i>`).join('')}</span>` : ''}</span></a></article>`;
  }

  /* ---------- search ---------- */
  const TERMS = ['Collar', 'Gold-tone', 'Velvet', 'Cat', 'Personalised', 'Bandana', 'Gift'];
  function searchIdx(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const words = q.split(/\s+/);
    return P.map((p) => {
      const hay = [p.name, catOf(p.category).name, p.material, p.detail, p.desc, p.colours.map((c) => c.name).join(' '), p.nature.map((n) => (n === 'dog' ? 'dog dogs bark co puppy' : 'cat cats purr co kitten')).join(' '), p.personalise ? 'personalised personalized engraved engraving custom name' : '', p.bundle ? 'gift set box' : ''].join(' ').toLowerCase();
      let s = 0; words.forEach((w) => { if (p.name.toLowerCase().includes(w)) s += 3; if (hay.includes(w)) s += 1; else if (w.length > 3 && hay.includes(w.slice(0, -1))) s += .5; else s -= 5; });
      return { p, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.p.pop - a.p.pop).map((x) => x.p);
  }
  function searchHTML(q) {
    const res = searchIdx(q || ''), cats = q ? K.CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim())) : [];
    return `<div class="wrap" style="padding-top:12px;padding-bottom:28px">
      <form class="sbar" id="sform" role="search">${I.search}<label class="sr" for="sq">Search the store</label><input id="sq" type="search" placeholder="Search collars, velvet, cats…" value="${esc(q || '')}" autocomplete="off"><button type="button" class="ibtn" data-act="closeall" aria-label="Close search">${I.close}</button></form>
      <div id="sres" style="padding-top:22px">${searchResults(q, res, cats)}</div></div>`;
  }
  function searchResults(q, res, cats) {
    if (!q) return `<div class="eyebrow" style="margin-bottom:12px">Popular searches</div><div class="row">${TERMS.map((t) => `<button class="chip" data-act="sterm" data-t="${t}">${t}</button>`).join('')}</div>
      ${S.recent.length ? `<div class="eyebrow" style="margin:26px 0 12px">Recently viewed</div><div class="hscroll">${S.recent.slice(0, 4).map((id) => prod(id)).filter(Boolean).map(card).join('')}</div>` : ''}`;
    return `${cats.length ? `<div class="row" style="margin-bottom:18px">${cats.map((c) => `<a class="chip" href="#/c/${c.id}" data-act="closeall">${c.name} ${I.arrow.replace('<svg', '<svg width="14"')}</a>`).join('')}</div>` : ''}
      ${res.length ? `<div class="row" style="justify-content:space-between;margin-bottom:14px"><span class="eyebrow">${res.length} result${res.length > 1 ? 's' : ''}</span><a class="link small" href="#/search?q=${encodeURIComponent(q)}" data-act="closeall">See all</a></div><div class="hscroll">${res.slice(0, 6).map(card).join('')}</div>`
      : `<div class="empty">${mk(36)}<p>Nothing found for “${esc(q)}”. Try “collar”, “velvet” or “cat”.</p></div>`}`;
  }

  /* ---------- quick view ---------- */
  function quickView(id, editIdx) {
    const p = prod(id); if (!p) return;
    if (p.personalise && p.personalise !== 'label') { closeAll(true); location.hash = `#/create?type=${p.personalise}`; return; }
    const ed = editIdx != null ? S.bag[editIdx] : null;
    UI.qv = { id, size: ed ? ed.size : p.sizes.length === 1 ? p.sizes[0] : '', colour: ed ? ed.colour : (p.colours[0] || {}).name || '', qty: ed ? ed.qty : 1, label: ed && ed.pers ? ed.pers.name : '', edit: editIdx };
    paintQV(); openLayer('modal');
  }
  function optionsHTML(p, st, scope) {
    return `${p.colours.length ? `<div><div class="opt-h"><b>Colour</b><span class="muted">${esc(st.colour)}</span></div><div class="row" style="gap:12px">${p.colours.map((c) => `<button class="swatch" style="background:${c.hex}" data-act="${scope}col" data-v="${esc(c.name)}" aria-pressed="${st.colour === c.name}" aria-label="${esc(c.name)}"></button>`).join('')}</div></div>` : ''}
      ${p.sizes.length ? `<div><div class="opt-h"><b>Size</b>${p.sizes.length > 1 ? '<a class="link muted" href="#/page/faq">Size guidance</a>' : ''}</div><div class="row" style="gap:8px">${p.sizes.map((s) => `<button class="chip" data-act="${scope}size" data-v="${esc(s)}" aria-pressed="${st.size === s}">${esc(s)}</button>`).join('')}</div>${st.err === 'size' ? '<span class="err" style="display:block;margin-top:8px">Choose a size.</span>' : ''}</div>` : ''}
      ${p.personalise === 'label' ? `<div class="field"><label for="${scope}-label">Their name, stitched on the label</label><input class="input" id="${scope}-label" maxlength="${CF.labelMax}" value="${esc(st.label)}" placeholder="e.g. Bella" ${st.err === 'label' ? 'aria-invalid="true"' : ''}><div class="row" style="justify-content:space-between">${st.err === 'label' ? '<span class="err">Add a name using letters.</span>' : '<span class="hint">Up to 12 letters.</span>'}<span class="counter" data-for="${scope}-label">${st.label.length}/${CF.labelMax}</span></div></div>` : ''}`;
  }
  function paintQV() {
    const q = UI.qv, p = prod(q.id);
    $('modal').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
      <div style="aspect-ratio:4/5;background:var(--ivory)"><img src="${IMG(p.img)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>
      <div style="padding:28px;display:grid;gap:18px;align-content:start"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span class="eyebrow">${catOf(p.category).name}</span><button class="ibtn" data-act="closeall" aria-label="Close">${I.close}</button></div>
        <h2 style="font-size:28px;line-height:1.15">${esc(p.name)}</h2><span class="num" style="font-size:18px">${money(p.price)}</span><p class="serif" style="font-size:19px;color:var(--muted);line-height:1.3">${esc(p.detail)}</p>
        ${optionsHTML(p, q, 'qv')}
        <div class="row" style="flex-wrap:nowrap"><div class="qty"><button data-act="qvqty" data-n="-1" aria-label="Decrease quantity">−</button><span class="num">${q.qty}</span><button data-act="qvqty" data-n="1" aria-label="Increase quantity">+</button></div><button class="btn" style="flex:1" data-act="qvadd">${q.edit != null ? 'Update bag' : 'Add to bag'}</button></div>
        <a class="link small" href="#/p/${p.id}" data-act="closeall">View full details</a></div></div>`;
    bindCounters();
  }
  function readSel(st, p, scope) {
    st.err = '';
    const lb = $(`${scope}-label`); if (lb) st.label = lb.value.trim();
    if (p.sizes.length > 1 && !st.size) st.err = 'size';
    else if (p.personalise === 'label' && (!st.label || !NAME_RE.test(st.label))) st.err = 'label';
    return !st.err;
  }
  function lineFrom(p, st) {
    return { pid: p.id, name: p.name, img: p.img, price: p.price, qty: st.qty, size: st.size, colour: st.colour, opts: [p.colours.length > 1 ? st.colour : '', p.sizes.length > 1 ? `Size ${st.size}` : ''].filter(Boolean).join(' · '), pers: p.personalise === 'label' ? { type: 'label', name: st.label, summary: `“${st.label}” on the label` } : null };
  }
  function bindCounters() { document.querySelectorAll('.counter[data-for]').forEach((c) => { const i = $(c.dataset.for); if (i) i.oninput = () => { c.textContent = `${i.value.length}/${i.maxLength}`; }; }); }

  /* ================= VIEWS ================= */
  const V = {};
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a>${items.map(([h, l]) => `<span aria-hidden="true">/</span>${h ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}`).join('')}</nav>`;
  const vid = (id, extra) => `<video src="${VID(id)}" poster="${POS(id)}" autoplay muted loop playsinline preload="metadata" ${extra || ''}></video>`;

  /* ---------- detail helpers (hotspots, crops) ---------- */
  const HS = K.HOTSPOTS || {};
  const hotspots = (imgId, scope) => (HS[imgId] || []).map((h, i) => `<button class="hs" style="left:${h.x}%;top:${h.y}%" data-act="hs" data-scope="${scope}" data-img="${imgId}" data-i="${i}" aria-label="Detail: ${esc(h.t)}"><span>${i + 1}</span></button>`).join('');
  const crop = (imgId, h) => `<div class="crop"><img src="${IMG(imgId)}" alt="" loading="lazy" style="transform-origin:${h.x}% ${h.y}%;transform:scale(${h.z + .6})"></div>`;

  V.home = () => {
    const story = HS.p02;
    const gallery = ['estate-collar', 'signature-cat-collar', 'ampersand-plush', 'estate-lead', 'velvet-bed', 'name-tag', 'gold-bowl'].map(prod);
    const cats = K.CATEGORIES.filter((c) => P.some((p) => p.category === c.id)).slice(0, 6);
    return `
    <section class="cine" data-scrub="cine"><div class="pin">
      <div class="frame">${vid('dog-chair')}<div class="shade"></div></div>
      <div class="cine-t"><span class="eyebrow">The House Collection</span><h1 class="display">Two Natures.<span class="s">One House.</span></h1>
        <p>Considered essentials for the ones who make a house feel like home.</p>
        <div class="ctas"><a class="btn cream" href="#/shop">Shop the Collection</a><a class="btn line-cream" href="#/personalised">Explore Personalisation</a></div></div>
      <span class="cue" aria-hidden="true">Scroll</span></div></section>

    <section class="story" data-scrub="story" style="--n:${story.length + 1}"><div class="pin">
      <div class="st-media"><div class="st-zoom" id="stz"><img src="${IMG('p02')}" alt="Golden dog wearing The Estate Collar with an engraved bone tag">${story.map((h, i) => `<i class="st-dot" style="left:${h.x}%;top:${h.y}%" data-i="${i}"></i>`).join('')}</div>
        <div class="st-seal" id="stseal">${hallmarkSVG('Fluffy', new Date().getFullYear())}</div></div>
      <div class="st-copy"><span class="eyebrow">The Estate Collar · in detail</span>
        <div class="st-steps">${story.map((h, i) => `<div class="st-step" data-i="${i}"><span class="n">0${i + 1}</span><h3>${esc(h.t)}</h3><p>${esc(h.d)}</p></div>`).join('')}<div class="st-step" data-i="${story.length}"><span class="n">0${story.length + 1}</span><h3>The hallmark</h3><p>Our ampersand, their name and the year, struck on the reverse. The maker’s signature on every personalised piece.</p></div></div>
        <div class="st-prog">${[...story, 0].map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
        <a class="arrowlink" href="#/p/estate-collar">Discover The Estate Collar ${I.arrow}</a></div>
    </div></section>

    <section class="mx-nature">
      <a class="mx-n rv" href="#/dogs"><img src="${IMG('p02')}" alt="" loading="lazy"><div class="lbl"><div><b>Bark Co.</b><span class="finish" style="--dot:var(--gold)">For dogs · gold-tone details</span></div><i>${I.arrow}</i></div></a>
      <a class="mx-n rv" href="#/cats"><img src="${IMG('p03')}" alt="" loading="lazy"><div class="lbl"><div><b>Purr Co.</b><span class="finish" style="--dot:var(--silver)">For cats · silver-tone details</span></div><i>${I.arrow}</i></div></a>
    </section>

    <section class="hg" data-scrub="hg"><div class="pin">
      <div class="hg-h wrap"><div><span class="eyebrow">The collection, in detail</span><h2 class="display">Pieces worth a closer look</h2></div><span class="hg-count num" id="hgc">01 / ${String(gallery.length).padStart(2, '0')}</span></div>
      <div class="hg-track" id="hgt">${gallery.map((p, i) => `<article class="hg-item"><a class="hg-ph" href="#/p/${p.id}" data-cursor="Discover"><img src="${IMG(p.img)}" alt="${esc(p.name)}" loading="lazy">${p.hover ? `<img class="h" src="${IMG(p.hover)}" alt="" loading="lazy">` : ''}</a>
        <div class="hg-t"><span class="num faint">${String(i + 1).padStart(2, '0')}</span><div><a href="#/p/${p.id}"><b>${esc(p.name)}</b></a><span>${esc(p.detail)}</span></div><span class="num">${p.personalise && p.personalise !== 'label' ? 'From ' : ''}${money(p.price)}</span></div></article>`).join('')}
        <a class="hg-end" href="#/shop"><span class="display">Shop all</span>${I.arrow}</a></div>
      <div class="hg-bar wrap"><i id="hgb"></i></div></div></section>

    <section class="mx-band"><div class="wrap in2">
      <div class="stage rv" id="hstage">${tagPreview('Bella', 'gold')}</div>
      <div class="fade"><span class="eyebrow">Signature personalisation</span><h2 class="display">Made for them. <span class="s">Marked as theirs.</span></h2>
        <p>Every collar and tag is engraved to order, then finished with the house hallmark on the reverse.</p>
        <div class="try"><label class="sr" for="htry">Try their name</label><input id="htry" maxlength="${CF.nameMax}" placeholder="Try their name" autocomplete="off">
          <div class="fin" role="group" aria-label="Finish"><button data-act="hfin" data-f="gold" aria-pressed="true"><i class="metal-gold"></i>Gold-tone</button><button data-act="hfin" data-f="silver" aria-pressed="false"><i class="metal-silver"></i>Silver-tone</button></div></div>
        <a class="btn cream" href="#/create">Create Your Piece</a></div></div></section>

    <section class="appsec"><div class="wrap appin">
      <div class="fade"><span class="eyebrow">The Barks &amp; Purrs App</span><h2 class="display">Their world, <span class="s">in your pocket.</span></h2>
        <p>A little world built around them: their routine, care reminders, birthdays and memories, the Collar Atelier, and a community of pets and their people.</p>
        <ul class="appfeat"><li><b>Their day</b><span>Walks, meals, play and rest, made for dogs or cats.</span></li><li><b>Care, considered</b><span>Vet dates and reminders you set, never invented.</span></li><li><b>The Atelier</b><span>Commission a collar and watch it come to life.</span></li><li><b>Life, together</b><span>Stories, meet-ups and pet-friendly places.</span></li></ul>
        <div class="row" style="gap:14px"><a class="btn" href="${APP_URL}" target="_blank" rel="noopener">${I.phone} Open the app</a><span class="hint">Interactive prototype · opens in a new tab</span></div></div>
      <div class="phones" aria-hidden="true">
        <div class="ph2 back rv"><img src="${IMG('app-community')}" alt="" loading="lazy"></div>
        <div class="ph2 front rv"><img src="${IMG('app-home')}" alt="" loading="lazy"></div>
        <div class="ph2 side rv"><img src="${IMG('app-atelier')}" alt="" loading="lazy"></div>
      </div></div></section>

    <section class="wrap sec"><div class="mx-rail-h fade"><div><span class="eyebrow">The collections</span><h2 class="display">Shop by category</h2></div><a class="tlink" href="#/shop">Shop all</a></div>
      <div class="mx-cats">${cats.map((c) => `<a class="mx-cat" href="#/c/${c.id}"><div class="ph rv"><img src="${IMG(c.img)}" alt="" loading="lazy"></div><div class="t"><b>${c.name}</b><span>${P.filter((p) => p.category === c.id).length} pieces</span></div></a>`).join('')}</div></section>

    <section class="wrap sec" style="padding-top:0"><div class="mx-life">
        <figure class="rv">${vid('paw-ball')}<figcaption><span>The Ampersand Plush</span><a href="#/p/ampersand-plush">Shop</a></figcaption></figure>
        <figure class="rv"><img src="${IMG('p35')}" alt="" loading="lazy"><figcaption><span>Velvet Round Bed</span><a href="#/p/velvet-bed">Shop</a></figcaption></figure>
        <figure class="rv">${vid('cat-groom')}<figcaption><span>The Ivory Bandana</span><a href="#/p/ivory-bandana">Shop</a></figcaption></figure>
      </div></section>`;
  };

  /* ---- listing ---- */
  const PRICES = [['u1500', 'Under EGP 1,500', 0, 1499], ['1500-3500', 'EGP 1,500 – 3,500', 1500, 3500], ['3500-7000', 'EGP 3,500 – 7,000', 3501, 7000], ['o7000', 'Over EGP 7,000', 7001, 1e9]];
  const SORTS = [['featured', 'Featured'], ['new', 'Newest'], ['pop', 'Most popular'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']];
  const multi = (v) => (v ? v.split(',').filter(Boolean) : []);
  function listing(base, title, intro, banner, eyebrow, crumb) {
    const q = UI.q, f = { pet: multi(q.pet), cat: multi(q.cat), size: multi(q.size), col: multi(q.col), mat: multi(q.mat), price: multi(q.price), avail: multi(q.avail) };
    const pool = P.filter(base);
    const apply = (skip) => pool.filter((p) => (skip === 'pet' || !f.pet.length || f.pet.some((x) => p.nature.includes(x)))
      && (skip === 'cat' || !f.cat.length || f.cat.includes(p.category))
      && (skip === 'size' || !f.size.length || f.size.some((s) => p.sizes.includes(s)))
      && (skip === 'col' || !f.col.length || f.col.some((c) => p.colours.some((x) => x.name === c)))
      && (skip === 'mat' || !f.mat.length || f.mat.includes(p.material))
      && (skip === 'price' || !f.price.length || f.price.some((k) => { const r = PRICES.find((x) => x[0] === k); return p.price >= r[2] && p.price <= r[3]; }))
      && (skip === 'avail' || !f.avail.length || f.avail.includes(p.availability)));
    let res = apply();
    const sort = q.sort || 'featured';
    res = res.slice().sort(sort === 'new' ? (a, b) => b.added.localeCompare(a.added) : sort === 'pop' ? (a, b) => b.pop - a.pop : sort === 'price-asc' ? (a, b) => a.price - b.price : sort === 'price-desc' ? (a, b) => b.price - a.price : (a, b) => (b.pop + (b.personalise ? 15 : 0)) - (a.pop + (a.personalise ? 15 : 0)));
    const facet = (key, label, values, fmt) => { const opts = values.filter((v) => v.n > 0 || f[key].includes(v.v)); if (opts.length < 2 && !f[key].length) return ''; return `<div class="fgroup"><h4>${label}</h4>${opts.map((o) => `<label class="check"><input type="checkbox" data-act="fset" data-k="${key}" value="${esc(o.v)}" ${f[key].includes(o.v) ? 'checked' : ''}>${fmt ? fmt(o) : esc(o.l || o.v)}<small>${o.n}</small></label>`).join('')}</div>`; };
    const cnt = (key, test) => apply(key).filter(test).length;
    const sizes = [...new Set(pool.flatMap((p) => p.sizes))], cols = [...new Map(pool.flatMap((p) => p.colours).map((c) => [c.name, c])).values()];
    const filters = facet('pet', 'Pet', [{ v: 'dog', l: 'Dogs · Bark Co.' }, { v: 'cat', l: 'Cats · Purr Co.' }].map((o) => Object.assign(o, { n: cnt('pet', (p) => p.nature.includes(o.v)) })))
      + facet('cat', 'Category', K.CATEGORIES.map((c) => ({ v: c.id, l: c.name, n: cnt('cat', (p) => p.category === c.id) })))
      + facet('size', 'Size', sizes.map((s) => ({ v: s, n: cnt('size', (p) => p.sizes.includes(s)) })))
      + facet('col', 'Colour', cols.map((c) => ({ v: c.name, hex: c.hex, n: cnt('col', (p) => p.colours.some((x) => x.name === c.name)) })), (o) => `<span class="row" style="gap:8px"><i style="width:14px;height:14px;border-radius:50%;background:${o.hex};border:1px solid var(--line-2)"></i>${esc(o.v)}</span>`)
      + facet('mat', 'Material', K.MATERIALS.map((m) => ({ v: m, n: cnt('mat', (p) => p.material === m) })))
      + facet('price', 'Price', PRICES.map(([k, l, a, b]) => ({ v: k, l, n: cnt('price', (p) => p.price >= a && p.price <= b) })))
      + facet('avail', 'Availability', [{ v: 'ready', l: 'Ready to ship (sample)' }, { v: 'made', l: 'Made to order' }].map((o) => Object.assign(o, { n: cnt('avail', (p) => p.availability === o.v) })));
    UI.filtersHTML = filters;
    const active = Object.entries(f).flatMap(([k, vs]) => vs.map((v) => [k, v]));
    const lab = (k, v) => (k === 'pet' ? (v === 'dog' ? 'Dogs' : 'Cats') : k === 'cat' ? catOf(v).name : k === 'price' ? PRICES.find((x) => x[0] === v)[1] : k === 'avail' ? (v === 'made' ? 'Made to order' : 'Ready to ship') : v);
    return `<div class="wrap">${crumbs(crumb || [['', title]])}
      ${banner ? `<div class="lbanner fade">${banner}</div>` : ''}
      <header class="lhead">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}<h1>${title}</h1>${intro ? `<p>${intro}</p>` : ''}</header>
      <div class="toolbar"><div class="row" style="gap:10px"><button class="btn ghost sm fbtn" data-act="filters">${I.filter} Filter${active.length ? ` (${active.length})` : ''}</button><span class="small muted num" id="rcount">${res.length} piece${res.length !== 1 ? 's' : ''}</span></div>
        <label class="row small" style="gap:8px"><span class="muted">Sort</span><select data-act="sort" aria-label="Sort products">${SORTS.map(([k, l]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      ${active.length ? `<div class="chipline">${active.map(([k, v]) => `<button class="chip" data-act="fclear" data-k="${k}" data-v="${esc(v)}" aria-label="Remove filter ${esc(lab(k, v))}">${esc(lab(k, v))} ${I.close.replace('<svg', '<svg width="13"')}</button>`).join('')}<button class="link small" data-act="fclearall">Clear all</button></div>` : ''}
      <div class="lay"><aside class="side" aria-label="Filters">${filters}</aside>
        <div id="results">${res.length ? `<div class="grid">${res.map(card).join('')}</div>` : `<div class="empty">${mk(40)}<p>No pieces match these filters. Try removing one, or browse everything.</p><div class="row"><button class="btn sm" data-act="fclearall">Clear filters</button><a class="btn ghost sm" href="#/shop">Shop all</a></div></div>`}</div></div></div>`;
  }
  V.shop = () => listing(() => true, 'Shop All', 'Every piece in the house, for dogs and for cats.');
  V.dogs = () => listing((p) => p.nature.includes('dog'), 'Bark Co.', 'Warm, confident pieces for dogs: full-grain leather, gold-tone hardware, and toys made to be carried home.', vid('dachshund'), 'For dogs', [['', 'Dogs · Bark Co.']]);
  V.cats = () => listing((p) => p.nature.includes('cat'), 'Purr Co.', 'Quiet, curious pieces for cats: slim collars with safety buckles, shallow bowls and soft places to disappear.', vid('cat-bed2'), 'For cats', [['', 'Cats · Purr Co.']]);
  V.new = () => listing((p) => isNew(p) || p.added >= '2026-06-01', 'New Arrivals', 'The latest pieces from the house.', '', 'Just in', [['', 'New Arrivals']]);
  V.c = (id) => { const c = catOf(id); if (!c) return V.notfound(); return listing((p) => p.category === id, c.name, c.blurb, '', 'Collection', [['#/shop', 'Shop'], ['', c.name]]); };
  V.search = () => { const q = UI.q.q || ''; const ids = searchIdx(q).map((p) => p.id); return listing((p) => ids.includes(p.id), q ? `“${esc(q)}”` : 'Search', q ? `${ids.length} result${ids.length !== 1 ? 's' : ''} for your search.` : 'Search by name, category, material or pet.', '', 'Search', [['', 'Search']]); };

  V.personalised = () => {
    const items = P.filter((p) => p.personalise);
    return `<div class="wrap">${crumbs([['', 'Personalised']])}
      <section class="mx-band fade" style="margin-top:8px;border-radius:var(--r);overflow:hidden"><div class="in2" style="padding-left:clamp(20px,4vw,64px);padding-right:clamp(20px,4vw,64px)"><div style="display:grid;gap:18px;justify-items:start"><span class="eyebrow">Personalisation</span><h2 class="display">Their name, <span class="s">engraved.</span></h2><p>Every personalised piece is made to order. Choose the piece, the leather and the finish, then tell us their name. We engrave it and strike the house hallmark on the reverse.</p><div class="row"><a class="btn cream" href="#/create">Create Your Piece</a></div></div>
        <div class="stage">${tagPreview('Max', 'silver')}</div></div></section>
      <section class="sec" style="padding-top:64px"><div class="sh"><h2>How it works</h2></div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${[['Choose the piece', 'Estate, Heritage or Signature Cat collar, or a tag on its own.'], ['Size & leather', 'Measure their neck and add two fingers. Choose from the leathers each collar is made in.'], ['Finish', 'Gold-tone or silver-tone hardware and tag.'], ['Engraving', `Their name on the front, up to ${CF.nameMax} characters; contact details on the reverse if you like.`], ['Review & add', 'Check every detail and the price before it goes in your bag.']].map(([t, d], i) => `<div class="fade" style="display:grid;gap:8px;padding-top:18px;border-top:1px solid var(--line)"><span style="font-size:13px;font-weight:600;letter-spacing:.1em;color:var(--accent)">0${i + 1}</span><b style="font-weight:500">${t}</b><span class="muted small">${d}</span></div>`).join('')}</div></section>
      <section><div class="sh"><h2>Personalised pieces</h2></div><div class="grid g4">${items.map(card).join('')}</div></section></div>`;
  };

  /* ---- product page ---- */
  V.p = (id) => {
    const p = prod(id); if (!p) return V.notfound();
    S.recent = [id, ...S.recent.filter((x) => x !== id)].slice(0, 10); save();
    if (!UI.pv || UI.pv.id !== id) UI.pv = { id, size: p.sizes.length === 1 ? p.sizes[0] : '', colour: (p.colours[0] || {}).name || '', qty: 1, label: '', err: '' };
    const st = UI.pv, media = [...p.gallery.map((g) => ({ t: 'img', id: g })), ...(p.video ? [{ t: 'vid', id: p.video }] : [])];
    const gi = Math.min(UI.gi || 0, media.length - 1), m = media[gi];
    const w = S.wish.includes(id), c = catOf(p.category);
    const related = P.filter((x) => x.id !== id && (x.category === p.category || x.nature.some((n) => p.nature.includes(n)))).sort((a, b) => (b.category === p.category) - (a.category === p.category) || b.pop - a.pop).slice(0, 4);
    const recent = S.recent.filter((x) => x !== id).map(prod).filter(Boolean).slice(0, 4);
    const conf = p.personalise && p.personalise !== 'label';
    return `<div class="wrap">${crumbs([[p.nature.length > 1 ? '#/shop' : p.nature[0] === 'dog' ? '#/dogs' : '#/cats', p.nature.length > 1 ? 'Shop' : p.nature[0] === 'dog' ? 'Bark Co.' : 'Purr Co.'], [`#/c/${c.id}`, c.name], ['', p.name]])}
      <div class="pdp">
        <div class="gal"><div class="main ${m.t === 'img' ? 'zoomable' : ''}" id="gmain">${m.t === 'vid' ? vid(m.id) : `<img src="${IMG(m.id)}" alt="${esc(p.name)}">${hotspots(m.id, 'pdp')}<div class="hs-card" id="hscard" hidden></div>`}${media.length > 1 ? `<div class="arrows"><button data-act="gnav" data-n="-1" aria-label="Previous image">${I.back.replace('<svg', '<svg width="18"')}</button><button data-act="gnav" data-n="1" aria-label="Next image">${I.chev.replace('<svg', '<svg width="18"')}</button></div>` : ''}</div>
          ${media.length > 1 ? `<div class="thumbs" role="group" aria-label="Gallery">${media.map((x, i) => `<button data-act="gsel" data-i="${i}" aria-pressed="${i === gi}" aria-label="${x.t === 'vid' ? 'Video' : `Image ${i + 1}`}"><img src="${x.t === 'vid' ? POS(x.id) : IMG(x.id)}" alt="">${x.t === 'vid' ? `<span class="pl">${I.play.replace('<svg', '<svg width="18"')}</span>` : ''}</button>`).join('')}</div>` : ''}</div>
        <div class="info">
          <div style="display:grid;gap:10px"><span class="eyebrow">${p.nature.length > 1 ? 'Dogs & cats' : p.nature[0] === 'dog' ? 'Bark Co. · For dogs' : 'Purr Co. · For cats'}${p.personalise ? ' · Personalised' : ''}</span><h1>${esc(p.name)}</h1><span class="price num">${conf ? 'From ' : ''}${money(p.price)}</span></div>
          <p class="det">${esc(p.detail)}</p><p>${esc(p.desc)}</p>
          ${conf ? `<div class="notice">${I.pen.replace('<svg', '<svg width="20" style="flex:none"')}<span><b>Made to order.</b> Choose the size, ${p.personalise === 'tag' ? 'tag shape' : 'leather'}, finish and engraving in the configurator. Every option shown there is available for this piece.</span></div>
            <div class="row" style="flex-wrap:nowrap"><a class="btn" style="flex:1" href="#/create?type=${p.personalise}">Personalise · from ${money(p.price)}</a><button class="ibtn wish" style="border:1px solid var(--line-2);width:52px;height:52px" data-act="wish" data-id="${p.id}" aria-pressed="${w}" aria-label="${w ? 'Remove from' : 'Add to'} wishlist">${I.heart}</button></div>`
          : `${optionsHTML(p, st, 'pv')}
            <div class="row" style="flex-wrap:nowrap"><div class="qty"><button data-act="pvqty" data-n="-1" aria-label="Decrease quantity">−</button><span class="num">${st.qty}</span><button data-act="pvqty" data-n="1" aria-label="Increase quantity">+</button></div><button class="btn" style="flex:1" data-act="pvadd">Add to Bag<span class="wide-only"> · ${money(p.price * st.qty)}</span></button><button class="ibtn wish" style="border:1px solid var(--line-2);width:52px;height:52px" data-act="wish" data-id="${p.id}" aria-pressed="${w}" aria-label="${w ? 'Remove from' : 'Add to'} wishlist">${I.heart}</button></div>`}
          <div class="acc">
            <details open><summary>Materials & craftsmanship</summary><div><span class="serif" style="font-size:18px;color:var(--ink)">${esc(p.detail)}</span><span>${esc(p.craft)}</span>${p.bundle ? `<span>Includes: ${p.bundle.map((b) => `<a class="link" href="#/p/${b}">${esc(prod(b).name)}</a>`).join(', ')}</span>` : ''}</div></details>
            <details><summary>Care</summary><div><span>${esc(p.care)}</span></div></details>
            <details><summary>Delivery & returns</summary><div><span>Delivery options and timing appear at checkout once shipping is connected. No estimate is shown until then.</span><span>${p.availability === 'made' ? 'Made-to-order and engraved pieces are produced for your pet; the returns policy will be confirmed by the house.' : 'The returns policy will be confirmed by the house.'}</span></div></details>
          </div>
          <span class="sample">Sample product information</span>
        </div></div>
      ${(() => { const d = p.gallery.flatMap((g) => (HS[g] || []).map((h) => ({ g, h }))); return d.length ? `<section class="sec" style="padding-top:40px;padding-bottom:0"><div class="sh"><h2>In detail</h2><span class="muted small">Tap a detail to see it on the piece</span></div><div class="details">${d.map(({ g, h }, i) => `<button class="dt rv" data-act="dtgo" data-g="${p.gallery.indexOf(g)}" data-img="${g}" data-i="${(HS[g] || []).indexOf(h)}">${crop(g, h)}<span class="num faint">${String(i + 1).padStart(2, '0')}</span><b>${esc(h.t)}</b><span>${esc(h.d)}</span></button>`).join('')}</div></section>` : ''; })()}
      <section class="sec" style="padding-top:40px"><div class="sh"><h2>You may also like</h2></div><div class="hscroll">${related.map(card).join('')}</div></section>
      ${recent.length ? `<section style="padding-bottom:20px"><div class="sh"><h2 style="font-size:clamp(36px,4vw,52px)">Recently viewed</h2></div><div class="hscroll">${recent.map(card).join('')}</div></section>` : ''}</div>`;
  };

  /* ---- configurator ---- */
  function cfInit(type, editKey) {
    const ed = editKey ? S.bag.find((b) => b.key === editKey) : null;
    if (ed && ed.pers && ed.pers.cfg) { UI.cf = Object.assign({}, ed.pers.cfg, { edit: editKey, err: '' }); return; }
    const nature = type === 'signature' ? 'cat' : 'dog';
    const T = CF.types[nature].find((t) => t.id === type) || CF.types[nature][0];
    UI.cf = { nature, type: T.id, size: '', leather: nature === 'cat' ? 'ivory' : 'emerald', finish: nature === 'cat' ? 'silver' : 'gold', tag: nature === 'cat' ? 'round' : 'bone', name: '', l1: '', l2: '', bg: 'green', err: '', edit: null };
  }
  const cfType = () => CF.types[UI.cf.nature].find((t) => t.id === UI.cf.type) || CF.types[UI.cf.nature][0];
  const cfSizes = () => { const T = cfType(); return CF.sizes[UI.cf.nature].filter((s) => !T.sizes || T.sizes.includes(s[0])); };
  const cfLeathers = () => { const T = cfType(); return CF.leathers.filter((l) => !T.leathers || T.leathers.includes(l.id)); };
  function cfCalc() {
    const c = UI.cf, T = cfType(), fin = CF.finishes.find((f) => f.id === c.finish), contact = c.l1 || c.l2 ? CF.contactAdd : 0;
    return { T, fin, contact, total: T.base + fin.add + contact, leather: CF.leathers.find((l) => l.id === c.leather), size: CF.sizes[c.nature].find((s) => s[0] === c.size), tag: CF.tags[c.nature].find((t) => t.id === c.tag) };
  }
  function cfDone() { const c = UI.cf, T = cfType(); return [true, !T.collar || !!c.size, true, !!c.name.trim() && NAME_RE.test(c.name.trim()), true, true, false]; }
  V.create = () => {
    if (!UI.cf || UI.q.type || UI.q.edit) { cfInit(UI.q.type, UI.q.edit); UI.q = {}; history.replaceState(null, '', '#/create'); }
    const c = UI.cf, T = cfType(), x = cfCalc(), done = cfDone();
    let n = 0; const step = (title, body, hint) => `<div class="cstep"><div class="h"><span class="n">${['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'][n++]}.</span><h3>${title}</h3>${hint ? `<span class="small muted" style="margin-left:auto">${hint}</span>` : ''}</div>${body}</div>`;
    return `<div class="wrap">${crumbs([['#/personalised', 'Personalised'], ['', 'Create Your Piece']])}
      <header class="lhead" style="padding-bottom:20px"><span class="eyebrow">${c.edit ? 'Editing a piece in your bag' : 'The configurator'}</span><h1>Create your piece.</h1></header>
      <div class="cfg">
        <div class="pv"><div class="stage" id="cstage">${collarSVG()}<span class="sweep"></span><div class="bgsw"><button data-act="cbg" data-v="green" aria-pressed="${c.bg !== 'ivory'}" style="background:#163028" aria-label="Emerald backdrop"></button><button data-act="cbg" data-v="ivory" aria-pressed="${c.bg === 'ivory'}" style="background:#F5EFE2" aria-label="Ivory backdrop"></button></div></div>
          <div class="row" style="justify-content:space-between;margin-top:12px"><span class="hint">Illustrative preview, not a production rendering</span><b class="num" id="cprice" style="font-weight:500;font-size:22px">${money(x.total)}</b></div></div>
        <div>
          <div class="steps" aria-hidden="true">${done.map((d) => `<i class="${d ? 'on' : ''}"></i>`).join('')}</div>
          ${step('Product type', `<div class="row" style="gap:8px">${['dog', 'cat'].map((k) => `<button class="chip" data-act="cnat" data-v="${k}" aria-pressed="${c.nature === k}">${k === 'dog' ? 'For dogs · Bark Co.' : 'For cats · Purr Co.'}</button>`).join('')}</div>
            <div style="display:grid;gap:8px">${CF.types[c.nature].map((t) => `<button class="o wide" data-act="ctype" data-v="${t.id}" aria-pressed="${c.type === t.id}"><img src="${IMG(t.img)}" alt=""><span style="display:grid;gap:2px"><b>${t.name}</b><small>${t.note}${t.width ? ' · ' + t.width : ''} · from ${money(t.base)}</small></span></button>`).join('')}</div>`)}
          ${T.collar ? step('Size & material', `<div class="opts2" style="grid-template-columns:repeat(auto-fill,minmax(92px,1fr))">${cfSizes().map(([k, a, b]) => `<button class="o" data-act="csize" data-v="${k}" aria-pressed="${c.size === k}"><b>${k}</b><small class="num">${a}–${b} cm</small></button>`).join('')}</div>
            ${c.err === 'size' ? '<span class="err">Choose a size to continue.</span>' : ''}
            <details class="small muted"><summary style="cursor:pointer;font-weight:500;color:var(--ink)">How to measure</summary><p style="margin-top:8px">Measure around the neck where the collar sits with a soft tape, then add two fingers’ width. Between sizes, choose the larger.${c.nature === 'cat' ? ' Cat collars use a quick-release safety buckle.' : ''}</p></details>
            <span class="serif" style="font-size:18px;color:var(--muted)">${c.type === 'signature' ? 'Soft leather, 12 mm' : c.type === 'heritage' ? 'Full-grain leather, 40 mm' : 'Full-grain leather, 25 mm'}</span>`, 'Required') : step('Size & material', `<p class="muted small">The tag is one size and fits any collar with a D-ring. ${c.finish === 'gold' ? 'Gold-tone' : 'Silver-tone'} finish.</p>`)}
          ${step('Colour & finish', `${T.collar ? `<div class="opt-h"><b>Leather colour</b><span class="muted">${x.leather.name}</span></div><div class="opts2" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr))">${cfLeathers().map((l) => `<button class="o" data-act="cleather" data-v="${l.id}" aria-pressed="${c.leather === l.id}"><span class="sw" style="background:${l.hex}"></span><b>${l.name}</b></button>`).join('')}</div>` : ''}
            <div class="opt-h"><b>Finish</b></div><div class="opts2">${CF.finishes.map((f) => `<button class="o" data-act="cfinish" data-v="${f.id}" aria-pressed="${c.finish === f.id}"><span class="mt metal-${f.id}"></span><b>${f.name} · +${money(f.add)}</b><small>${T.collar ? f.desc : f.desc.split(',')[0] + '.'}</small></button>`).join('')}</div>
            <div class="opt-h"><b>Tag shape</b></div><div class="row" style="gap:8px">${CF.tags[c.nature].map((t) => `<button class="chip" data-act="ctag" data-v="${t.id}" aria-pressed="${c.tag === t.id}">${t.name}</button>`).join('')}</div>`)}
          ${step('Engraving', `<div class="field"><label for="c-name">Their name · front of the tag</label><input class="input" id="c-name" maxlength="${CF.nameMax}" value="${esc(c.name)}" placeholder="e.g. Bella" autocomplete="off" ${c.err === 'name' ? 'aria-invalid="true"' : ''}><div class="row" style="justify-content:space-between">${c.err === 'name' ? '<span class="err">Add their name using letters, spaces or hyphens.</span>' : '<span class="hint">Letters, spaces, hyphens and apostrophes.</span>'}<span class="counter" data-for="c-name">${c.name.length}/${CF.nameMax}</span></div></div>
            <div class="grid2"><div class="field"><label for="c-l1">Reverse line 1 · optional</label><input class="input" id="c-l1" maxlength="${CF.lineMax}" value="${esc(c.l1)}" placeholder="Phone"><span class="counter" data-for="c-l1">${c.l1.length}/${CF.lineMax}</span></div><div class="field"><label for="c-l2">Reverse line 2 · optional</label><input class="input" id="c-l2" maxlength="${CF.lineMax}" value="${esc(c.l2)}" placeholder="Area"><span class="counter" data-for="c-l2">${c.l2.length}/${CF.lineMax}</span></div></div>
            <span class="hint">Contact engraving adds ${money(CF.contactAdd)}. It’s engraved exactly as typed, so please check it carefully.</span>`, 'Required')}
          ${step('Preview', `<p class="muted small">The preview updates as you choose. Switch the backdrop above to see it on cream. The hallmark (our ampersand, their name and the year) is struck on the reverse of the finished tag.</p>`)}
          ${step('Review', `<dl class="spec" id="cspec">${cfSpec()}</dl>`)}
          ${step('Add to bag', `<button class="btn block" data-act="cadd">${c.edit ? 'Update the piece in my bag' : 'Add to Bag'} · <span id="cprice2">${money(x.total)}</span></button><span class="hint">Made to order and engraved for your pet. Sample pricing.</span>`)}
        </div></div></div>`;
  };
  function cfSpec() {
    const c = UI.cf, x = cfCalc();
    const rows = [['Piece', x.T.name, money(x.T.base)], ...(x.T.collar ? [['Size', x.size ? `${x.size[0]} · ${x.size[1]}–${x.size[2]} cm` : '<span class="err">Not chosen</span>', ''], ['Leather', x.leather.name, '']] : []), ['Finish', x.fin.name, '+' + money(x.fin.add)], ['Tag', x.tag.name, ''], ['Engraving', c.name.trim() ? `“${esc(c.name.trim())}”` : '<span class="err">Not added</span>', ''], ['Reverse', [c.l1, c.l2].filter(Boolean).map(esc).join(' / ') || '—', x.contact ? '+' + money(x.contact) : '']];
    return rows.map(([k, v, pr]) => `<div><dt>${k}</dt><dd>${v}${pr ? ` <span class="muted" style="font-weight:400">${pr}</span>` : ''}</dd></div>`).join('') + `<div style="font-size:16px"><dt style="color:var(--ink)">Total</dt><dd class="num">${money(x.total)}</dd></div>`;
  }
  function paintCfg(shine) {
    const st = $('cstage'); if (!st) return;
    st.querySelector('svg').outerHTML = collarSVG(); $('cspec').innerHTML = cfSpec(); const t = money(cfCalc().total); $('cprice').textContent = t; $('cprice2').textContent = t;
    document.querySelectorAll('.steps i').forEach((el, i) => el.classList.toggle('on', cfDone()[i]));
    if (shine && !reduced()) { st.style.setProperty('--sw', UI.cf.finish === 'gold' ? 'rgba(195,152,76,.5)' : 'rgba(154,161,163,.5)'); st.classList.remove('shine'); void st.offsetWidth; st.classList.add('shine'); }
  }
  function collarSVG(opts) {
    const c = opts || UI.cf, T = opts ? { collar: opts.collar } : cfType(), L = CF.leathers.find((l) => l.id === c.leather) || CF.leathers[0];
    const W = { estate: 36, heritage: 54, signature: 24 }[c.type] || 0, gold = c.finish === 'gold', light = c.bg === 'ivory';
    const g = gold ? ['#C3984C', '#FCEFD5', '#C3984C', '#F5EFE2'] : ['#9AA1A3', '#FCEFD5', '#9AA1A3', '#F5EFE2'], engr = '#17130F';
    const name = (c.name || '').trim() || 'Their name', path = 'M70 200 Q400 435 730 200';
    const cy = (x) => { const t = (x - 70) / 660; return (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * 435 + t * t * 200; };
    const tagOnly = !T.collar, ringY = tagOnly ? 150 : cy(400) + W / 2 + 6, tagC = ringY + (tagOnly ? 150 : 96), S2 = tagOnly ? 1.45 : 1;
    const shape = c.tag === 'bone' ? `<path d="M-92 -26 a26 26 0 1 1 26 -26 h132 a26 26 0 1 1 26 26 v52 a26 26 0 1 1 -26 26 h-132 a26 26 0 1 1 -26 -26 z" fill="url(#mtl)" stroke="#17130F" stroke-opacity=".3" stroke-width="1.5"/><path d="M-80 -18 a17 17 0 1 1 17 -17 h126 a17 17 0 1 1 17 17 v36 a17 17 0 1 1 -17 17 h-126 a17 17 0 1 1 -17 -17 z" fill="none" stroke="${g[3]}" stroke-opacity=".55"/>`
      : c.tag === 'oval' ? `<ellipse rx="62" ry="80" fill="url(#mtl)" stroke="#17130F" stroke-opacity=".3" stroke-width="1.5"/><ellipse rx="53" ry="70" fill="none" stroke="${g[3]}" stroke-opacity=".6"/><rect x="-9" y="-57" width="18" height="18" fill="${engr}" opacity=".5" mask="url(#amp)"/>`
      : `<circle r="72" fill="url(#mtl)" stroke="#17130F" stroke-opacity=".3" stroke-width="1.5"/><circle r="62" fill="none" stroke="${g[3]}" stroke-opacity=".55"/>`;
    const fs = Math.max(28, Math.min(c.tag === 'oval' ? 48 : 58, 58 - Math.max(0, name.length - 5) * 4)), back = [c.l1, c.l2].filter(Boolean);
    return `<svg viewBox="0 0 800 620" role="img" aria-label="Preview: ${esc(name)} engraved on a ${gold ? 'gold-tone' : 'silver-tone'} ${c.tag} tag${tagOnly ? '' : `, ${L.name.toLowerCase()} leather collar`}">
      <defs><linearGradient id="mtl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".35" stop-color="${g[1]}"/><stop offset=".62" stop-color="${g[2]}"/><stop offset=".85" stop-color="${g[3]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>
        <linearGradient id="lea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.hex}"/><stop offset="1" stop-color="${L.edge}"/></linearGradient>
        <mask id="amp" maskContentUnits="objectBoundingBox"><image href="icon.png" width="1" height="1" preserveAspectRatio="xMidYMid meet"/></mask>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#17130F" flood-opacity="${light ? .18 : .45}"/></filter></defs>
      <rect width="800" height="620" fill="${light ? '#F5EFE2' : '#163028'}"/>
      <g filter="url(#sh)">${tagOnly ? '' : `<path d="${path}" fill="none" stroke="${L.edge}" stroke-width="${W + 4}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="url(#lea)" stroke-width="${W}" stroke-linecap="round"/>
        <path d="M70 ${200 - W / 2 + 6} Q400 ${435 - W / 2 + 6} 730 ${200 - W / 2 + 6}" fill="none" stroke="${L.stitch}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="6 5"/><path d="M70 ${200 + W / 2 - 6} Q400 ${435 + W / 2 - 6} 730 ${200 + W / 2 - 6}" fill="none" stroke="${L.stitch}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="6 5"/>
        <g transform="translate(170 ${cy(170)}) rotate(-25)"><rect x="-22" y="${-W / 2 - 10}" width="44" height="${W + 20}" rx="7" fill="none" stroke="url(#mtl)" stroke-width="8"/><rect x="-2" y="-3" width="30" height="6" rx="3" fill="url(#mtl)"/></g>
        <g transform="translate(250 ${cy(250)}) rotate(-19)"><rect x="-9" y="${-W / 2 - 4}" width="18" height="${W + 8}" rx="3" fill="url(#lea)" stroke="${L.edge}"/></g>`}
        <ellipse cx="400" cy="${ringY + 8}" rx="${17 * S2}" ry="${20 * S2}" fill="none" stroke="url(#mtl)" stroke-width="7"/><g transform="translate(400 ${tagC}) scale(${S2})">${shape}</g></g>
      <g transform="translate(400 ${tagC + (c.tag === 'oval' ? 14 : 0) * S2}) scale(${S2})"><text y="${fs * .32 + 1.5}" text-anchor="middle" font-family="BP Script, Pinyon Script, cursive" font-size="${fs}" fill="${g[3]}" opacity=".7">${esc(name)}</text><text y="${fs * .32}" text-anchor="middle" font-family="BP Script, Pinyon Script, cursive" font-size="${fs}" fill="${engr}" ${c.name ? '' : 'opacity=".55"'}>${esc(name)}</text></g>
      ${back.length ? `<g transform="translate(670 520)"><circle r="54" fill="url(#mtl)" stroke="#17130F" stroke-opacity=".3"/>${back.map((l, i) => `<text y="${(i - (back.length - 1) / 2) * 15 + 4}" text-anchor="middle" font-family="Albert Sans, sans-serif" font-size="${l.length > 14 ? 9 : 11}" fill="${engr}">${esc(l)}</text>`).join('')}<text y="72" text-anchor="middle" font-family="Albert Sans, sans-serif" font-size="10" letter-spacing="2" fill="${light ? '#17130F' : '#FCEFD5'}" opacity=".6">REVERSE</text></g>` : ''}</svg>`;
  }
  const tagPreview = (name, finish) => collarSVG({ type: 'estate', collar: true, leather: 'emerald', finish, tag: 'bone', name, l1: '', l2: '', bg: 'green' });

  /* ---- bag page ---- */
  V.bag = () => {
    const sub = subtotal();
    return `<div class="wrap">${crumbs([['', 'Bag']])}<header class="lhead"><h1>Your bag</h1></header>
      ${S.bag.length ? `<div class="co"><div>${S.bag.map((b, i) => bagItem(b, i)).join('')}<div class="row" style="margin-top:20px"><a class="link" href="#/shop">Continue shopping</a></div></div>
        <aside class="sum panel"><div class="tot"><div><span class="muted">Subtotal</span><span>${money(sub)}</span></div><div><span class="muted">Delivery</span><span class="muted">At checkout</span></div><div class="g"><span>Estimated total</span><span>${money(sub)}</span></div></div>
          <a class="btn block" href="#/checkout">Checkout</a><span class="hint" style="font-size:12px">Sample prices. The checkout is a demonstration: nothing is charged.</span></aside></div>`
      : `<div class="empty">${mk(40)}<p>Your bag is empty. Considered pieces are waiting.</p><a class="btn" href="#/shop">Shop the collection</a></div>`}</div>`;
  };

  /* ---- checkout ---- */
  const AREAS = ['Cairo', 'Giza', 'Alexandria', 'Other governorate'];
  V.checkout = () => {
    if (!S.bag.length) return V.bag();
    const f = UI.co || {}, e = f.errs || {}, sub = subtotal();
    const fld = (n, l, a, ph) => `<div class="field"><label for="co-${n}">${l}</label><input class="input" id="co-${n}" name="${n}" value="${esc(f[n] || '')}" ${a || ''} ${ph ? `placeholder="${ph}"` : ''} ${e[n] ? 'aria-invalid="true"' : ''}>${e[n] ? `<span class="err">${e[n]}</span>` : ''}</div>`;
    return `<div class="wrap">${crumbs([['#/bag', 'Bag'], ['', 'Checkout']])}<header class="lhead"><span class="eyebrow">Demonstration checkout</span><h1>Checkout</h1></header>
      <div class="notice" style="margin-bottom:30px"><span><b>Payments, shipping and orders aren’t connected.</b> You can complete this flow to preview it, but nothing is charged, reserved or dispatched.</span></div>
      <form class="co" id="coform" novalidate><div>
        <fieldset><h2>Contact</h2><div class="grid2">${fld('email', 'Email', 'type="email" autocomplete="email"')}${fld('phone', 'Mobile', 'type="tel" inputmode="tel" autocomplete="tel"', '010 1234 5678')}</div></fieldset>
        <fieldset><h2>Delivery address</h2><div class="grid2">${fld('first', 'First name', 'autocomplete="given-name"')}${fld('last', 'Last name', 'autocomplete="family-name"')}</div>${fld('street', 'Street & building', 'autocomplete="address-line1"')}<div class="grid2">${fld('apt', 'Apartment, floor · optional', 'autocomplete="address-line2"')}${fld('district', 'District', 'autocomplete="address-level3"', 'e.g. Zamalek')}</div>
          <div class="field"><label for="co-gov">Governorate</label><select class="input" id="co-gov" name="gov" ${e.gov ? 'aria-invalid="true"' : ''}><option value="">Choose</option>${AREAS.map((a) => `<option ${f.gov === a ? 'selected' : ''}>${a}</option>`).join('')}</select>${e.gov ? `<span class="err">${e.gov}</span>` : ''}</div></fieldset>
        <fieldset><h2>Delivery method</h2>
          <label class="radio"><input type="radio" name="ship" value="courier" ${f.ship !== 'collect' ? 'checked' : ''}><span><b style="font-weight:500">Courier delivery</b><br><span class="small muted">Rate and timing would come from the shipping provider. Not connected.</span></span><span class="small muted">TBC</span></label>
          <label class="radio"><input type="radio" name="ship" value="collect" ${f.ship === 'collect' ? 'checked' : ''}><span><b style="font-weight:500">Collect from the atelier</b><br><span class="small muted">Only if the house offers collection. To be confirmed.</span></span><span class="small muted">TBC</span></label></fieldset>
        <fieldset><h2>Payment</h2>
          <label class="radio"><input type="radio" name="pay" value="card" ${f.pay !== 'cod' ? 'checked' : ''}><span><b style="font-weight:500">Card</b><br><span class="small muted">Would open the payment provider’s secure page. Not connected.</span></span><span></span></label>
          <label class="radio"><input type="radio" name="pay" value="cod" ${f.pay === 'cod' ? 'checked' : ''}><span><b style="font-weight:500">Cash on delivery</b><br><span class="small muted">If enabled by the house.</span></span><span></span></label></fieldset>
        <button class="btn block" type="submit">Place demo order</button><p class="hint" style="margin-top:10px">By placing a demo order you agree this is a preview. No personal data leaves this browser.</p></div>
        <aside class="sum panel"><h2 style="margin:0">Order summary</h2>${S.bag.map((b) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><img src="${IMG(b.img)}" alt="" style="width:56px;aspect-ratio:4/5;object-fit:cover;border-radius:10px"><span style="flex:1;display:grid;gap:2px;min-width:0"><span>${esc(b.name)} <span class="muted">× ${b.qty}</span></span>${b.opts ? `<span class="small muted">${esc(b.opts)}</span>` : ''}${b.pers ? `<span style="color:var(--accent);font-weight:500">${esc(b.pers.summary)}</span>` : ''}</span><span class="num small">${money(b.price * b.qty)}</span></div>`).join('')}
          <div class="tot"><div><span class="muted">Subtotal</span><span>${money(sub)}</span></div><div><span class="muted">Delivery</span><span class="muted">To be confirmed</span></div><div class="g"><span>Total before delivery</span><span>${money(sub)}</span></div></div></aside></form></div>`;
  };
  V.order = (id) => {
    const o = S.orders.find((x) => x.id === id); if (!o) return V.notfound();
    const hm = o.items.find((i) => i.pers && i.pers.type !== 'label');
    return `<div class="wrap" style="max-width:760px;padding-top:40px;padding-bottom:40px;display:grid;gap:24px;justify-items:center;text-align:center">
      ${hm ? hallmarkSVG(hm.pers.name, new Date().getFullYear()) : mk(64, 'color:var(--accent)')}
      <span class="eyebrow">Demo order ${esc(o.id)}</span><h1 class="script" style="font-size:clamp(52px,8vw,84px);line-height:.95">Thank you, ${esc(o.first)}.</h1>
      <p class="muted" style="max-width:46ch">This was a demonstration: nothing was charged, reserved or dispatched. In the live store you’d receive a confirmation email${hm ? ', and your engraved piece would enter production' : ''}.</p>
      <div class="panel" style="width:100%;text-align:left">${o.items.map((i) => `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${i.qty} × ${esc(i.name)}${i.pers ? `<br><span style="color:var(--accent);font-weight:500">${esc(i.pers.summary)}</span>` : ''}</span><span class="num">${money(i.price * i.qty)}</span></div>`).join('')}<div class="tot"><div class="g"><span>Total before delivery</span><span>${money(o.total)}</span></div></div></div>
      <a class="btn" href="#/shop">Continue shopping</a></div>`;
  };
  function hallmarkSVG(name, year) {
    const txt = `MADE FOR ${String(name).toUpperCase()} · BARKS & PURRS CO. · ${year} · `;
    return `<svg class="hallmark" viewBox="0 0 200 200" role="img" aria-label="Hallmark: made for ${esc(name)}, ${year}"><defs><path id="hmc" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/><mask id="hmm" maskContentUnits="objectBoundingBox"><image href="icon.png" width="1" height="1" preserveAspectRatio="xMidYMid meet"/></mask></defs><circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" stroke-width="1.2"/><text font-family="Albert Sans, sans-serif" font-size="11.5" letter-spacing="2.2" fill="currentColor" font-weight="600"><textPath href="#hmc">${esc(txt)}</textPath></text><rect x="70" y="70" width="60" height="60" fill="currentColor" mask="url(#hmm)"/></svg>`;
  }

  /* ---- wishlist / account / pages ---- */
  V.wishlist = () => `<div class="wrap">${crumbs([['', 'Wishlist']])}<header class="lhead"><h1>Wishlist</h1><p>Saved in this browser.</p></header>${S.wish.length ? `<div class="grid g4">${S.wish.map(prod).filter(Boolean).map(card).join('')}</div>` : `<div class="empty">${mk(40)}<p>Nothing saved yet. Tap the heart on any piece to keep it here.</p><a class="btn" href="#/shop">Shop the collection</a></div>`}</div>`;
  V.account = () => `<div class="wrap">${crumbs([['', 'Account']])}<header class="lhead"><h1>Account</h1></header>
    <div class="co"><div style="display:grid;gap:24px"><div class="notice"><span><b>Sign-in isn’t connected yet.</b> In the live store, accounts would hold your orders, addresses and saved pieces. For now, everything below lives in this browser only.</span></div>
      <section><h2 class="eyebrow" style="margin-bottom:12px">Demo orders</h2>${S.orders.length ? S.orders.map((o) => `<a class="row" href="#/order/${o.id}" style="justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line)"><span>${esc(o.id)} · ${o.items.length} item${o.items.length > 1 ? 's' : ''}<br><span class="small muted">${new Date(o.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · demonstration</span></span><span class="num">${money(o.total)}</span></a>`).join('') : '<p class="muted">No orders yet.</p>'}</section></div>
      <aside class="panel"><a class="row" href="${APP_URL}" target="_blank" rel="noopener" style="justify-content:space-between">The Barks &amp; Purrs App <span class="muted">↗</span></a><a class="row" href="#/wishlist" style="justify-content:space-between">Wishlist <span class="muted">${S.wish.length}</span></a><a class="row" href="#/bag" style="justify-content:space-between">Bag <span class="muted">${S.bag.reduce((a, b) => a + b.qty, 0)}</span></a><button class="link small" style="justify-self:start" data-act="clearlocal">Clear data saved in this browser</button></aside></div></div>`;
  const PAGES = {
    about: ['About the house', `<p>Barks & Purrs Co. is a pet-care house built on one idea: <b>Two Natures. One House.</b> Dogs and cats live differently, so Bark Co. and Purr Co. are made for how each of them lives, under one considered brand.</p><h2>The Hallmark, not the sale</h2><p>We would rather show you the materials, the stitching and the engraving than describe them in grand words. Every personalised piece is finished with the house hallmark.</p>`],
    contact: ['Contact', '<p>The house’s contact details, studio address and customer care hours will be published here.</p><div class="notice"><span><b>Placeholder.</b> Contact details haven’t been supplied, so none are shown.</span></div>'],
    shipping: ['Shipping & Returns', '<p>Delivery areas, rates, timings and the returns policy will be confirmed by the house and published here before launch.</p><div class="notice"><span><b>Not yet configured.</b> No delivery estimates or promises are made in this preview.</span></div>'],
    faq: ['FAQs', `<h2>How do I choose a collar size?</h2><p>Measure around the neck where the collar sits with a soft tape, then add two fingers’ width. Dogs: XS 20–26 cm, S 26–32, M 32–40, L 40–48, XL 48–56. Cats: S 18–22, M 22–26, L 26–30. Between sizes, choose the larger.</p><h2>What can be engraved?</h2><p>Up to ${CF.nameMax} characters on the front (letters, spaces, hyphens and apostrophes), and two optional lines of up to ${CF.lineMax} characters on the reverse.</p><h2>Are the finishes solid gold or silver?</h2><p>Finishes are described as gold-tone and silver-tone. The exact metal specification will be confirmed by the house.</p><h2>What is the hallmark?</h2><p>The house’s maker’s mark on personalised pieces: our ampersand, their name and the year. It is a signature, not a certification of metal content.</p>`],
    privacy: ['Privacy Policy', '<p>The privacy policy will be published here before launch.</p><p>In this preview, your bag, wishlist and demo orders are stored only in this browser and are never sent anywhere.</p>'],
    terms: ['Terms & Conditions', '<p>Terms and conditions will be published here before launch.</p>']
  };
  V.page = (id) => { const pg = PAGES[id]; if (!pg) return V.notfound(); return `<div class="wrap">${crumbs([['', pg[0]]])}<article class="page"><h1>${pg[0]}</h1>${pg[1]}</article></div>`; };
  V.notfound = () => `<div class="wrap" style="padding:80px 0"><div class="empty">${mk(40)}<p>We couldn’t find that page.</p><a class="btn" href="#/">Back to the house</a></div></div>`;

  function footerHTML() {
    return `<div class="wrap"><div class="top"><div style="display:grid;gap:18px;align-content:start"><span class="eyebrow" style="color:rgba(252,239,213,.6)">The house letter</span><p class="script" style="font-size:42px">New pieces, quietly announced.</p>
        <form class="nl row" id="nlform" novalidate style="flex-wrap:nowrap"><label class="sr" for="nl-e">Email</label><input id="nl-e" type="email" placeholder="Your email" value="${esc(S.news)}" autocomplete="email"><button class="btn cream sm" type="submit">Sign up</button></form><span class="small" id="nl-msg" style="color:rgba(252,239,213,.6)">${S.news ? 'You’re on the list in this preview.' : 'Preview only: no emails are sent until the mailing platform is connected.'}</span></div>
      <div class="cols"><div><h4>Shop</h4><ul>${K.CATEGORIES.filter((c) => P.some((p) => p.category === c.id)).slice(0, 6).map((c) => `<li><a href="#/c/${c.id}">${c.name}</a></li>`).join('')}</ul></div>
        <div><h4>The house</h4><ul><li><a href="#/dogs">Dogs · Bark Co.</a></li><li><a href="#/cats">Cats · Purr Co.</a></li><li><a href="#/personalised">Personalisation</a></li><li><a href="#/page/about">About the brand</a></li><li><a href="${APP_URL}" target="_blank" rel="noopener">The App ↗</a></li></ul></div>
        <div><h4>Help</h4><ul><li><a href="#/page/contact">Contact</a></li><li><a href="#/page/shipping">Shipping & Returns</a></li><li><a href="#/page/faq">FAQs</a></li></ul></div>
        <div><h4>Follow</h4><ul><li><span style="color:rgba(252,239,213,.6)">Instagram · link to be added</span></li><li><span style="color:rgba(252,239,213,.6)">Other channels · to be added</span></li></ul></div></div></div>
      <span class="wordmark big" aria-hidden="true"></span>
      <div class="legal"><span>© ${new Date().getFullYear()} Barks & Purrs Co. · Prototype store with sample catalogue</span><span class="row" style="gap:18px"><a href="#/page/privacy">Privacy Policy</a><a href="#/page/terms">Terms & Conditions</a></span></div></div>`;
  }

  /* ================= motion ================= */
  function showHs(el) {
    const box = el.closest('.main, .st-zoom'); const card = box && box.querySelector('.hs-card'); if (!card) return;
    const h = (HS[el.dataset.img] || [])[+el.dataset.i]; if (!h) return;
    const was = el.getAttribute('aria-expanded') === 'true';
    box.querySelectorAll('.hs').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (was) { card.hidden = true; box.classList.remove('focus'); return; }
    el.setAttribute('aria-expanded', 'true');
    card.innerHTML = `<b>${esc(h.t)}</b><span>${esc(h.d)}</span>`; card.hidden = false;
    card.style.left = Math.min(Math.max(h.x, 18), 82) + '%'; card.style.top = (h.y > 60 ? h.y - 4 : h.y + 6) + '%'; card.classList.toggle('above', h.y > 60);
    const img = box.querySelector('img'); if (img && !reduced()) { img.style.transformOrigin = `${h.x}% ${h.y}%`; box.classList.add('focus'); }
  }
  let ticking = false, MO = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function motionInit() {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
    document.querySelectorAll('.rv:not(.shown)').forEach((el) => (io && !reduced() ? io.observe(el) : el.classList.add('shown')));
    const g = $('gmain');
    if (g && g.classList.contains('zoomable') && matchMedia('(hover: hover)').matches && !reduced()) {
      const img = g.querySelector('img');
      g.onmousemove = (e) => { if (g.classList.contains('focus')) return; const r = g.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; g.classList.add('lens'); };
      g.onmouseleave = () => g.classList.remove('lens');
      g.onclick = (e) => { if (!e.target.closest('.hs')) { g.classList.remove('focus'); g.querySelectorAll('.hs').forEach((b) => b.setAttribute('aria-expanded', 'false')); const c = $('hscard'); if (c) c.hidden = true; } };
    }
    MO = [...document.querySelectorAll('[data-scrub]')];
    onScroll();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(scrub); } }
  function scrub() {
    ticking = false; if (!MO || !MO.length) return;
    const vh = innerHeight, rm = reduced();
    MO.forEach((sec) => {
      const hh = $('hdr').offsetHeight, r = sec.getBoundingClientRect(), span = Math.max(1, r.height - (vh - hh)), p = clamp((hh - r.top) / span, 0, 1);
      if (r.bottom < -50 || r.top > vh + 50) return;
      const k = sec.dataset.scrub;
      if (k === 'cine') {
        const t = rm ? 0 : ease(clamp(p * 1.25, 0, 1));
        const f = sec.querySelector('.frame'); f.style.clipPath = `inset(${t * 9}% ${t * 7}% ${t * 9}% ${t * 7}% round ${t * 6}px)`; f.querySelector('video').style.transform = `scale(${1.12 - t * .12})`;
        const tx = sec.querySelector('.cine-t'); tx.style.opacity = String(1 - clamp(p * 2.2, 0, 1)); tx.style.transform = `translateY(${-p * 60}px)`;
        sec.querySelector('.cue').style.opacity = String(1 - clamp(p * 6, 0, 1));
      }
      if (k === 'story') {
        const hs = HS.p02, n = hs.length + 1, pos = rm ? 0 : p * n, i = clamp(Math.floor(pos), 0, n - 1);
        const z = $('stz'); if (!z) return;
        const tgt = (j) => (j < hs.length ? hs[j] : { x: 50, y: 50, z: 1 });
        const a = tgt(i), b = tgt(Math.min(i + 1, n - 1)), f = ease(clamp((pos - i - .55) / .45, 0, 1));
        const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, sc = a.z + (b.z - a.z) * f;
        const im = z.querySelector('img'); im.style.transformOrigin = `${x}% ${y}%`; im.style.transform = `scale(${rm ? 1 : sc})`;
        z.querySelectorAll('.st-dot').forEach((d, j) => d.classList.toggle('on', j === i));
        z.querySelectorAll('.st-dot').forEach((d) => { const h = hs[+d.dataset.i]; d.style.transformOrigin = '0 0'; d.style.left = `${x + (h.x - x) * sc}%`; d.style.top = `${y + (h.y - y) * sc}%`; });
        sec.querySelectorAll('.st-step').forEach((s2, j) => s2.classList.toggle('on', j === i));
        sec.querySelectorAll('.st-prog i').forEach((s2, j) => s2.classList.toggle('on', j <= i));
        $('stseal').classList.toggle('on', i === n - 1);
      }
      if (k === 'hg') {
        const tr = $('hgt'); if (!tr) return;
        if (matchMedia('(min-width: 900px)').matches && !rm) {
          const max = tr.scrollWidth - tr.clientWidth; tr.style.transform = `translateX(${-p * max}px)`;
          const items = tr.querySelectorAll('.hg-item').length; $('hgc').textContent = `${String(clamp(Math.round(p * (items - 1)) + 1, 1, items)).padStart(2, '0')} / ${String(items).padStart(2, '0')}`;
          $('hgb').style.transform = `scaleX(${p})`;
        } else tr.style.transform = '';
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { if (MO) MO.forEach((s2) => { if (s2.dataset.scrub === 'hg') { const tr = $('hgt'); if (tr) s2.style.height = ''; } }); sizeHg(); onScroll(); });
  function sizeHg() { const s2 = document.querySelector('[data-scrub=hg]'), tr = $('hgt'); if (!s2 || !tr) return; if (matchMedia('(min-width: 900px)').matches && !reduced()) { s2.style.height = `${innerHeight - $('hdr').offsetHeight + (tr.scrollWidth - tr.clientWidth) * 0.9}px`; } else s2.style.height = ''; }
  /* custom cursor label on gallery imagery (desktop) */
  const cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
  addEventListener('mousemove', (e) => { const t = e.target.closest && e.target.closest('[data-cursor]'); if (t && !reduced()) { cur.textContent = t.dataset.cursor; cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; cur.classList.add('on'); } else cur.classList.remove('on'); }, { passive: true });

  /* ================= router ================= */
  function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?'); const q = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' ')); });
    return { parts: path.split('/').filter(Boolean), q };
  }
  let lastPath = '';
  function route() {
    const { parts, q } = parseHash(); UI.q = q;
    const [a, b] = parts, path = parts.join('/');
    let html;
    if (!a) html = V.home();
    else if (a === 'c') html = V.c(b);
    else if (a === 'p') { if (lastPath !== path) UI.gi = 0; html = V.p(b); }
    else if (a === 'page') html = V.page(b);
    else if (a === 'order') html = V.order(b);
    else if (V[a] && !['c', 'p', 'page', 'order'].includes(a)) { if (a === 'create' && lastPath !== 'create') { if (!q.type && !q.edit) UI.cf = null; } html = V[a](); }
    else html = V.notfound();
    view.innerHTML = html;
    const samePage = lastPath === path; lastPath = path;
    if (!samePage) { scrollTo({ top: 0, behavior: 'instant' }); view.focus({ preventScroll: true }); }
    document.querySelectorAll('.hdr nav.main a').forEach((l) => { if (l.getAttribute('href') === '#/' + (a || '')) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
    after();
  }
  function after() {
    counts(); bindCounters();
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
    document.querySelectorAll('.fade:not(.in)').forEach((el) => (io && !reduced() ? io.observe(el) : el.classList.add('in')));
    document.querySelectorAll('.idx a').forEach((a) => a.addEventListener('mouseenter', () => { const pv = document.querySelector('.idx-pv'); pv.querySelector('img').src = a.dataset.img; pv.classList.add('on'); }));
    const ix = document.querySelector('.idx'); if (ix) ix.addEventListener('mouseleave', () => document.querySelector('.idx-pv').classList.remove('on'));
    const ht = $('htry'); if (ht) ht.oninput = () => { $('hstage').innerHTML = tagPreview(ht.value.trim() || 'Bella', UI.hfin || 'gold'); };
    const cn = $('c-name'); if (cn) ['c-name', 'c-l1', 'c-l2'].forEach((id) => { $(id).addEventListener('input', (e) => { const k = { 'c-name': 'name', 'c-l1': 'l1', 'c-l2': 'l2' }[id]; UI.cf[k] = e.target.value; if (k === 'name' && UI.cf.err === 'name') { UI.cf.err = ''; } paintCfg(); }); });
    document.querySelectorAll('video').forEach((v) => { v.muted = true; const p = v.play(); if (p) p.catch(() => {}); });
    motionInit(); sizeHg(); onScroll();
  }
  function setQ(mut) {
    const { parts, q } = parseHash(); mut(q);
    const qs = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    history.replaceState(null, '', '#/' + parts.join('/') + (qs ? '?' + qs : ''));
    const y = scrollY; route(); scrollTo(0, y);
  }
  addEventListener('hashchange', () => { closeAll(true); route(); });

  /* ================= actions ================= */
  const A = {
    menu: () => { $('menu').innerHTML = menuHTML(); openLayer('menu'); },
    bag: () => { $('bagd').innerHTML = bagHTML(); openLayer('bagd'); },
    search: () => { $('search').innerHTML = searchHTML(''); openLayer('search'); bindSearch(); },
    closeall: () => closeAll(),
    theme: () => { const next = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem('bp-store-theme', next); } catch (e) { /* ignore */ } toast(next === 'dark' ? 'Dark mode' : 'Light mode'); const hs = $('hstage'); if (hs) hs.innerHTML = tagPreview((($('htry') || {}).value || '').trim() || 'Bella', UI.hfin || 'gold'); if ($('cstage')) keepY(); },
    hs: (el) => showHs(el),
    dtgo: (el) => { UI.gi = +el.dataset.g; keepY(); const b = document.querySelector(`#gmain .hs[data-i="${el.dataset.i}"]`); const g = $('gmain'); if (g) g.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); if (b) setTimeout(() => showHs(b), 450); },
    rail: (el) => { const r = $('rail'); r.scrollBy({ left: +el.dataset.n * r.clientWidth * .75, behavior: 'smooth' }); },
    undo: () => { const u = UI.undo; UI.undo = null; $('toast').classList.remove('on'); if (u) u(); },
    sterm: (el) => { $('sq').value = el.dataset.t; $('sq').dispatchEvent(new Event('input')); },
    wish: (el) => { const id = el.dataset.id, i = S.wish.indexOf(id); if (i >= 0) S.wish.splice(i, 1); else S.wish.push(id); save(); counts(); document.querySelectorAll(`[data-act=wish][data-id="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', i < 0); b.setAttribute('aria-label', `${i < 0 ? 'Remove from' : 'Add to'} wishlist`); }); toast(i >= 0 ? 'Removed from your wishlist.' : 'Saved to your wishlist.'); if (lastPath === 'wishlist') route(); },
    quick: (el) => { const p = prod(el.dataset.id); if (!p.personalise && p.sizes.length <= 1 && p.colours.length <= 1) { addToBag(lineFrom(p, { qty: 1, size: p.sizes[0] || '', colour: (p.colours[0] || {}).name || '' })); return; } quickView(p.id); },
    qvcol: (el) => { UI.qv.colour = el.dataset.v; const l = $('qv-label'); if (l) UI.qv.label = l.value; paintQV(); },
    qvsize: (el) => { UI.qv.size = el.dataset.v; UI.qv.err = ''; const l = $('qv-label'); if (l) UI.qv.label = l.value; paintQV(); },
    qvqty: (el) => { UI.qv.qty = Math.max(1, Math.min(9, UI.qv.qty + +el.dataset.n)); const l = $('qv-label'); if (l) UI.qv.label = l.value; paintQV(); },
    qvadd: () => { const q = UI.qv, p = prod(q.id); if (!readSel(q, p, 'qv')) { paintQV(); return; } const line = lineFrom(p, q); if (q.edit != null) { Object.assign(S.bag[q.edit], line); save(); closeAll(true); A.bag(); toast('Bag updated.'); if (lastPath === 'bag') route(); return; } closeAll(true); addToBag(line); },
    pvcol: (el) => { UI.pv.colour = el.dataset.v; const l = $('pv-label'); if (l) UI.pv.label = l.value; route(); },
    pvsize: (el) => { UI.pv.size = el.dataset.v; UI.pv.err = ''; const l = $('pv-label'); if (l) UI.pv.label = l.value; route(); },
    pvqty: (el) => { UI.pv.qty = Math.max(1, Math.min(9, UI.pv.qty + +el.dataset.n)); const l = $('pv-label'); if (l) UI.pv.label = l.value; route(); },
    pvadd: () => { const p = prod(UI.pv.id); if (!readSel(UI.pv, p, 'pv')) { route(); const f = document.querySelector('.err'); if (f) f.scrollIntoView({ block: 'center' }); return; } addToBag(lineFrom(p, UI.pv)); },
    gsel: (el) => { UI.gi = +el.dataset.i; route(); },
    gnav: (el) => { const p = prod(UI.pv.id), n = p.gallery.length + (p.video ? 1 : 0); UI.gi = (UI.gi + +el.dataset.n + n) % n; route(); },
    bqty: (el) => { const b = S.bag[+el.dataset.i]; b.qty = Math.max(1, Math.min(9, b.qty + +el.dataset.n)); save(); counts(); refreshBag(); },
    brm: (el) => { const i = +el.dataset.i, [b] = S.bag.splice(i, 1); save(); counts(); refreshBag(); toast(`${b.name} removed.`, () => { S.bag.splice(i, 0, b); save(); counts(); refreshBag(); }); },
    bedit: (el) => { const i = +el.dataset.i; closeAll(true); quickView(S.bag[i].pid, i); },
    hfin: (el) => { UI.hfin = el.dataset.f; el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el)); $('hstage').innerHTML = tagPreview(($('htry').value || '').trim() || 'Bella', UI.hfin); },
    filters: () => { $('menu').innerHTML = `<div class="dh"><h2>Filter</h2><button class="ibtn" data-act="closeall" aria-label="Close filters">${I.close}</button></div><div class="db">${UI.filtersHTML}</div><div class="df"><button class="btn block" data-act="closeall">Show ${$('rcount').textContent}</button><button class="btn ghost block" data-act="fclearall">Clear all</button></div>`; openLayer('menu'); },
    fclear: (el) => setQ((q) => { q[el.dataset.k] = multi(q[el.dataset.k]).filter((v) => v !== el.dataset.v).join(','); }),
    fclearall: () => { const keep = UI.q.q; closeAll(true); setQ((q) => { Object.keys(q).forEach((k) => { if (k !== 'sort' && k !== 'q') delete q[k]; }); if (keep) q.q = keep; }); },
    cnat: (el) => { const c = UI.cf; if (c.nature === el.dataset.v) return; c.nature = el.dataset.v; c.type = CF.types[c.nature][0].id; c.size = ''; c.tag = c.nature === 'cat' ? 'round' : 'bone'; c.leather = c.nature === 'cat' ? 'ivory' : 'emerald'; keepY(); },
    ctype: (el) => { const c = UI.cf; c.type = el.dataset.v; const T = cfType(); if (T.sizes && !T.sizes.includes(c.size)) c.size = ''; if (T.leathers && !T.leathers.includes(c.leather)) c.leather = T.leathers[0]; keepY(); },
    csize: (el) => { UI.cf.size = el.dataset.v; if (UI.cf.err === 'size') UI.cf.err = ''; keepY(); },
    cleather: (el) => { UI.cf.leather = el.dataset.v; keepY(); },
    cfinish: (el) => { UI.cf.finish = el.dataset.v; el.parentElement.querySelectorAll('.o').forEach((b) => b.setAttribute('aria-pressed', b === el)); paintCfg(true); },
    ctag: (el) => { UI.cf.tag = el.dataset.v; keepY(); },
    cbg: (el) => { UI.cf.bg = el.dataset.v; keepY(); },
    cadd: () => {
      const c = UI.cf, T = cfType(), x = cfCalc(); c.err = '';
      if (T.collar && !c.size) c.err = 'size'; else if (!c.name.trim() || !NAME_RE.test(c.name.trim())) c.err = 'name';
      if (c.err) { keepY(); const el = c.err === 'size' ? document.querySelector('[data-act=csize]') : $('c-name'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (c.err === 'name') el.focus(); toast(c.err === 'size' ? 'Choose a size first.' : 'Add their name for the engraving.'); return; }
      const name = c.name.trim();
      const line = { pid: T.product, name: T.name, img: T.img, price: x.total, qty: 1, opts: [T.collar ? `Size ${c.size}` : '', T.collar ? `${x.leather.name} leather` : '', x.fin.name, `${x.tag.name} tag`].filter(Boolean).join(' · '),
        pers: { type: T.collar ? 'collar' : 'tag', name, summary: `Engraved “${name}”`, lines: c.l1 || c.l2 ? `Reverse: ${[c.l1, c.l2].filter(Boolean).join(' / ')}` : '', cfg: Object.assign({}, c, { err: '', edit: null }) } };
      if (c.edit) { const i = S.bag.findIndex((b) => b.key === c.edit); if (i >= 0) { Object.assign(S.bag[i], line); save(); counts(); toast('Your piece is updated.'); location.hash = '#/bag'; return; } }
      addToBag(line); UI.cf = null; toast('Added. Every personalised piece is hallmarked.');
    },
    clearlocal: (el) => { if (!el.dataset.confirm) { el.dataset.confirm = '1'; el.textContent = 'Tap again to clear bag, wishlist and demo orders'; return; } S = { bag: [], wish: [], recent: [], orders: [], news: '' }; save(); route(); toast('Cleared from this browser.'); }
  };
  function keepY() { const y = scrollY; route(); scrollTo(0, y); }
  function refreshBag() { if ($('bagd').classList.contains('on')) $('bagd').innerHTML = bagHTML(); if (['bag', 'checkout'].includes(lastPath)) keepY(); }
  function bindSearch() {
    const i = $('sq'); if (!i) return;
    i.oninput = () => { const q = i.value; $('sres').innerHTML = searchResults(q.trim(), searchIdx(q), q.trim() ? K.CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim())) : []); };
    $('sform').onsubmit = (e) => { e.preventDefault(); if (!i.value.trim()) return; closeAll(true); location.hash = `#/search?q=${encodeURIComponent(i.value.trim())}`; };
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'checkbox')) return;
    if (el.tagName === 'INPUT') return; // checkbox handled on change
    const fn = A[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'A') { if (el.dataset.act === 'closeall') closeAll(true); return; }
    e.preventDefault(); fn(el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act === 'fset') { const inDrawer = !!el.closest('.drawer'); setQ((q) => { const cur = multi(q[el.dataset.k]); q[el.dataset.k] = (el.checked ? [...cur, el.value] : cur.filter((v) => v !== el.value)).join(','); }); if (inDrawer) { $('menu').querySelector('.db').innerHTML = UI.filtersHTML; $('menu').querySelector('.df .btn').textContent = `Show ${$('rcount').textContent}`; } }
    if (el.dataset.act === 'sort') setQ((q) => { q.sort = el.value === 'featured' ? '' : el.value; });
  });
  document.addEventListener('submit', (e) => {
    const f = e.target; e.preventDefault();
    if (f.id === 'nlform') { const v = $('nl-e').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { $('nl-msg').textContent = 'Please enter a valid email address.'; $('nl-e').setAttribute('aria-invalid', 'true'); return; } S.news = v; save(); $('nl-msg').textContent = 'You’re on the list in this preview. No emails are sent until the mailing platform is connected.'; $('nl-e').removeAttribute('aria-invalid'); }
    if (f.id === 'coform') {
      const d = Object.fromEntries(new FormData(f).entries()), errs = {};
      Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Enter a valid email.';
      if (!/^(\+?20)?0?1[0125]\d{8}$/.test(d.phone.replace(/[\s-]/g, ''))) errs.phone = 'Enter an Egyptian mobile, e.g. 010 1234 5678.';
      ['first', 'last', 'street', 'district'].forEach((k) => { if (!d[k]) errs[k] = 'Required.'; });
      if (!d.gov) errs.gov = 'Choose a governorate.';
      if (Object.keys(errs).length) { UI.co = Object.assign(d, { errs }); keepY(); const fi = document.querySelector('[aria-invalid=true]'); if (fi) { fi.focus(); fi.scrollIntoView({ block: 'center' }); } return; }
      const id = 'DEMO-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      S.orders.unshift({ id, ts: Date.now(), first: d.first, items: S.bag.map((b) => Object.assign({}, b)), total: subtotal(), ship: d.ship, pay: d.pay }); S.bag = []; UI.co = null; save(); counts();
      location.hash = `#/order/${id}`;
    }
  });

  /* ================= loader & boot ================= */
  $('foot').innerHTML = footerHTML();
  route();
  {
    const L = document.createElement('div'); L.className = 'loader'; L.setAttribute('role', 'status'); L.setAttribute('aria-label', 'Loading Barks & Purrs Co.');
    L.innerHTML = `<div class="vel"></div><div class="vel b"></div><video src="${VID('cat-bed2')}" muted playsinline autoplay></video><div class="lg"><span class="wordmark" role="img" aria-label="Barks &amp; Purrs Co."></span><span class="tag script">Two Natures. One House.</span><span class="line"><i></i></span></div><button class="skip" data-skip>Skip</button>`;
    document.body.appendChild(L);
    const v = L.querySelector('video'); setTimeout(() => v.classList.add('on'), 500);
    const end = () => { if (L.classList.contains('out')) return; L.classList.add('out'); setTimeout(() => L.remove(), 900); };
    L.addEventListener('click', end); setTimeout(end, reduced() ? 1600 : 3400);
  }
})();
