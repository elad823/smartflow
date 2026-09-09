'use client';

import React from 'react';
import { IssueStatus, IssueSeverity, SortField, SortOrder } from '../types/issue';
import { Search, ArrowUpDown, X } from 'lucide-react';

interface FilterBarProps {
  status?: IssueStatus;
  severity?: IssueSeverity;
  category: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onStatusChange: (status?: IssueStatus) => void;
  onSeverityChange: (severity?: IssueSeverity) => void;
  onCategoryChange: (category: string) => void;
  onSortByChange: (sortBy: SortField) => void;
  onToggleSortOrder: () => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  status,
  severity,
  category,
  sortBy,
  sortOrder,
  onStatusChange,
  onSeverityChange,
  onCategoryChange,
  onSortByChange,
  onToggleSortOrder,
  onClearFilters,
}) => {
  const hasActiveFilters = Boolean(status || severity || category);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        {/* Search input for category / keywords */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by category or issue title..."
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {category && (
            <button
              onClick={() => onCategoryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={status || ''}
            onChange={(e) => onStatusChange(e.target.value ? (e.target.value as IssueStatus) : undefined)}
            aria-label="Filter by Status"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Severity Dropdown */}
          <select
            value={severity || ''}
            onChange={(e) => onSeverityChange(e.target.value ? (e.target.value as IssueSeverity) : undefined)}
            aria-label="Filter by Severity"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Sort By Field */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortField)}
            aria-label="Sort issues by"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="severity">Severity</option>
            <option value="status">Status</option>
            <option value="title">Title</option>
          </select>

          {/* Sort Direction Toggle */}
          <button
            onClick={onToggleSortOrder}
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-sm text-slate-700 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">{sortOrder}</span>
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
