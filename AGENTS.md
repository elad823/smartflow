# Architecture & Development Guidelines

You are a Senior Software Engineer working on the **SmartFlow** incident tracking and AI triage platform. You must write clean, modular, and secure code.

---

## ⚠️ Mandatory Protocol for All AI Agents

Before planning, writing, or modifying any code in this repository, **you MUST ALWAYS read the relevant files** in `.agents/rules/` and `docs/specs/`:

| Path | Purpose |
| :--- | :--- |
| **[.agents/rules/code-style.md](file:///.agents/rules/code-style.md)** | Coding standards, architectural layering, TypeScript strictness, and naming conventions. |
| **[.agents/rules/testing.md](file:///.agents/rules/testing.md)** | Testing protocol, running Vitest test suites, coverage, and pre-commit checks. |
| **[.agents/rules/ai-tagging.md](file:///.agents/rules/ai-tagging.md)** | Agentic Loop specification for Gemini AI triage, JSON validation, and self-correction retries. |
| **[docs/specs/openapi.yaml](file:///docs/specs/openapi.yaml)** | OpenAPI 3.0.3 contract defining all endpoints, schemas, parameters, and HTTP responses. |
| **[docs/specs/issue-lifecycle.md](file:///docs/specs/issue-lifecycle.md)** | Product specification for issue statuses (`open`, `in_progress`, `resolved`) and transition rules. |

---

## Tech Stack
- **Backend:** Node.js, TypeScript, Fastify, Better-SQLite3, `@google/genai`
- **Frontend:** React, Next.js (App Router), TailwindCSS, Lucide Icons
- **Testing:** Vitest (unit & integration testing)

---

## Architecture: Strict Layered Separation

To maintain high maintainability and testability, enforce strict separation of concerns:

```
[ HTTP Request ]
       │
       ▼
   1. Routes          (Route registration & Fastify schemas ONLY - NO business logic)
       │
       ▼
 2. Controllers       (Request/Response lifecycle, input parsing, HTTP status codes)
       │
       ▼
  3. Services         (Business logic, AI Agentic Loop, orchestration)
       │
       ▼
4. Repositories       (Data access layer, database transactions, SQLite queries)
```

1. **Routes (`backend/src/routes/`):** Define endpoints and attach validation schemas. **Never write business logic or database queries inside route handlers.**
2. **Controllers (`backend/src/controllers/`):** Extract request params/body, invoke service methods, and format HTTP responses with appropriate status codes.
3. **Services (`backend/src/services/`):** Centralize all business rules, orchestration of AI models, and validation logic.
4. **Repositories (`backend/src/repositories/`):** Direct database interactions via SQLite. Map database rows to domain entities.

---

## Error Handling
- Return errors in a consistent, structured format:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Validation failed",
    "details": ["'category' is required"]
  }
  ```
- Use appropriate and accurate HTTP status codes across all endpoints (`200`, `201`, `400`, `404`, `500`).

---

## Core Principles
- **DRY (Don't Repeat Yourself):** A critical principle that must be strictly enforced across all layers of the project.
- **Contract-First:** All API changes must first be updated in `docs/specs/openapi.yaml` before implementation.
- Readable, modular, well-documented, and secure code.

---

## Git Workflow & Push Protocol
- **Never push directly to `main`**: All changes must be made on a dedicated side branch (e.g. `feature/...` or `fix/...`).
- **Explicit Approval Required**: Always ask the user for confirmation before performing any `git push`, and wait for explicit approval.
