'use client';

import React from 'react';
import { Issue } from '../types/issue';
import { formatDate, getSeverityConfig, getStatusConfig } from '../lib/utils';
import { Sparkles, ArrowRight, Inbox, RefreshCw, AlertTriangle } from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  isLoading: boolean;
  error?: string | null;
  onSelectIssue: (issue: Issue) => void;
  onRetry: () => void;
  onNewIssueClick: () => void;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  isLoading,
  error,
  onSelectIssue,
  onRetry,
  onNewIssueClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Failed to load issues</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-slate-900">No issues found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No matching issues were found with the selected filters, or no issues have been created yet.
        </p>
        <button
          onClick={onNewIssueClick}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Create New Issue</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="px-5 py-3.5">Issue Details</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Severity</th>
              <th scope="col" className="px-4 py-3.5">Category & AI Analysis</th>
              <th scope="col" className="px-4 py-3.5">Created</th>
              <th scope="col" className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {issues.map((issue) => {
              const statusCfg = getStatusConfig(issue.status);
              const severityCfg = getSeverityConfig(issue.severity);
              const confidencePercent = issue.aiAnalysis?.confidenceScore
                ? Math.round(issue.aiAnalysis.confidenceScore * 100)
                : null;

              return (
                <tr
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Title & Description preview */}
                  <td className="px-5 py-4 max-w-xs sm:max-w-sm">
                    <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {issue.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {issue.description}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Severity Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityCfg.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dotClass}`}></span>
                      {severityCfg.label}
                    </span>
                  </td>

                  {/* Category & AI Summary */}
                  <td className="px-4 py-4 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium border border-slate-200">
                        {issue.category}
                      </span>
                      {confidencePercent !== null && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          {confidencePercent}%
                        </span>
                      )}
                    </div>
                    {issue.aiAnalysis?.summary && (
                      <p className="text-xs text-slate-500 italic line-clamp-1 mt-1">
                        &ldquo;{issue.aiAnalysis.summary}&rdquo;
                      </p>
                    )}
                  </td>

                  {/* Created timestamp */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(issue.createdAt)}
                  </td>

                  {/* Action button */}
                  <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-medium">
                    <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800 transition-colors">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
