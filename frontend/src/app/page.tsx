'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Issue, IssueStatus, IssueSeverity, SortField, SortOrder, PaginationMeta, UpdateableIssueStatus } from '../types/issue';

import { issueService } from '../services/issueService';
import { Header } from '../components/Header';
import { StatsOverview } from '../components/StatsOverview';
import { FilterBar } from '../components/FilterBar';
import { IssueList } from '../components/IssueList';
import { Pagination } from '../components/Pagination';
import { IssueDetailModal } from '../components/IssueDetailModal';
import { CreateIssueModal } from '../components/CreateIssueModal';

export default function DashboardPage() {
  // Data state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Filter & sorting state
  const [statusFilter, setStatusFilter] = useState<IssueStatus | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check backend health periodically or on mount
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const connected = await issueService.checkBackendHealth();
      if (isMounted) setIsBackendConnected(connected);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch issues
  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await issueService.getIssues({
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter.trim() || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setIssues(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching issues.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, severityFilter, categoryFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Handler for reset/clear filters
  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setSeverityFilter(undefined);
    setCategoryFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleToggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const handleIssueCreated = (newIssue: Issue) => {
    loadIssues();
  };

  const handleUpdateStatus = async (id: string, newStatus: UpdateableIssueStatus) => {
    const updated = await issueService.updateIssueStatus(id, newStatus);
    setIssues((prev) => prev.map((item) => (item.id === id ? updated : item)));
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue(updated);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        onNewIssueClick={() => setIsCreateModalOpen(true)}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Issues & Diagnostics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time incident tracking enriched with AI root-cause analysis and automated remediation suggestions.
          </p>
        </div>

        {/* Stats / Overview Cards */}
        <StatsOverview issues={issues} totalItems={pagination.totalItems} />

        {/* Filter and Search Bar */}
        <FilterBar
          status={statusFilter}
          severity={severityFilter}
          category={categoryFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setCurrentPage(1);
          }}
          onSeverityChange={(severity) => {
            setSeverityFilter(severity);
            setCurrentPage(1);
          }}
          onCategoryChange={(cat) => {
            setCategoryFilter(cat);
            setCurrentPage(1);
          }}
          onSortByChange={(field) => {
            setSortBy(field);
            setCurrentPage(1);
          }}
          onToggleSortOrder={handleToggleSortOrder}
          onClearFilters={handleClearFilters}
        />

        {/* Issues List Component */}
        <IssueList
          issues={issues}
          isLoading={isLoading}
          error={error}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          onRetry={loadIssues}
          onNewIssueClick={() => setIsCreateModalOpen(true)}
        />

        {/* Pagination Controls */}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        SmartFlow App &copy; {new Date().getFullYear()} &bull; Client Frontend Application
      </footer>

      {/* Detail Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={handleUpdateStatus}
      />


      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />
    </div>
  );
}
