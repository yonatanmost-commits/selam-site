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

test('isInAppBrowser spots TikTok, Instagram and Facebook webviews', () => {
  const inApp = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_35.1.0 JsSdk/2.0 NetType/4G Channel/App Store ByteLocale/he Region/IL',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 trill_350104 BytedanceWebview/d8a21c6',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.106',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]',
  ];
  inApp.forEach((ua) => assert.strictEqual(C.isInAppBrowser(ua), true, ua));
  const real = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  ];
  real.forEach((ua) => assert.strictEqual(C.isInAppBrowser(ua), false, ua));
});

test('encodeCart / decodeCart round-trip for the carry-over link', () => {
  const items = [{ id: 'cacao-oat-ylang', qty: 2 }, { id: 'aloe-green-clay-lavender', qty: 1 }];
  const s = C.encodeCart(items);
  assert.strictEqual(s, 'cacao-oat-ylang.2,aloe-green-clay-lavender.1');
  assert.deepStrictEqual(C.decodeCart(s), items);
});

test('decodeCart ignores junk', () => {
  assert.deepStrictEqual(C.decodeCart(''), []);
  assert.deepStrictEqual(C.decodeCart(null), []);
  assert.deepStrictEqual(C.decodeCart('a.x,,b.3,.2'), [{ id: 'b', qty: 3 }]);
});

test('buildWaUrl encodes the text', () => {
  const url = C.buildWaUrl('שלום עולם', '972543477997');
  assert.ok(url.startsWith('https://wa.me/972543477997?text='));
  assert.ok(url.includes(encodeURIComponent('שלום עולם')));
});
