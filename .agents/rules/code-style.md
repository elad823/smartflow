# Code Style & Architecture Rules

This document outlines the coding standards, code consistency, and architectural requirements for the SmartFlow codebase.

---

## 1. Architectural Layering Boundaries

Every component in the system has a strictly defined responsibility:

### Routes (`backend/src/routes/*.routes.ts`)
- **Allowed:** Fastify route path declarations, HTTP methods, attaching Fastify schemas, and binding to controller handlers.
- **Forbidden:** Business logic, `try/catch` error formatting, direct database queries, or external API calls.

### Controllers (`backend/src/controllers/*.controller.ts`)
- **Allowed:** Unpacking request parameters, query strings, and body payloads; delegating work to service methods; returning explicit HTTP status codes (`200`, `201`, `204`).
- **Forbidden:** Heavy data transformations, SQL operations, direct calls to Gemini API, or inline business validation.

### Services (`backend/src/services/*.service.ts`)
- **Allowed:** Core business logic, data sanitization, orchestration of AI agentic loops, triggering repository calls, and throwing typed application errors (`NotFoundError`, `ValidationError`).
- **Forbidden:** Direct dependency on Fastify HTTP request/reply objects.

### Repositories (`backend/src/repositories/*.repository.ts`)
- **Allowed:** Prepared SQL statements, query execution, database transactions, table row-to-domain mapping, and persistence operations.
- **Forbidden:** HTTP concerns, AI logic, or presentation formatting.

---

## 2. TypeScript & Code Standards

- **Strict Typing:** Avoid `any`. Always use explicit domain types and interfaces defined in `types/`.
- **Async/Await:** Always use `async/await` instead of raw Promise chains (`.then()`).
- **Explicit Return Types:** Exported functions and public class methods must declare explicit return types.
- **Naming Conventions:**
  - **Files:** `kebab-case` with descriptive suffixes (e.g. `issue.controller.ts`, `issue.service.ts`, `issue.routes.ts`).
  - **Classes & Interfaces:** `PascalCase` (e.g. `SqliteIssueRepository`, `IIssueRepository`).
  - **Variables & Functions:** `camelCase` (e.g. `createIssue`, `runAgenticLoop`).
  - **Constants:** `UPPER_SNAKE_CASE` (e.g. `VALID_PRIORITIES`).

---

## 3. DRY (Don't Repeat Yourself)

- Centralize common utility functions (e.g., date formatting, class merging `cn()`) in `src/lib/` or `src/utils/`.
- Do not duplicate schema definitions or validation rules. Always refer back to `docs/specs/openapi.yaml`.
- Use shared error classes defined in `backend/src/utils/errors.ts`.

---

## 4. Error Handling Standard

- Errors must inherit from `AppError` and carry a valid HTTP status code:
  - `BadRequestError` (400)
  - `ValidationError` (400)
  - `NotFoundError` (404)
  - `InternalServerError` (500)
- All error responses must adhere to the structured `ErrorResponse` schema:
  ```typescript
  export interface ErrorResponse {
    statusCode: number;
    error: string;
    message: string;
    details?: string[];
  }
  ```
