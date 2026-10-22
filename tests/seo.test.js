// Run as: node --test tests/seo.test.js
// NOT `node --test tests/` — the apostrophe in the folder name breaks the directory form.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const BASE = 'https://yonatanmost-commits.github.io/selam-site/';
const html = read('index.html');

test('index.html is indexable — no noindex directive', () => {
  assert.ok(!/noindex/i.test(html), 'index.html must not contain noindex');
});

test('legal pages stay noindex — they carry the street address', () => {
  for (const f of ['privacy.html', 'accessibility.html']) {
    assert.match(read(f), /name="robots"\s+content="noindex/i, `${f} lost its noindex`);
  }
});

test('canonical is present and absolute', () => {
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(m, 'no canonical link');
  assert.strictEqual(m[1], BASE);
});

test('all required Open Graph / Twitter tags are present', () => {
  for (const p of ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description',
                   'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
    assert.match(html, new RegExp(`property="${p}"`), `missing ${p}`);
  }
  assert.match(html, /name="twitter:card"\s+content="summary_large_image"/);
});

test('og:image is absolute and the file exists', () => {
  const m = html.match(/property="og:image"\s+content="([^"]+)"/);
  assert.ok(m[1].startsWith('https://'), 'og:image must be absolute or it will not render on WhatsApp');
  const rel = m[1].slice(BASE.length);
  assert.ok(fs.existsSync(path.join(root, rel)), `${rel} does not exist in the repo`);
});

test('title is branded, carries the city, and has no nikud', () => {
  const m = html.match(/<title>([^<]+)<\/title>/);
  assert.ok(m, 'no title');
  assert.match(m[1], /חדרה/, 'title should name the city');
  // Hebrew combining marks U+0591-U+05C7 — nobody searches with nikud.
  assert.ok(!/[֑-ׇ]/.test(m[1]), 'title must not contain nikud');
});

// --- structured data ---

function jsonLdBlocks() {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

test('every JSON-LD block parses', () => {
  const blocks = jsonLdBlocks();
  assert.ok(blocks.length > 0, 'no JSON-LD found');
  for (const b of blocks) assert.doesNotThrow(() => JSON.parse(b));
});

function graph() {
  return jsonLdBlocks().flatMap((b) => JSON.parse(b)['@graph'] || []);
}

test('business entity has locality but no street address', () => {
  const biz = graph().find((n) => n['@type'] === 'HealthAndBeautyBusiness');
  assert.ok(biz, 'no business entity');
  assert.strictEqual(biz.address.addressLocality, 'חדרה');
  assert.ok(!('streetAddress' in biz.address),
    'streetAddress must stay out — the clinic is at home (city-only decision)');
});

test('exactly 5 Products, matching the 5 distinct soap ids', () => {
  // soap-of-month reuses coffee-turmeric's id, so a 6th block would be a duplicate product
  assert.strictEqual(graph().filter((n) => n['@type'] === 'Product').length, 5);
});

test('every JSON-LD price matches a price shown on the page', () => {
  // Read the rendered .price, not the buy button — sold-out soaps still show a
  // price but have no button. The <s class="was"> before it is the pre-discount
  // price and must not count.
  const displayed = new Set(
    [...html.matchAll(/<div class="price">(?:<s class="was">₪\d+<\/s>)?\s*₪(\d+)/g)].map((m) => m[1])
  );
  assert.ok(displayed.size > 0, 'found no displayed prices to compare against');
  for (const p of graph().filter((n) => n['@type'] === 'Product')) {
    assert.ok(displayed.has(String(p.offers.price)),
      `Product "${p.name}" price ${p.offers.price} is shown nowhere on the page`);
  }
});

// --- stock state ---

/** Gallery cards as { name, soldOut, hasBuy } — the month card reuses a gallery id. */
function soapCards() {
  return [...html.matchAll(/<article class="soap([^"]*)"[^>]*>([\s\S]*?)<\/article>/g)].map((m) => ({
    name: m[2].match(/<h3>([^<]+)<\/h3>/)[1],
    soldOut: /\bout-of-stock\b/.test(m[1]),
    hasBuy: /class="buy"/.test(m[2]),
  }));
}

test('a sold-out card offers no way to buy, and says so', () => {
  const cards = soapCards();
  assert.ok(cards.length > 0, 'no soap cards found');
  for (const c of cards.filter((x) => x.soldOut)) {
    assert.ok(!c.hasBuy, `"${c.name}" is sold out but still has an add-to-cart button`);
  }
  // The month card duplicates a gallery soap; it must not outlive the card's stock state.
  const monthName = html.match(/<div class="month-card([^"]*)"[\s\S]*?<h2>([^<]+)<\/h2>/);
  const monthSoldOut = /\bout-of-stock\b/.test(monthName[1]);
  const twin = cards.find((c) => c.name === monthName[2]);
  if (twin) {
    assert.strictEqual(monthSoldOut, twin.soldOut,
      `soap of the month "${monthName[2]}" disagrees with its gallery card about stock`);
  }
});

test('stock state on the page and in the structured data agree', () => {
  const products = graph().filter((n) => n['@type'] === 'Product');
  for (const c of soapCards()) {
    const p = products.find((x) => x.name === c.name);
    assert.ok(p, `no Product entry for "${c.name}"`);
    const want = c.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
    assert.strictEqual(p.offers.availability, want,
      `"${c.name}" is ${c.soldOut ? 'sold out' : 'in stock'} on the page but the JSON-LD disagrees`);
  }
});

test('Product images exist on disk', () => {
  for (const p of graph().filter((n) => n['@type'] === 'Product')) {
    const rel = p.image.slice(BASE.length);
    assert.ok(fs.existsSync(path.join(root, rel)), `missing image ${rel}`);
  }
});

// --- crawl files ---

test('robots.txt allows crawling, blocks legal pages, declares the sitemap', () => {
  const r = read('robots.txt');
  assert.match(r, /^Allow: \/$/m);
  assert.ok(!/^Disallow: \/$/m.test(r), 'blanket Disallow: / is still there');
  assert.match(r, /^Disallow: \/privacy\.html$/m);
  assert.match(r, /^Disallow: \/accessibility\.html$/m);
  assert.match(r, new RegExp(`^Sitemap: ${BASE}sitemap\\.xml$`, 'm'));
});

test('sitemap uses the correct namespace and matches the canonical URL', () => {
  const s = read('sitemap.xml');
  // "sitemaps.org" — plural. The singular form silently invalidates the file.
  assert.match(s, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const loc = s.match(/<loc>([^<]+)<\/loc>/);
  assert.strictEqual(loc[1], BASE);
});

test('every page declares light-only color-scheme (Android forced-dark opt-out)', () => {
  for (const f of ['index.html', 'privacy.html', 'accessibility.html']) {
    assert.match(read(f), /name="color-scheme"\s+content="only light"/, `${f} will invert on dark-mode phones`);
  }
});
