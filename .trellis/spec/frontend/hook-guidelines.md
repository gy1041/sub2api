# Hook Guidelines

This Vue codebase uses Composition API composables under `frontend/src/composables`. Treat them as reusable stateful logic units, not UI components.

## Naming And Placement

Name composables `useX.ts` and export a `useX` function. Existing examples include `useTableLoader.ts`, `useClipboard.ts`, `useForm.ts`, `useModelWhitelist.ts`, and `useRoutePrefetch.ts`.

Put composable tests in `frontend/src/composables/__tests__` with matching names, for example `useTableLoader.spec.ts`, `usePersistedPageSize.spec.ts`, and `useOpenAIOAuth.spec.ts`.

If logic is domain-specific and only used by one component, keep it in that component until reuse is real. Promote it to a composable when multiple views/components need the same behavior.

## Structure

Use Vue refs/reactive/computed/watch lifecycle APIs directly. `useTableLoader.ts` is the reference for returning state plus action functions: `items`, `loading`, `params`, `pagination`, `load`, `reload`, and handlers.

Clean up timers, event listeners, and requests in `onUnmounted`. `useTableLoader.ts` aborts its active request on unmount; auth/navigation composables use the same cleanup mindset.

When a composable accepts a callback or fetcher, type the callback contract explicitly with generics or interfaces. `useTableLoader<T, P>` is the primary pattern for typed reusable data loading.

## Data Fetching

The project does not use Vue Query/SWR. Use axios API modules from `frontend/src/api` plus local composable state for loading, cancellation, pagination, and debounce.

Use `AbortController`/`FetchOptions` where repeated requests can race. `useTableLoader.ts` passes `{ signal }` into API calls and ignores cancellation errors.

Use `@vueuse/core` helpers when already appropriate. `useTableLoader.ts` uses `useDebounceFn`; avoid reimplementing generic debounce/throttle behavior.

## Persistence

Keep localStorage keys stable and centralized inside the store/composable that owns them. `frontend/src/stores/auth.ts` owns auth token keys; `usePersistedPageSize.ts` owns table page-size persistence.

Validate and normalize persisted values before using them. `auth.ts` parses pending auth session JSON defensively and clears invalid storage.

## Common Mistakes

Do not make composables mutate unrelated stores invisibly unless that is their documented purpose.

Do not leave request cancellation, intervals, resize observers, or media query listeners active after unmount.

Do not expose raw mutable internals when callers only need readonly data; follow the local store/composable pattern and return only what consumers need.
