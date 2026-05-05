# ФураЕдет — Design System

**ФураЕдет** ("Truck is Going") is a logistics SaaS for cargo transportation across Russia and CIS. It's a B2B platform with three user roles: **Client**, **Manager**, and **Admin**, plus a public marketing landing page with an online price calculator and order tracking.

## Sources
- **GitHub**: `iceacarid/Diplomka228` (private)
  - `frontend/` — React 19 + Vite 8 + Tailwind 4, React Router 7
  - `backend/` — Laravel
- The frontend codebase is mirrored under `source/` in this project.

## Stack snapshot
- React 19 + Vite + Tailwind v4
- Routes: `/` (landing), `/login`, `/register`, `/forgot-password`, `/dashboard/*`
- Dashboard tabs: Orders, Drivers, Trucks, Tariffs, Users, AI Optimization, Profile (role-gated)
- Order lifecycle: `draft → pending → in_progress → shipped → delivered / rejected`
- Tracking ID format: `FE-XXXXXX`

## Index
- `colors_and_type.css` — all tokens (color, type, spacing, radii, shadow, motion easing) as CSS vars
- `SKILL.md` — agent skill descriptor (cross-compatible with Agent Skills)
- `assets/` — brand assets (logo, hero photography from source repo)
- `source/` — mirror of repo's `frontend/src` for component reference
- `preview/` — atomic design-system cards rendered in the Design System tab:
  - Colors: brand, neutrals, semantic
  - Type: display (Bebas Neue), body (DM Sans + JetBrains Mono)
  - Spacing & Radii
  - Components: buttons, pills (status + role), inputs
  - Brand: wordmark
- `ui_kits/`
  - `shared/icons.jsx` — Lucide-style line icon set, exposed as `window.Icon`
  - `landing/` — public marketing page (Nav, Hero w/ calculator, Ticker, Stats, Services, Why, Fleet, Process, Testimonials, CTA, Footer)
  - `cabinet/` — authenticated dashboard with topbar role switcher (Client / Manager / Admin views, sidebar, KPI tiles, tracker, queue, drivers, charts, audit log)

---

## CONTENT FUNDAMENTALS

**Language:** Russian (ru). All product copy is in Russian. Numbers use Russian formatting (`14 000`, `25M+ км`).

**Tone:** Confident, industrial, slightly bold. Direct B2B voice — "мы везём грузы", "доверьте грузы профессионалам". No cutesy phrasing. No filler enthusiasm.

**Address form:** Plural formal "вы / вас / ваш" ("Кабинет", "Войти", "Зарегистрируйтесь за 2 минуты").

**Casing:**
- Display headings (Bebas Neue): always UPPERCASE, large letter-spacing
- Eyebrows / labels / button text: UPPERCASE with 0.10–0.25em tracking
- Body text: sentence case
- Brand wordmark: `ФУРА` (white) + `ЕДЕТ` (gold)

**Examples (real copy from product):**
- Hero: "Логистика Вашего Бизнеса."
- Eyebrow: "Логистика нового поколения"
- Section labels: "Наши возможности", "Почему ФураЕдет", "Как мы работаем"
- CTA: "Начать работу →", "Рассчитать стоимость", "Доверьте грузы профессионалам"
- Stats are concrete: "25M+ КМ пройдено", "99% Вовремя", "12 лет на рынке"

**Numerals:** Roman counters with prefix slash ("01 / ФУРЫ", "02 / СРЕДНИЙ ТОННАЖ") for editorial rhythm. Tracking IDs in JetBrains Mono.

**Emoji:** **Not used in customer-facing surfaces.** The current dashboard nav uses emoji as icons (📦 🚚 🤖 etc.) — this is a placeholder; the redesign replaces them with proper SVG icons.

**Vibe:** Editorial / industrial-magazine. Think a freight company that wants to read like a Wired feature, not like a SaaS landing page. Numbers are oversized, labels are tiny, lots of negative space, lots of horizontal rules.

---

## VISUAL FOUNDATIONS

### Palette
- **Primary surface:** `--navy: #0A1628` deep navy. Marketing surfaces and any "hero" UI moments live here.
- **Elevated navy:** `--navy-2: #0F2040` (cards on dark) and `--navy-3: #162B55` (inputs/hover).
- **Footer / deepest:** `--navy-deep: #060D1A`.
- **Accent:** `--gold: #F0A500`. Single accent color — used for the "ЕДЕТ" wordmark, CTAs, active states, hairline indicators, eyebrow text.
- **Off-white surface:** `--off-white: #F5F3EE` warm — page bg for cabinets and the stats band on the landing.
- **Pure white** for raised surfaces inside the off-white sections.
- **Semantics:** green / red / amber / blue for status pills only — never for primary CTAs.

### Type
- **Display: Bebas Neue** — every section header, every big numeric stat, the wordmark, fleet category names. Always uppercase, condensed, tightly tracked at 1–3px.
- **Body: DM Sans** — UI text, paragraphs, table cells. Weights 300 (rare), 400, 500, 600, 700.
- **Mono: JetBrains Mono** — counters ("01"), tracking IDs, license plates.
- Massive scale contrast: 9–10px eyebrow labels next to 60–110px display headlines is normal.

### Backgrounds
- Solid `--navy` is the canonical hero background.
- A faint **8% gold grid** (`80px × 80px` lines) sits over the hero — `linear-gradient(rgba(240,165,0,0.03) 1px, transparent 1px)` x/y.
- Imagery is desaturated (`grayscale(20–60%)`) and faded to ~8% opacity behind text, with full-bleed edges on the right and a horizontal gradient mask to navy on the left.
- **No** rainbow / blue-purple gradients. The only gradient is the gold→gold-2 4px brand-accent strip on auth cards.

### Animation
- Fade-up on enter (20px / 0.5s ease).
- A signature "wobble-to-flat" hover on the calculator card: `transform: rotate(3deg) → rotate(0)` on hover, with `cubic-bezier(0.34,1.56,0.64,1)` (`--ease-pop`) and a swap of border to gold.
- Marquee ticker: gold band, 30s linear infinite, items separated by `◆`.
- Standard easing: `cubic-bezier(0.22, 1, 0.36, 1)` for transitions, ~0.25s default. No bounces on UI controls.

### Hover / Press
- Light surfaces: `translateY(-4px)` + soft shadow lift (services cards) OR background swap to navy with text inverted (services hover state).
- Dark surfaces: brighten text from `rgba(255,255,255,0.42)` → 1.0; gold underlines/borders appear.
- Buttons: gold buttons darken slightly via opacity; ghost buttons gain a 1px gold border. No scale-down press states (industrial brand).

### Borders & lines
- Hairlines on dark: `1px solid rgba(255,255,255,0.07)` — heavily used to divide rows, sections, footer columns.
- Hairlines on light: `1px solid var(--gray-1) #E8E6E0`.
- Active row indicator: a 3px-wide vertical gold bar on the left edge.
- Editorial rules: 28×3px gold bar above section headers — very brand-specific motif.

### Shadows
- Cards on light: `0 4px 16px rgba(10,22,40,0.06)` — soft, low.
- Hero/floating panel: `20px 20px 60px rgba(0,0,0,0.55)` — long, dramatic, offset.
- On hover gold-glow: `0 0 0 1px var(--gold), 0 0 60px rgba(240,165,0,0.20)`.

### Transparency / blur
- Top nav: `rgba(10,22,40,0.97) + backdropFilter: blur(16px)` — sticky over hero.
- White overlays on dark navy use `rgba(255,255,255,0.05–0.12)` for input fills and dividers.
- No frosted "glass" cards beyond the nav; brand keeps surfaces solid for legibility.

### Radii
- `2px` — primary CTAs, ghost buttons (industrial / sticker feel).
- `6px` — inputs, small chips.
- `10–14px` — service cards, dashboard cards.
- `20px` — hero calculator card and auth card.
- Pills: `999px` — only for status pills.

### Cards
- Dashboard card: `bg: white | border: 1px solid var(--gray-1) | radius: 14px | shadow: shadow-2 | padding: 24–32px`.
- Hero card (calculator): `bg: var(--navy-2) | border: 2px solid rgba(255,255,255,0.07) | radius: 14px | tilted 3deg by default | shadow: shadow-hero`.
- Status pill: `padding: 2px 8px | radius: pill | font: 11px/600 | bg+fg from semantic pair`.

### Layout rules
- Landing uses `padding: 80px` for full-width sections.
- Dashboard uses sidebar `w: 240px` (collapsed `64px`) + content area with `padding: 24–32px`.
- Sticky nav height: `68px`. Sticky cabinet topbar: `64px`.
- Editorial 3-column / 4-column grids with 16px gap on services.

### Imagery vibe
- Cool industrial photography: trucks at dawn, warehouses, ports.
- Desaturated 20–60% grayscale, optionally pushed warm by sitting on top of off-white sections.
- Black-and-navy as far as possible; gold is text-only, never tinted onto photos.

---

## ICONOGRAPHY

The repo ships **inline SVG icons hand-drawn in JSX** at 1.5–2.0 stroke width, no fills (line style). Examples in `source/`:
- 24×24 navigation/UI icons (eye, lock, mail, error)
- 28–32px feature icons (truck, refrigerator, GPS pin, AI grid, warehouse)
- All single-color, taking `currentColor`, with crisp `strokeLinecap="round"` joins

**Approach:** stroke icons, never filled silhouettes. **Lucide** is the closest match on a public CDN and is used as the substitution set in the redesign (same 1.5–2px stroke, rounded joins). When an exact analog exists in the source code (truck, GPS, shield, lightning, fridge), we recreate it inline; otherwise we use Lucide.

**Emoji:** removed from the dashboard sidebar in the redesign — they were placeholders.
**Unicode glyphs:** only `→` arrows (CTAs), `★` (rating), `◆` (ticker separator), `«»` (quotes).
**No icon font.** No PNG icons.

> **Substitution flag:** Lucide icons stand in for any UI icons not already drawn in the source. If you have an internal icon set, drop it into `assets/icons/` and the kit will pick it up.

---

## Font note (substitution flag)

All three fonts (Bebas Neue, DM Sans, JetBrains Mono) are loaded from **Google Fonts** in this design system, matching the source `index.html`. No font files were shipped in the repo, so there is nothing to substitute — these ARE the production fonts. If the user later wants self-hosted woff2 files, drop them into `fonts/` and update the `@import` in `colors_and_type.css`.

---

## Caveats
- The **landing page already has a strong design** in source. The redesign is a polish pass + extraction of system tokens, not a full reinvention.
- The **dashboard is the big lift** — source is generic Tailwind blue (`bg-blue-900`, emoji icons). The redesign rebuilds it on the brand: navy sidebar with gold accents, editorial typography, proper SVG iconography, role-aware home screen.
