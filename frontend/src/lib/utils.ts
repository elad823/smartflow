import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IssueSeverity, IssueStatus } from "../types/issue";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getSeverityConfig(severity: IssueSeverity) {
  switch (severity) {
    case 'critical':
      return {
        label: 'Critical',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
        dotClass: 'bg-red-500',
      };
    case 'high':
      return {
        label: 'High',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
        dotClass: 'bg-amber-500',
      };
    case 'medium':
      return {
        label: 'Medium',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
        dotClass: 'bg-blue-500',
      };
    case 'low':
      return {
        label: 'Low',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
        dotClass: 'bg-emerald-500',
      };
  }
}

export function getStatusConfig(status: IssueStatus) {
  switch (status) {
    case 'open':
      return {
        label: 'Open',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };

    case 'resolved':
      return {
        label: 'Resolved',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    case 'closed':
      return {
        label: 'Closed',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}
