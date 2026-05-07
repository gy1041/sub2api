# Type Safety

The frontend is TypeScript-first, but it tolerates pragmatic `any` in boundary-heavy areas. Preserve existing type contracts and improve local precision where changes touch code.

## Shared Types

Put API/domain types used across modules in `frontend/src/types/index.ts`. Existing examples include `User`, `AdminUser`, `BasePaginationResponse<T>`, `FetchOptions`, auth request/response types, and dashboard/usage types.

API modules may define request/response interfaces locally when they are admin-endpoint-specific, as in `frontend/src/api/admin/users.ts` with `AdminBindAuthIdentityRequest`.

Component-only types belong near the component or in the component directory's `types.ts`. `frontend/src/components/common/types.ts` defines reusable common component types such as table columns.

## API Contracts

Use typed axios calls: `apiClient.get<Type>(...)`, `post<Type>(...)`, and return `data` with the declared type. `frontend/src/api/admin/users.ts` is the reference pattern.

Remember that `apiClient` unwraps the standard backend envelope. API functions should type the payload after unwrapping, not the outer `{ code, message, data }` response, unless they intentionally call raw axios.

Keep frontend field names aligned with backend JSON, which is mostly snake_case for API payloads (`page_size`, `allowed_groups`, `last_active_at`, `token_expires_at`).

## Runtime Validation

There is no Zod/Yup runtime validation layer. Validate untrusted persisted browser data manually before using it. `frontend/src/stores/auth.ts` checks pending auth session fields and removes invalid localStorage values.

For backend responses, rely on typed API modules and defensive fallback defaults in views/composables. `useTableLoader.ts` defaults missing `items`, `total`, and `pages`.

## Generics And Utility Types

Use generics for reusable infrastructure. `useTableLoader<T, P>` and `BasePaginationResponse<T>` are the reference patterns for typed table data loading.

Use union types for constrained modes and statuses. Existing examples include user roles/statuses in `frontend/src/types/index.ts`, route auth metadata, and `sort_order?: 'asc' | 'desc'` in API filters.

## Pragmatic Any

The ESLint config allows `any`, and existing shared components use it where data is intentionally generic, such as `DataTable.vue` row values and `SelectOption` extra properties. Keep `any` at generic boundaries; avoid spreading it into feature-specific business logic.

Use `unknown` for external metadata where the shape is not known, as in auth identity metadata types. Narrow before reading fields.

## Common Mistakes

Do not duplicate incompatible versions of the same API type in several modules. Extend or import from `frontend/src/types` when the type is shared.

Do not assume localStorage JSON is valid. Always parse with try/catch.

Do not use camelCase in frontend API payload fields when the backend expects snake_case.

## Scenario: Daily Check-in Reward UI Contract

### 1. Scope / Trigger

- Trigger: profile-page reward claim UI backed by admin-configured settings and current-user APIs.
- Reason: this spans `frontend/src/api/user.ts`, admin settings types, profile components, i18n, and backend snake_case contracts.

### 2. Signatures

- API functions:
  - `getDailyCheckinStatus(): Promise<DailyCheckinStatus>`
  - `claimDailyCheckin(): Promise<DailyCheckinClaimResult>`
- Admin settings fields:
  - `daily_checkin_enabled?: boolean`
  - `daily_checkin_min_reward?: number`
  - `daily_checkin_max_reward?: number`

### 3. Contracts

- `DailyCheckinStatus` fields:
  - `enabled`
  - `claimed_today`
  - `reward?: number | null`
  - `balance`
  - `min_reward`
  - `max_reward`
  - `checkin_date`
  - `claimed_at?: string | null`
- `DailyCheckinClaimResult` extends status with `already_claimed`.
- Profile UI must disable the claim button when `!enabled`, already claimed, or request is in flight.
- Successful first claim should refresh the auth user so other balance displays update.
- Settings UI must validate finite non-negative rewards and `max >= min` before calling `updateSettings`.

### 4. Validation & Error Matrix

- Status load fails -> show the API error message or `profile.dailyCheckin.loadFailed`.
- Claim fails -> show the API error message or `profile.dailyCheckin.claimFailed`.
- Non-finite or negative admin reward input -> show `admin.settings.dailyCheckin.rewardRangeError`.
- `max < min` -> show `admin.settings.dailyCheckin.maxRewardError`.

### 5. Good/Base/Bad Cases

- Good: enabled, unclaimed status renders actionable card; POST returns reward and updated balance; success toast includes formatted reward.
- Base: disabled status renders unavailable card and never calls claim API.
- Bad: settings save silently coerces invalid reward strings to `0` and overwrites valid backend settings.

### 6. Tests Required

- API module tests assert GET/POST endpoints and typed return payloads.
- Profile card tests cover disabled, claim success, auth refresh, and load failure.
- Profile view tests assert the card is mounted in the profile shell.
- Settings view tests cover round-trip save payload and invalid range blocking.

### 7. Wrong vs Correct

#### Wrong

```ts
daily_checkin_min_reward: Number(form.daily_checkin_min_reward) || 0
```

This converts invalid input to zero and can accidentally change production settings.

#### Correct

```ts
const minReward = Number(form.daily_checkin_min_reward)
if (!Number.isFinite(minReward) || minReward < 0) {
  appStore.showError(t('admin.settings.dailyCheckin.rewardRangeError'))
  return
}
```
