# Directory Structure

The frontend is a Vue 3 + Vite + TypeScript app under `frontend/`. Organize additions by existing surface area and reuse shared components/composables before adding new local utilities.

## Layout

```text
frontend/src/
├── api/                 # axios client and endpoint modules
│   └── admin/           # admin-only API modules
├── assets/              # static assets and provider icons
├── components/          # reusable UI components by domain
│   ├── common/          # generic UI primitives
│   ├── layout/          # app/auth/table layouts
│   ├── account/         # account management components
│   ├── payment/         # payment/subscription components
│   └── user/            # user dashboard/profile components
├── composables/         # reusable Composition API logic
├── constants/           # shared constants
├── i18n/                # vue-i18n setup and locales
├── router/              # route definitions, guards, title helpers
├── stores/              # Pinia setup stores
├── styles/              # extra CSS modules/files
├── types/               # shared TypeScript types
├── utils/               # pure helpers
└── views/               # route-level screens by audience
```

Examples: `frontend/src/api/client.ts` owns axios configuration, `frontend/src/router/index.ts` owns route registration and guards, `frontend/src/stores/auth.ts` owns auth state, and `frontend/src/components/common/DataTable.vue` is the reusable table component.

## Feature Organization

Put route-level screens in `views/<area>/`, reusable domain widgets in `components/<domain>/`, API calls in `api/` or `api/admin/`, and cross-screen state in `stores/`. For example, user dashboard screens live in `frontend/src/views/user`, while dashboard cards/charts live in `frontend/src/components/user/dashboard`.

If a behavior is reusable across screens, place it in `frontend/src/composables` with tests under `frontend/src/composables/__tests__`. Existing examples include `useTableLoader.ts`, `usePersistedPageSize.ts`, and `useRoutePrefetch.ts`.

Keep shared primitive UI in `frontend/src/components/common` and export it from that directory's `index.ts` when it is intended for broad reuse.

## Naming Conventions

Vue components use PascalCase filenames such as `DataTable.vue`, `LoginAgreementPrompt.vue`, and `PaymentProviderDialog.vue`.

Composables use `useX.ts`, stores use descriptive lowercase names such as `auth.ts` and `adminSettings.ts`, and API endpoint modules use lower camel or plural domain names such as `users.ts`, `apiKeys.ts`, and `channelMonitor.ts`.

Tests sit next to their area in `__tests__` folders and use `.spec.ts`, matching `frontend/src/router/__tests__/guards.spec.ts` and `frontend/src/composables/__tests__/useTableLoader.spec.ts`.

## Entry Points

`frontend/src/main.ts` initializes theme, Pinia, injected config, i18n, router readiness, and then mounts the app. Do not duplicate bootstrap logic in views.

`frontend/src/App.vue` should stay thin; layout and page structure belong in layout components and views.
