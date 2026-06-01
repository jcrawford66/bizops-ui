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

This is a **React 19 + TypeScript + Vite** frontend, intended as the UI for the `bizops-api` NestJS backend.

**React Compiler is enabled** via `babel-plugin-react-compiler` (configured in [vite.config.ts](vite.config.ts)). This means manual `useMemo`/`useCallback` are generally unnecessary — the compiler handles memoization automatically.

**TypeScript config is split:**
- `tsconfig.app.json` — source files under `src/`
- `tsconfig.node.json` — Vite config and build tooling
- `tsconfig.json` — references both

The app currently has a single entry point at [src/App.tsx](src/App.tsx). As features are added, create feature directories under `src/` and register routes or top-level components from `App.tsx`.
