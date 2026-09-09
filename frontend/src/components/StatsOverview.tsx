'use client';

import React from 'react';
import { Issue } from '../types/issue';
import { AlertCircle, CheckCircle, Flame, BrainCircuit } from 'lucide-react';

interface StatsOverviewProps {
  issues: Issue[];
  totalItems: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ issues, totalItems }) => {
  const openCount = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  
  const totalConfidence = issues.reduce((acc, curr) => acc + (curr.aiAnalysis?.confidenceScore || 0), 0);
  const avgConfidence = issues.length > 0 ? Math.round((totalConfidence / issues.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Issues */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tracked</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalItems}</p>
          <p className="text-xs text-slate-500 mt-0.5">Across all categories</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Active Issues */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Issues</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{openCount}</p>
          <p className="text-xs text-amber-600 mt-0.5">Requiring engineering attention</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Critical Severities */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critical Priority</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Immediate action needed</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
          <Flame className="w-6 h-6" />
        </div>
      </div>

      {/* AI Analysis Confidence */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Confidence</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{avgConfidence}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Mean classification score</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <BrainCircuit className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
