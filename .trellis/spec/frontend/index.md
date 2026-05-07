# Frontend Development Guidelines

> Project-specific conventions for the Vue 3 frontend in this repository.

---

## Overview

The frontend is a Vue 3 + Vite + TypeScript app under `frontend/`. It uses Pinia setup stores, axios API modules, Vue Router route metadata, vue-i18n, Tailwind utility classes, and Vitest. These guideline files document the conventions already present in the repository so implementation and review agents keep matching the current app.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | `frontend/src` layout, feature placement, naming, entry points | Complete |
| [Component Guidelines](./component-guidelines.md) | Vue SFC structure, props/emits, Tailwind, dark mode, accessibility | Complete |
| [Hook Guidelines](./hook-guidelines.md) | Composition API composables, cancellation, typed reusable data loading | Complete |
| [State Management](./state-management.md) | Pinia setup stores, local state, server state, router state, persistence | Complete |
| [Quality Guidelines](./quality-guidelines.md) | Tooling, tests, i18n, responsive/dark-mode review checklist | Complete |
| [Type Safety](./type-safety.md) | Shared API/domain types, typed axios calls, runtime validation boundaries | Complete |

---

## Pre-Development Checklist

Before frontend changes, read the files relevant to the layer being touched:

- File placement, naming, or new screens/components: [Directory Structure](./directory-structure.md)
- Vue component props, emits, layout, styling, or accessibility: [Component Guidelines](./component-guidelines.md)
- Reusable Composition API logic or request lifecycle behavior: [Hook Guidelines](./hook-guidelines.md)
- Pinia, local state, route state, server state, or localStorage: [State Management](./state-management.md)
- API/domain types or TypeScript contracts: [Type Safety](./type-safety.md)
- Tests, lint/type-check/build, i18n, responsive behavior, or review gates: [Quality Guidelines](./quality-guidelines.md)

Use the project examples named in each guide, such as `frontend/src/api/client.ts`, `frontend/src/components/common/DataTable.vue`, `frontend/src/composables/useTableLoader.ts`, and `frontend/src/stores/auth.ts`, as the reference implementation style.

---

## Quality Check

For frontend review, verify changed code against the same relevant guide files above. Pay special attention to API envelope unwrapping, route auth metadata, i18n coverage, dark-mode/responsive classes, request cancellation, and shared type reuse.
