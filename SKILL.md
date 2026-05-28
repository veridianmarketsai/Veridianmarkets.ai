---
name: veridian-memoir-design
description: Use this skill to generate well-branded interfaces and assets for Veridian Memoir ("history-led finance"), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill first — it covers the product
context, the brand voice ("CONTENT FUNDAMENTALS"), the visual system ("VISUAL
FOUNDATIONS"), and iconography. Then explore the other files:

- `colors_and_type.css` — all design tokens (color, type, spacing, radius,
  shadow) plus semantic type classes. Import this in any artifact you build.
- `fonts/times.ttf` — the brand serif (wired as `VM Serif`); mono is JetBrains
  Mono from Google Fonts.
- `preview/` — specimen cards for every token group; good reference for exact
  treatments.
- `ui_kits/web/` — a high-fidelity, modular React recreation of the product
  (front page, company screener with eye-preview, supply-chain "principle"
  network, company dashboard, and the History/Memoir analogue engine). Reuse the
  JSX components or lift their markup.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy
assets out and create static HTML files for the user to view. If working on
production code, copy assets and read the rules here to become an expert in
designing with this brand.

If the user invokes this skill without other guidance, ask them what they want
to build or design, ask a few sharp questions, and act as an expert designer who
outputs HTML artifacts _or_ production code, depending on the need.

**Non-negotiables of the brand:** warm paper (never white), warm ink (never pure
black), one deep teal + a terracotta accent, editorial serif headlines paired
with monospace data/labels, hairline + dashed rules, line-art charts (solid =
NOW, dashed = THEN), Tabler icons, and absolutely no emoji or gradients. Every
screen reaches backward to a historical analogue — that's the whole point.
