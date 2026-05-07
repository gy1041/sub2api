# State Management

The frontend uses Pinia setup stores for cross-route state, component/composable refs for local state, and axios API modules for server state.

## Global State

Use Pinia stores under `frontend/src/stores` for app-wide concerns: auth/session (`auth.ts`), injected app settings (`app.ts`), admin settings, onboarding, and other cross-route state.

Stores use the setup-store style with `defineStore`, `ref`, `computed`, and action functions. `frontend/src/stores/auth.ts` is the reference: it owns auth tokens, current user, token refresh timers, pending auth sessions, and derived `isAuthenticated`/`isAdmin` state.

Do not put route-local table filters or modal state in Pinia unless multiple routes need it.

## Local State

Use component-local `ref`, `reactive`, and `computed` for view state. `frontend/src/views/user/DashboardView.vue` keeps dashboard date range, loading flags, and chart data local because they are page-specific.

Use composables for reusable local state patterns. `frontend/src/composables/useTableLoader.ts` owns table pagination, filters, loading, request cancellation, and debounced reloads.

## Server State

Server data is fetched through modules in `frontend/src/api`. API functions return unwrapped data because `frontend/src/api/client.ts` converts the backend `{ code, message, data }` envelope into `response.data`.

Avoid duplicating long-lived server data in multiple stores. If several views need the same durable data, create or extend a store; if only one screen needs it, keep it local to that screen/composable.

## URL And Router State

Routes are defined in `frontend/src/router/index.ts` with lazy-loaded views and route metadata for auth, admin access, titles, and descriptions. Put route guard behavior in router helpers/composables rather than inside individual views.

Use route params/query for shareable navigation state only when the URL should encode it. Most table page size and sort preferences are persisted locally instead, as in `DataTable.vue` and `usePersistedPageSize.ts`.

## Persistence

Auth persistence belongs to `frontend/src/stores/auth.ts` and localStorage keys there. App/theme bootstrapping belongs to `frontend/src/main.ts` and app store initialization.

When reading localStorage, parse defensively and clear invalid state. The auth store's pending session parsing is the model to follow.

## Common Mistakes

Do not bypass stores by reading/writing auth tokens in random components. API interceptors and auth store own that behavior.

Do not use global state for ephemeral UI state like one modal's open flag, a single form's fields, or a one-page loading flag.

Do not cache server responses without an invalidation plan. This codebase currently uses explicit reloads rather than a query cache library.
