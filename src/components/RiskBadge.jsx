import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";

export function RiskBadge({ status, size = "md", showIcon = true, className = "" }) {
  const norm = (status || "").toUpperCase();

  let bg = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = HelpCircle;
  let label = status || "Unknown";

  if (norm === "PENDING SCAN" || norm === "PENDING" || norm === "UNASSESSED" || norm === "NOT ASSESSED") {
    bg = "bg-slate-100 text-slate-600 border-slate-300";
    Icon = Clock;
    label = "Pending Scan";
  } else if (norm === "LOW" || norm === "SECURE" || norm === "PASS") {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
    Icon = norm === "PASS" ? CheckCircle2 : ShieldCheck;
    if (norm === "LOW") label = "Low Risk";
    if (norm === "SECURE") label = "Secure";
    if (norm === "PASS") label = "Pass";
  } else if (norm === "MEDIUM" || norm === "NEEDS ATTENTION" || norm === "WARNING") {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
    Icon = AlertTriangle;
    if (norm === "MEDIUM") label = "Medium Risk";
    if (norm === "NEEDS ATTENTION") label = "Needs Attention";
    if (norm === "WARNING") label = "Warning";
  } else if (norm === "HIGH" || norm === "HIGH RISK" || norm === "FAIL" || norm === "CRITICAL") {
    bg = "bg-rose-50 text-rose-700 border-rose-200";
    Icon = norm === "FAIL" ? XCircle : AlertOctagon;
    if (norm === "HIGH" || norm === "HIGH RISK") label = "High Risk";
    if (norm === "CRITICAL") label = "Critical";
    if (norm === "FAIL") label = "Fail";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-md gap-1",
    md: "px-2.5 py-1 text-xs font-bold rounded-lg gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-extrabold rounded-lg gap-2"
  }[size] || "px-2.5 py-1 text-xs font-bold rounded-lg gap-1.5";

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4"
  }[size] || "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center border font-mono tracking-tight transition-colors shadow-sm ${bg} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Risk status: ${label}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
