# Database Guidelines

The backend uses PostgreSQL, Ent-generated models, raw SQL for complex cases, and embedded SQL migrations. Keep schema changes explicit and append-only.

## ORM And Query Patterns

Use Ent for normal CRUD and type-safe predicates. Existing repositories import Ent packages with `db...` aliases, for example `dbent`, `dbaccount`, `dbgroup`, and `dbpredicate` in `backend/internal/repository/account_repo.go`.

Use raw SQL through repository-owned executors when Ent would make the query unclear or inefficient. This is already used for aggregation, dashboard, ops, cache, and bulk paths such as `backend/internal/repository/ops_repo_dashboard.go`, `backend/internal/repository/dashboard_aggregation_repo.go`, and `backend/internal/repository/account_repo.go`.

All database calls should accept and pass `context.Context`. Prefer `QueryRowContext`, `ExecContext`, and Ent methods with `ctx`; this matches `backend/internal/repository/migrations_runner.go` and repository methods like `GetByID(ctx, id)`.

## Transactions And Side Effects

Keep persistence changes and their cache/outbox side effects together in the repository when the repository already owns that aggregate. For example, `accountRepository.Create` writes the account and then enqueues scheduler outbox work in `backend/internal/repository/account_repo.go`.

Do not hide network calls or HTTP behavior in repositories. Repositories may call storage/database/cache adapters, but upstream API calls belong in services or explicit integration packages.

## Migrations

Create a new numbered `.sql` file under `backend/migrations/` for every schema change. Existing names use zero-padded numeric prefixes and descriptive suffixes such as `092_payment_orders.sql`, `097_fix_settings_updated_at_default.sql`, and `120_enforce_payment_orders_out_trade_no_unique_notx.sql`.

Never edit an already-applied migration unless you are deliberately handling a documented historical checksum compatibility case. `backend/internal/repository/migrations_runner.go` records SHA-256 checksums in `schema_migrations` and fails startup on unexpected changes.

Use the `_notx.sql` suffix only for migrations that must run outside a transaction, especially PostgreSQL `CREATE INDEX CONCURRENTLY` or similar operations. The runner treats files ending in `_notx.sql` specially.

## Naming And Schema Shape

Database JSON exposed through APIs uses snake_case fields to match backend response structs and frontend types, for example `page_size`, `allowed_groups`, and `last_active_at` in `backend/internal/pkg/response/response.go` and `frontend/src/types/index.ts`.

Prefer explicit indexes for high-volume usage, scheduler, ops, and search paths. Existing examples include usage log index migrations under `backend/migrations/076_add_usage_log_upstream_model_index_notx.sql`, `078_add_usage_log_requested_model_index_notx.sql`, and `065_add_search_trgm_indexes.sql`.

## Common Mistakes

Do not mutate migration history to “fix” a deployed database. Add a follow-up migration.

Do not bypass the repository error translation layer with raw database errors at handler boundaries. Translate persistence failures to service/application errors before returning them upward.

Do not build SQL by concatenating untrusted input. Use placeholders and parameter binding as repository methods do across `backend/internal/repository`.

## Scenario: Daily Balance Reward Claims

### 1. Scope / Trigger

- Trigger: features that credit user balance once per calendar period, such as daily check-in rewards.
- Reason: these features cross API, settings, database uniqueness, balance cache invalidation, and frontend display contracts.

### 2. Signatures

- Settings keys:
  - `daily_checkin_enabled`
  - `daily_checkin_min_reward`
  - `daily_checkin_max_reward`
- User APIs:
  - `GET /api/v1/user/daily-checkin`
  - `POST /api/v1/user/daily-checkin`
- DB table shape:
  - `daily_checkins(user_id, checkin_date, reward, balance_after, claimed_at)`
  - unique constraint on `(user_id, checkin_date)`

### 3. Contracts

- Status response fields use snake_case:
  - `enabled: boolean`
  - `claimed_today: boolean`
  - `reward?: number`
  - `balance: number`
  - `min_reward: number`
  - `max_reward: number`
  - `checkin_date: YYYY-MM-DD`
  - `claimed_at?: timestamp`
- Claim response includes all status fields plus `already_claimed: boolean`.
- Successful claims add the reward to `users.balance`, update `users.total_recharged`, persist a claim row, and invalidate user balance/auth caches.
- Already-claimed status must return the user's current balance, not the historical `balance_after` from the claim row.

### 4. Validation & Error Matrix

- Feature disabled -> `DAILY_CHECKIN_DISABLED` forbidden error.
- Same user/date duplicate -> no second balance credit; return HTTP 200 with an already-claimed result, not a `DAILY_CHECKIN_CLAIMED` conflict.
- Missing user during claim -> `USER_NOT_FOUND`.
- Negative settings values -> reject at admin settings boundary.
- `max_reward < min_reward` -> reject at admin settings boundary; service-side parsing should still clamp defensively if persisted settings drift.

### 5. Good/Base/Bad Cases

- Good: `min=1`, `max=3`, enabled; first claim creates one row and credits one random rounded reward.
- Base: disabled or zero reward range; status is readable, claim is blocked when disabled.
- Bad: two concurrent POSTs for the same user/day both credit balance. The unique `(user_id, checkin_date)` constraint and single SQL transaction must prevent this.

### 6. Tests Required

- Unit tests with `-tags unit` for disabled, reward range, duplicate claim, and current-balance status.
- Repository or integration coverage for unique user/day persistence when feasible.
- Handler/API tests should assert the response envelope unwraps to the fields above.

### 7. Wrong vs Correct

#### Wrong

Return `daily_checkins.balance_after` from the status endpoint after the user has later spent or recharged balance.

#### Correct

Use the claim row only for reward/date/claimed metadata; load the current user row for the displayed `balance`.
