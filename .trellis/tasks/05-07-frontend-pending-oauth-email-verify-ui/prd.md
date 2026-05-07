# Frontend Pending OAuth Email Verification UI

## Goal

Make the pending OAuth create-account form match public email verification settings. For Linux.do, when email verification is disabled, the form should not ask users for an email, password, verification code, or show the send-code action.

## Requirements

- Read `email_verify_enabled` from `getPublicSettings()` in `PendingOAuthCreateAccountForm.vue`.
- The form must know which pending OAuth provider is being completed, at least enough to apply Linux.do-only no-email behavior.
- For Linux.do with `email_verify_enabled=false`, hide email input, password input, verification-code input, send-code button, Turnstile, and verification hint/success message.
- For Linux.do with `email_verify_enabled=false`, submit account creation without `email`, `password`, or `verifyCode` values.
- For non-Linux.do providers, do not remove email/password requirements unless existing provider-specific verified-email UI already bypasses this component.
- When `email_verify_enabled=true`, keep current verification-code UI and send-code behavior.
- Do not change invitation-code UI behavior except where tests need settings fixtures to include both flags.
- Keep existing Turnstile behavior for send-code flow when verification is enabled.
- Update Vitest coverage for both enabled and disabled email-verification states.

## Acceptance Criteria

- [ ] Component test verifies Linux.do email/password/verification controls are absent when public settings have `email_verify_enabled=false`.
- [ ] Component test verifies Linux.do submit payload omits `email`, `password`, and `verifyCode` when verification is disabled.
- [ ] Component test verifies controls remain available and send-code API is called when `email_verify_enabled=true`.
- [ ] Existing callback view behavior continues to work with omitted `verifyCode`.

## Technical Notes

- Likely component: `frontend/src/components/auth/PendingOAuthCreateAccountForm.vue`.
- Likely tests: `frontend/src/components/auth/__tests__/PendingOAuthCreateAccountForm.spec.ts`.
- Callback submitters already use `payload.verifyCode || undefined`, so they should naturally omit the field when the form emits an empty value.
- Research reference: `.trellis/tasks/05-07-fix-linuxdo-email-verification-disabled/research/issue-1956-context.md`.
