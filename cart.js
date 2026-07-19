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
