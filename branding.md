# Design System Specification: WiserPicture — Warm Editorial

## 1. Overview & Creative North Star
**Theme:** Warm Editorial (Aligned with Workbook)

A warm, organic, and trustworthy aesthetic inspired by the WiserPicture workbook design system. Earth tones convey wisdom, faith, and practical grounding. The typography pairs a classic serif for headlines with a clean sans-serif for body copy.

---

## 2. Core Colors (Tokens)

> **Note:** These values are derived from the live website and serve as the canonical source of truth.

*   **Primary:** `#334F2B` (Forest Green) — Primary actions, CTA buttons, active navigation states, footer background.
*   **Secondary:** `#C9A84C` (Golden/Mustard) — Secondary highlights, labels, accents, quote borders.
*   **Tertiary:** `#C0603A` (Terracotta) — Section labels, badges, blockquote borders in article prose, warnings.
*   **Background:** `#F9F9F6` (Warm Cream) — Main page background.
*   **Surface:** `#FFFFFF` (White) — Cards (`warm-card`), containers, elevated surfaces.
*   **On-Surface:** `#1A1C1B` (Deep Warm Black) — Primary text color.
*   **On-Surface-Variant:** `#6B705C` (Muted Olive) — Secondary text, captions, placeholder text.
*   **Outline-Variant:** `#C8C8C5` (Warm Gray) — Borders, dividers.

### Surface Hierarchy
*   **Surface Container (Low):** `#F4F4F1`
*   **Surface Container:** `#F4F4F1`
*   **Surface Container (High):** `#E8E8E5`
*   **Surface Container (Highest):** `#D8D8D5`

### Footer (Inverted — Green)
*   **Footer Background:** `#334F2B` (same as Primary — `bg-primary`)
*   **Footer Text (links):** `rgba(255,255,255,0.8)` (`text-white/80`)
*   **Footer Text (secondary links):** `rgba(255,255,255,0.6)` (`text-white/60`)
*   **Footer Hover:** `#FFFFFF` (`hover:text-white`)

### Tailwind Config (exact implementation)
```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        "surface": "#FFFFFF",
        "surface-container-lowest": "#F9F9F6",
        "surface-container": "#F4F4F1",
        "surface-container-low": "#F4F4F1",
        "surface-container-high": "#E8E8E5",
        "surface-container-highest": "#D8D8D5",
        "primary": "#334F2B",
        "secondary": "#C9A84C",
        "tertiary": "#C0603A",
        "background": "#F9F9F6",
        "outline-variant": "#C8C8C5",
        "on-surface-variant": "#6B705C",
        "on-surface": "#1A1C1B",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#2A3F22",
        "secondary-fixed-dim": "#C9A84C",
      },
      fontFamily: {
        "headline": ["Lora", "serif"],
        "body": ["Manrope", "sans-serif"],
        "label": ["Manrope", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  }
}
```

---

## 3. Typography

*   **Headline/Display Font:** `Lora` (Serif) — authoritative, editorial headlines. Italics used for H1 display and blockquotes.
*   **Body/Label Font:** `Manrope` (Sans-Serif) — high legibility for all UI text.
*   **Fallback Stack:**
    *   Headline: `['Lora', 'serif']`
    *   Body: `['Manrope', 'sans-serif']`

### Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"/>
```

### Type Scale

| Level | Tailwind Classes | Notes |
|-------|-----------------|-------|
| H1 Display | `text-4xl md:text-6xl font-headline italic text-on-surface` | Homepage hero, page titles |
| H2 Section | `text-2xl md:text-3xl font-headline italic text-on-surface` | Section headings |
| H3 Card | `text-xl font-headline text-on-surface` | Card titles, sub-sections |
| Body | `text-base leading-relaxed text-on-surface` (`font-body`) | General paragraphs |
| Caption / Label | `text-[0.65rem] font-bold uppercase tracking-widest text-tertiary` | Section labels above headings |
| Nav links | `font-medium text-sm tracking-wide` | Header navigation |

### Prose (Article / Episode pages)
```css
.prose h2 { font-family: 'Lora', serif; font-size: 1.75rem; color: #1A1C1B; margin-top: 2.5rem; margin-bottom: 1rem; font-style: italic; }
.prose h3 { font-family: 'Lora', serif; font-size: 1.35rem; color: #1A1C1B; margin-top: 2rem; margin-bottom: 0.75rem; }
.prose p  { color: #444; line-height: 1.8; margin-bottom: 1.5rem; font-size: 1.05rem; }
.prose blockquote { border-left: 3px solid #C0603A; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #6B705C; font-family: 'Lora', serif; font-size: 1.2rem; }
.prose a  { color: #334F2B; text-decoration: underline; text-underline-offset: 4px; }
```

---

## 4. System Implementation Rules

*   **Backgrounds:** Use `#F9F9F6` (`bg-background`) as the base. Use `#FFFFFF` for cards with subtle shadows.
*   **Cards (`warm-card`):** White background, `1px solid #E8E8E5` border, `box-shadow: 0 1px 3px rgba(45,51,25,0.06)`. No glassmorphism. Hover: `box-shadow: 0 4px 12px rgba(45,51,25,0.1)`.
*   **Buttons (Primary):** `bg-primary text-white font-semibold rounded shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
*   **Buttons (Secondary/Outlined):** `border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-all`
*   **Text Colors:** Use `text-on-surface` (`#1A1C1B`) for primary, `text-on-surface-variant` (`#6B705C`) for secondary.
*   **Footer:** Inverted section using `bg-primary` (`#334F2B`) with `text-white/80` for links and `text-white/60` for secondary links.
*   **Responsiveness:** Mobile (1 col) → Tablet (2 col) → Desktop (3-4 col). Max width: `max-w-7xl`.

---

## 5. Components

### Header / Navigation
```
- Sticky, `bg-[#F9F9F6]/90 backdrop-blur-xl`, subtle shadow
- Logo: `h-12 w-auto`
- Desktop nav: centered, `gap-8`, `text-sm font-medium tracking-wide`
- Active page link: `text-primary` (no underline)
- "Mi Cuenta": icon + text, inline near CTA button
- CTA Button: `bg-primary text-white`, right-aligned
- Mobile: hamburger → slide-in drawer from left
```

### Cards (`warm-card`)
```css
.warm-card {
  background: #FFFFFF;
  border: 1px solid #E8E8E5;
  box-shadow: 0 1px 3px rgba(45,51,25,0.06), 0 1px 2px rgba(45,51,25,0.04);
}
.warm-card:hover {
  box-shadow: 0 4px 12px rgba(45,51,25,0.1);
}
```

### Verse / Quote Block
```html
<div class="bg-[#F4F4F1] rounded-r-lg border-l-4 border-secondary px-8 py-10 text-center">
  <p class="text-lg italic font-headline text-on-surface leading-snug mb-4">quote text</p>
  <p class="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-secondary">Attribution</p>
</div>
```

### Section Label Pattern
```html
<span class="text-[0.65rem] font-bold text-tertiary uppercase tracking-widest mb-3 block">LABEL</span>
<h2 class="text-2xl md:text-3xl font-headline italic text-on-surface mb-4">Heading</h2>
```

### Iconography
- **Library:** Material Symbols Outlined (Google)
- **Style:** `FILL: 0, wght: 400` default; `FILL: 1` for active/filled states
- **Sizes:** `text-xl` (20px) standard, `text-3xl` for feature icons

---

## 6. Exceptions Documented

| Element | Color / Value | Justification |
|---------|--------------|---------------|
| Spotify button | `bg-[#1DB954]` | Official Spotify brand color — required for brand recognition |
| Podcast play icon on hover | `text-[#1DB954]` | Spotify brand association on podcast listing |

---

## 7. Accessibility Rules

- **WCAG AA minimum** for all text (4.5:1 ratio)
- Primary text `#1A1C1B` / `#F9F9F6` → ratio **14.7:1 (AAA)** ✅
- Footer `white` / `#334F2B` → ratio **6.8:1 (AA)** ✅
- All `<img>` tags must have descriptive `alt` text
- All interactive buttons must have `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Mobile menu toggle must have `aria-label`

---

## 8. Workbook Module Typography System

Typography rules specific to the interactive workbook modules (`modulo-1` through `modulo-5`).

### Type Scale — Modules

| Level | Usage | Tailwind Classes |
|-------|-------|-----------------|
| **Section H2** | Main section heading | `text-3xl font-headline font-bold text-primary italic border-b-4 border-secondary inline-block pb-1` |
| **Sub-heading H3** | Contextual label before a group | `font-headline font-bold text-primary text-xl mt-12 mb-6` |
| **Block title — Definition** | Inside green definition block | `text-secondary font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Illustration** | Inside gold illustration block | `text-primary font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Warning** | Inside rust warning block | `text-white font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Story** | Inside cream story block | `font-headline italic text-lg text-on-surface mb-4 tracking-wide` |
| **Card title H4** | Inside two-column card | `font-headline font-bold text-[color] text-lg mb-3` |
| **Quote / Bible verse** | Main quote text | `font-headline italic text-base text-on-surface` |
| **Quote attribution** | Reference below quote | `text-secondary font-bold text-sm not-italic uppercase tracking-widest mt-4 block` |
| **Body text** | Regular paragraph | `text-[1.05rem] leading-[1.7] text-on-surface` |

### Block Color Conventions

| Block Type | Background | Title Color | Notes |
|-----------|-----------|-------------|-------|
| **Definition** | `bg-primary` (`#334F2B`) | `text-secondary` (gold) | Lightbulb icon bottom-right |
| **Illustration** | `bg-[#C1AA46]` (muted gold) | `text-primary` (dark green) | Material icon top-right |
| **Warning** | `bg-[#C0603A]` (terracotta) | `text-white` | Warning icon top-right |
| **Story** | `bg-[#F4F4F1]` + `border-l-4 border-secondary` | Italic serif, `text-on-surface` | No icon overlay |
| **Quote** | `bg-[#F4F4F1]` + `border-l-4 border-secondary` | No explicit title | Attribution in `text-secondary` uppercase |
| **Exercise** | `bg-[#F4F4F1]` + `border border-outline-variant/30` | `text-secondary` with edit icon | Full `rounded-xl` |

### Interactive Components — Modules

| Component | Classes |
|-----------|---------|
| Textareas | `.workbook-textarea` (bg `#E8DED1`, rounded-lg, `focus:ring-secondary`) |
| Short Inputs | `bg-[#E8DED1] rounded-lg focus-within:ring-[#C9A84C]` + `input bg-transparent` |
| Checkboxes | `text-primary rounded focus:ring-primary focus:ring-2 border-outline-variant` |
