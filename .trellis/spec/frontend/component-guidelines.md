# Component Guidelines

Components use Vue 3 single-file components with `<script setup lang="ts">`, Composition API primitives, Tailwind utility classes, and explicit props/emits where useful.

## Component Structure

Follow the common order used by `frontend/src/components/common/DataTable.vue`: template first, then `<script setup lang="ts">`, then scoped or global styles only when utilities are insufficient.

Use `defineProps`, `withDefaults`, and `defineEmits` for component contracts. Keep interfaces close to the component when they are local; move shared contracts to `frontend/src/components/common/types.ts` or `frontend/src/types` when reused.

For route views, compose smaller domain components instead of putting all UI and logic in one file. `frontend/src/views/user/DashboardView.vue` delegates stats, charts, recent usage, and quick actions to `frontend/src/components/user/dashboard/*`.

## Props And Emits

Type props explicitly. Use `withDefaults` for optional booleans and default modes, as `DataTable.vue` does for `loading`, sticky columns, sort behavior, and virtualizer options.

Use typed emits for events. `DataTable.vue` emits `sort: [key: string, order: 'asc' | 'desc']`; follow that tuple style for new emitted events.

Prefer `v-model:propName` for two-way parent/child state when the existing component API uses it, such as dashboard chart controls in `DashboardView.vue`.

## Styling

Use Tailwind utility classes as the default styling mechanism. The app uses `frontend/src/style.css` and `frontend/src/styles` for global styles and specialized shared CSS.

Maintain dark-mode classes alongside light-mode classes for shared components. Existing common components include paired classes like `dark:bg-dark-900`, `dark:border-dark-700`, and `dark:text-gray-100`.

For responsive behavior, follow existing patterns: common tables render mobile cards below `768px` and desktop tables above it in `DataTable.vue`.

## Accessibility And UX

Use semantic elements and ARIA only where needed. Preserve table semantics for tabular data, button elements for actions, and meaningful labels for empty/loading states.

Keep loading and empty states explicit. Shared components like `LoadingSpinner`, `Skeleton`, `EmptyState`, and the empty slot in `DataTable.vue` are already available.

Use i18n text for user-facing strings when the surrounding component is localized. Existing components call `useI18n()` and `t(...)`, and route metadata uses `titleKey`/`descriptionKey` in `frontend/src/router/index.ts`.

## Common Mistakes

Do not create one-off table, modal, select, input, or toast implementations when a common component exists under `frontend/src/components/common`.

Do not put API calls directly into deeply nested presentational components if the parent view or a composable already owns loading/retry/filter state.

Do not rely on desktop-only layouts. Components in admin/user areas should preserve the existing mobile card or responsive grid behavior.
