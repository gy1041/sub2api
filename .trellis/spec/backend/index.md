# Backend Development Guidelines

> Project-specific conventions for the Go backend in this repository.

---

## Overview

Backend code for `sub2api` lives under `backend/` and is organized around Gin handlers, service interfaces, Ent/SQL repositories, embedded SQL migrations, shared response helpers, and zap-backed logging. These guideline files document the conventions already present in the repository so implementation and review agents keep matching the existing code.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | `backend/internal` layering, route/handler/service/repository ownership, naming | Complete |
| [Database Guidelines](./database-guidelines.md) | Ent usage, raw SQL boundaries, migration checksum rules, schema naming | Complete |
| [Error Handling](./error-handling.md) | `ApplicationError`, response envelope, wrapping, redacted 5xx logging | Complete |
| [Quality Guidelines](./quality-guidelines.md) | Go formatting, tests, layering review checklist, forbidden patterns | Complete |
| [Logging Guidelines](./logging-guidelines.md) | `internal/pkg/logger`, levels, structured fields, sensitive-data redaction | Complete |

---

## Pre-Development Checklist

Before backend changes, read the files relevant to the layer being touched:

- Route, handler, service, repository, or migration placement: [Directory Structure](./directory-structure.md)
- Database schema, query, transaction, or migration changes: [Database Guidelines](./database-guidelines.md)
- New or changed error responses: [Error Handling](./error-handling.md)
- New logging or operational events: [Logging Guidelines](./logging-guidelines.md)
- Tests, review expectations, or quality gates: [Quality Guidelines](./quality-guidelines.md)

Use the project examples named in each guide, such as `backend/internal/server/routes/admin.go`, `backend/internal/repository/account_repo.go`, and `backend/internal/pkg/response/response.go`, as the reference implementation style.

---

## Quality Check

For backend review, verify changed code against the same relevant guide files above. Pay special attention to API envelope compatibility, migration immutability, safe error/log redaction, and cross-layer data shape consistency with the frontend.
