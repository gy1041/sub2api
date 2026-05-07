# Error Handling

The backend has a standard application error type and a standard HTTP response envelope. Preserve both when adding new code.

## Error Types

Use `backend/internal/pkg/errors.ApplicationError` when an error needs to control the HTTP status, reason, message, or metadata. It supports wrapping with `WithCause`, metadata with `WithMetadata`, and conversion from arbitrary errors through `FromError`.

Service packages may expose sentinel/domain errors for expected business failures. Repositories translate Ent/PostgreSQL errors into those service errors, as seen in `backend/internal/repository/account_repo.go` with `translatePersistenceError`.

Unexpected errors should remain wrapped with `%w` so callers keep the chain. `backend/internal/repository/migrations_runner.go` is the main example: every migration failure adds operation context while preserving the original error.

## Propagation Pattern

Handlers should return through `backend/internal/pkg/response` helpers. Use `response.Success`, `response.Created`, `response.Paginated`, `response.Error`, or `response.ErrorFrom` instead of manually constructing ad-hoc JSON envelopes.

Lower layers should not write Gin responses. Services and repositories return values plus errors; handlers decide the HTTP response.

For nil or invalid input at service/repository boundaries, return a domain/service error instead of panicking. `accountRepository.Create` checks nil input and returns `service.ErrAccountNilInput`.

## API Error Responses

The standard response shape is:

```json
{
  "code": 400,
  "message": "error message",
  "reason": "optional_machine_reason",
  "metadata": {},
  "data": null
}
```

Success responses use `code: 0` and place payloads under `data`. This shape is defined in `backend/internal/pkg/response/response.go` and unwrapped by `frontend/src/api/client.ts`.

For internal server errors, `response.ErrorFrom` logs redacted details for 5xx responses and sends a safe client message.

## Logging Errors

Redact sensitive values before logging error details. `response.ErrorFrom` uses `backend/internal/util/logredact`, and logging helpers in gateway/ops paths should keep following that pattern.

Use contextual messages when wrapping errors. Avoid returning raw `err` from complex operations without saying which operation failed.

## Common Mistakes

Do not return HTML, plain text, or custom error JSON from API handlers. The frontend interceptor expects the standard envelope.

Do not expose upstream credentials, tokens, API keys, cookies, request bodies, or full provider payloads in error messages or logs.

Do not swallow errors in background or side-effect code without at least a debug/warn/error log when the failure affects observability or consistency.
