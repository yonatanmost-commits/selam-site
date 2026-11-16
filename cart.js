/* Selam soap cart — pure logic + DOM wiring. Pure part is node-testable. */
(function (root) {
  'use strict';

  const DELIVERY = [
    { id: 'pickup', label: 'איסוף עצמי — בתיאום', price: 0 },
    { id: 'post',   label: 'משלוח בדואר',          price: 25 },
  ];
  const FREE_SHIPPING_ABOVE = null; // set to e.g. 120 to enable free post shipping above that subtotal
  const MAX_QTY = 20;

  const clamp = (q) => Math.min(Math.max(q, 0), MAX_QTY);

  function addItem(items, id) {
    const found = items.find((it) => it.id === id);
    if (!found) return items.concat([{ id, qty: 1 }]);
    return items.map((it) => (it.id === id ? { id, qty: clamp(it.qty + 1) } : it));
  }

  function setQty(items, id, qty) {
    const q = clamp(qty);
    if (q === 0) return removeItem(items, id);
    return items.map((it) => (it.id === id ? { id, qty: q } : it));
  }

  function removeItem(items, id) {
    return items.filter((it) => it.id !== id);
  }

  function cartCount(items) {
    return items.reduce((n, it) => n + it.qty, 0);
  }

  function subtotal(items, catalog) {
    return items.reduce((s, it) => s + catalog[it.id].price * it.qty, 0);
  }

  function deliveryPrice(deliveryId, sub) {
    const d = DELIVERY.find((x) => x.id === deliveryId);
    if (!d) return 0;
    if (FREE_SHIPPING_ABOVE !== null && d.id === 'post' && sub >= FREE_SHIPPING_ABOVE) return 0;
    return d.price;
  }

  function total(items, catalog, deliveryId) {
    const sub = subtotal(items, catalog);
    return sub + deliveryPrice(deliveryId, sub);
  }

  function sanitize(items, catalog) {
    return items
      .filter((it) => it && catalog[it.id] && it.qty > 0)
      .map((it) => ({ id: it.id, qty: clamp(it.qty) }));
  }

  function buildMessage(items, catalog, deliveryId) {
    if (!items.length) return null;
    const lines = ['היי סלם! 🌿 אשמח להזמין:'];
    items.forEach((it) => {
      const p = catalog[it.id];
      lines.push('• ' + p.name + ' — ' + it.qty + ' × ₪' + p.price);
    });
    const sub = subtotal(items, catalog);
    const ship = deliveryPrice(deliveryId, sub);
    if (deliveryId === 'pickup') lines.push('איסוף עצמי — בתיאום (חינם)');
    else lines.push('משלוח בדואר — ₪' + ship);
    lines.push('סה"כ: ₪' + (sub + ship));
    return lines.join('\n');
  }

  function buildWaUrl(text, phone) {
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  }

  // TikTok / Instagram / Facebook in-app browsers block every hop to WhatsApp
  // (wa.me, api.whatsapp.com, whatsapp://). Checkout has to route around them.
  function isInAppBrowser(ua) {
    return /musical_ly|trill_|BytedanceWebview|TikTok|Instagram|FBAN|FBAV|FB_IAB/i.test(ua || '');
  }

  // Cart <-> "?cart=" string, so "open in browser" carries the cart across.
  function encodeCart(items) {
    return items.map((it) => it.id + '.' + it.qty).join(',');
  }

  function decodeCart(s) {
    return String(s || '').split(',').map((part) => {
      const i = part.lastIndexOf('.');
      const id = part.slice(0, i), qty = Number(part.slice(i + 1));
      return i > 0 && Number.isInteger(qty) && qty > 0 ? { id, qty } : null;
    }).filter(Boolean);
  }

  const SelamCart = {
    DELIVERY, FREE_SHIPPING_ABOVE, MAX_QTY,
    addItem, setQty, removeItem, cartCount, subtotal,
    deliveryPrice, total, sanitize, buildMessage, buildWaUrl,
    isInAppBrowser, encodeCart, decodeCart,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SelamCart;
  else root.SelamCart = SelamCart;

  if (typeof document === 'undefined') return;

  document.addEventListener('DOMContentLoaded', function () {
    const WA_PHONE = '972543477997';
    const $ = (id) => document.getElementById(id);
    const pill = $('cartPill'), badge = $('cartCount'), live = $('cartLive'),
          backdrop = $('cartBackdrop'), drawer = $('cartDrawer'), closeBtn = $('cartClose'),
          listEl = $('cartItems'), emptyEl = $('cartEmpty'), totalEl = $('cartTotal'),
          checkoutBtn = $('cartCheckout'), deliveryBox = $('cartDelivery'),
          inAppBox = $('cartInApp'), copyBtn = $('cartCopy'), msgEl = $('cartMsg');
    const IN_APP = SelamCart.isInAppBrowser(navigator.userAgent);
    if (!pill || !drawer) return;

    // Catalog from DOM — first button per id wins (gallery before soap-of-month)
    const catalog = {};
    document.querySelectorAll('.buy[data-id]').forEach((b) => {
      const id = b.dataset.id;
      if (!catalog[id]) catalog[id] = { id, name: b.dataset.soap, price: Number(b.dataset.price) };
    });

    // Storage (in-memory fallback)
    const KEY = 'selam-cart';
    let memory = [];
    function load() {
      try { return SelamCart.sanitize(JSON.parse(localStorage.getItem(KEY)) || [], catalog); }
      catch (_) { return memory; }
    }
    // Inside TikTok/Instagram the cart also rides in ?cart=, so "open in browser"
    // (which reopens the current address) arrives with the cart already filled.
    function syncUrl(items) {
      try {
        const u = new URL(location.href);
        if (IN_APP && items.length) u.searchParams.set('cart', SelamCart.encodeCart(items));
        else u.searchParams.delete('cart');
        if (u.href !== location.href) history.replaceState(history.state, '', u.href);
      } catch (_) {}
    }
    function save(items) {
      memory = items;
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {}
      syncUrl(items);
    }

    let items = load();
    const carried = new URLSearchParams(location.search).get('cart');
    if (carried) {
      const fromUrl = SelamCart.sanitize(SelamCart.decodeCart(carried), catalog);
      if (fromUrl.length) items = fromUrl;
    }
    save(items);
    let deliveryId = 'post';
    let lastFocus = null;

    function fmt(n) { return '₪' + n; }

    function render() {
      const count = SelamCart.cartCount(items);
      badge.textContent = count;
      pill.hidden = count === 0;
      emptyEl.hidden = count !== 0;
      checkoutBtn.disabled = count === 0;
      listEl.innerHTML = '';
      items.forEach((it) => {
        const p = catalog[it.id];
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML =
          '<span class="nm"></span>' +
          '<span class="cart-qty">' +
            '<button type="button" data-act="dec" aria-label="הפחתת כמות">−</button>' +
            '<b>' + it.qty + '</b>' +
            '<button type="button" data-act="inc" aria-label="הוספת כמות">+</button>' +
            '<button type="button" class="rm" data-act="rm" aria-label="הסרה מהסל">הסרה</button>' +
          '</span>' +
          '<span class="ln">' + it.qty + ' × ' + fmt(p.price) + '</span>';
        li.querySelector('.nm').textContent = p.name;
        li.dataset.id = it.id;
        listEl.appendChild(li);
      });
      totalEl.textContent = fmt(SelamCart.total(items, catalog, deliveryId));
      if (inAppBox && !inAppBox.hidden) msgEl.value = SelamCart.buildMessage(items, catalog, deliveryId) || '';
      if (count === 0 && !drawer.hidden) closeDrawer();
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      backdrop.hidden = false; drawer.hidden = false;
      closeBtn.focus();
    }
    function closeDrawer() {
      backdrop.hidden = true; drawer.hidden = true;
      if (inAppBox) inAppBox.hidden = true;
      if (lastFocus) lastFocus.focus();
    }

    // Add-to-cart buttons
    document.querySelectorAll('.buy[data-id]').forEach((b) => {
      b.setAttribute('aria-label', 'הוספה לסל: ' + b.dataset.soap);
      const label = b.firstChild;
      const orig = label.textContent;
      b.addEventListener('click', () => {
        items = SelamCart.addItem(items, b.dataset.id);
        save(items); render();
        live.textContent = 'נוסף לסל — ' + SelamCart.cartCount(items) + ' פריטים בסל';
        b.classList.add('added');
        label.textContent = 'נוסף ✓';
        clearTimeout(b._t);
        b._t = setTimeout(() => { b.classList.remove('added'); label.textContent = orig; }, 1200);
      });
    });

    // Drawer item actions (event delegation)
    listEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-act]'); if (!btn) return;
      const id = btn.closest('.cart-item').dataset.id;
      const cur = items.find((it) => it.id === id);
      if (btn.dataset.act === 'inc') items = SelamCart.setQty(items, id, cur.qty + 1);
      if (btn.dataset.act === 'dec') items = SelamCart.setQty(items, id, cur.qty - 1);
      if (btn.dataset.act === 'rm')  items = SelamCart.removeItem(items, id);
      save(items); render();
    });

    deliveryBox.addEventListener('change', (ev) => {
      if (ev.target.name === 'delivery') { deliveryId = ev.target.value; render(); }
    });

    pill.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !drawer.hidden) closeDrawer();
    });
    drawer.addEventListener('keydown', (ev) => { // keep Tab inside the dialog
      if (ev.key !== 'Tab') return;
      const f = drawer.querySelectorAll('button:not([disabled]), input, textarea, a[href]');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });

    checkoutBtn.addEventListener('click', () => {
      const msg = SelamCart.buildMessage(items, catalog, deliveryId);
      if (!msg) return;
      if (IN_APP && inAppBox) { // WhatsApp is unreachable from here: keep the cart, offer the ways out
        msgEl.value = msg;
        inAppBox.hidden = false;
        inAppBox.scrollIntoView({ block: 'nearest' });
        return;
      }
      const url = SelamCart.buildWaUrl(msg, WA_PHONE);
      // In-app browsers (WhatsApp/Instagram/Facebook links) block new tabs and
      // window.open returns null — the cart used to empty with nothing opened.
      // Fall back to navigating this tab so the order always reaches WhatsApp.
      const win = window.open(url, '_blank');
      items = []; save(items); render(); closeDrawer();
      if (!win) window.location.href = url;
    });

    if (copyBtn) copyBtn.addEventListener('click', () => {
      const orig = copyBtn.textContent;
      const done = () => { copyBtn.textContent = 'הועתק ✓'; setTimeout(() => { copyBtn.textContent = orig; }, 1500); };
      const fallback = () => { // webviews often refuse the async clipboard API
        msgEl.focus(); msgEl.select(); msgEl.setSelectionRange(0, msgEl.value.length);
        try { if (document.execCommand('copy')) done(); } catch (_) {}
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msgEl.value).then(done, fallback);
      } else fallback();
    });

    render();
  });
})(this);
