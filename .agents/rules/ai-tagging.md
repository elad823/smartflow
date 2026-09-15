# AI Tagging & Agentic Loop Specification

This rule file defines the exact business logic and execution lifecycle of the **Autonomous Agentic Loop** used to classify issues, infer priority, and generate diagnostic remediation steps using Google Gemini.

---

## 1. Overview & Objectives

When a new issue is submitted (`title`, `description`), the system initiates an autonomous agentic loop to:
1. Identify the technical **Category** (e.g. `Database`, `Security`, `Frontend UI`, `Infrastructure`, `Performance`).
2. Evaluate the incident **Priority** (`critical`, `high`, `medium`, `low`).
3. Formulate an executive diagnostic **Summary**.
4. Prescribe immediate **Recommended Actions** for engineers.
5. Provide a **Confidence Score** between `0.0` and `1.0`.

---

## 2. Agentic Loop Architecture

```
[ New Issue: Title + Description ]
              │
              ▼
   ┌────────────────────────────────────────┐
   │ Attempt 1: Prompt Gemini Model        │
   └───────────────────┬────────────────────┘
                       │
                       ▼
         [ Parse Response JSON ]
                       │
             ┌─────────┴─────────┐
             │                   │
         [ Valid ]          [ Invalid / Error ]
             │                   │
             │                   ▼
             │         [ Attempt < MaxRetries? ]
             │             ├── Yes ──► Inject Error Feedback into Prompt
             │             │           └── Attempt N+1 (Switch Candidate Model)
             │             └── No  ──► Trigger Deterministic Local Fallback
             ▼
   [ Verified Structured Data ]
              │
              ▼
  [ Persist Issue in SQLite DB ]
```

---

## 3. JSON Output Schema & Mandatory Fields

The Gemini model is instructed to output pure JSON matching this interface:

```typescript
export interface GeminiIssueAnalysisResponse {
  category: string;             // Mandatory, non-empty
  priority: 'low' | 'medium' | 'high' | 'critical'; // Mandatory, valid enum
  summary: string;              // High-level diagnostic overview
  confidenceScore: number;      // Float between 0.0 and 1.0
  recommendedAction: string;    // Immediate remediation steps
}
```

---

## 4. Validation Rules (`validateClassificationOutput`)

Before accepting any model response, the output is parsed and verified:

1. **Object Validation:** Root payload must be a non-null, non-array JSON object.
2. **Category Verification:** Field `category` must exist, be of type `string`, and not be empty.
3. **Priority Enum Enforcement:** Field `priority` must exist and normalize (lowercase) to one of:
   - `critical`
   - `high`
   - `medium`
   - `low`
4. **Sanitization:**
   - Confidence score is clamped to `[0.0, 1.0]`.
   - Markdown code fences (e.g. ` ```json ... ``` `) are automatically stripped prior to parsing.

---

## 5. Self-Correction & Retry Mechanism

If the model produces invalid JSON or fails schema validation:

1. The validation errors are recorded into an array (e.g. `"Mandatory field 'category' is missing or empty."`).
2. An autonomous retry is initiated (up to `maxRetries = 3`).
3. The prompt for the next attempt is dynamically augmented with an explicit correction block:
   ```
   ⚠️ CRITICAL CORRECTION REQUIRED FROM PREVIOUS ATTEMPT:
   Your previous response was rejected due to the following validation errors:
   - Mandatory field 'category' is missing or empty.
   You must fix these errors immediately and return a strictly valid JSON object.
   ```
4. Candidate models alternate between `gemini-3.8-flash` and `gemini-2.5-flash` to recover from possible model-specific hiccups.

---

## 6. Deterministic Fallback Triage

If the agentic loop exhausts all retry attempts or if no `GEMINI_API_KEY` is present:
- The system executes a local deterministic rule-based heuristic (`fallbackAnalysis`).
- Scans keywords in the title and description for known signatures:
  - Database terms (`sql`, `postgres`, `deadlock`, `pool`) -> Category `Database`
  - Security terms (`auth`, `jwt`, `unauthorized`, `permission`) -> Category `Security`, Priority `high`
  - System outage terms (`production`, `down`, `fatal`, `crash`) -> Priority `critical`
- Guarantees **zero request downtime** and protects SQLite database integrity at all times.
