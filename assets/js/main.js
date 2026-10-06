/* =========================================================================
   ÁUREO — Cafés Especiais  ·  Front-end logic
   Carrinho (localStorage), header sticky, scroll-reveal, steppers,
   assinatura toggle, galeria de produto, WhatsApp e toasts.
   Vanilla JS — zero dependências. Substituível por WooCommerce no backend.
   ========================================================================= */
(() => {
  'use strict';

  /* ---- Config ----------------------------------------------------------- */
  const WHATSAPP = '5511999999999'; // número da loja (DDI+DDD+número)
  const STORE = 'ÁUREO Cafés Especiais';
  const CART_KEY = 'aureo_cart_v1';
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ---- Catálogo (espelha o cadastro de produtos do WooCommerce) --------- */
  const CATALOG = {
    geisha:   { id: 'geisha',   name: 'Geisha Boquete',          origin: 'Boquete · Panamá',            price: 189.0, weight: '250g',  notes: 'Jasmim, bergamota, mel',        tag: 'Microlote',   sca: 92, stock: 18, a: '#4a3526', b: '#1c1714' },
    bourbon:  { id: 'bourbon',  name: 'Bourbon Amarelo',         origin: 'Cerrado Mineiro · Brasil',    price: 68.0,  weight: '250g',  notes: 'Chocolate, caramelo, amêndoa',  tag: 'Best-seller', sca: 86, a: '#5a3d23', b: '#2a1d16' },
    catuai:   { id: 'catuai',   name: 'Catuaí Vermelho',         origin: 'Mantiqueira · Brasil',        price: 74.0,  weight: '250g',  notes: 'Laranja, caramelo, baunilha',   tag: 'Doce',        sca: 85, a: '#6b3f2a', b: '#2a1d16' },
    honey:    { id: 'honey',    name: 'Microlote Honey',         origin: 'Chapada Diamantina · Brasil', price: 96.0,  oldPrice: 118.0, weight: '250g', notes: 'Damasco, mel, frutas vermelhas', tag: 'Microlote', sca: 88, a: '#7a5230', b: '#2a1d16' },
    yirga:    { id: 'yirga',    name: 'Etiópia Yirgacheffe',     origin: 'Yirgacheffe · Etiópia',       price: 112.0, weight: '250g',  notes: 'Floral, limão siciliano, chá',  tag: 'Floral',      sca: 90, a: '#5b6b52', b: '#1c1714' },
    espresso: { id: 'espresso', name: 'Espresso Signature',      origin: 'Blend da casa',               price: 58.0,  weight: '250g',  notes: 'Cacau, avelã, melaço',          tag: 'Blend',       sca: 84, a: '#3b2a20', b: '#120d0a' },
    decaf:    { id: 'decaf',    name: 'Descafeinado Swiss Water',origin: 'Sul de Minas · Brasil',       price: 82.0,  weight: '250g',  notes: 'Chocolate amargo, nozes',       tag: 'Descaf',      sca: 83, a: '#4a4038', b: '#1c1714' },
    coldbrew: { id: 'coldbrew', name: 'Cold Brew Concentrado',   origin: 'Garrafa 500ml',               price: 64.0,  weight: '500ml', notes: 'Cacau, melado, final limpo',    tag: 'Pronto',      a: '#2f231b', b: '#0f0b08' },
  };
  window.AUREO_CATALOG = CATALOG;

  /* ---- Cart store ------------------------------------------------------- */
  const Cart = {
    read() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
    write(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); document.dispatchEvent(new Event('cart:change')); },
    add(id, qty = 1) {
      const items = this.read();
      const found = items.find(i => i.id === id);
      if (found) found.qty += qty; else items.push({ id, qty });
      this.write(items);
    },
    setQty(id, qty) {
      let items = this.read();
      if (qty <= 0) items = items.filter(i => i.id !== id);
      else { const f = items.find(i => i.id === id); if (f) f.qty = qty; }
      this.write(items);
    },
    remove(id) { this.write(this.read().filter(i => i.id !== id)); },
    clear() { this.write([]); },
    count() { return this.read().reduce((s, i) => s + i.qty, 0); },
    subtotal() { return this.read().reduce((s, i) => s + (CATALOG[i.id]?.price || 0) * i.qty, 0); },
    detailed() { return this.read().map(i => ({ ...CATALOG[i.id], qty: i.qty, line: (CATALOG[i.id]?.price || 0) * i.qty })); },
  };
  window.AUREO_CART = Cart;

  /* ---- Toast ------------------------------------------------------------ */
  function toast(msg) {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 320); }, 2600);
  }
  window.AUREO_TOAST = toast;

  /* ---- Bean / package artwork builder ----------------------------------- */
  function beanArt(p, big = false) {
    return `<div class="bean-art" style="--bag-a:${p.a};--bag-b:${p.b}">
      <div class="bag-label">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <span class="eyebrow" style="color:var(--gold)">ÁUREO</span>
          <span class="seal">A</span>
        </div>
        <div>
          <p class="font-display" style="font-size:${big ? '1.45rem' : '1.05rem'};line-height:1.1;font-weight:600">${p.name}</p>
          <p style="font-size:.72rem;opacity:.7;margin-top:.25rem">${p.origin}</p>
        </div>
        <div style="border-top:1px solid var(--line);padding-top:.5rem;font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;opacity:.7">
          ${p.notes}
        </div>
      </div>
    </div>`;
  }
  window.AUREO_BEAN = beanArt;

  /* ---- Header sticky ---------------------------------------------------- */
  function initHeader() {
    const h = document.querySelector('.site-header');
    if (!h) return;
    const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu ------------------------------------------------------ */
  function initMobileMenu() {
    const btn = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!btn || !menu) return;
    const close = () => menu.classList.add('hidden-menu');
    btn.addEventListener('click', () => menu.classList.toggle('hidden-menu'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    menu.querySelector('[data-menu-close]')?.addEventListener('click', close);
  }

  /* ---- Scroll reveal ---------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }

  /* ---- Cart badge ------------------------------------------------------- */
  function refreshBadges() {
    const c = Cart.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = c;
      el.classList.toggle('hidden', c === 0);
    });
  }

  /* ---- Add-to-cart buttons (delegated) ---------------------------------- */
  function initAddButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const id = btn.getAttribute('data-add');
      const qtyEl = btn.closest('[data-product-scope]')?.querySelector('[data-qty]');
      const qty = qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;
      Cart.add(id, qty);
      toast(`${CATALOG[id]?.name || 'Item'} adicionado à sacola`);
    });
  }

  /* ---- Generic steppers ------------------------------------------------- */
  function initSteppers() {
    document.addEventListener('click', (e) => {
      const dec = e.target.closest('[data-step="-"]');
      const inc = e.target.closest('[data-step="+"]');
      if (!dec && !inc) return;
      const input = (dec || inc).closest('.stepper')?.querySelector('input');
      if (!input) return;
      let v = parseInt(input.value, 10) || 1;
      v += inc ? 1 : -1;
      v = Math.max(parseInt(input.min || '1', 10), v);
      input.value = v;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  /* ---- WhatsApp helpers ------------------------------------------------- */
  function waLink(text) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`; }
  window.AUREO_WA = waLink;
  function initWhatsApp() {
    document.querySelectorAll('[data-wa]').forEach(a => {
      const msg = a.getAttribute('data-wa') || `Olá! Gostaria de falar com a ${STORE}.`;
      a.href = waLink(msg);
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  /* ---- Subscription billing toggle -------------------------------------- */
  function initPlanToggle() {
    const toggle = document.querySelector('[data-billing-toggle]');
    if (!toggle) return;
    const apply = (cycle) => {
      document.querySelectorAll('[data-price-monthly]').forEach(el => {
        el.textContent = cycle === 'quarter' ? el.dataset.priceQuarter : el.dataset.priceMonthly;
      });
      document.querySelectorAll('[data-cycle-label]').forEach(el => {
        el.textContent = cycle === 'quarter' ? '/trimestre' : '/mês';
      });
      toggle.dataset.cycle = cycle;
      toggle.querySelectorAll('button').forEach(b => b.classList.toggle('active-cycle', b.dataset.cycle === cycle));
    };
    toggle.querySelectorAll('button').forEach(b => b.addEventListener('click', () => apply(b.dataset.cycle)));
    apply('month');
  }

  /* ---- Page renderers (cart / checkout) --------------------------------- */
  function renderCart() {
    const root = document.querySelector('[data-cart-page]');
    if (!root) return;
    const items = Cart.detailed();
    const list = root.querySelector('[data-cart-list]');
    const empty = root.querySelector('[data-cart-empty]');
    const body = root.querySelector('[data-cart-body]');

    if (!items.length) { empty?.classList.remove('hidden'); body?.classList.add('hidden'); return; }
    empty?.classList.add('hidden'); body?.classList.remove('hidden');

    list.innerHTML = items.map(p => `
      <div class="flex gap-4 py-5 border-b" style="border-color:var(--line)" data-row="${p.id}">
        <div class="w-20 h-24 rounded-xl overflow-hidden flex-none">${beanArt(p)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between gap-3">
            <div>
              <p class="font-display text-lg leading-tight">${p.name}</p>
              <p class="text-sm opacity-60">${p.origin} · ${p.weight}</p>
            </div>
            <button data-remove="${p.id}" class="opacity-40 hover:opacity-100 transition text-sm">Remover</button>
          </div>
          <div class="flex justify-between items-center mt-3">
            <div class="stepper">
              <button type="button" data-cart-dec="${p.id}">−</button>
              <input type="text" value="${p.qty}" readonly>
              <button type="button" data-cart-inc="${p.id}">+</button>
            </div>
            <p class="font-semibold tabular">${BRL.format(p.line)}</p>
          </div>
        </div>
      </div>`).join('');

    updateSummary(root);

    list.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { Cart.remove(b.dataset.remove); }));
    list.querySelectorAll('[data-cart-inc]').forEach(b => b.addEventListener('click', () => { const it = Cart.read().find(i => i.id === b.dataset.cartInc); Cart.setQty(b.dataset.cartInc, (it?.qty || 1) + 1); }));
    list.querySelectorAll('[data-cart-dec]').forEach(b => b.addEventListener('click', () => { const it = Cart.read().find(i => i.id === b.dataset.cartDec); Cart.setQty(b.dataset.cartDec, (it?.qty || 1) - 1); }));
  }

  function updateSummary(root) {
    const sub = Cart.subtotal();
    const ship = sub >= 99 || sub === 0 ? 0 : 19.9;
    const total = sub + ship;
    root.querySelectorAll('[data-sum-subtotal]').forEach(e => e.textContent = BRL.format(sub));
    root.querySelectorAll('[data-sum-ship]').forEach(e => e.textContent = ship === 0 ? 'Grátis' : BRL.format(ship));
    root.querySelectorAll('[data-sum-total]').forEach(e => e.textContent = BRL.format(total));
    root.querySelectorAll('[data-ship-hint]').forEach(e => {
      if (sub === 0) { e.textContent = ''; return; }
      e.textContent = ship === 0 ? '✓ Você ganhou frete grátis' : `Faltam ${BRL.format(99 - sub)} para frete grátis`;
    });
  }

  function renderCheckoutSummary() {
    const root = document.querySelector('[data-checkout]');
    if (!root) return;
    const items = Cart.detailed();
    const list = root.querySelector('[data-checkout-list]');
    if (list) {
      list.innerHTML = items.length ? items.map(p => `
        <div class="flex justify-between items-center gap-3 text-sm py-2">
          <span class="flex items-center gap-2"><span class="w-6 h-6 grid place-items-center rounded-full text-xs font-semibold" style="background:var(--sand)">${p.qty}</span>${p.name}</span>
          <span class="tabular">${BRL.format(p.line)}</span>
        </div>`).join('') : '<p class="text-sm opacity-60 py-3">Sua sacola está vazia.</p>';
    }
    updateSummary(root);

    const form = root.querySelector('[data-checkout-form]');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const lines = items.map(p => `• ${p.qty}x ${p.name} (${p.weight}) — ${BRL.format(p.line)}`).join('\n');
      const sub = Cart.subtotal();
      const ship = sub >= 99 ? 0 : 19.9;
      const msg = `*Novo pedido — ${STORE}*\n\n${lines}\n\nSubtotal: ${BRL.format(sub)}\nFrete: ${ship === 0 ? 'Grátis' : BRL.format(ship)}\n*Total: ${BRL.format(sub + ship)}*\n\nCliente: ${data.nome || '-'}\nE-mail: ${data.email || '-'}\nEntrega: ${data.endereco || '-'}, ${data.cidade || '-'}\nPagamento: ${data.pagamento || '-'}`;
      window.open(waLink(msg), '_blank');
      toast('Pedido enviado! Continue no WhatsApp.');
    });
  }

  /* ---- Product gallery thumbs ------------------------------------------- */
  function initGallery() {
    const main = document.querySelector('[data-gallery-main]');
    if (!main) return;
    document.querySelectorAll('[data-gallery-thumb]').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('[data-gallery-thumb]').forEach(x => x.classList.remove('ring-2'));
        t.classList.add('ring-2');
        main.style.setProperty('--bag-a', t.dataset.a);
        main.style.setProperty('--bag-b', t.dataset.b);
      });
    });
  }

  /* ---- Product detail loader (reads ?p=) -------------------------------- */
  function initProductDetail() {
    const root = document.querySelector('[data-product-detail]');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('p') || 'geisha';
    const p = CATALOG[id] || CATALOG.geisha;
    root.querySelectorAll('[data-pd="name"]').forEach(e => e.textContent = p.name);
    root.querySelectorAll('[data-pd="origin"]').forEach(e => e.textContent = p.origin);
    root.querySelectorAll('[data-pd="notes"]').forEach(e => e.textContent = p.notes);
    root.querySelectorAll('[data-pd="tag"]').forEach(e => e.textContent = p.tag);
    root.querySelectorAll('[data-pd="weight"]').forEach(e => e.textContent = p.weight);
    root.querySelectorAll('[data-pd="price"]').forEach(e => e.textContent = BRL.format(p.price));
    const main = root.querySelector('[data-gallery-main]');
    if (main) { main.innerHTML = beanArt(p, true); main.style.setProperty('--bag-a', p.a); main.style.setProperty('--bag-b', p.b); }
    root.querySelector('[data-add-main]')?.setAttribute('data-add', p.id);
    const rel = root.querySelector('[data-related]');
    if (rel) {
      const ids = Object.keys(CATALOG).filter(x => x !== id).slice(0, 4);
      rel.innerHTML = ids.map((rid, i) => productCard(CATALOG[rid], i)).join('');
    }
    document.title = `${p.name} — ÁUREO Cafés Especiais`;
  }

  /* ---- Premium chrome: film grain + scroll progress --------------------- */
  function initChrome() {
    if (!document.querySelector('.grain')) {
      const g = document.createElement('div'); g.className = 'grain'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
    }
    let bar = document.querySelector('.scroll-progress');
    if (!bar) { bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar); }
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Count-up (números que sobem ao entrar na tela) ------------------- */
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dec = (String(el.dataset.count).split('.')[1] || '').length;
      const dur = 1500, t0 = performance.now();
      const fmt = (n) => n.toFixed(dec).replace('.', ',') + suffix;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .5 });
    els.forEach(e => io.observe(e));
  }

  /* ---- Tilt 3D (apenas em ponteiro fino) -------------------------------- */
  function initTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const max = 9;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) scale(1.03)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- Botões magnéticos ------------------------------------------------ */
  function initMagnetic() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .28}px, ${(e.clientY - r.top - r.height / 2) * .4}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- Coffee beans (SVG + flutuação + chuva) --------------------------- */
  function beanSVG(fill = '#3b2a20', w = 22) {
    return `<svg width="${w}" viewBox="0 0 24 32" fill="none" aria-hidden="true"><ellipse cx="12" cy="16" rx="10" ry="15" fill="${fill}"/><path d="M12 2.5 C7 10 17 22 12 29.5" stroke="rgba(0,0,0,.42)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
  }
  window.AUREO_BEAN_SVG = beanSVG;

  function initFloatingBeans() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('[data-beans]').forEach(box => {
      const n = parseInt(box.dataset.beans, 10) || 14;
      const layer = document.createElement('div'); layer.className = 'beans-bg'; layer.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < n; i++) {
        const b = document.createElement('div'); b.className = 'bean';
        b.innerHTML = beanSVG('#caa86f', 14 + Math.random() * 20);
        b.style.left = (Math.random() * 100) + '%';
        b.style.animationDuration = (11 + Math.random() * 13) + 's';
        b.style.animationDelay = (-Math.random() * 18) + 's';
        layer.appendChild(b);
      }
      box.prepend(layer);
    });
  }

  function beanBurst(count = 30) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wrap = document.createElement('div'); wrap.className = 'bean-burst'; wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div'); b.className = 'bean';
      b.innerHTML = beanSVG(Math.random() > .5 ? '#3b2a20' : '#5a3d23', 14 + Math.random() * 16);
      b.style.left = (Math.random() * 100) + '%';
      b.style.animationDuration = (1.9 + Math.random() * 1.7) + 's';
      b.style.animationDelay = (Math.random() * .5) + 's';
      wrap.appendChild(b);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 4200);
  }
  window.AUREO_BEAN_BURST = beanBurst;

  /* ---- Ícones SVG (substituem emojis) ----------------------------------- */
  const ICONS = {
    star:     '<path d="M12 3.2l2.6 5.5 6 .7-4.4 4.2 1.1 5.9L12 16.8 6.7 19.5l1.1-5.9L3.4 9.4l6-.7z"/>',
    cup:      '<path d="M4 8h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/><path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M7.5 2.5c-.5.8.5 1.4 0 2.5M11.5 2.5c-.5.8.5 1.4 0 2.5"/>',
    cups:     '<rect x="3" y="9" width="8" height="8" rx="2"/><rect x="13" y="11" width="7" height="6" rx="2"/>',
    sprout:   '<path d="M12 20v-7"/><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z"/><path d="M12 11c0-2.5 2-4 4.5-4 0 2.5-2 4-4.5 4z"/>',
    compass:  '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    gem:      '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/>',
    bolt:     '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    flask:    '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
    help:     '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/>',
    coin:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.2a2.2 2.2 0 0 1 2.5-1.2c1.5.2 2 1 2 2M14.5 14.8a2.2 2.2 0 0 1-2.5 1.2c-1.5-.2-2-1-2-2"/>',
    gift:     '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z"/>',
    leaf:     '<path d="M5 19c0-8 6-13 14-13 0 8-6 13-14 13z"/><path d="M5 19c3-5 7-8 11-9"/>',
    crown:    '<path d="M3 7l4 4 5-6 5 6 4-4-2 12H5z"/><path d="M5 21h14"/>',
    spark:    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
    truck:    '<path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    lock:     '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield:   '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    seed:     '<path d="M12 4c4 2 6 5 6 9a6 6 0 0 1-12 0c0-4 2-7 6-9z"/><path d="M12 5c-1.5 4-1.5 9 0 14"/>',
    fire:     '<path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-5 1 1 2 1 3-3z"/>',
    heart:    '<path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z"/>',
  };
  function icon(name, cls = '') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }
  window.AUREO_ICON = icon;

  /* ---- Preloader / brand intro (1x por sessão) -------------------------- */
  function initPreloader() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || sessionStorage.getItem('aureo_intro')) { document.body.classList.remove('loading'); return; }
    sessionStorage.setItem('aureo_intro', '1');
    const pl = document.createElement('div');
    pl.className = 'preloader';
    pl.innerHTML = `<div class="preloader__beans"></div><div class="preloader__inner">
      <div class="preloader__brand">ÁUREO<span class="dot">.</span></div>
      <div class="preloader__line"></div>
      <div class="preloader__sub">Cafés Especiais · Torra Artesanal</div>
    </div>`;
    document.body.classList.add('loading');
    document.body.appendChild(pl);
    // beans dentro do preloader
    const layer = pl.querySelector('.preloader__beans');
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('div'); b.className = 'bean'; b.style.position = 'absolute'; b.style.top = '110%';
      b.innerHTML = beanSVG('#caa86f', 14 + Math.random() * 20);
      b.style.left = (Math.random() * 100) + '%'; b.style.animation = `beanFloat ${9 + Math.random() * 8}s linear ${-Math.random() * 10}s infinite`;
      layer.appendChild(b);
    }
    const done = () => { pl.classList.add('done'); document.body.classList.remove('loading'); setTimeout(() => pl.remove(), 1100); };
    setTimeout(done, 1900);
  }

  /* ---- Custom cursor ---------------------------------------------------- */
  function initCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    let rx = 0, ry = 0, mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      ring.classList.add('on'); dot.classList.add('on');
    });
    const loop = () => { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', (e) => {
      ring.classList.toggle('grow', !!e.target.closest('a, button, .opt, .card, [data-tilt], summary, input, label'));
    });
    document.addEventListener('mouseleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); });
  }

  /* ---- Text reveal por palavra ------------------------------------------ */
  function initTextReveal() {
    const heads = document.querySelectorAll('h1.font-display:not(.enter), h2.font-display:not(.enter)');
    const targets = [];
    heads.forEach(h => {
      if (h.children.length || h.dataset.noReveal !== undefined || !h.textContent.trim()) return;
      const words = h.textContent.trim().split(/\s+/);
      h.classList.add('tr');
      h.innerHTML = words.map((w, i) => `<span class="tr-word"><i style="transition-delay:${i * 55}ms">${w}</i></span>`).join(' ');
      targets.push(h);
    });
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .35 });
    targets.forEach(t => io.observe(t));
  }

  /* ---- Jornada (scroll) ------------------------------------------------- */
  function initJourney() {
    const els = document.querySelectorAll('.journey');
    if (!els.length) return;
    const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .3 });
    els.forEach(e => io.observe(e));
  }

  /* ---- Year stamp ------------------------------------------------------- */
  function initYear() { document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear()); }

  /* ---- Boot ------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // auto-mount product grids that ask for it (before reveal observers)
    document.querySelectorAll('[data-grid]').forEach(grid => {
      const ids = (grid.dataset.grid === 'all') ? Object.keys(CATALOG) : grid.dataset.grid.split(',').map(s => s.trim());
      grid.innerHTML = ids.map((id, i) => productCard(CATALOG[id], i)).join('');
    });

    initHeader(); initMobileMenu(); initAddButtons(); initSteppers();
    initWhatsApp(); initPlanToggle(); initGallery(); initProductDetail(); initYear();
    refreshBadges(); renderCart(); renderCheckoutSummary();
    initPreloader(); initCursor();
    initChrome(); initCountUp(); initTilt(); initMagnetic(); initFloatingBeans();
    initTextReveal(); initJourney();
    initReveal();
    document.addEventListener('cart:change', () => { refreshBadges(); renderCart(); renderCheckoutSummary(); });
  });

  /* ---- Reusable product card -------------------------------------------- */
  function productCard(p, i) {
    if (!p) return '';
    const sca = p.sca ? `<span class="badge-sca">${icon('star')} SCA ${p.sca}</span>` : '';
    const promo = p.oldPrice ? `<span class="absolute top-3 right-3 chip chip-gold !bg-gold !text-espresso">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : '';
    const oldP = p.oldPrice ? `<span class="price-old tabular">${BRL.format(p.oldPrice)}</span>` : '';
    const scar = p.stock ? `<div class="scarcity mt-3">${icon('fire', 'w-3.5 h-3.5')}<span>Restam ${p.stock}</span><span class="bar"><i style="width:${Math.min(100, p.stock * 4)}%"></i></span></div>` : '';
    return `<article class="card reveal" data-delay="${(i % 4) + 1}" data-product-scope>
      <a href="produto.html?p=${p.id}" class="card__media block">${beanArt(p)}
        <span class="absolute top-3 left-3 chip chip-gold !bg-gold !text-espresso shadow">${p.tag}</span>${promo}
      </a>
      <div class="p-5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs opacity-60 truncate">${p.origin}</p>${sca}
        </div>
        <a href="produto.html?p=${p.id}"><h3 class="font-display text-xl mt-1 leading-tight hover:text-[var(--gold)] transition">${p.name}</h3></a>
        <p class="text-sm opacity-70 mt-1">${p.notes}</p>
        ${scar}
        <div class="flex items-center justify-between mt-4">
          <span class="font-semibold tabular">${oldP}${BRL.format(p.price)}</span>
          <button class="btn btn-ghost !py-2 !px-4 text-sm" data-add="${p.id}">Adicionar</button>
        </div>
      </div>
    </article>`;
  }
  window.AUREO_CARD = productCard;
})();
