# Issue 1956 Context

## Source

- GitHub issue: https://github.com/Wei-Shaw/sub2api/issues/1956

## User-Visible Bug

When Linux.do login is enabled and global email verification is disabled, a new user using Linux.do OAuth is still asked to enter an email and complete local email verification. Direct email registration under the same global setting succeeds without verification.

## Additional Reports

- Another user reports the same behavior and identifies v0.1.115 as the likely regression point after an OIDC/OAuth login refactor.
- The same comment says newly authorized accounts also hit the issue, so the bug is not only caused by deleting and recreating a previously registered Linux.do account.
- Another user confirms downgrading to an older version avoids the issue.

## Local Code Findings

- `frontend/src/components/auth/PendingOAuthCreateAccountForm.vue` always renders the verification-code input and send-code button.
- `frontend/src/views/auth/LinuxDoCallbackView.vue` posts `verify_code: payload.verifyCode || undefined` to `/auth/oauth/pending/create-account`.
- `backend/internal/handler/auth_oauth_pending_flow.go` uses the shared `createPendingOAuthAccount` flow for Linux.do, OIDC, WeChat, and generic pending OAuth account creation.
- `backend/internal/service/auth_oauth_email_flow.go` currently makes `RegisterOAuthEmailAccount` call `VerifyOAuthEmailCode` unconditionally, independent of `email_verify_enabled`.
- Normal email registration in `backend/internal/service/auth_service.go` only checks verification code when `settingService.IsEmailVerifyEnabled(ctx)` is true.

## Implementation Direction

Align pending OAuth local account creation with normal email registration: require local email verification only when the global email verification setting is enabled. Keep send-code behavior guarded by the frontend UI and ensure backend account creation remains authoritative.

