import { Issue } from '../types/issue';

export const INITIAL_MOCK_ISSUES: Issue[] = [
  {
    id: "a3b8c2d1-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
    title: "PostgreSQL connection pool exhausted in production",
    description: "Multiple microservices started failing with 'Connection timeout' errors under heavy traffic. The database pool limit was hit and queries are hanging.",
    status: "open",
    severity: "critical",
    category: "Database",
    aiAnalysis: {
      summary: "Connection pool exhaustion causing cascading request timeouts across dependent microservices.",
      detectedCategory: "Database",
      confidenceScore: 0.96,
      recommendedAction: "Increase maximum connection pool size in PgBouncer, check for leaking unclosed database sessions in the auth service, and review long-running queries."
    },
    createdAt: "2026-09-09T10:15:30.000Z",
    updatedAt: "2026-09-09T10:15:32.450Z"
  },
  {
    id: "b4c9d3e2-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
    title: "JWT token validation failing intermittently on mobile client",
    description: "iOS users report sudden logouts with 401 Unauthorized errors after token refresh cycle. Seems related to clock drift between mobile client and auth cluster.",
    status: "in_progress",
    severity: "high",
    category: "Security & Auth",
    aiAnalysis: {
      summary: "Clock skew between client and authentication servers leads to premature rejection of valid JWT tokens.",
      detectedCategory: "Security & Auth",
      confidenceScore: 0.92,
      recommendedAction: "Add a 60-second leeway/tolerance window to JWT expiration checks on backend and ensure client syncs time offset."
    },
    createdAt: "2026-09-08T16:42:10.000Z",
    updatedAt: "2026-09-08T18:20:15.000Z"
  },
  {
    id: "c5d0e4f3-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
    title: "Memory leak detected in report generation background worker",
    description: "Heap snapshot indicates uncollected buffer allocations during large PDF exports. Worker restarts automatically every 4 hours due to OOM kill.",
    status: "open",
    severity: "high",
    category: "Performance",
    aiAnalysis: {
      summary: "High memory consumption during PDF report compilation caused by retained buffer references in worker scope.",
      detectedCategory: "Performance",
      confidenceScore: 0.89,
      recommendedAction: "Stream output chunks directly to cloud storage instead of accumulating complete buffer in memory; invoke garbage collection hooks between batch runs."
    },
    createdAt: "2026-09-07T08:11:00.000Z",
    updatedAt: "2026-09-07T08:11:04.100Z"
  },
  {
    id: "d6e1f5a4-7b8c-9d0e-1f2a-3b4c5d6e7f80",
    title: "Dropdown menu cut off on mobile viewport in Safari",
    description: "Navigation bar sub-menu does not render properly inside Safari iOS when screen width is below 390px due to overflow clipping.",
    status: "resolved",
    severity: "medium",
    category: "Frontend UI",
    aiAnalysis: {
      summary: "CSS overflow clipping on parent container prevents absolute positioned dropdown from rendering outside viewport bounds.",
      detectedCategory: "Frontend UI",
      confidenceScore: 0.94,
      recommendedAction: "Use Portal or popover API to render mobile menus at root level and verify responsive breakpoints."
    },
    createdAt: "2026-09-06T14:22:00.000Z",
    updatedAt: "2026-09-07T11:05:00.000Z"
  },
  {
    id: "e7f2a6b5-8c9d-0e1f-2a3b-4c5d6e7f8091",
    title: "Typo in email notification template footer",
    description: "Customer onboarding email says 'Welocme' instead of 'Welcome' in the header banner.",
    status: "closed",
    severity: "low",
    category: "Copy & Content",
    aiAnalysis: {
      summary: "Minor typographical error in transactional email greeting banner.",
      detectedCategory: "Copy & Content",
      confidenceScore: 0.98,
      recommendedAction: "Correct the string constant in onboarding-email.html template."
    },
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-05T09:30:00.000Z"
  }
];
