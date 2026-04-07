# IOE Platform Development Guide

This document captures patterns, conventions, and lessons learned from building the IOE (Intelligent Operations Engine) platform — an AI-native Agent Harness for telecom operators. Use this as a reference when developing similar data-intensive dashboard/management platforms.

---

## Tech Stack & Architecture

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 with custom dark theme tokens (`@theme` block in index.css)
- **State**: Zustand (lightweight, no boilerplate)
- **Routing**: React Router v6 (`Routes`/`Route`)
- **Icons**: Lucide React (consistent, tree-shakable — never use emoji in UI)
- **Deployment**: GitHub Pages via `gh-pages` package
- **Build**: `cd web && npm run build` then `npx gh-pages -d dist`

## Design System Conventions

### Color Tokens (Dark Theme)
```
bg-primary: #0f172a    bg-secondary: #1e293b   bg-tertiary: #334155
accent-cyan: #06b6d4   accent-blue: #3b82f6    accent-purple: #8b5cf6
status-green: #22c55e  status-yellow: #eab308  status-red: #ef4444
text-primary: #f1f5f9  text-secondary: #94a3b8 text-muted: #64748b
border: #334155
```

### Card Style Pattern (Connected Systems style)
```tsx
<div className="rounded-xl border-2 p-4"
  style={{ borderColor: color + '50', backgroundColor: color + '06' }}>
```
- Tinted border: `color + '50'` (30% opacity hex)
- Tinted background: `color + '06'` (2.4% opacity hex)
- Hover: `hover:scale-[1.02] transition-all`

### List Item Pattern
```tsx
<div className="rounded-lg border text-[10px] font-medium"
  style={{ backgroundColor: color + '08', borderColor: color + '20', color }}>
  <Icon className="w-3 h-3 shrink-0" />
  {label}
</div>
```

### Page Header Pattern (with icon)
```tsx
<h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
  <PageIcon className="w-5 h-5 text-accent-cyan" />
  {t('Page Title', '页面标题')}
</h1>
```

### Animated Connection Line (RichFlow)
Protocol badge on top, animated width transition with glow, status text below. Uses `eventTick` state cycling on 3s interval.

## Bilingual (i18n) Pattern

Use the `useText()` hook with `t(en, zh)` for ALL user-visible text:
```tsx
const { t, isZh } = useText();
// Usage:
{t('English text', '中文文本')}
```

**Rules:**
- Never hardcode display strings — always wrap with `t()`
- Technical terms (RSRP, SINR, dBm, A2A-T) don't need translation
- Data constants with Chinese text need bilingual fields (`name`/`nameEn`, `label`/`labelZh`)

## Mobile Responsive Design

### Critical Lessons Learned

1. **Use `h-dvh` not `h-screen`** for the root container — `100vh` on mobile Safari includes the browser address bar height, hiding bottom content (input bars, footers). `h-dvh` (dynamic viewport height) adapts correctly.

2. **Breakpoint strategy**: `md:` (768px) = desktop threshold
   - Below `md:` = mobile layout (stacked, simplified)
   - `sm:` (640px) = intermediate step for grids

3. **Sidebar → Mobile Drawer**: Desktop sidebar becomes a fixed overlay drawer on mobile, triggered by hamburger button in Navbar. Store needs `mobileSidebarOpen` boolean state.

4. **Multi-panel layouts** (Chat 3-panel, Workflows canvas+panels):
   - Hide secondary panels on mobile: `hidden md:flex md:w-64`
   - Provide alternative access (dropdown selector in header for Chat conversations)
   - Touch-unfriendly features (drag-drop palette): hide on mobile

5. **Topology/diagram visualizations**: Use `shrink-0` with fixed pixel widths + `overflow-x-auto` wrapper with `min-w-[Npx]`. Never use `flex-1 min-w-0` for diagram boxes — they will compress to zero on narrow screens.

6. **Grid responsiveness pattern**:
   ```
   grid-cols-5 → grid-cols-2 sm:grid-cols-3 md:grid-cols-5
   grid-cols-2 (side-by-side) → grid-cols-1 md:grid-cols-2
   grid-cols-[1fr_280px] → grid-cols-1 md:grid-cols-[1fr_280px]
   ```

7. **Modals on mobile**: Change `w-[600px]` to `w-full max-w-[600px]`, add `px-4` to backdrop for edge spacing.

8. **Fixed-width sidebar panels** (w-44, w-64): Convert to horizontal scrollable tab bar on mobile using `overflow-x-auto` + `min-w-max`.

9. **ScenarioSwitcher / feature selectors**: Never hide critical navigation with `hidden sm:block` — users need these on all devices. Use compact layout instead.

10. **Native `<select>` for mobile**: When a desktop sidebar list becomes hidden, add a native `<select>` dropdown in the header visible only on mobile (`md:hidden`). Native select works perfectly on touch.

## Consistency Audit Checklist

Run this checklist before declaring a feature complete:

### Text & Icons
- [ ] All display strings wrapped in `t(en, zh)`
- [ ] No emoji anywhere — use Lucide React icons exclusively
- [ ] Page headers have icon + title matching Sidebar nav item
- [ ] Consistent font sizes: headers `text-lg`, section titles `text-sm`, body `text-xs`, tiny labels `text-[10px]`

### Interactions
- [ ] Every `<button>` has an `onClick` handler
- [ ] Every element with `cursor-pointer` or `hover:scale-*` has an `onClick`
- [ ] Every `useNavigate()` target is a valid route
- [ ] All tab/panel switching is wired and tested
- [ ] Placeholder buttons show "coming soon" feedback (not silent dead clicks)
- [ ] Help text matches actual behavior ("click any level" → ensure card is clickable)

### Responsive
- [ ] All grids have responsive breakpoints
- [ ] All fixed-width panels have mobile fallback (hidden/stacked/scrollable)
- [ ] Modals use `w-full max-w-[Npx]` pattern
- [ ] Root container uses `h-dvh` not `h-screen`
- [ ] Test on actual phone, not just browser resize

### Style Consistency
- [ ] Card style matches Connected Systems pattern (rounded-xl, tinted border/bg)
- [ ] Status colors are semantic (green=active, yellow=warning, red=error)
- [ ] Hover effects: `hover:border-accent-cyan/30` on cards, `hover:scale-[1.02]` on list items
- [ ] Animations: `transition-all` on interactive elements

## Architecture Patterns

### Data Layer
- Scenario-based data: `useScenario()` context provides scenario-specific data, falls back to defaults
- Type definitions in `data/` folder: agents.ts, chat.ts, knowledge.ts, etc.
- Each scenario overrides: dashboard KPIs, agent configs, conversations, knowledge entries

### Component Organization
```
src/
  components/     # Shared: Navbar, Sidebar, ScenarioSwitcher
  pages/          # Route pages: Dashboard, Chat, Agents, etc.
  data/           # Type defs + default data + scenario stories
  hooks/          # useText (i18n)
  context/        # ScenarioContext
  store/          # Zustand store (useStore)
```

### Sub-component Pattern (within page files)
Complex pages define sub-components in the same file:
```tsx
// Top of file: helper components
function SkillCard({ skill, selected, onClick }) { ... }
function AgentEditor({ agent, onClose }) { ... }
function DirectRoutingTopology({ agents, tick, ... }) { ... }

// Bottom: main page component
export default function Agents() { ... }
```

### Modal Pattern
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    onClick={onClose}>
    <div className="w-full max-w-[600px] bg-bg-card border border-border rounded-2xl shadow-2xl max-h-[80vh] overflow-auto"
      onClick={e => e.stopPropagation()}>
      {/* content */}
    </div>
  </div>
)}
```

## Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| SVG topology elements overlap on narrow screens | Use HTML/CSS card layout with `shrink-0` + fixed widths + `overflow-x-auto` |
| `100vh` cuts off bottom on mobile Safari | Use `h-dvh` (dynamic viewport height) |
| `flex-1 min-w-0` causes boxes to collapse | Use `shrink-0` with explicit width for diagram elements |
| Emoji renders inconsistently across platforms | Use Lucide React icons everywhere |
| Hardcoded Chinese text breaks EN mode | Always use `t(en, zh)` pattern |
| Hidden panels leave no mobile access | Add native `<select>` or compact toggle |
| `grid-cols-6` unusable on 375px screen | Add breakpoints: `grid-cols-2 sm:grid-cols-3 md:grid-cols-6` |
| Button looks clickable but does nothing | Every interactive-looking element must have onClick |
| Modal overflows mobile screen | Use `w-full max-w-[Npx]` + backdrop `px-4` |

## Build & Deploy Workflow

```bash
# Development
cd web && npm run dev

# Type check
cd web && npx tsc -b --noEmit

# Build (always run from web/ directory, not root)
cd web && npm run build

# Deploy to GitHub Pages
cd web && npx gh-pages -d dist

# Full cycle
cd web && npm run build && npx gh-pages -d dist
```

**Important**: The root `npm run build` compiles backend TypeScript (Node.js agents), NOT the web frontend. Always `cd web` first.
