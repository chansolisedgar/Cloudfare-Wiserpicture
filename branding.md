# Design System Specification: WiserPicture — Warm Editorial

## 1. Overview & Creative North Star
**Theme:** Warm Editorial (Aligned with Workbook)

A warm, organic, and trustworthy aesthetic inspired by the WiserPicture workbook design system. Earth tones convey wisdom, faith, and practical grounding. The typography pairs a classic serif for headlines with a clean sans-serif for body copy.

---

## 2. Core Colors (Tokens)

Based on the workbook design system:

*   **Primary:** `#4A6741` (Forest Green) — Primary actions, CTA buttons, active navigation states.
*   **Secondary:** `#C9A84C` (Golden/Mustard) — Secondary highlights, labels, accents.
*   **Tertiary:** `#C0603A` (Terracotta) — Special badges, tertiary highlights, alerts.
*   **Background:** `#FAFAF7` (Warm Cream) — Main page background.
*   **Surface:** `#FFFFFF` (White) — Cards, containers, elevated surfaces.
*   **On-Surface:** `#2D3319` (Deep Green/Black) — Primary text color.
*   **On-Surface-Variant:** `#6B705C` (Muted Olive) — Secondary text, captions.
*   **Outline-Variant:** `#C4C0B6` (Warm Gray) — Borders, dividers.

### Surface Hierarchy
*   **Surface Container (Low):** `#F5F3ED`
*   **Surface Container:** `#F0EDE6`
*   **Surface Container (High):** `#E8E4DB`
*   **Surface Container (Highest):** `#DDD9D0`

### Footer (Inverted)
*   **Footer Background:** `#2D3319` (Deep green)
*   **Footer Text:** `#B8C4A0` (Light sage)
*   **Footer Accent:** `#8CB870` (Bright sage green)

---

## 3. Typography

*   **Headline/Display Font:** `Newsreader` (Serif) for authoritative, editorial headlines.
*   **Body/Label Font:** `Inter` (Sans-Serif) for high legibility.
*   **Fallback Stack:**
    *   Headline: `['Newsreader', 'serif']`
    *   Body: `['Inter', 'sans-serif']`

---

## 4. System Implementation Rules

*   **Backgrounds:** Use `#FAFAF7` as the base. Use `#FFFFFF` for cards with subtle shadows.
*   **Cards:** White background, `1px solid #E8E4DB` border, subtle box-shadow. No glassmorphism.
*   **Buttons:** Solid fill using Primary (`#4A6741`) with white text. Outlined variant with border.
*   **Text Colors:** Use `#2D3319` for primary text, `#6B705C` for secondary.
*   **Footer:** Dark inverted section using `#2D3319` background with light `#B8C4A0` text.
*   **Responsiveness:** Mobile (1 col) → Tablet (2 col) → Desktop (3-4 col).

---

## 5. Workbook Module Typography System

Typography rules specific to the interactive workbook modules (modulo-1 through modulo-5). These definitions are the canonical reference — always apply these classes consistently in all modules.

### Fonts in Use

| Role | Font | Tailwind Class |
|------|------|----------------|
| Headlines & display | Lora (serif) | `font-headline` |
| Body, labels, UI | Manrope (sans-serif) | `font-body` |

---

### Type Scale — Modules

| Level | Usage | Tailwind Classes |
|-------|-------|-----------------|
| **Section H2** | Main section heading (e.g. "Mayordomía", "Generosidad") | `text-3xl font-headline font-bold text-primary italic border-b-4 border-secondary inline-block pb-1` |
| **Sub-heading H3** | Contextual label before a group of cards or content (e.g. "Dos errores que debemos evitar") | `font-headline font-bold text-primary text-xl mt-12 mb-6` |
| **Block title — Definition** | Title inside a green definition block | `text-secondary font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Illustration** | Title inside a gold illustration block | `text-primary font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Warning** | Title inside a rust warning block | `text-white font-headline italic text-xl mb-4 tracking-wide` |
| **Block title — Story** | Title inside a cream story/anecdote block | `font-headline italic text-lg text-on-surface mb-4 tracking-wide` |
| **Card title H4** | Title inside a two-column card (e.g. error cards) | `font-headline font-bold text-[color] text-lg mb-3` |
| **Quote / Bible verse** | Main quote text in a left-bordered quote block | `font-headline italic text-base text-on-surface` (implicit — no extra class, inherits from block) |
| **Quote attribution** | Reference line below a quote | `text-secondary font-bold text-sm not-italic uppercase tracking-widest mt-4 block` |
| **Body text** | Regular paragraph text | `text-[1.05rem] leading-[1.7] text-on-surface` (via `article p` CSS rule) |
| **Body inside colored block** | Paragraphs inside green/gold/rust blocks | `text-sm !text-white leading-relaxed font-medium` |
| **Exercise section label** | Gold label above an exercise block (e.g. "SECCIÓN 1") | `text-secondary font-bold tracking-wide uppercase text-sm mb-4` |

---

### Block Color Conventions

| Block Type | Background | Title Color | Notes |
|-----------|-----------|-------------|-------|
| **Definition** | `bg-primary` (`#334F2B` dark green) | `text-secondary` (gold) | Lightbulb icon bottom-right |
| **Illustration** | `bg-[#C1AA46]` (muted gold) | `text-primary` (dark green) | Material icon top-right, small |
| **Warning / Advertencia** | `bg-[#C0603A]` (rust) | `text-white` | Warning icon top-right |
| **Story / Historia real** | `bg-[#F4F4F1]` (cream) + `border-l-4 border-secondary` | Italic serif, `text-on-surface` | No icon overlay |
| **Quote / Versículo** | `bg-[#F4F4F1]` (cream) + `border-l-4 border-secondary` | No explicit title | Attribution in gold uppercase |
| **Exercise** | `bg-[#F4F4F1]` + `border border-outline-variant/30` | `text-secondary` with edit icon | Full `rounded-xl` |
| **Error / Info card** | `bg-[#F4F4F1]` + `border-t-4 border-[color]` | `font-headline font-bold text-[color]` | Full `rounded-xl` |

---

### Interactive Components

| Component | Usage | Classes / Structure |
|-----------|-------|---------------------|
| **Textareas (Long answers)** | Main reflection questions | `.workbook-textarea` (Melon bg `#E8DED1`, rounded-lg, focus:ring-secondary) |
| **Short Inputs (1, 2, 3)** | Numbered short answers | Wrap in `bg-[#E8DED1] rounded-lg focus-within:ring-[#C9A84C]` with `input bg-transparent` |
| **Checkboxes / Scales** | Single or multiple choice options | `<input type="checkbox">` with native Tailwind Forms classes: `text-primary rounded focus:ring-primary focus:ring-2 border-outline-variant` |
