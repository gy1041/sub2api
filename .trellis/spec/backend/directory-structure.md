# Directory Structure

Backend code lives under `backend/` and follows a layered Go layout. Keep new code in the layer that already owns the behavior instead of creating one-off packages.

## Layout

```text
backend/
├── cmd/server/                 # binary entrypoint and version file
├── internal/config/            # env/config loading and wiring
├── internal/domain/            # shared domain constants and dispatch rules
├── internal/handler/           # Gin HTTP handlers and request/response mapping
│   ├── admin/                  # admin-only handlers
│   └── dto/                    # HTTP DTOs and mapper helpers
├── internal/middleware/        # legacy/shared middleware
├── internal/model/             # small persistence/API models not owned by ent
├── internal/pkg/               # reusable infrastructure packages
├── internal/repository/        # Ent/SQL persistence adapters
├── internal/server/routes/     # route registration by surface area
├── internal/service/           # business types, interfaces, and services
├── internal/testutil/          # test helpers
├── internal/util/              # local utilities
└── migrations/                 # numbered SQL migrations embedded by Go
```

Examples: `backend/internal/server/routes/admin.go` registers admin route groups, `backend/internal/handler/admin/user_handler.go` owns admin user HTTP behavior, `backend/internal/repository/account_repo.go` implements account persistence, and `backend/internal/service` exposes the interfaces handlers depend on.

## Module Organization

Add API endpoints by touching the route file for the surface (`backend/internal/server/routes/user.go`, `admin.go`, `gateway.go`, `payment.go`, or `auth.go`), the matching handler package, and the service/repository interfaces needed by that flow. Keep route files thin: they should group paths and attach handler methods, not contain business logic.

Handlers translate HTTP concerns: bind/query params, auth context, status codes, and DTO mapping. Business decisions belong in `internal/service`; persistence belongs in `internal/repository`. DTO conversions that are reused across handlers belong in `backend/internal/handler/dto`, as in `backend/internal/handler/dto/mappers.go`.

Repository implementations usually return service-layer types and satisfy service interfaces. Follow the constructor pattern in `backend/internal/repository/account_repo.go`: keep the concrete struct private and expose a `New...Repository` constructor returning the service interface.

## Naming Conventions

Use snake_case filenames for Go files that describe the feature, matching existing names such as `gateway_handler_chat_completions.go`, `idempotency_helper.go`, and `migrations_runner.go`. Tests live next to the code with `_test.go`; integration-style repository tests use names like `*_integration_test.go`.

Package names are short lowercase names (`handler`, `repository`, `routes`, `logger`). Do not create stuttered package names such as `accountrepository`; put account-specific files inside the existing package.

Generated Ent code lives outside `internal/` under `backend/ent`; application code imports it with aliases like `dbent`, `dbaccount`, and `dbpredicate` to avoid collisions with service/domain names.

## Examples To Follow

Use `backend/internal/handler/handler.go` as the aggregation point for handler dependencies. Use `backend/internal/server/routes/admin.go` as the pattern for grouping related admin endpoints into small `register...Routes` helpers.

Use `backend/internal/repository/account_repo.go` for a full repository example: it mixes Ent builders for normal CRUD, raw SQL for complex operations, service errors for boundary failures, and scheduler outbox side effects after persistence changes.

Use `backend/internal/pkg/response/response.go` for the standard API envelope and pagination shape shared with the frontend.
