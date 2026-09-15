# Testing Guidelines & Verification Protocol

This document defines the testing strategy, standards, and verification steps required for any changes made to the SmartFlow application.

---

## 1. Test Architecture

The codebase relies on **Vitest** for fast, native TypeScript testing:

```
backend/tests/
├── database.test.ts    # Unit tests for SQLite schema, indexes, and SqliteIssueRepository
├── ai.service.test.ts  # Unit tests for the AI Agentic Loop, JSON validation, and self-correction
└── issue.api.test.ts   # Integration / E2E tests for Fastify REST endpoints via app.inject()
```

---

## 2. Test Execution Commands

Before submitting code, opening a PR, or requesting a git push, all tests must pass 100%:

```bash
# Run all backend tests
npm test --prefix backend

# Watch mode for active development
npm run test:watch --prefix backend

# Validate frontend compilation and type safety
npm run build --prefix frontend
```

---

## 3. Testing Principles

### Fastify API Integration Tests (`issue.api.test.ts`)
- Use `app.inject({ method, url, payload })` to simulate realistic HTTP requests without binding to network ports.
- Verify:
  - Correct HTTP status code (`200`, `201`, `400`, `404`).
  - Response headers and payload structure.
  - Schema rejection for invalid formats (e.g. invalid UUIDs, bad status enums, short descriptions).

### Database Repository Tests (`database.test.ts`)
- Run tests against an isolated in-memory SQLite database (`:memory:`).
- Verify:
  - Schema initialization, foreign keys, and indexes.
  - CRUD operations (`create`, `findById`, `updateStatus`, `findMany`).
  - Sorting and pagination calculations (`totalItems`, `totalPages`).

### AI Agentic Loop Tests (`ai.service.test.ts`)
- **Always mock the Gemini API** in test suites using `vi.fn()` to prevent external network dependencies, rate-limit failures, or credential leakage in CI environments.
- Verify:
  - Success on first iteration.
  - Self-correction retry on invalid JSON schema or missing mandatory fields.
  - Graceful deterministic fallback when max retries are exhausted.

---

## 4. Pre-Push Checklist

- [ ] `npm test --prefix backend` passes with 0 failures.
- [ ] `npm run build --prefix backend` completes without TypeScript errors.
- [ ] `npm run build --prefix frontend` compiles clean production bundle.
- [ ] No temporary debug statements (`console.log`, `debugger`) left in production files.
