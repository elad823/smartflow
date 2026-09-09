'use client';

import React, { useState } from 'react';
import { Issue, CreateIssueRequest } from '../types/issue';
import { issueService, IssueServiceError } from '../services/issueService';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (issue: Issue) => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setErrorMessage(null);
    setErrorDetails(null);
    setCreatedIssue(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails(null);

    // Frontend validation
    if (title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters long.");
      return;
    }
    if (title.trim().length > 150) {
      setErrorMessage("Title cannot exceed 150 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateIssueRequest = {
        title: title.trim(),
        description: description.trim(),
      };
      const result = await issueService.createIssue(payload);
      setCreatedIssue(result);
      onIssueCreated(result);
    } catch (err: any) {
      if (err instanceof IssueServiceError && err.errorResponse) {
        setErrorMessage(err.errorResponse.message);
        setErrorDetails(err.errorResponse.details || null);
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred while creating the issue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {createdIssue ? 'Issue Created & AI Analyzed' : 'Report New Issue'}
              </h2>
              <p className="text-xs text-slate-500">
                {createdIssue ? 'AI automated analysis report generated' : 'AI will automatically detect category, severity, and remediation steps'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {createdIssue ? (
          /* Success & AI Enriched Result View */
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Issue successfully published & analyzed</p>
                <p className="text-xs text-emerald-700 mt-0.5">Recorded with ID: {createdIssue.id}</p>
              </div>
            </div>

            {/* AI Result Card */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Classification
                </span>
                <span className="bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full text-[11px]">
                  {Math.round(createdIssue.aiAnalysis.confidenceScore * 100)}% Confidence
                </span>
              </div>

              <div className="text-sm">
                <p className="font-medium text-slate-800">{createdIssue.title}</p>
                <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{createdIssue.aiAnalysis.summary}&rdquo;</p>
              </div>

              <div className="pt-2 border-t border-indigo-100 flex items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Category: </span>
                  <span className="font-semibold text-slate-800">{createdIssue.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">Severity: </span>
                  <span className="font-semibold text-slate-800 capitalize">{createdIssue.severity}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700">
                <span className="font-semibold text-indigo-900 block mb-1">Recommended Remediation:</span>
                {createdIssue.aiAnalysis.recommendedAction}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <span>Done</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{errorMessage}</p>
                  {errorDetails && errorDetails.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-red-600">
                      {errorDetails.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Issue Title *</label>
                <span className="text-[11px] text-slate-400">{title.length}/150</span>
              </div>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="e.g. PostgreSQL connection pool exhausted in production"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Brief summary (3 to 150 characters)</p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Problem Description *</label>
                <span className="text-[11px] text-slate-400">{description.length} chars (min 10)</span>
              </div>
              <textarea
                required
                rows={4}
                placeholder="Provide detailed context, error messages, impacted services, and steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Detailed text describing the problem (at least 10 characters)</p>
            </div>

            {/* Submit Action */}
            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50/70 px-3 py-2 rounded-lg border border-indigo-100 animate-pulse">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                <span>Running automated Gemini AI root cause & remediation analysis (~10-15s)...</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze & Create</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
