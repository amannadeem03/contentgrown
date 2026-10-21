# Landing page template

How the SEO landing pages (`short-form-video-editing/`, `vsl-editing/`, `youtube-video-editing/`, `video-ad-editing/`) are built.
The master copy is `short-form-video-editing/index.html`; copy it to `<slug>/index.html` and change only what is listed under "Changes per page".
The homepage files (`index.html`, `styles.css`, `script.js`) are not touched by these pages.

## Files

| File | Role |
|---|---|
| `/styles.css` | Homepage stylesheet, loaded as is: tokens, header and mobile menu, buttons and the rotating beam, work cards, pricing cards, FAQ, closing CTA, footer, the Get Started dialog, the lightbox |
| `/page.css` | Only the extras the landing pages need: hero without video, section blocks, clip captions, steps, note box, related cards, footer link row, no-JavaScript fallbacks. Loaded after `styles.css` |
| `/page.js` | Small behaviour file (plain JS, `defer`): reveal on scroll, header, hamburger, Services menu, clips + lightbox, pricing tabs, FAQ, Get Started dialog. Each block does nothing if its elements are missing, so one file serves all four pages |
| `<slug>/index.html` | The page. Every path inside is absolute (`/styles.css`, `/assets/...`, `/vsl-editing`) because the page may be served with or without a trailing slash |

The homepage `script.js` is not loaded on these pages (it assumes the homepage DOM). `cleanUrls` and redirects in `vercel.json` are not used: the page is the folder's `index.html`.

## Sections (in order)

1. Header: same markup as the homepage. Logo goes to `/`, nav goes to `/#work`, `/#pricing`, `/#proof`. The Services menu holds links to the four landing pages (plus "All services" to `/#services`)
2. Hero: eyebrow, one H1, one lead paragraph, **Book a Call** (Calendly, new tab) and **See Packages** (`#packages`). Four still frames from the studio's own posters instead of playing video
3. What We Edit: four feature cards
4. Clips: the real portfolio clips for this page's category, poster first. Hover plays the small `-grid.mp4` preview; click opens the full clip in the lightbox
5. Packages (`#packages`): pricing cards with the Standard / Advanced toggle, disclaimer, "Custom production" box. Only on pages that have prices
6. How It Works: the four steps from the homepage
7. Who It Suits: three cards and a "when it is not the right fit" note
8. FAQ: accordion, answers in the HTML, no FAQ markup
9. "Need More ...?": three links to the other landing pages
10. Closing call to action (`#book`, **Book a Call**) and the footer (social icons, link row, tagline, copyright)

## Changes per page

- Head: `<title>`, meta description, canonical, `og:url`, `og:title`, `og:description`, `twitter:title`, `twitter:description` (see checklist)
- JSON-LD: all names, URLs and descriptions (BreadcrumbList label, Service, WebPage)
- Hero: eyebrow, H1, lead, the four `background-image` posters
- Section copy: headings, intros, cards, steps and "Who it suits" text (keep only what the homepage states)
- Clips: for each clip the `data-full`, `data-preview`, `data-label`, `aria-label`, the poster `src`, `width`/`height`, `alt` text and the `figcaption`. Use `assets/portfolio/<category>/<name>.mp4`, its `-grid.mp4` and `assets/portfolio/posters/<name>.jpg`. Show only clips that exist in `workItems` in `script.js`
- Pricing: copy the cards from the homepage data only where this page has prices (short-form). Pages whose work is quoted separately (VSL, video ads, and YouTube/long-form until prices exist) remove section 5 and use the "Custom production" box with **Book a Call**, wording "custom quote"
- FAQ: questions and answers
- Section 9 and the footer link row: point to the other three pages, never to the page itself
- `aria-current="page"` on this page's link in the Services menus (desktop and mobile) and in the footer row
- The top comment block: keep it, it is the template documentation

## Keep as is

Header and mobile menu markup, footer markup and the social icon block, the lightbox markup, the skip link, the inline `<script>` that adds the `js` class to `<html>`, the font and favicon links, the Calendly link, and all class names and ids (`page.js` and the stylesheets look for them).

## Head tags checklist

- [ ] `<title>`: from `D:\CONTENTGROWN\SEO\keyword-and-content-strategy.md`, 60 characters at most, form `<Service> | CONTENTGROWN`. The homepage title stays `CONTENTGROWN`
- [ ] `<meta name="description">`: 155 characters at most, plain sentences, nothing about revisions, turnaround or call length
- [ ] `<link rel="canonical" href="https://contentgrown.com/<slug>">`: no trailing slash
- [ ] `<meta name="robots" content="index,follow,max-image-preview:large">`
- [ ] Open Graph: `og:type` (website), `og:site_name` (CONTENTGROWN), `og:url`, `og:title`, `og:description`, `og:image` (`https://contentgrown.com/assets/og-image.jpg`, 1200 x 630) and `og:image:alt`
- [ ] Twitter: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`
- [ ] Favicon links (absolute `/assets/...` paths) and the Montserrat font links
- [ ] JSON-LD `@graph`: `BreadcrumbList` (Home > this page), `Service` (provider = Organization with `@id` `https://contentgrown.com/#organization`, name CONTENTGROWN, url `https://contentgrown.com/`), `WebPage` (`isPartOf` = `https://contentgrown.com/#website`). No `FAQPage`, no ratings or reviews, no prices, nothing the page does not itself say
- [ ] `<html lang="en">`, exactly one `<h1>`, a logical H2/H3 order, alt text or `aria-label` on every image and video, descriptive link text

## Content rules

- Only facts the homepage already states (services, process, pricing, FAQ, portfolio). No invented clients, results, numbers, awards or years
- No client names or logos. Only the studio's own portfolio clips
- Prices exactly as in `pricingPlans` in `script.js`. No price on this page that the homepage does not show: everything else is a "custom quote"
- Owner decision: leave out revisions, turnaround and call length (no "2 rounds", "unlimited revisions", "48-72 hours", "Twenty minutes", "15-minute")
- Brand: `CONTENTGROWN` for the wordmark, `Contentgrown` inside sentences, never "Content Grown" or "Content Growth"
- Button text is only "Book a Call" (opens `https://calendly.com/contentgrownn/15mincall` in a new tab)

## Adding the page to `sitemap.xml`

Add one `<url>` block with the canonical address (no trailing slash) and today's date, keep the homepage entry:

```xml
<url>
  <loc>https://contentgrown.com/<slug></loc>
  <lastmod>YYYY-MM-DD</lastmod>
</url>
```

`robots.txt` already points to the sitemap. After deploy: request indexing for the new URL in Search Console and check that `/<slug>` and `/<slug>/` both resolve and the canonical stays without the slash.

## Testing locally

Serve the repo root (so `/styles.css` and `/assets/...` resolve), for example `python -m http.server 8080`, and open `http://localhost:8080/<slug>/`. Check 1440 x 900, 1920 x 1080, 768 x 1024, 390 x 844 and 360 x 740: no horizontal scroll, the hamburger opens, the Services menu lists the four pages, a clip previews on hover and opens on click, the Get Started dialog opens.
