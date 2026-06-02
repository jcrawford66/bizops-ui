# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server with HMR
npm run build    # type-check (tsc -b) then Vite production build → dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

No test runner is configured.

## Architecture

This is a **React 19 + TypeScript + Vite + Tailwind CSS** frontend for the BizOps business optimization platform. It pairs with the `bizops-api` NestJS backend.

**React Compiler is enabled** via `babel-plugin-react-compiler` (configured in `vite.config.ts`). Manual `useMemo`/`useCallback` are generally unnecessary.

**TypeScript config is split:**
- `tsconfig.app.json` — source files under `src/`
- `tsconfig.node.json` — Vite config and build tooling
- `tsconfig.json` — references both

**Routing:** React Router v6 with a single `<Layout>` wrapper route. All pages live under `src/pages/` and are registered in `src/App.tsx`.

**Global state:** `src/context/AppContext.tsx` holds alerts, the AI chat state, and sidebar collapse state. Consume via `useApp()`.

**Key libraries:** `recharts` for all data visualizations, `lucide-react` for icons, `date-fns` for date formatting.

## Source structure

```
src/
  App.tsx                   # Router + AppProvider root
  context/AppContext.tsx     # Global alerts, chat, sidebar state
  types/index.ts            # Shared TypeScript types for all domain objects
  components/
    layout/
      Layout.tsx            # Sidebar + Header + <Outlet> shell
      Sidebar.tsx           # Collapsible nav (slate-900 dark)
      Header.tsx            # Title, notification bell, chat toggle, avatar
      ChatBot.tsx           # Floating AI assistant panel
    ui/
      Card.tsx              # Card / CardHeader / CardBody
      StatCard.tsx          # KPI metric card with trend indicator
      Badge.tsx             # Status/tag pill (success/warning/error/info/purple)
      Button.tsx            # Primary/secondary/ghost/danger variants
      Modal.tsx             # Centered overlay modal
  pages/
    Dashboard.tsx           # Overview: KPIs, revenue chart, team efficiency, activity feed
    Revenue.tsx             # Revenue & margin trends, category breakdown, top drivers
    Expenses.tsx            # Invoice register, margin impact alerts, category chart
    Employees.tsx           # Efficiency table, radar chart, revenue attribution
    SocialMedia.tsx         # Platform post composer with auto-loaded format templates
    Inventory.tsx           # Stock register, low-stock alerts, manual add
    Customers.tsx           # Customer directory, profile modal, at-risk flags
    Calendar.tsx            # Monthly grid, event modals, upcoming sidebar
    Integrations.tsx        # 12 pre-built connectors + custom webhook builder
    Settings.tsx            # Business profile, notifications, security, team, webhooks
```

## Adding a new page

1. Create `src/pages/MyPage.tsx`
2. Add a `<Route>` in `src/App.tsx`
3. Add a nav entry in `src/components/layout/Sidebar.tsx` (`NAV` array)
4. Add the page title in `src/components/layout/Layout.tsx` (`PAGE_TITLES` map)

## Recharts Tooltip formatter typing

Recharts' `formatter` prop types `value` as `ValueType | undefined`. Cast to avoid TS errors:

```tsx
<Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} />
```
