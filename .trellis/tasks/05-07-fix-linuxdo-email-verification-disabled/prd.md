# Fix Linux.do OAuth Email Verification Toggle

## Goal

Fix issue #1956: when global email verification is disabled, users completing Linux.do OAuth signup must not be forced through local email verification or a user-supplied email binding step. The Linux.do OAuth account-creation flow should allow a Linux.do-only account when local email verification is disabled, while preserving invitation, existing-account, provider-binding, Turnstile, and pending-session safeguards.

## What I Already Know

- Issue: https://github.com/Wei-Shaw/sub2api/issues/1956
- Reporter states Linux.do login is enabled and email verification is disabled, but new Linux.do OAuth users are still asked to fill and verify email.
- Follow-up clarification: at `/auth/linuxdo/callback`, clicking "create new account" still asks for an email even after verification controls are hidden. Because any arbitrary email can pass when email verification is disabled, Linux.do signup should not require the user to bind or enter an email in that mode.
- Plain email registration in the same configuration succeeds without verification.
- A commenter reports the regression started after the v0.1.115 OIDC/OAuth login refactor; v0.1.114 behaved correctly.
- A commenter reports newly authorized accounts also hit this problem, so it is not limited to deleted/recreated Linux.do users.
- Current frontend `PendingOAuthCreateAccountForm.vue` always renders a verification code field and send-code button.
- Current backend pending OAuth create-account path calls `RegisterOAuthEmailAccount`, which currently verifies a local email code unconditionally.

## Scope

This parent task coordinates two implementation subtasks:

- `05-07-backend-pending-oauth-email-verify-switch`: backend rules for pending OAuth account creation.
- `05-07-frontend-pending-oauth-email-verify-ui`: frontend pending OAuth account-creation UI behavior.

## Requirements

- When `email_verify_enabled=false`, Linux.do pending OAuth account creation must allow account creation without `email` and without `verify_code`.
- In that no-email Linux.do path, backend should create the local user with an internal deterministic synthetic email derived from the pending Linux.do identity/provider subject, then bind the Linux.do identity as the login method.
- The no-email account creation path should be Linux.do-specific unless implementation research proves another provider has equivalent verified identity semantics and product requirements.
- When `email_verify_enabled=true`, Linux.do pending OAuth account creation must still require a valid local email verification code.
- When `email_verify_enabled=true`, Linux.do pending OAuth account creation should continue to require user-supplied email, password, and verification code as before.
- Shared pending OAuth email account creation should continue to support providers that need a user-supplied local email; do not remove email requirements for OIDC/WeChat unless already covered by existing verified-email provider flow.
- Existing-email behavior must remain unchanged: if the submitted email already belongs to an account, return/transition to the bind-login choice state instead of creating a duplicate account.
- Invitation-code behavior must remain unchanged: if invitation-only registration is enabled, new pending OAuth account creation must still require and consume a valid invitation code.
- Reserved synthetic emails such as `@linuxdo-connect.invalid` must remain blocked for user-submitted local account creation, but backend-owned Linux.do synthetic emails may be generated internally for this OAuth-only path.
- Pending OAuth browser/session binding, provider mismatch checks, identity binding, adoption decisions, session consumption, rollback, and provider default grants must remain intact.
- Frontend Linux.do account creation should not show or require email, password, verification-code, send-code, or Turnstile controls when public settings say email verification is disabled.
- Frontend should continue to show and use verification-code controls when email verification is enabled.

## Acceptance Criteria

- [ ] Backend tests cover Linux.do pending OAuth create-account with `email_verify_enabled=false`, no `email`, and no `verify_code`, producing tokens, creating an internally synthetic local email, and binding the pending identity.
- [ ] Backend tests cover `email_verify_enabled=true` with missing/invalid `verify_code`, preserving the existing error behavior.
- [ ] Backend tests cover user-submitted reserved synthetic email remains rejected on the local email account path.
- [ ] Backend tests or existing coverage confirm existing-email transition still wins before account creation.
- [ ] Frontend tests cover Linux.do hidden email/password/verification controls and omitted `email`/`verifyCode` when `email_verify_enabled=false`.
- [ ] Frontend tests cover visible verification controls and send-code behavior when `email_verify_enabled=true`.
- [ ] Relevant backend and frontend unit tests pass.

## Out Of Scope

- Changing Linux.do provider configuration or OAuth protocol behavior.
- Changing the invitation-code product behavior.
- Migrating legacy users or repairing existing database rows.
- Removing email requirements from non-Linux.do OAuth providers that still need local email collection.
- Posting to or closing the GitHub issue.

## Technical Notes

- Backend likely files: `backend/internal/service/auth_oauth_email_flow.go`, `backend/internal/handler/auth_oauth_pending_flow.go`, `backend/internal/handler/auth_oauth_pending_flow_test.go`, `backend/internal/service/auth_oauth_email_flow_test.go`.
- Frontend likely files: `frontend/src/components/auth/PendingOAuthCreateAccountForm.vue`, `frontend/src/components/auth/__tests__/PendingOAuthCreateAccountForm.spec.ts`, `frontend/src/views/auth/LinuxDoCallbackView.vue`.
- Research summary is persisted at `research/issue-1956-context.md`.
