---
argus-artifact-id: 01KVX1HRZJMGVWRD23XN3HW1HV
---

# Tailwind CSS v3 to v4 Migration Plan — @papernote/ui

## Context

papernote-ui is a published React component library (`@papernote/ui`) currently on Tailwind CSS v3.4. Three consumer apps (prylance, nexara, atrium) import its design tokens via `@papernote/ui/tailwind-config` — a JS config object they spread into their own `tailwind.config.js`. Tailwind v4 fundamentally changes this model: configuration moves from JS to CSS (`@theme` directive), the PostCSS plugin changes, and several utility class APIs break. This migration must preserve visual fidelity across 227 Tailwind-using components while providing a clean consumer upgrade path.

**Version strategy: Major bump to 2.0.0** — the consumer integration contract changes fundamentally.

---

## Phase 0: Pre-Migration Baseline

1. Build Storybook on `main` and capture visual snapshots of key component stories
2. Save current `dist/styles.css` as baseline for CSS diff comparison
3. Create `feat/tailwind-v4` branch

---

## Phase 1: Dependencies & Build Config

### 1.1 package.json

```diff
- "autoprefixer": "^10.4.0",
- "postcss-import": "^16.1.1",
- "tailwindcss": "^3.4.0",
+ "tailwindcss": "^4.0.0",
+ "@tailwindcss/postcss": "^4.0.0",
+ "@tailwindcss/vite": "^4.0.0",
```

Keep `postcss` and `rollup-plugin-postcss` (still needed for Rollup builds).

### 1.2 postcss.config.cjs

Replace entire contents:
```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### 1.3 Storybook Vite plugin

Create `.storybook/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [tailwindcss()] });
```

---

## Phase 2: CSS-First Theme Configuration

### 2.1 Create `src/styles/theme.css`

Translate the entire 330-line `tailwind.config.js` into a `@theme` block using CSS custom properties. This is the new canonical source of design tokens.

Key mappings:
| v3 JS Config | v4 CSS Custom Property |
|---|---|
| `colors.primary.500: '#64748b'` | `--color-primary-500: #64748b` |
| `fontFamily.sans: [...]` | `--font-sans: ui-sans-serif, system-ui, ...` |
| `fontSize.sm: ['0.875rem', {...}]` | `--text-sm: 0.875rem; --text-sm--line-height: 1.375rem` |
| `spacing['4.5']: '1.125rem'` | `--spacing-4_5: 1.125rem` |
| `borderRadius['4xl']: '2rem'` | `--radius-4xl: 2rem` |
| `boxShadow.paper: '...'` | `--shadow-paper: ...` |
| `animation['fade-in']: '...'` | `--animate-fade-in: fadeIn 0.5s ease-in-out` |
| `backgroundImage['subtle-grain']: url(...)` | `--background-image-subtle-grain: url(...)` |
| `minWidth/minHeight.touch` | `--min-width-touch: 2.75rem; --min-height-touch: 2.75rem` |

All 18 keyframe definitions move inside the `@theme` block.

**Note:** v4 has a built-in `shadow-xs` (`0 1px rgb(0 0 0 / 0.05)`). Our custom `--shadow-xs` will override it, preserving our value (`0 1px 2px 0 rgb(0 0 0 / 0.03)`).

### 2.2 Content detection & safelist replacement

Add to `src/styles/index.css`:
```css
@source "../components/**/*.{tsx,ts}";
@source inline("bg-sky-100 bg-sky-50 bg-sky-100/50 bg-amber-100 bg-amber-50 bg-amber-100/50 bg-emerald-100 bg-emerald-50 bg-emerald-100/50 bg-pink-100 bg-pink-50 bg-pink-100/50");
```

### 2.3 Keep `tailwind.config.js` for now

Do NOT delete — consumers on v3 still need it. Phase 5 adds a parallel `./theme` export.

---

## Phase 3: Stylesheet Migration (`src/styles/index.css`)

### 3.1 Replace directives

```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
+ @import "tailwindcss";
+ @import "./theme.css";
```

Google Fonts `@import url(...)` and `@import '../components/Spreadsheet.css'` stay as-is (v4's PostCSS plugin handles imports).

### 3.2 @layer blocks stay

`@layer base`, `@layer components` blocks with `@apply` continue to work in v4. The 58 `@apply` usages all reference standard Tailwind utilities — no custom-to-custom `@apply` chains.

### 3.3 Convert custom utilities to @utility

```diff
- @layer utilities {
-   .line-clamp-1 { ... }
-   .scrollbar-hide { ... }
-   .text-shadow { ... }
-   .bg-gradient-primary { ... }
- }
+ @utility line-clamp-1 { ... }
+ @utility scrollbar-hide { ...; &::-webkit-scrollbar { display: none; } }
+ @utility text-shadow { ... }
+ @utility bg-gradient-primary { ... }
```

**Note:** `line-clamp-*` is built into v4 natively — verify the built-in matches our behavior and potentially drop the custom definitions.

### 3.4 Clean up duplicates

- Table classes (`.table`, `.table-header`, etc.) are defined both inside `@layer components` AND as raw CSS outside layers. Consolidate.
- `@keyframes pulse` + `.animate-pulse` in raw CSS duplicate the theme definition. Remove the raw CSS version.
- `@keyframes slideIn*` in raw CSS duplicate theme keyframes. Keep the raw CSS `.animate-slide-in-*` classes but remove duplicate keyframe definitions.

### 3.5 Raw CSS outside layers

Scrollbar styles, `.table-stable`, `.page-nav-dot` tooltip CSS, touch-friendly `@media (pointer: coarse)` — all stay as-is. Un-layered CSS in v4 has highest specificity (same as v3).

---

## Phase 4: Component Class Renames

### 4.1 `bg-opacity-*` removal (7 occurrences, 6 files)

| File | Before | After |
|---|---|---|
| Drawer.tsx | `bg-ink-900 bg-opacity-50` | `bg-ink-900/50` |
| Modal.tsx | `bg-ink-900 bg-opacity-50` | `bg-ink-900/50` |
| DataTable.tsx | `bg-white bg-opacity-75` | `bg-white/75` |
| AdminModal.tsx | `bg-black bg-opacity-50` | `bg-black/50` |
| CommandPalette.tsx | `bg-ink-900 bg-opacity-50` | `bg-ink-900/50` |
| NotificationBar.tsx | `bg-white bg-opacity-50` / `hover:bg-opacity-60` | `bg-white/50` / `hover:bg-white/60` |

### 4.2 `placeholder-{color}` syntax (8 occurrences, 7+ files)

`placeholder-ink-400` becomes `placeholder:text-ink-400` everywhere:
- `src/styles/index.css` (`.input` class)
- Autocomplete, PasswordInput, CommandPalette, Textarea, MarkdownEditor, SearchBar, MaskedInput

### 4.3 `dark:` variant (45 occurrences, 13 files)

v3 default `darkMode` = `'media'`. v4 default = `@media (prefers-color-scheme: dark)`. Same behavior — **no changes needed**.

Files with `dark:` usage: ActionCard, ProcessHealthBar, ThemeToggle, CaseQueueItem, NotificationIndicator, FunnelChart, SplitPane, ComingSoon, ConfidenceIndicator, SystemActionEntry, EntityCard, ReviewDecisionCard, AnomalyBanner.

### 4.4 Visual inspection needed (no code changes)

- **`ring-*` utilities** (16 occurrences, 13 files) — v4 uses `outline` instead of `box-shadow` for rings. Focus styles on `.btn` and interactive components need visual verification.
- **`space-x/y-*`** (86 occurrences, 37 files) — v4 uses `:where()` selector (lower specificity). Verify Stack, ControlBar, ExpandableToolbar layouts.
- **`divide-*`** (3 occurrences) — same `:where()` change.

---

## Phase 5: Consumer Migration Path

### 5.1 New package.json exports

```json
"exports": {
  ".": { "import": "./dist/index.esm.js", "require": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./styles": "./dist/styles.css",
  "./styles.css": "./dist/styles.css",
  "./theme": "./src/styles/theme.css",
  "./theme.css": "./src/styles/theme.css",
  "./tailwind-config": "./tailwind.config.js"
}
```

### 5.2 Consumer v4 integration pattern

Consumers replace their JS config with CSS imports:

```css
/* consumer's main CSS */
@import "tailwindcss";
@import "@papernote/ui/theme";

@source "../src/**/*.{tsx,ts}";
```

### 5.3 Deprecation timeline

- **2.0.0-beta**: Both `./tailwind-config` (v3) and `./theme` (v4) exports
- **2.0.0 stable**: Same, `./tailwind-config` deprecated in docs
- **2.1.0+**: Remove `./tailwind-config` and `tailwind.config.js`

---

## Phase 6: Verification

1. **Build**: `npm run build` — verify `dist/styles.css`, `dist/index.esm.js`, `dist/index.d.ts` all produced
2. **CSS diff**: Compare new `dist/styles.css` against v3 baseline (expect CSS custom properties added, different reset, outline-based rings)
3. **Storybook**: `npm run storybook` — visual check of all 27 component classes from index.css
4. **Focus states**: Tab through buttons/inputs, verify ring appearance
5. **Overlays**: Test Drawer, Modal, CommandPalette backdrop opacity
6. **DataGrid**: Verify column color banding (safelisted classes)
7. **Unit tests**: `npm test` — should pass (CSS changes don't affect logic)
8. **Consumer integration**: `npm pack`, install in one consumer, verify builds + renders

---

## Risk Summary

| Risk | Severity | Mitigation |
|---|---|---|
| `rollup-plugin-postcss` + `@tailwindcss/postcss` incompatibility | High | Test immediately in Phase 1. Fallback: pass plugin directly via `plugins` option |
| `ring-*` visual change (outline vs box-shadow) | Medium | Visual inspection; may need `@utility` shim if unacceptable |
| `space-x/y` specificity change causes layout shifts | Medium | Visual regression test Stack, ControlBar, ExpandableToolbar |
| SVG data URIs in `@theme` break under Lightning CSS | Low | Test `bg-subtle-grain` early (used in 20+ components) |
| Consumer migration coordination | Medium | Beta release, dual exports, migration guide |

---

## Effort Estimate

| Phase | Effort |
|---|---|
| Phase 0: Baseline | 1h |
| Phase 1: Dependencies & config | 30min |
| Phase 2: theme.css creation | 2h |
| Phase 3: index.css rewrite | 2h |
| Phase 4: Component renames | 1.5h |
| Phase 5: Consumer exports & docs | 2h |
| Phase 6: Verification | 3h |
| **Total** | **~12h** |

---

## Files Modified

| File | Change |
|---|---|
| `package.json` | Deps, version bump, new exports |
| `postcss.config.cjs` | Rewrite for `@tailwindcss/postcss` |
| `src/styles/theme.css` | **NEW** — full `@theme` block (replaces tailwind.config.js) |
| `src/styles/index.css` | Directive replacement, @utility conversion, cleanup |
| `.storybook/vite.config.ts` | **NEW** — Tailwind v4 Vite plugin |
| 6 component files | `bg-opacity-*` → `/opacity` modifier |
| 7+ component files | `placeholder-ink-*` → `placeholder:text-ink-*` |
| `tailwind.config.js` | Kept (deprecated) for consumer compat |
