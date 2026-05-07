# Logging Guidelines

Backend logging is centralized in `backend/internal/pkg/logger` with zap-backed structured logging, a slog/stdlog bridge, runtime level changes, and optional sink delivery for ops system logs.

## Logger APIs

Use `logger.L()` for structured zap logging, `logger.S()` for sugared logging, and `logger.With(...)` when shared fields apply to a block. Runtime components can use `logger.WriteSinkEvent` when events must be indexed independently of the current log level, as documented in `backend/internal/pkg/logger/logger.go`.

Legacy code still uses `logger.LegacyPrintf(component, ...)` in places such as `backend/internal/repository/account_repo.go`. New code may follow the local file's existing style, but prefer structured zap fields when adding a new logging path.

Use the standard library `log` only where the package has already intentionally bridged it or where a compatibility path requires it. The logger package bridges stdlog and slog to the global logger.

## Levels

Use debug for detailed diagnostic data and noisy request internals. Use info for lifecycle events and successful important operations. Use warn for recoverable failures or degraded behavior. Use error for failed operations that require operator attention or affect client-visible behavior.

Do not log at fatal from library, handler, service, or repository code. Reserve fatal exits for process startup/entrypoint logic.

## Fields And Message Shape

Include stable component names when logs are routed to ops/system-log sinks. `LogEvent` supports `component`, `message`, `loggerName`, `level`, and arbitrary fields.

Prefer machine-readable fields over formatting everything into one string. Include IDs such as `user_id`, `account_id`, `group_id`, `request_id`, or migration filename when available.

## Sensitive Data

Never log raw API keys, OAuth tokens, cookies, passwords, authorization headers, upstream credentials, or full request/response bodies containing user prompts. Use redaction helpers such as `backend/internal/util/logredact` before logging user-controlled error text.

Keep gateway and upstream logs compact. Existing tests such as `backend/internal/handler/openai_gateway_compact_log_test.go` protect compact logging behavior.

## Operational Events

Log migration failures, scheduler/outbox failures, payment webhook problems, upstream gateway failures, auth/OAuth state failures, and ops monitoring failures with enough context to diagnose the issue.

Avoid adding per-row or per-token info logs inside hot loops. Prefer aggregate logs or debug level for high-volume paths like usage, gateway streaming, and monitoring.
