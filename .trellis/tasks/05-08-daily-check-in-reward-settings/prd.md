# daily check-in reward settings

## Goal

Add a daily check-in reward feature so signed-in users can claim a once-per-day balance reward from the profile page. Administrators can enable or disable the feature from system settings and configure the minimum and maximum reward amount.

## What I already know

* The user requested a daily check-in feature.
* The feature's main user-facing entry should live in the profile page.
* System settings must include an enable/disable switch.
* System settings must allow configuring minimum and maximum reward money.
* The project already has user balance support and admin balance history flows.
* The profile shell is `frontend/src/views/user/ProfileView.vue`.
* User profile APIs are grouped in `frontend/src/api/user.ts`.
* Admin system settings are represented by `frontend/src/api/admin/settings.ts` and `frontend/src/views/admin/SettingsView.vue`.
* Backend user handlers and services already own current-user profile behavior.
* Backend admin settings handler/service already own system settings persistence.

## Assumptions

* "Money" means the user's account balance amount in the same unit used by existing balance UI/API values.
* A successful check-in should add the reward directly to the user's balance.
* A user may claim at most once per local calendar day as determined by the backend.
* Reward amount should be randomly selected within `[min, max]`, inclusive from a product perspective and rounded consistently with existing balance precision.
* If the feature is disabled, the backend must reject check-in attempts even if a stale frontend still calls the endpoint.
* Default settings should be disabled with a safe zero reward range until an admin configures it.

## Requirements

* Add persistent tracking so each user has at most one successful daily check-in per day.
* Add a current-user API to fetch daily check-in status, including whether the feature is enabled, whether the user already checked in today, today's reward if already checked in, and the configured reward range needed for display.
* Add a current-user API to perform today's check-in.
* Check-in must be idempotency-safe for repeated clicks or concurrent requests: only one reward can be credited for the same user/day.
* On success, update the user's balance and return the reward amount plus updated balance.
* Add admin settings fields:
  * `daily_checkin_enabled`
  * `daily_checkin_min_reward`
  * `daily_checkin_max_reward`
* Validate admin settings so reward amounts are non-negative and `max >= min` when enabled or when both values are saved.
* Add the check-in UI to the profile page using the existing profile card style.
* The profile check-in UI should show:
  * enabled/disabled state
  * whether today's check-in has been claimed
  * reward amount after a successful check-in
  * updated balance or current balance when available
* Add system settings UI controls for the enable switch and min/max reward inputs.
* Add backend and frontend tests covering:
  * disabled feature blocks check-in
  * enabled feature rewards within configured range
  * duplicate same-day check-in is blocked or returns an already-claimed state without adding balance again
  * admin settings switch/min/max fields round-trip through API/UI helpers
  * profile card renders actionable and already-claimed states

## Acceptance Criteria

* [ ] Admin can enable/disable daily check-in from system settings.
* [ ] Admin can configure minimum and maximum check-in reward amounts.
* [ ] Users can see the check-in card on the profile page when the feature is enabled.
* [ ] Users can claim the daily reward once per day.
* [ ] A successful claim increases account balance by the returned reward amount.
* [ ] Duplicate claims on the same day do not increase balance again.
* [ ] When disabled, users cannot claim a reward.
* [ ] Relevant backend and frontend tests pass.

## Definition of Done

* Tests added/updated for backend service/handler or repository behavior as appropriate.
* Frontend component/API tests added or updated.
* Backend Go formatting passes.
* Frontend lint/type-check or targeted Vitest checks pass.
* Trellis check agent reviews and fixes issues.

## Out of Scope

* Streak rewards or multi-day streak logic.
* Admin dashboard analytics for check-ins.
* User-facing check-in history beyond today's status.
* Email/push notifications reminding users to check in.
* Currency conversion or payment-provider integration.

## Technical Notes

* Add implementation context for backend and frontend specs before Phase 2.
* Prefer existing settings persistence patterns over a new config subsystem.
* Prefer a small dedicated check-in record/table with a unique user/day constraint for concurrency safety.
* Prefer existing balance update/redeem history conventions if they already support non-redeem balance records cleanly; otherwise keep the first implementation tightly scoped.
