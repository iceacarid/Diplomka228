---
name: furaedet-design
description: Use this skill to generate well-branded interfaces and assets for ФураЕдет (FuraEdet) — a Russian logistics / freight company — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start
- Foundation tokens live in `colors_and_type.css` (CSS vars for color, type, spacing, shadows, easing).
- Webfonts: `fonts/` (Bebas Neue, DM Sans, JetBrains Mono — Google Fonts substitutes).
- UI kits: `ui_kits/landing/` (marketing site) and `ui_kits/cabinet/` (client/manager/admin dashboards).
- Shared icons: `ui_kits/shared/icons.jsx` — Lucide-style line icons via `window.Icon`.
- Brand voice / iconography / visual rules: `README.md`.
