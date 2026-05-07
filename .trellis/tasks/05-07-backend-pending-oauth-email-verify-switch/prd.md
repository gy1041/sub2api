# Backend Pending OAuth Email Verification Toggle

## Goal

Update backend pending OAuth account creation so it respects the global `email_verify_enabled` setting. Linux.do users should be able to complete OAuth signup without a user-supplied email or local verification code when email verification is disabled.

## Requirements

- `RegisterOAuthEmailAccount` must only verify `verifyCode` when `AuthService.IsEmailVerifyEnabled(ctx)` is true.
- Linux.do pending OAuth account creation with `email_verify_enabled=false` must accept an omitted/empty email and create the user with a backend-generated deterministic synthetic Linux.do email based on the pending identity/provider subject.
- The generated synthetic email must be internal-only; users still must not be allowed to submit reserved synthetic emails through local email registration or the normal OAuth email account path.
- Linux.do pending OAuth account creation with `email_verify_enabled=true` must keep requiring a user-supplied email and valid verification code.
- Do not remove the user-supplied email requirement for OIDC/WeChat pending account creation unless the existing verified-email provider path already handles those providers separately.
- If email verification is enabled, keep the existing missing-code, invalid-code, and email-service-unavailable behavior.
- If email verification is disabled, allow an empty `verifyCode` while still validating email format, reserved-email policy, registration-enabled state, invitation requirements, duplicate email, password hashing, signup source, token generation, and rollback.
- Keep the pending OAuth handler flow unchanged unless needed for tests or clearer error handling.
- Preserve existing-email transition behavior in `createPendingOAuthAccount`: existing local users should move to bind-login choice state before any verification requirement is evaluated.
- Add focused unit tests for no-code success when verification is disabled and code-required behavior when enabled.

## Acceptance Criteria

- [ ] A Linux.do pending OAuth create-account backend test succeeds with `email_verify_enabled=false`, no `email`, and no `verify_code`.
- [ ] The created user receives an internal synthetic Linux.do email and the pending Linux.do identity is bound.
- [ ] A pending OAuth create-account backend test fails with `EMAIL_VERIFY_REQUIRED` or existing equivalent when `email_verify_enabled=true` and no `verify_code`.
- [ ] User-submitted reserved Linux.do synthetic emails are still rejected.
- [ ] Existing tests for account binding, session consumption, rollback, invitation, and provider signup source continue to pass.
- [ ] Run targeted backend tests for auth OAuth pending/account creation.

## Technical Notes

- Likely service file: `backend/internal/service/auth_oauth_email_flow.go`.
- Likely handler tests: `backend/internal/handler/auth_oauth_pending_flow_test.go`.
- Related normal-registration behavior: `backend/internal/service/auth_service.go`.
- Research reference: `.trellis/tasks/05-07-fix-linuxdo-email-verification-disabled/research/issue-1956-context.md`.
