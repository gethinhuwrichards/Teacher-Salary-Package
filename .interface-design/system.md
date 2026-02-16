# Design System — Teacher Package

Extracted from existing codebase. Frequency-weighted to match dominant patterns.

---

## Colors

### Palette

```
Primary (Orange):
  --primary-50:  #FCF8D8   (light cream)
  --primary-100: #FDE8D3   (peach)
  --primary-200: #FBCFA6   (light orange)
  --primary-500: #DD700B   (orange — brand)
  --primary-600: #C46209   (dark orange)
  --primary-700: #A85308   (deep orange)

Grays:
  --gray-50:  #FAFAF8   (background)
  --gray-100: #FFFFFF   (surface / card)
  --gray-200: #D9DADF   (border)
  --gray-300: #C2C2BD   (border hover)
  --gray-400: #ADACA7   (muted text, placeholders)
  --gray-500: #7C7D75   (secondary text)
  --gray-600: #5C5D57   (body text light)
  --gray-700: #3D3E3A   (body text)
  --gray-800: #1A1A1A   (heading text)
  --gray-900: #111111   (display text)

Green (functional):
  --green-50:  #f0fdf4
  --green-200: #bbf7d0
  --green-500: #22c55e
  --green-600: #16a34a
  --green-700: #15803d

Red (functional):
  --red-50:  #fef2f2
  --red-100: #fee2e2
  --red-200: #fecaca
  --red-500: #ef4444
  --red-600: #dc2626
  --red-700: #b91c1c
```

### Usage Rules

- Surface backgrounds: `--gray-100` (#fff)
- Page background: `--gray-50`
- All borders: `--gray-200`
- Interactive accent: `--primary-500` / `--primary-600`
- Use `var(--white)` for white-on-color text — never hardcode `#ffffff`
- Never hardcode hex values that exist in the palette

---

## Typography

### Fonts

```
Body:    'DM Sans', sans-serif
Display: 'Fira Sans', sans-serif  (h1, h2, h3, stat numbers)
```

### Type Scale (consolidated)

Eliminate near-duplicates. Canonical sizes:

```
--text-2xs:  0.7rem    (badges, table-xs)
--text-xs:   0.75rem   (labels, captions, uppercase text)
--text-sm:   0.8rem    (secondary UI, table cells, tags)
--text-base: 0.85rem   (compact body, detail rows)
--text-md:   0.9rem    (nav, form labels, body copy)
--text-lg:   0.95rem   (form inputs, buttons, paragraphs)
--text-xl:   1.1rem    (section headings, search input)
--text-2xl:  1.25rem   (logo, card highlights)
--text-3xl:  1.5rem    (admin h1, modal h2, salary amounts)
--text-4xl:  2rem      (page h1)
--text-5xl:  2.5rem    (hero display, headline amounts)
```

**Retired sizes** (merge into nearest canonical):
- 0.6rem → 0.7rem
- 0.78rem → 0.8rem
- 0.88rem → 0.9rem
- 1.0rem → 0.95rem or 1.1rem by context
- 1.05rem → 1.1rem
- 1.15rem → 1.1rem
- 1.6rem → 1.5rem
- 1.75rem → 1.5rem or 2rem by context
- 2.8rem → 2.5rem

### Font Weights

```
400  — body text
500  — medium (nav links, detail values)
600  — semibold (labels, buttons, table headers)
700  — bold (headings, amounts, logos)
800  — extra-bold (hero h1 only)
```

---

## Spacing

### Grid: 4px base (0.25rem)

Canonical scale:

```
0.25rem    4px     (micro gaps, badge padding)
0.5rem     8px     (small gaps, checkbox gap, list gaps)
0.75rem    12px    (form gaps, section margins)
1rem       16px    (standard gap, card gap, section padding)
1.25rem    20px    (card padding, grid gaps)
1.5rem     24px    (card padding, section padding, nav gaps)
2rem       32px    (section spacing, large padding)
2.5rem     40px    (hero/modal padding)
3rem       48px    (large section padding)
4rem       64px    (extra-large spacing)
```

**Off-grid values to normalize:**
- 0.1rem → 0 or 0.25rem
- 0.15rem → 0.25rem
- 0.3rem → 0.25rem
- 0.35rem → 0.25rem or 0.5rem
- 0.4rem → 0.5rem
- 0.6rem → 0.5rem or 0.75rem
- 0.65rem → 0.75rem
- 0.8rem → 0.75rem or 1rem
- 0.85rem → 0.75rem or 1rem
- 1.75rem → 1.5rem or 2rem

---

## Border Radius

### Scale

```
--radius-xs:   4px     (micro badges)
--radius-sm:   6px     (dropdown items, inner elements)
--radius-md:   8px     (inputs, small buttons, dropdowns, error banners)
--radius-lg:   10px    (buttons, tab buttons)
--radius-xl:   12px    (cards, tables, form sections)  ← dominant card radius
--radius-2xl:  16px    (modals, hero cards)
--radius-pill: 9999px  (badges, pills)
--radius-full: 50%     (avatars, icons)
```

**Violations to fix:**
- 3px (new-badge) → 4px
- 5px (btn-xs) → 6px
- 14px (step card) → 12px
- 20px (cta-card) → 16px or keep as intentional hero treatment

---

## Depth (Borders + Shadows)

System uses **borders as primary depth** with **subtle shadows for lift**.

### Border Pattern

```
Standard:   1px solid var(--gray-200)
Interactive: 2px solid var(--gray-200)  → 2px solid var(--primary-500) on focus/active
Divider:    1px solid var(--gray-200)   (border-bottom separators)
Heavy:      2px solid var(--gray-200)   (section dividers, table headers)
```

### Shadow Scale

```
--shadow-none:    none
--shadow-xs:      0 1px 3px rgba(0, 0, 0, 0.04)
                  ↳ header only

--shadow-sm:      0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)
                  ↳ cards at rest (5x) — DOMINANT rest shadow

--shadow-md:      0 4px 12px rgba(0, 0, 0, 0.08)
                  ↳ card hover state (2x)

--shadow-lg:      0 8px 24px rgba(0, 0, 0, 0.1)
                  ↳ dropdowns, elevated hover (3x)

--shadow-xl:      0 20px 60px rgba(0, 0, 0, 0.15)
                  ↳ modal overlay (1x)

--shadow-accent:  0 2px 8px rgba(221, 112, 11, 0.2)
                  ↳ primary button rest

--shadow-accent-hover: 0 4px 14px rgba(221, 112, 11, 0.25)
                  ↳ primary button hover, headline card
```

**Violations:**
- Cards using single `0 1px 3px rgba(0,0,0,0.06)` without the second layer → normalize to `--shadow-sm`
- `0 4px 14px` and `0 4px 16px` are near-duplicates → pick `0 4px 14px`

---

## Component Patterns

### Button

```css
/* Base */
.btn {
  padding: 0.75rem 1.5rem;        /* normalize from 0.65rem */
  border-radius: 10px;             /* --radius-lg */
  font-size: 0.95rem;              /* --text-lg */
  font-weight: 600;
  font-family: var(--font-body);
  transition: all 0.2s;
}

/* Sizes */
.btn-sm:   padding 0.5rem 0.75rem,  radius 8px,  font-size 0.8rem
.btn-xs:   padding 0.25rem 0.5rem,  radius 6px,  font-size 0.7rem
.btn-cta:  padding 1rem 2.5rem,     radius 12px, font-size 1.1rem, weight 700

/* Variants */
.btn-primary:   bg primary-600, color white, shadow-accent
.btn-secondary: bg gray-100, border 2px gray-300, color gray-700
.btn-success:   bg green-600, color white
.btn-danger:    bg red-600, color white
```

### Card

```css
.card {
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 12px;              /* --radius-xl — THE card radius */
  padding: 1.5rem;                  /* or 1.25rem for compact */
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);     /* 0 4px 12px */
}
```

### Input

```css
.form-input {
  height: 42px;
  padding: 0.5rem 0.75rem;         /* normalize from 0.6rem 0.8rem */
  border: 2px solid var(--gray-200);
  border-radius: 8px;               /* --radius-md */
  font-size: 0.95rem;               /* --text-lg */
  background: var(--gray-100);
}

.form-input:focus {
  border-color: var(--primary-500);
}
```

### Table

```css
/* Unified table header */
th {
  font-size: 0.75rem;              /* --text-xs (normalize review-table 0.7rem) */
  font-weight: 600;                /* (normalize review-table 700) */
  color: var(--gray-500);          /* (normalize past-table gray-600) */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.75rem;                /* normalize from 0.65rem */
}

td {
  padding: 0.75rem;                /* normalize from 0.6rem */
  font-size: 0.85rem;
  border-bottom: 1px solid var(--gray-200);
}
```

### Badge

```css
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;            /* pill */
  font-size: 0.8rem;                /* --text-sm */
  font-weight: 600;
}
```

---

## Layout

### Max Widths

```
--width-narrow:  680px    (forms — submit page)
--width-medium:  900px    (detail pages — school, archived)
--width-wide:    1200px   (listing pages, admin, header, main content)
```

**Violation:** `max-width: 1100px` (admin-past) and `860px` (home-page) are off-scale.
- 1100px → 1200px (or 900px if narrower is intended)
- 860px → 900px

### Breakpoints

```
640px   — mobile (nav collapse, form rows stack)
768px   — tablet (grid collapse, reduced padding)
```

---

## Transitions

```
Standard: 0.2s (used consistently across codebase)
Fast:     0.15s (autocomplete items only — consider normalizing to 0.2s)
```

---

## Known Technical Debt

1. **Variable naming:** `--teal-*`, `--blue-*`, `--amber-*`, `--yellow-*` all map to orange. Rename to `--primary-*` semantic names.
2. **`!important` overrides:** 4 instances in admin tables — refactor specificity instead.
3. **Duplicate class names:** `.school-name`, `.school-country`, `.admin-header` defined in multiple files.
4. **`--gray-100` is #ffffff:** Indistinguishable from `--white`. Consider making gray-100 an actual light gray (#F5F5F3) or alias it explicitly.
