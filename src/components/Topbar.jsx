import React from "react";
import { Menu, Shield, Plus, Sparkles, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Topbar({ onToggleSidebar }) {
  const location = useLocation();

  // Page title mapping
  let pageTitle = "Dashboard";
  if (location.pathname.startsWith("/vehicles/")) pageTitle = "Vehicle Inspection";
  else if (location.pathname === "/vehicles") pageTitle = "Fleet Inventory";
  else if (location.pathname.startsWith("/assessment/")) pageTitle = "Security Assessment";
  else if (location.pathname.startsWith("/results/")) pageTitle = "Assessment Results";
  else if (location.pathname.startsWith("/remediation/")) pageTitle = "Remediation Workflow";
  else if (location.pathname.startsWith("/report/")) pageTitle = "Security Readiness Report";
  else if (location.pathname === "/fleet") pageTitle = "Fleet Security Overview";
<<<<<<< HEAD
  else if (location.pathname === "/whitelist") pageTitle = "Device Whitelisting & Access Control";
  else if (location.pathname === "/pairing") pageTitle = "Strong BLE Pairing Security";
  else if (location.pathname === "/auth") pageTitle = "Challenge–Response Authentication";
=======
  else if (location.pathname === "/intake") pageTitle = "Workshop Intake";
>>>>>>> 8efc294 (Add Methodology & Architecture specification, Express backend assessment engine, and live scan workflow)
  else if (location.pathname === "/settings") pageTitle = "Settings & About";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between no-print">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-600 hidden sm:block">
            Connected E-Rickshaw Wireless BMS Security Assessment
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <Link
          to="/assessment/CR3W-003"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Start Demo Assessment</span>
          <span className="sm:hidden">Start</span>
        </Link>
      </div>
    </header>
  );
}
