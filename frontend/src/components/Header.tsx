'use client';

import React from 'react';
import { Sparkles, PlusCircle, Activity, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onNewIssueClick: () => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNewIssueClick, isBackendConnected }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">SmartFlow</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  AI Issue Tracker
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Automated categorization, severity scoring & remediation</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Backend connection status badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isBackendConnected ? "Connected to Fastify API (http://localhost:3000)" : "Using resilient client mock store (Fastify server offline)"}
            >
              {isBackendConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API Live</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline Client Mode</span>
                </>
              )}
            </div>

            {/* Create Issue CTA */}
            <button
              onClick={onNewIssueClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
