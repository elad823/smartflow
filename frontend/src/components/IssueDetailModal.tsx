'use client';

import React from 'react';
import { Issue, UpdateableIssueStatus } from '../types/issue';

import { formatDate, getSeverityConfig, getStatusConfig } from '../lib/utils';
import { X, Sparkles, CheckCircle2, Copy, Check, Clock, Tag, Loader2, AlertCircle } from 'lucide-react';

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  onUpdateStatus?: (issueId: string, status: UpdateableIssueStatus) => Promise<void> | void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, onClose, onUpdateStatus }) => {
  const [copied, setCopied] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  if (!issue) return null;

  const statusCfg = getStatusConfig(issue.status);
  const severityCfg = getSeverityConfig(issue.severity);
  const confidencePercent = Math.round((issue.aiAnalysis?.confidenceScore || 0) * 100);

  const handleCopyId = () => {
    navigator.clipboard.writeText(issue.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: UpdateableIssueStatus) => {
    if (!issue || issue.status === newStatus || isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(issue.id, newStatus);
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/60">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityCfg.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dotClass}`}></span>
                {severityCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <Tag className="w-3 h-3 text-slate-400" />
                {issue.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{issue.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
            <div className="flex items-center gap-1.5">
              <span>ID:</span>
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                {issue.id}
              </code>
              <button
                onClick={handleCopyId}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy Issue ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Created {formatDate(issue.createdAt)}</span>
            </div>
          </div>

          {/* Status Updater Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Update Status</h4>
                <p className="text-xs text-slate-500 mt-0.5">Move issue through lifecycle stages</p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                {(['open', 'in_progress', 'resolved'] as UpdateableIssueStatus[]).map((st) => {
                  const cfg = getStatusConfig(st);
                  const isCurrent = issue.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating || isCurrent}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? `${cfg.badgeClass} font-semibold shadow-xs`
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50'
                      }`}
                    >
                      {isUpdating && isCurrent && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {updateError && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{updateError}</span>
              </div>
            )}
          </div>

          {/* Issue Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Problem Description</h4>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* AI Analysis Card */}
          {issue.aiAnalysis && (
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">AI Diagnostic & Remediation</h4>
                </div>

                {/* Confidence Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Confidence:</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${confidencePercent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">{confidencePercent}%</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Executive Summary</p>
                <p className="text-sm text-slate-700 bg-white/90 p-3 rounded-lg border border-indigo-100">
                  {issue.aiAnalysis.summary}
                </p>
              </div>

              {/* Inferred Category */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Detected Category:</span>
                <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {issue.aiAnalysis.detectedCategory}
                </span>
              </div>

              {/* Recommended Action */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prescribed Remediation Steps</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed pl-5">
                  {issue.aiAnalysis.recommendedAction}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
