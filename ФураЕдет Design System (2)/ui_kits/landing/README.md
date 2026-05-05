# Landing Page — ФураЕдет

Marketing single-page redesign for the public-facing site (homepage). Based on the source `register/main_page.html` styling cues but rebuilt with the new design system: Bebas Neue display, navy + gold palette, modular sections.

## Files
- `index.html` — entry. Loads icons, then sections in order.
- `Nav.jsx` — fixed top navigation with brand wordmark.
- `Hero.jsx` — hero with brand statement + interactive shipping calculator card.
- `Sections.jsx` — Ticker, Stats, Services (3 cards), Why (6 features), Fleet (4 truck types), Process (5 steps), Testimonials, CTA.
- `Footer.jsx` — 5-column footer with contacts.

## Sections
1. **Nav** — sticky, blurred backdrop. Links to anchors.
2. **Hero** — left: claim + stats. Right: tilted gold-bordered calc card with route fields.
3. **Ticker** — gold band of route names scrolling.
4. **Stats** — 4-up KPI bar.
5. **Services** — 3 cards: грузоперевозки, рефрижераторы, склады.
6. **Why** — 6-feature grid with sticky left column.
7. **Fleet** — 4 truck capacity tiers.
8. **Process** — 5 numbered steps along a horizontal timeline.
9. **Testimonials** — 3 client quotes.
10. **CTA** — final centered hero with phone CTA.
11. **Footer** — links + contacts + legal.

## Design notes
- Display headlines use Bebas Neue with letter-spacing 2–3px, uppercase.
- "Highlight word" pattern: gold accent inside otherwise-white headline.
- Narrow gold underline on section tags ("ВОЗМОЖНОСТИ" with 32px line + arrow on hover).
- Cards use `var(--navy-2)` on `var(--navy)` background. Hover lifts 4px and adds gold border.
