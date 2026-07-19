# Soap Cart & Order Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-soap WhatsApp buttons with an add-to-cart flow that computes a total including delivery (pickup ₪0 / Israel Post ₪25) and hands off one itemized order message to WhatsApp.

**Architecture:** Static site, no backend. New `cart.js` (loaded with `defer` from `index.html`) holds pure cart logic (testable via `node --test`, exported when `module` exists) plus DOM wiring. `index.html` gets `data-id`/`data-price` on buy buttons, cart-pill + drawer markup, and CSS in the existing style block. State: `localStorage` key `selam-cart`, in-memory fallback. **Spec deviation (approved direction, refined):** spec said "all code lives in index.html"; logic moved to `cart.js` for testability — behavior identical.

**Tech Stack:** Vanilla JS (ES2020, no deps), node:test built-in runner for tests, GitHub Pages hosting.

## Global Constraints

- Hebrew RTL site; all user-facing strings in this plan are exact — copy verbatim.
- Palette tokens only; `--rose-deep` is `#824641` — never lighten (AA contrast depends on it).
- WhatsApp number: `972543477997` (already the `PHONE` const in index.html).
- Delivery: `pickup` ₪0 ("איסוף עצמי — בתיאום"), `post` ₪25 ("משלוח בדואר"). `FREE_SHIPPING_ABOVE = null` at launch.
- Max quantity per item: 20.
- No personal data collected on-site; no changes to privacy.html/accessibility.html.
- Workshop CTA (`.ws-cta`) and contact form keep their existing direct-WhatsApp handlers — do not touch.
- Commit after each task; do NOT `git push` (publishes to the live public site) until the final on-device task is approved by the user.

---

### Task 1: Pure cart logic in `cart.js` + node tests

**Files:**
- Create: `cart.js`
- Create: `tests/cart.test.js`

**Interfaces:**
- Produces (used by Task 4 wiring and later tasks):
  `SelamCart = { DELIVERY, FREE_SHIPPING_ABOVE, MAX_QTY, addItem(items,id), setQty(items,id,qty), removeItem(items,id), cartCount(items), subtotal(items,catalog), deliveryPrice(deliveryId,sub), total(items,catalog,deliveryId), sanitize(items,catalog), buildMessage(items,catalog,deliveryId), buildWaUrl(text,phone) }`
  — `items` is `[{id, qty}]`; `catalog` is `{ [id]: {id, name, price} }`. All functions pure (return new arrays, never mutate).

- [ ] **Step 1: Write the failing tests**

Create `tests/cart.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../cart.js');

const catalog = {
  'cacao-oat-ylang': { id: 'cacao-oat-ylang', name: 'קקאו, שיבולת שועל ואילנג־אילנג', price: 30 },
  'aloe-green-clay-lavender': { id: 'aloe-green-clay-lavender', name: 'אלוורה, חימר ירוק ולבנדר', price: 28 },
};

test('addItem adds a new line with qty 1', () => {
  const items = C.addItem([], 'cacao-oat-ylang');
  assert.deepStrictEqual(items, [{ id: 'cacao-oat-ylang', qty: 1 }]);
});

test('addItem increments an existing line and does not mutate input', () => {
  const start = [{ id: 'cacao-oat-ylang', qty: 1 }];
  const items = C.addItem(start, 'cacao-oat-ylang');
  assert.strictEqual(items[0].qty, 2);
  assert.strictEqual(start[0].qty, 1);
});

test('addItem clamps at MAX_QTY', () => {
  const items = C.addItem([{ id: 'cacao-oat-ylang', qty: C.MAX_QTY }], 'cacao-oat-ylang');
  assert.strictEqual(items[0].qty, C.MAX_QTY);
});

test('setQty clamps to MAX_QTY and removes at qty<=0', () => {
  assert.strictEqual(C.setQty([{ id: 'a', qty: 3 }], 'a', 99)[0].qty, C.MAX_QTY);
  assert.deepStrictEqual(C.setQty([{ id: 'a', qty: 3 }], 'a', 0), []);
});

test('removeItem drops the line', () => {
  assert.deepStrictEqual(C.removeItem([{ id: 'a', qty: 2 }, { id: 'b', qty: 1 }], 'a'), [{ id: 'b', qty: 1 }]);
});

test('cartCount sums quantities', () => {
  assert.strictEqual(C.cartCount([{ id: 'a', qty: 2 }, { id: 'b', qty: 3 }]), 5);
});

test('subtotal multiplies price by qty', () => {
  const items = [{ id: 'cacao-oat-ylang', qty: 2 }, { id: 'aloe-green-clay-lavender', qty: 1 }];
  assert.strictEqual(C.subtotal(items, catalog), 88);
});

test('deliveryPrice: pickup is 0, post is 25', () => {
  assert.strictEqual(C.deliveryPrice('pickup', 88), 0);
  assert.strictEqual(C.deliveryPrice('post', 88), 25);
});

test('total = subtotal + delivery', () => {
  const items = [{ id: 'cacao-oat-ylang', qty: 2 }];
  assert.strictEqual(C.total(items, catalog, 'post'), 85);
  assert.strictEqual(C.total(items, catalog, 'pickup'), 60);
});

test('sanitize drops unknown ids and clamps qty', () => {
  const items = [{ id: 'gone-soap', qty: 2 }, { id: 'cacao-oat-ylang', qty: 999 }];
  assert.deepStrictEqual(C.sanitize(items, catalog), [{ id: 'cacao-oat-ylang', qty: C.MAX_QTY }]);
});

test('buildMessage lists items, delivery and total (post)', () => {
  const items = [{ id: 'cacao-oat-ylang', qty: 2 }, { id: 'aloe-green-clay-lavender', qty: 1 }];
  const msg = C.buildMessage(items, catalog, 'post');
  assert.strictEqual(msg, [
    'היי סלם! 🌿 אשמח להזמין:',
    '• קקאו, שיבולת שועל ואילנג־אילנג — 2 × ₪30',
    '• אלוורה, חימר ירוק ולבנדר — 1 × ₪28',
    'משלוח בדואר — ₪25',
    'סה"כ: ₪113',
  ].join('\n'));
});

test('buildMessage renders pickup as free coordination line', () => {
  const msg = C.buildMessage([{ id: 'cacao-oat-ylang', qty: 1 }], catalog, 'pickup');
  assert.ok(msg.includes('איסוף עצמי — בתיאום (חינם)'));
  assert.ok(msg.includes('סה"כ: ₪30'));
});

test('buildMessage returns null for empty cart', () => {
  assert.strictEqual(C.buildMessage([], catalog, 'post'), null);
});

test('buildWaUrl encodes the text', () => {
  const url = C.buildWaUrl('שלום עולם', '972543477997');
  assert.ok(url.startsWith('https://wa.me/972543477997?text='));
  assert.ok(url.includes(encodeURIComponent('שלום עולם')));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (repo root): `node --test tests/`
Expected: FAIL — `Cannot find module '../cart.js'`

- [ ] **Step 3: Implement `cart.js` pure logic**

Create `cart.js`:

```js
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

  const SelamCart = {
    DELIVERY, FREE_SHIPPING_ABOVE, MAX_QTY,
    addItem, setQty, removeItem, cartCount, subtotal,
    deliveryPrice, total, sanitize, buildMessage, buildWaUrl,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SelamCart;
  else root.SelamCart = SelamCart;

  // DOM wiring added in a later task; guarded so node tests skip it.
  if (typeof document === 'undefined') return;
})(this);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS (14 pass, 0 fail)

- [ ] **Step 5: Commit**

```bash
git add cart.js tests/cart.test.js
git commit -m "feat: pure cart logic (items, delivery pricing, WhatsApp message) with node tests"
```

---

### Task 2: Markup — data attributes, cart pill, drawer, script include

**Files:**
- Modify: `index.html:424` (ship-note), `index.html:433,442,451,460,488` (buy buttons), `index.html:645` area (before `<script>`: new markup + script include)

**Interfaces:**
- Produces DOM contract consumed by Task 4: buttons `.buy[data-id][data-price][data-soap]`; elements `#cartPill`, `#cartCount`, `#cartLive`, `#cartBackdrop`, `#cartDrawer`, `#cartClose`, `#cartItems`, `#cartEmpty`, `#cartDelivery`, `#cartTotalRow`, `#cartTotal`, `#cartCheckout`.

- [ ] **Step 1: Update ship-note copy**

Replace line 424:

```html
      <span class="ship-note reveal">משלוח בדואר ₪25 · איסוף עצמי חינם</span>
```

- [ ] **Step 2: Add data attributes + new label to the 5 buy buttons**

Each `.buy` button: add `data-id` + `data-price`, change visible text `להזמנה` → `הוספה לסל`, and swap the WhatsApp bubble SVG for a plus-in-circle. The 5 buttons (gallery ×4 at lines 433/442/451/460, soap-of-month at 488) become — exact `data-id`/`data-price` pairs:

| line | data-id | data-price |
|------|---------|-----------|
| 433 | `white-clay-charcoal-tea-tree` | `30` |
| 442 | `aloe-green-clay-lavender` | `28` |
| 451 | `cacao-oat-ylang` | `30` |
| 460 | `coffee-turmeric` | `30` |
| 488 (month) | `coffee-turmeric` | `30` (same id — increments the same cart line; keeps its own data-soap) |

Template (example, line 433 — repeat pattern for all five, keeping each button's existing `data-soap` value):

```html
<button class="buy" data-id="white-clay-charcoal-tea-tree" data-price="30" data-soap="חימר לבן, פחם פעיל ועץ התה">הוספה לסל<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></button>
```

- [ ] **Step 3: Add cart pill + drawer markup before the `<script>` tag (after the footer, index.html:645 area)**

```html
<!-- CART -->
<button id="cartPill" class="cart-pill" hidden aria-haspopup="dialog" aria-controls="cartDrawer">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  <span>הסל שלי</span><span id="cartCount" class="cart-badge">0</span>
</button>
<span id="cartLive" class="sr-only" aria-live="polite"></span>

<div id="cartBackdrop" class="cart-backdrop" hidden></div>
<aside id="cartDrawer" class="cart-drawer" role="dialog" aria-modal="true" aria-label="סל ההזמנה" hidden>
  <div class="cart-head">
    <h3>סל ההזמנה</h3>
    <button id="cartClose" class="cart-close" aria-label="סגירת הסל">✕</button>
  </div>
  <p id="cartEmpty" class="cart-empty" hidden>הסל ריק — <a href="#shop">לגלריית הסבונים</a></p>
  <ul id="cartItems" class="cart-items"></ul>
  <fieldset id="cartDelivery" class="cart-delivery">
    <legend>אופן קבלת ההזמנה</legend>
    <label><input type="radio" name="delivery" value="post" checked> משלוח בדואר — ₪25</label>
    <label><input type="radio" name="delivery" value="pickup"> איסוף עצמי — בתיאום (חינם)</label>
  </fieldset>
  <div id="cartTotalRow" class="cart-total"><span>סה"כ</span><b id="cartTotal">₪0</b></div>
  <button id="cartCheckout" class="btn btn-primary cart-checkout">השלמת ההזמנה בוואטסאפ</button>
  <p class="cart-pay-note">התשלום בביט או בפייבוקס לאחר אישור ההזמנה.</p>
</aside>
<script src="cart.js" defer></script>
```

(The existing inline `<script>` stays; `cart.js` include sits directly above it.)

- [ ] **Step 4: Verify structure**

Run: `node -e "const h=require('fs').readFileSync('index.html','utf8'); ['cartPill','cartDrawer','cartItems','cartCheckout','data-id=\"coffee-turmeric\"','cart.js'].forEach(s=>{ if(!h.includes(s)) throw new Error('missing: '+s); }); if(h.includes('>להזמנה<')) throw new Error('old buy label remains'); console.log('markup OK');"`
Expected: `markup OK`

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: cart markup — data attributes on buy buttons, cart pill and drawer"
```

---

### Task 3: Cart CSS in the existing style block

**Files:**
- Modify: `index.html` — append inside `<style>` just before the `@media(prefers-reduced-motion...)` rule (line 319)

**Interfaces:**
- Consumes: class/id names from Task 2. Produces: visual styles only; `.buy.added` state consumed by Task 4.

- [ ] **Step 1: Add the CSS block**

Insert before the `prefers-reduced-motion` media query:

```css
/* ───────────────── CART ───────────────── */
.sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.buy.added{ background:var(--olive); }
.cart-pill{ position:fixed; bottom:1.2rem; inset-inline-start:1.2rem; z-index:150; display:inline-flex; align-items:center; gap:.55rem;
  background:var(--espresso); color:var(--paper); border:none; cursor:pointer; font-family:inherit; font-weight:600; font-size:.95rem;
  padding:.8rem 1.3rem; border-radius:100px; box-shadow:var(--shadow); transition:transform .25s; }
.cart-pill:hover{ transform:translateY(-3px); }
.cart-badge{ background:var(--rose-deep); color:var(--paper); font-size:.8rem; font-weight:700; min-width:1.5rem; height:1.5rem;
  border-radius:100px; display:grid; place-items:center; padding:0 .3rem; }
.cart-backdrop{ position:fixed; inset:0; z-index:180; background:rgba(46,38,31,.45); }
.cart-drawer{ position:fixed; z-index:190; bottom:0; inset-inline:0; margin-inline:auto; max-width:480px; max-height:85vh; overflow:auto;
  background:var(--paper); border:1px solid var(--line); border-bottom:none; border-radius:22px 22px 0 0; padding:1.4rem 1.5rem 1.7rem;
  box-shadow:var(--shadow); }
.cart-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
.cart-head h3{ font-weight:900; font-size:1.25rem; color:var(--espresso); }
.cart-close{ background:transparent; border:1px solid var(--line); color:var(--ink-soft); width:2.2rem; height:2.2rem; border-radius:50%;
  cursor:pointer; font-size:1rem; }
.cart-empty{ color:var(--ink-soft); padding:.6rem 0 1rem; }
.cart-empty a{ color:var(--rose-deep); font-weight:600; }
.cart-items{ list-style:none; display:grid; gap:.7rem; }
.cart-item{ display:grid; grid-template-columns:1fr auto; gap:.2rem .9rem; align-items:center; background:var(--paper-2);
  border:1px solid var(--line); border-radius:12px; padding:.7rem .9rem; }
.cart-item .nm{ font-weight:600; font-size:.95rem; color:var(--espresso); }
.cart-item .ln{ color:var(--ink-soft); font-size:.88rem; }
.cart-qty{ display:inline-flex; align-items:center; gap:.55rem; grid-row:span 2; }
.cart-qty button{ width:1.9rem; height:1.9rem; border-radius:50%; border:1px solid var(--line); background:var(--paper);
  color:var(--espresso); font-size:1rem; cursor:pointer; line-height:1; }
.cart-qty .rm{ border-color:transparent; color:var(--rose-deep); font-size:.85rem; width:auto; border-radius:8px; padding:0 .3rem; }
.cart-delivery{ border:1px solid var(--line); border-radius:12px; padding:.9rem 1rem; margin-top:1.1rem; display:grid; gap:.55rem; }
.cart-delivery legend{ padding:0 .4rem; font-weight:600; font-size:.92rem; color:var(--espresso); }
.cart-delivery label{ display:flex; align-items:center; gap:.6rem; font-size:.95rem; color:var(--ink-soft); cursor:pointer; }
.cart-delivery input{ accent-color:var(--rose-deep); width:1.05rem; height:1.05rem; }
.cart-total{ display:flex; justify-content:space-between; align-items:center; margin-top:1.1rem; padding-top:1rem;
  border-top:1px solid var(--line); font-size:1.05rem; color:var(--espresso); }
.cart-total b{ font-weight:900; font-size:1.35rem; color:var(--cacao); }
.cart-checkout{ width:100%; justify-content:center; margin-top:1rem; }
.cart-pay-note{ margin-top:.7rem; text-align:center; color:var(--ink-soft); font-size:.85rem; }
```

Note: `.btn-primary` already exists (espresso→clay-deep bg) — the checkout button reuses it, so no new colors are introduced and AA holds.

- [ ] **Step 2: Verify no CSS syntax breakage**

Run: `node -e "const h=require('fs').readFileSync('index.html','utf8'); const s=h.split('<style>')[1].split('</style>')[0]; let d=0; for(const c of s){ if(c==='{')d++; if(c==='}')d--; if(d<0) throw new Error('unbalanced'); } if(d!==0) throw new Error('unbalanced: '+d); console.log('css OK');"`
Expected: `css OK`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: cart styles — pill, bottom-sheet drawer, steppers, delivery, totals"
```

---

### Task 4: DOM wiring in `cart.js` + remove old buy handler

**Files:**
- Modify: `cart.js` (replace the trailing `if (typeof document === 'undefined') return;` stub with full wiring)
- Modify: `index.html:689-696` (delete the old `.buy[data-soap]` WhatsApp handler block from the inline script)

**Interfaces:**
- Consumes: `SelamCart` pure API (Task 1), DOM ids/classes (Task 2), `.buy.added` style (Task 3). Reads `PHONE`? No — the inline script's `PHONE` is not visible to `cart.js` scope timing; define `const WA_PHONE = '972543477997';` inside the wiring.

- [ ] **Step 1: Replace the stub in `cart.js`**

Replace the final line `if (typeof document === 'undefined') return;` with:

```js
  if (typeof document === 'undefined') return;

  document.addEventListener('DOMContentLoaded', function () {
    const WA_PHONE = '972543477997';
    const $ = (id) => document.getElementById(id);
    const pill = $('cartPill'), badge = $('cartCount'), live = $('cartLive'),
          backdrop = $('cartBackdrop'), drawer = $('cartDrawer'), closeBtn = $('cartClose'),
          listEl = $('cartItems'), emptyEl = $('cartEmpty'), totalEl = $('cartTotal'),
          checkoutBtn = $('cartCheckout'), deliveryBox = $('cartDelivery');
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
    function save(items) {
      memory = items;
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {}
    }

    let items = load();
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
      if (count === 0 && !drawer.hidden) closeDrawer();
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      backdrop.hidden = false; drawer.hidden = false;
      closeBtn.focus();
    }
    function closeDrawer() {
      backdrop.hidden = true; drawer.hidden = true;
      if (lastFocus) lastFocus.focus();
    }

    // Add-to-cart buttons
    document.querySelectorAll('.buy[data-id]').forEach((b) => {
      b.setAttribute('aria-label', 'הוספה לסל: ' + b.dataset.soap);
      b.addEventListener('click', () => {
        items = SelamCart.addItem(items, b.dataset.id);
        save(items); render();
        live.textContent = 'נוסף לסל — ' + SelamCart.cartCount(items) + ' פריטים בסל';
        b.classList.add('added');
        const label = b.firstChild; const orig = label.textContent;
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
      const f = drawer.querySelectorAll('button:not([disabled]), input, a[href]');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });

    checkoutBtn.addEventListener('click', () => {
      const msg = SelamCart.buildMessage(items, catalog, deliveryId);
      if (!msg) return;
      window.open(SelamCart.buildWaUrl(msg, WA_PHONE), '_blank');
      items = []; save(items); render(); closeDrawer();
    });

    render();
  });
```

- [ ] **Step 2: Delete the old buy handler from `index.html`**

Remove this block (lines 689–696):

```js
  document.querySelectorAll('.buy[data-soap]').forEach(b => {
    b.setAttribute('aria-label', 'להזמנה בוואטסאפ: ' + b.getAttribute('data-soap'));
    b.addEventListener('click', () => {
      const soap = b.getAttribute('data-soap');
      const text = 'היי סלם! 🌿\nאשמח להזמין את הסבון: ' + soap + '.\nאפשר פרטים?';
      window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text), '_blank');
    });
  });
```

(Keep the `.ws-cta` and `contactForm` handlers below it untouched.)

- [ ] **Step 3: Re-run node tests (pure logic untouched but re-verify)**

Run: `node --test tests/`
Expected: all PASS

- [ ] **Step 4: Syntax-check cart.js in node**

Run: `node --check cart.js`
Expected: no output (exit 0)

- [ ] **Step 5: Commit**

```bash
git add cart.js index.html
git commit -m "feat: wire cart UI — add-to-cart, drawer, delivery choice, WhatsApp checkout"
```

---

### Task 5: Browser + on-device verification, then deploy

**Files:** none (verification), then `git push` on approval.

- [ ] **Step 1: Local browser pass (desktop)**

Open `index.html` in a real browser (e.g. `start index.html` from PowerShell). Checklist:
- Add each soap; badge counts; soap-of-month increments the coffee-turmeric line (no duplicate line).
- Drawer: ± steppers, remove, empty state appears when last item removed, pill hides.
- Delivery switch post↔pickup updates total (e.g. 2× cacao: ₪85 post / ₪60 pickup).
- Checkout opens wa.me with correct itemized Hebrew text; cart clears afterwards.
- Refresh mid-cart → cart persists.
- Keyboard-only: Tab to buy → add → Tab to pill → Enter opens drawer → focus lands on close → Tab stays inside → Escape closes, focus returns.

- [ ] **Step 2: Fix anything found, commit fixes**

```bash
git add -A && git commit -m "fix: cart polish from browser pass"
```
(Skip if nothing found.)

- [ ] **Step 3: USER GATE — real-phone test before publish**

Ask the user to test on a phone via a local preview or by pushing to a draft. Do NOT `git push` until the user says the flow looks right (push = live public site with real orders flowing).

- [ ] **Step 4: Deploy on approval**

```bash
git push
```
Then user hard-refreshes on the phone and runs the same checklist once live.
