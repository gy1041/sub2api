# Frontend Quality Guidelines

Frontend changes should keep Vue 3 setup components, Pinia state, axios API modules, i18n, dark mode, and responsive behavior consistent with the current app.

## Tooling

Use the scripts in `frontend/package.json`: `npm run lint:check`, `npm run typecheck`, `npm run test:run`, and `npm run build` as appropriate for the change. The lint script with `--fix` exists, but use check mode when only verifying.

The project uses ESLint with `vue-eslint-parser`, `@typescript-eslint`, and Vue 3 essential rules. Some rules are intentionally relaxed, including explicit `any`, multi-word component names, and selected Vue structural rules.

Vitest tests live under `__tests__` folders across api, components, composables, router, stores, utils, and views.

## Required Patterns

Use API modules rather than calling axios directly from components. `frontend/src/api/client.ts` centralizes base URL, credentials, auth headers, locale, timezone, response unwrapping, token refresh, and auth failure behavior.

Use Pinia stores for cross-route state and composables for reusable local behavior. Keep one-off view state local.

Use i18n for user-facing strings where the surrounding view/component is already localized. Route metadata supports `titleKey` and `descriptionKey` in `frontend/src/router/index.ts`.

Preserve dark-mode and responsive classes when editing shared components. Common components should work in both light/dark themes and mobile/desktop layouts.

## Testing Expectations

For API client/interceptor changes, add or update tests under `frontend/src/api/__tests__`.

For composables, test state transitions, cancellation, persistence, and edge cases under `frontend/src/composables/__tests__`.

For router/auth behavior, update `frontend/src/router/__tests__`. For shared components, use `frontend/src/components/**/__tests__`.

For pure utility behavior, prefer small Vitest tests next to `frontend/src/utils`.

## Avoid

Do not add a second HTTP client or custom fetch wrapper. Extend `apiClient` or API modules.

Do not bypass the standard backend envelope handling in normal API modules.

Do not add hard-coded English/Chinese strings to localized views without updating locale files.

Do not create new primitives that duplicate `frontend/src/components/common` components such as `DataTable`, `BaseDialog`, `ConfirmDialog`, `Input`, `Select`, `Toast`, `Pagination`, or `LoadingSpinner`.

## Review Checklist

Check that new screens have loading, empty, and error states.

Check that admin-only pages are protected by route metadata and backend authorization.

Check that forms handle disabled/loading states and do not submit twice accidentally.

Check that table/list pages preserve pagination, cancellation, sorting, and page-size persistence patterns when applicable.
