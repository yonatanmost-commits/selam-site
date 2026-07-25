# Findability — making סלם discoverable

**Date:** 2026-07-25
**Status:** approved design, ready for implementation plan

## Problem

The site works. A test run brought dozens of real orders, the cart and delivery flow are live, contact details are real. But every one of those orders came from a link Selam sent by hand, because the site is invisible:

- `index.html` carries `<meta name="robots" content="noindex, nofollow">`
- `robots.txt` is `User-agent: * / Disallow: /`
- `<title>` is `רפואה משלימה` — generic, unbranded, no city
- Zero Open Graph tags, so every WhatsApp link she sends previews as a bare grey URL
- Zero structured data, no canonical, no `sitemap.xml`

A woman in Hadera looking for רפלקסולוגיה cannot find her.

## Goal

Make the site findable by search and shareable on WhatsApp, without changing the page's structure, flow, palette, or commerce.

**Non-goals for this round:** a custom domain, service pages, testimonials, performance/Core Web Vitals work, FAQ (see Deferred).

## Decisions

| Decision | Value | Rationale |
|---|---|---|
| Base URL | `https://yonatanmost-commits.github.io/selam-site/` | Owner chose to stay on GitHub Pages for now. See Base URL below. |
| Location exposure | City + area, **no street** | Home clinic; owner's explicit choice. Google Business Profile supports this natively as a service-area business. |
| City / area | Beit Eliezer, **Hadera** — served area: חדרה, פרדס חנה־כרכור, אור עקיבא, בנימינה, גבעת עדה, עמק חפר | Confirmed by owner. |
| Legal pages | Stay `noindex` | They contain the street address (`privacy.html:40`). Indexing them would undo the city-only decision. |
| Scope | Single page, fully optimized | One page competing for one query cluster is the right size for this business today. Revisit only when Search Console shows real demand. |

### Base URL

The base URL appears in exactly six places. It is listed here so that migrating to a custom domain later is a known, bounded change rather than a search-and-replace hunt:

1. `<link rel="canonical">` in `index.html`
2. `og:url` in `index.html`
3. `og:image` in `index.html` (absolute URL required — relative paths do not render in WhatsApp/Facebook)
4. `HealthAndBeautyBusiness.url` in the JSON-LD block
5. `Product.image` ×4 in the JSON-LD block (absolute URLs required)
6. `<loc>` in `sitemap.xml`

Plus one line in `robots.txt` (`Sitemap:`).

## Design

### 1. Go public

**`index.html`:** remove the `noindex, nofollow` meta tag and its `<!-- Draft phase -->` comment.

**`robots.txt`** becomes:

```
User-agent: *
Allow: /
Disallow: /privacy.html
Disallow: /accessibility.html

Sitemap: https://yonatanmost-commits.github.io/selam-site/sitemap.xml
```

`privacy.html` and `accessibility.html` keep their own `noindex` meta tags — belt and braces, since `robots.txt` disallow prevents crawling but not necessarily indexing from external links.

**Honest caveat to record:** the street address is already committed to the public `selam-site` repository, and GitHub's own pages are crawled. `noindex` reduces exposure; it does not erase it. Removing it from git history is a separate task, out of scope here.

### 2. Title, description, canonical

```html
<title>סלם · רפואת שורש — רפלקסולוגיה וריפוי רייקי לנשים בחדרה</title>
```

Deliberately **without nikud**. Nobody searches `סֶלָּם`. Nikud remains in the visual wordmark (`.brand-name`), which is unaffected.

The existing `<meta name="description">` is good and stays, extended with the city:

> סלם — רפואה משלימה לנשים בחדרה והסביבה: רפלקסולוגיה, ריפוי רייקי וסבון טבעי בעבודת יד. ריפוי הוליסטי שנבנה דרך הקשבה, מתוך אהבה אמיתית לאדם ולטבע.

Add `<link rel="canonical" href="{BASE_URL}">`.

### 3. Share card (Open Graph + Twitter)

The highest-felt change: Selam shares this link over WhatsApp constantly, and it currently renders as nothing.

```html
<meta property="og:type"        content="website" />
<meta property="og:site_name"   content="סלם · רפואת שורש" />
<meta property="og:locale"      content="he_IL" />
<meta property="og:title"       content="סלם · רפואת שורש — רפלקסולוגיה וריפוי רייקי לנשים בחדרה" />
<meta property="og:description" content="רפלקסולוגיה, ריפוי רייקי וסבון טבעי בעבודת יד. ריפוי הוליסטי שנבנה דרך הקשבה." />
<meta property="og:url"         content="{BASE_URL}" />
<meta property="og:image"       content="{BASE_URL}images/share-card.jpg" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt"   content="סלם · רפואת שורש — רפלקסולוגיה, ריפוי רייקי וסבון טבעי" />
<meta name="twitter:card"       content="summary_large_image" />
```

**New asset: `images/share-card.png`, 1200×630.** Composed from her existing real photography plus the brand wordmark, in the earth palette. Built with the same pipeline already proven on the receipt logo kit: `resvg_py` rasterizing an SVG, with Frank Ruhl Libre + Bellefair TTFs from the scratchpad `fonts/` directory (neither font is installed system-wide). The wordmark on the card **keeps** its nikud — it is an image, not indexed text.

Design constraint: WhatsApp crops previews toward the center on some clients, so the text stays centered.

**As built (diverged from the first attempt, deliberately):** a cream card with the centered brand lockup, tree-ring texture at low opacity, and the soap photo as a **full-strength strip along the bottom** (`y 476..630`). The first two attempts put the photo full-bleed behind the text under a cream veil; both failed — the veil greyed her warm cacao browns into a cold mauve, and no amount of saturation or warm-screen correction fixed it, because the cast came from the veil sitting over dark pixels rather than from the photo. Separating the two zones means the photo keeps its true colour at full strength *and* the text sits on clean cream. Script kept at `scratchpad/make_share_card.py`; it is reproducible but not committed, since the output PNG is the artefact.

Source photo: `soap-cacao-oat-ylang.jpeg`. `selam.jpg` (her portrait) is a reasonable alternative — a face converts better for a healing practice — and is a one-line change in the script.

### 4. Structured data (JSON-LD)

A single `<script type="application/ld+json">` block near the end of `<body>`, containing an `@graph` with:

**`HealthAndBeautyBusiness`** (a `LocalBusiness` subtype)
- `name`: סלם · רפואת שורש
- `url`, `image`, `logo`
- `telephone`: +972543477997
- `email`: shorashealing@gmail.com
- `address`: `PostalAddress` with `addressLocality: חדרה`, `addressRegion: מחוז חיפה`, `addressCountry: IL` — **no `streetAddress`**
- `areaServed`: the towns listed in Decisions
- `knowsLanguage`: he
- `priceRange`: ₪₪
- `audience`: women (she treats women only)
- `makesOffer`: two `Service` entries, רפלקסולוגיה and ריפוי רייקי — **added during implementation, beyond this spec's original list.** Justification: the business entity otherwise says nothing about what she actually does, and "רפלקסולוגיה" is the single most important query term. Small, additive, no new risk.

**`Product` ×4** — one per distinct soap. Note: soap-of-month shares `data-id="coffee-turmeric"` with its gallery entry, so it gets **no** block of its own; a fifth would be a duplicate product.

| `data-id` | name | price (ILS) | image |
|---|---|---|---|
| `white-clay-charcoal-tea-tree` | חימר לבן, פחם פעיל ועץ התה | 30 | `images/soap-white-clay-charcoal-tea-tree.jpeg` |
| `aloe-green-clay-lavender` | אלוורה, חימר ירוק ולבנדר | 28 | `images/soap-aloe-green-clay-lavender.jpeg` |
| `cacao-oat-ylang` | קקאו, שיבולת שועל וילנג ילנג | 30 | `images/soap-cacao-oat-ylang.jpeg` |
| `coffee-turmeric` | קפה וכורכום — פילינג עדין | 30 | `images/soap-coffee-turmeric.jpeg` |

Each with an `Offer`: `priceCurrency: ILS`, the discounted price as `price`, `availability: InStock`. Prices **must** mirror the displayed discounted price exactly — the struck-through original is not the offer price.

Rich-result note: full merchant listings need shipping and return policy fields. We are deliberately not claiming those. The `Product` blocks exist for entity clarity, not for a shopping carousel.

**Deliberately excluded:** `BreadcrumbList` (meaningless on a single page), `Review`/`AggregateRating` (no consented real reviews yet — fabricating these is a policy violation and a lie), `FAQPage` (deferred).

**Perspective on weight:** structured data is supporting evidence. What actually decides whether she ranks for "רפלקסולוגיה בחדרה" is the Google Business Profile in §7. The JSON-LD makes her machine-legible and consistent with that profile; it is not the lever itself.

### 5. `sitemap.xml`

New file, root. One `<url>` entry: the base URL, with `<lastmod>`. Legal pages excluded, matching their `noindex`.

### 6. Copy: city, woven not stuffed

Four insertions. Two rules govern them: **no keyword stuffing** (Google penalizes it and Selam would reject how it reads — four natural mentions is saturation for a site this size), and **the city attaches to treatments only, never to soap**, because soap ships nationally by post and "חדרה" must not imply otherwise.

| Location | Change |
|---|---|
| Hero eyebrow (`index.html:398`) | `רפואה משלימה` → `רפואה משלימה · חדרה והסביבה`. Sits directly above the `h1`, above the fold. |
| `#treatments`, closing line | Add: הטיפולים מתקיימים בקליניקה בחדרה. הכתובת המדויקת נשלחת בתיאום. |
| `#contact`, near the reach list | Add area line: חדרה, פרדס חנה־כרכור, אור עקיבא, בנימינה והסביבה. |
| Footer services line | `…· סבון טבעי · לנשים` → append `· חדרה` |

**Open question for Selam, not to be decided unilaterally:** `#about` has no heading since she removed "הסיפור שלי", which leaves the nav link labelled "הסיפור" pointing at a headless section — a gap for both search and screen readers. A heading there would help. It must be in her voice and it is her call.

### 7. Off-site: `docs/google-business-profile.md`

A guide in Hebrew, written so Selam can act on it herself:

- Register as a **service-area business** — Google explicitly supports showing served areas while hiding the street address, which matches the location decision exactly
- Categories: רפלקסולוג / מטפל הוליסטי
- Hours, service list, photos drawn from her existing real library
- How to ask her first real customers for reviews (reviews are the single largest local ranking factor, and she already has dozens of served customers)

Separately, for the owner: submit `sitemap.xml` to Google Search Console and verify the property.

## Verification

This sandbox has **no working headless browser** — Edge/Chrome `--screenshot` fails silently, so Lighthouse, axe, and screenshots cannot be run here. Stating that plainly rather than implying automated visual verification.

**What is automated —** new `tests/seo.test.js`, run as `node --test tests/seo.test.js` (the **file** path, not the directory: `node --test tests/` breaks on the apostrophe in the folder name). It reads `index.html` and asserts:

1. No `noindex` anywhere in `index.html`
2. `privacy.html` and `accessibility.html` still **do** contain `noindex`
3. `<link rel="canonical">` present and absolute
4. All required `og:*` tags present; `og:image` is an absolute URL
5. Every `application/ld+json` block `JSON.parse`s without error
6. Exactly 4 `Product` entries, and each price matches the corresponding `.buy[data-price]` attribute in the HTML — this catches the realistic future drift where a price is edited in one place and not the other
7. `sitemap.xml` exists and its `<loc>` matches the canonical URL

**What only the owner can confirm, after deploy:**

- Google Rich Results Test against the live URL
- Search Console: property verified, sitemap submitted, no coverage errors
- WhatsApp the link to himself and see the card actually render
- A real phone check that the copy insertions did not disturb the RTL mobile layout (per project convention: hard-refresh on a real device)

## Risks

| Risk | Severity | Position |
|---|---|---|
| Phone and email become scrapeable by spam bots | Low | Real, and the alternative is remaining invisible. Accept. |
| **Selam may get more inquiries than she wants** — one-on-one treatments, women only, a baby at home | Medium | Must be her informed choice, not a surprise. Fully reversible: `noindex` returns in one line. |
| Indexing takes days to weeks | — | Not a risk, an expectation to set. Nothing will look different on ship day. |
| Street address already in public git history | Low–medium | Pre-existing, disclosed above, out of scope. |
| Health claims in copy | Low | Israeli rules on advertising complementary medicine forbid claims to cure or treat conditions. Current copy reads clean, and the "100%" claims were already removed. Worth one read-through pass during implementation. |

## Adjacent finding — not part of this scope

**Retracted.** The workshop CTA (`<a class="buy ws-cta" href="#">להזמנת מקום`) was initially flagged as a dead link on her ₪350 offer. It is not: inline JS at the end of `index.html` binds `.ws-cta`, calls `preventDefault()`, and opens a prefilled `wa.me` message about the workshop. It works. Cart behaviour is also fine — `cart.js:97` selects `.buy[data-id]` and this element has no `data-id`, so it is correctly ignored.

The only residual nit, minor and optional: with JavaScript disabled the link does nothing. Giving it a real `wa.me` href and letting the JS enhance it would degrade gracefully and let long-press show a real target. Not a bug.

## Deferred

- **FAQ + `FAQPage` schema.** Designed and then deliberately postponed: it was the only piece requiring Selam to write new copy, and dropping it lets this round ship without waiting on her. When revived: `<details>`/`<summary>` accordion placed between `#workshop` and `#about` (not before `#contact` — her own voice in `#about` is the emotional close before the ask, and a practical Q&A block must not step on it); no new nav link, since the nav is already 4 links plus share plus CTA and tight on mobile; schema text must match visible text exactly, or it is a Google policy violation. Candidate questions: what happens in a first treatment; does reflexology hurt; what reiki feels like; how many treatments are needed; why she treats women only; how to care for handmade soap; how ordering and delivery work. Any pregnancy question must be answered by Selam herself — real contraindications live there.
- Custom domain (`.co.il`, ~₪40–70/yr). The single highest-value move remaining; deferred by owner choice, and §Base URL keeps it cheap.
- Service pages (`reflexology.html`, `reiki.html`, `soap.html`). Revisit when Search Console shows demand. Note: any new page needs `<meta name="color-scheme" content="only light">` or it inverts on dark-mode Android phones.
- Testimonials from real customers, with consent.
- Performance / Core Web Vitals: Google Fonts are render-blocking; `lighthouse_report.json` in the repo is stale.
