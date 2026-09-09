# Architecture & Development Guidelines

You are a Senior Software Engineer. You must write clean, modular, and secure code.

## Tech Stack
- **Backend:** Node.js (TypeScript, Fastify)
- **Frontend:** React (Next.js, TailwindCSS)

## Architecture
- **Strict Layered Separation:**
  - **Routes:** Define endpoints and schemas only. **Do not write business logic inside Routes.**
  - **Controllers:** Handle Request/Response lifecycle, input validation, and delegation to Services.
  - **Services:** Centralize all business logic, data processing, and external integrations.

## Error Handling
- Return errors in a consistent, structured format.
- Use appropriate and accurate HTTP status codes across all endpoints.

## Core Principles
- **DRY (Don't Repeat Yourself):** A critical principle that must be strictly enforced across all layers of the project.
- Readable, modular, well-documented, and secure code.

## Git Workflow & Push Protocol
- **Never push directly to `main`**: All changes must be pushed to a dedicated side branch (feature/fix branch).
- **Explicit Approval Required**: Always ask the user for confirmation before performing any `git push`, and wait for explicit approval.

