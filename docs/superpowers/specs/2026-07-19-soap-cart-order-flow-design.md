# Soap Cart & Order Flow — Design

**Date:** 2026-07-19
**Status:** Approved approach (A) — static cart → WhatsApp checkout
**Context:** The site is live and orders are arriving in dozens via per-soap WhatsApp buttons. Delivery is the current bottleneck: orders wait in chat with no delivery method or total price. This design replaces the per-soap "להזמנה" buttons with an add-to-cart flow that computes a total including delivery, then hands off to WhatsApp. Payment stays Bit/Paybox by request after Selam confirms — no on-site payment.

## Goals

- A customer can order several soaps in one structured message with an exact total.
- Delivery is chosen and priced on the site: self-pickup (free) or Israel Post shipping (₪25 flat, confirmed).
- Zero backend, zero fees: stays a static GitHub Pages site.
- No personal data collected on the site — address and payment move to the WhatsApp chat, so privacy pages need no changes.
- Selam's fulfillment fits her rhythm: batched drop-off of online-prepared Israel Post parcels.

## Non-goals

- On-site payment (a payment link can slot into the drawer later — structure allows it, nothing built now).
- Order form collecting name/address (rejected: friction + privacy scope creep).
- Locker/courier integrations (Boxit Box2Box noted as a future third delivery option).
- Changes to workshop booking or custom-soap requests — they keep direct WhatsApp links.

## Architecture

All code lives in `index.html` (matching the site's single-file pattern): a small vanilla-JS cart module + CSS in the existing style block. No build step, no dependencies.

### 1. Catalog & cart state

- Each `.soap` card (gallery + soap-of-month) carries `data-id`, `data-soap` (name, already present), and `data-price` (current sale price in ₪). The DOM is the single source of truth — price edits in HTML flow into the cart automatically.
- Cart state: array of `{id, qty}` in `localStorage` key `selam-cart`; in-memory fallback if storage is unavailable (cart then doesn't survive refresh). Qty clamped 1–20.
- Unknown ids in stored state (e.g., soap-of-month rotated) are dropped silently on load.

### 2. Delivery config

```js
const DELIVERY = [
  { id: 'pickup', label: 'איסוף עצמי — בתיאום', price: 0 },
  { id: 'post',   label: 'משלוח בדואר',          price: 25 },
];
const FREE_SHIPPING_ABOVE = null; // set to e.g. 120 to enable
```

- ₪25 flat rate confirmed by owner (Israel Post small parcel, online-prepared label, batched drop-off).
- `FREE_SHIPPING_ABOVE` off at launch; enabling it is a one-line change and the drawer copy adapts.
- The shop note "המחירים אינם כוללים דמי משלוח" is replaced with the concrete options: משלוח בדואר ₪25 · איסוף עצמי חינם.

### 3. UI components (RTL, existing visual language)

- **Add button:** per-soap "להזמנה" becomes **"הוספה לסל"**, same `.buy` pill style. On tap: adds 1, brief "נוסף ✓" state, cart badge updates.
- **Floating cart pill:** fixed bottom corner, espresso round pill matching the button family; visible only when cart is non-empty; shows item-count badge; `aria-live="polite"` region announces count changes.
- **Cart drawer:** overlay panel, paper background, `role="dialog"` `aria-modal="true"`, labeled "סל ההזמנה". Contents top-to-bottom: item rows (name, ± steppers, line total, remove), subtotal, delivery radios (from `DELIVERY`), computed **סה"כ**, CTA **"השלמת ההזמנה בוואטסאפ"**, quiet note "התשלום בביט או בפייבוקס לאחר אישור ההזמנה". Empty state: "הסל ריק" + link to `#shop`.
- **Focus behavior:** focus moves into drawer on open, Escape and backdrop-click close, focus returns to the cart pill. `:focus-visible` styling and AA contrast use the existing palette (espresso, rose-deep #824641 — do not lighten).
- `prefers-reduced-motion` respected for drawer/badge animations.

### 4. Checkout handoff (WhatsApp)

CTA builds an itemized Hebrew message and opens `https://wa.me/972543477997?text=…`:

```
היי סלם! 🌿 אשמח להזמין:
• קקאו, שיבולת שועל ואילנג־אילנג — 2 × ₪30
• אלוורה, חימר ירוק ולבנדר — 1 × ₪28
משלוח בדואר — ₪25
סה"כ: ₪113
```

- Pickup renders as `איסוף עצמי — בתיאום (חינם)` instead of the shipping line.
- Cart clears after the handoff (the WhatsApp thread is now the order record).
- Selam confirms stock, collects the address in chat, sends a Bit/Paybox request for the exact total.

### 5. Error handling & edge cases

- `localStorage` blocked → in-memory cart, no user-facing error.
- Soap-of-month duplicates a gallery soap → same `data-id`, so it increments the same line item (no double listing).
- JS disabled → existing `<noscript>` reveal fallback keeps content visible; buy buttons already require JS today, unchanged.
- Very long messages: 4 soaps max keeps `wa.me` URL well under limits; no truncation logic needed.

## Fulfillment process (owner-side, not code)

1. Order confirmed in WhatsApp + Bit received.
2. Prepare shipment on the Israel Post site (home-printed label — saves ₪3–5/parcel).
3. Batch drop-off at the branch every few days.
4. Confirm the ₪25 still covers the real tariff periodically via the [Israel Post calculator](https://services.israelpost.co.il/npostcalc.nsf/Calculator2NOHE); adjust `DELIVERY` if not.
5. Future: add Boxit Box2Box as a third delivery option when volume justifies signup.

## Testing

- Manual pass on a real phone, hard-refresh (project rule: headless screenshots unreliable here) — add/remove/qty, delivery switch, total math, WhatsApp message correctness (RTL rendering in WhatsApp included), cart persistence across refresh, empty-cart state.
- Keyboard-only pass: open drawer, adjust qty, choose delivery, activate CTA, Escape to close.
- Screen-reader sanity check of badge announcements and dialog labeling.
- Contrast: reuse existing AA-verified tokens; any new text colors verified with the same node-math method used before.

## Open items

- None blocking. `FREE_SHIPPING_ABOVE` threshold: decide later (off at launch).
