# Backend Quality Guidelines

Backend changes should preserve the existing Go layering, error envelope, migration immutability, and test style.

## Required Patterns

Run `gofmt` on changed Go files. Keep imports grouped by standard library, third-party packages, and project packages as existing files do.

Keep handlers thin and services/repositories testable. Constructors should accept dependencies and return interfaces where the service layer already defines them, as in `backend/internal/repository/account_repo.go`.

Use context-aware database and HTTP operations. Respect cancellation in repositories, migrations, upstream calls, and long-running handlers.

Use existing helper packages before adding new ones: response helpers in `backend/internal/pkg/response`, logging in `backend/internal/pkg/logger`, pagination in `backend/internal/pkg/pagination`, HTTP utilities under `backend/internal/pkg/httputil` and `backend/internal/util/httputil`.

## Testing Expectations

Add or update focused tests next to changed code. The project already has dense unit coverage under `backend/internal/handler`, `backend/internal/repository`, `backend/internal/service`, `backend/internal/payment`, and route tests under `backend/internal/server/routes`.

Use repository integration test patterns when database behavior or migrations change. Examples include `backend/internal/repository/migrations_runner_checksum_test.go`, `backend/internal/repository/account_repo_integration_test.go`, and `backend/internal/repository/ops_repo_system_logs_test.go`.

For API behavior, prefer handler or route tests that verify status codes and response bodies. Existing examples include `backend/internal/handler/admin/payment_handler.go` tests and `backend/internal/server/routes/gateway_test.go`.

### Scenario: Pending OAuth Account Creation Email Fields

#### 1. Scope / Trigger

- Trigger: `POST /api/v1/auth/oauth/pending/create-account` is shared by Linux.do, OIDC, and WeChat pending OAuth signup flows.
- The request contract is provider- and setting-dependent, so Gin binding tags must not make `email` or `password` unconditionally required on the shared DTO.

#### 2. Signatures

- Handler DTO: `createPendingOAuthAccountRequest`
- Fields: `email`, `password`, `verify_code`, `invitation_code`, `aff_code`, `adopt_display_name`, `adopt_avatar`
- Backend service paths:
  - User-entered local email: `AuthService.RegisterOAuthEmailAccount`
  - Backend-owned synthetic OAuth email: `AuthService.RegisterOAuthSyntheticEmailAccount`

#### 3. Contracts

- Linux.do with `email_verify_enabled=false` and omitted `email`: create a Linux.do-only account with deterministic backend-owned `linuxdo-<provider_subject>@linuxdo-connect.invalid`.
- Linux.do with `email_verify_enabled=true`: require user-entered `email`, `password`, and valid `verify_code`.
- OIDC/WeChat pending local account creation: keep requiring user-entered local `email` and `password`; verification follows the global email verification setting.
- User-submitted reserved synthetic domains (`@linuxdo-connect.invalid`, `@oidc-connect.invalid`, `@wechat-connect.invalid`) stay rejected on local email paths.

#### 4. Validation & Error Matrix

- Missing local `email` when local credentials are required -> `EMAIL_VERIFY_REQUIRED`
- Invalid local `email` -> `EMAIL_VERIFY_REQUIRED`
- Missing or short local `password` -> `PASSWORD_REQUIRED`
- Reserved synthetic email submitted by user -> `EMAIL_RESERVED`
- Existing submitted email -> pending choice/bind-login state, not duplicate account creation
- Missing/invalid `verify_code` while `email_verify_enabled=true` -> email verification error

#### 5. Good/Base/Bad Cases

- Good: Linux.do no-email signup with email verification disabled creates a synthetic local email and binds the OAuth identity.
- Base: OIDC/WeChat create-account with local email and password follows the normal email registration gates.
- Bad: Adding `binding:"required"` to shared `email` or `password` breaks Linux.do no-email signup before service validation can choose the correct path.

#### 6. Tests Required

- Handler test for Linux.do no-email account creation when email verification is disabled; assert token response, synthetic email user, identity binding, and consumed pending session.
- Handler or service tests for missing/invalid verification code when email verification is enabled.
- Service test that user-submitted reserved synthetic email remains rejected.
- Existing-email transition test asserting choice/bind-login response still wins before account creation.

#### 7. Wrong vs Correct

Wrong:

```go
type createPendingOAuthAccountRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}
```

Correct:

```go
type createPendingOAuthAccountRequest struct {
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`
}
```

Then validate inside the handler after loading the pending session and provider so provider-specific rules can run.

## Avoid

Do not place business logic in route registration. Route files should wire groups and handlers only.

Do not invent a second API response shape. The frontend relies on the `code/message/data/reason/metadata` envelope.

Do not change applied migrations; add a new migration.

Do not add global mutable state unless the package already owns runtime configuration and uses synchronization/atomics, as `backend/internal/pkg/logger` does.

## Review Checklist

Check whether the change crosses handler, service, repository, migration, and frontend API types. If it does, verify the data shape at every boundary.

Check errors for safe client messages, wrapped causes, and redacted logging.

Check hot paths for unnecessary allocations, blocking calls, or noisy logs, especially gateway streaming, scheduler, usage, and ops monitoring code.

Check that tests cover both success and expected failure cases for auth, payment, billing, and admin actions.
