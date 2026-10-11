import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Car, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Download, 
  Search, 
  ArrowRight,
  Shield,
  Activity,
  Sliders
} from "lucide-react";
import { getVehicles } from "../logic/storage";
import { StatCard } from "../components/StatCard";
import { RiskBadge } from "../components/RiskBadge";
import { useToast } from "../context/ToastContext";

export function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const total = vehicles.length;
  const pendingCount = vehicles.filter(v => v.status === "Pending Scan" || !v.riskScore).length;
  const secureCount = vehicles.filter(v => v.status === "Secure").length;
  const warningCount = vehicles.filter(v => v.status === "Needs Attention").length;
  const highRiskCount = vehicles.filter(v => v.status === "High Risk").length;

  const pendingPct = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
  const securePct = total > 0 ? Math.round((secureCount / total) * 100) : 0;
  const warningPct = total > 0 ? Math.round((warningCount / total) * 100) : 0;
  const highRiskPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;

  const filtered = vehicles.filter(v => {
    const matches = v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.bmsModel.toLowerCase().includes(search.toLowerCase()) ||
      v.workshopStation.toLowerCase().includes(search.toLowerCase());

    if (!matches) return false;
    if (filter === "PENDING") return v.status === "Pending Scan" || !v.riskScore;
    if (filter === "SECURE") return v.status === "Secure";
    if (filter === "WARNING") return v.status === "Needs Attention";
    if (filter === "HIGH_RISK") return v.status === "High Risk";
    return true;
  });

  const handleExportCSV = () => {
    const headers = ["Vehicle ID", "Model", "Registration", "BMS Model", "Battery Spec", "Workshop Hub", "Status", "Last Assessed"];
    const rows = vehicles.map(v => [
      v.id,
      `"${v.model}"`,
      v.regNumber,
      `"${v.bmsModel}"`,
      `"${v.batterySpec}"`,
      `"${v.workshopStation}"`,
      v.status,
      `"${v.lastAssessed || 'Not assessed'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CyberRide_3W_Fleet_Security_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Fleet security report exported to CSV.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Fleet Security Overview</h2>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Aggregated Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security readiness breakdown across all registered connected 3-wheelers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Fleet Audit (CSV)</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total 3W Fleet"
          value={total}
          subtitle="Managed in workshop network"
          icon={Car}
          color="blue"
        />
        <StatCard
          title="Secure Fleet"
          value={`${secureCount} (${securePct}%)`}
          subtitle="Hardened BLE endpoints"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Needs Attention"
          value={`${warningCount} (${warningPct}%)`}
          subtitle="Weak PIN / generic broadcast"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="High Risk Vehicles"
          value={`${highRiskCount} (${highRiskPct}%)`}
          subtitle="Exposed safety commands"
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* Fleet Risk Distribution Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 uppercase font-mono tracking-wider">
            Overall Fleet Security Posture
          </span>
          <span className="font-mono text-slate-500">
            {pendingCount > 0 ? `${pendingCount} Pending Scan • ` : ""}{secureCount} Secure • {warningCount} Warn • {highRiskCount} High Risk
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {pendingCount > 0 && (
            <div
              className="bg-slate-400 h-full transition-all duration-500"
              style={{ width: `${pendingPct}%` }}
              title={`Pending Scan: ${pendingPct}%`}
            />
          )}
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${securePct}%` }}
            title={`Secure: ${securePct}%`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${warningPct}%` }}
            title={`Needs Attention: ${warningPct}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${highRiskPct}%` }}
            title={`High Risk: ${highRiskPct}%`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium">Pending Scan ({pendingPct}%)</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Secure ({securePct}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-600 font-medium">Needs Attention ({warningPct}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-600 font-medium">High Risk ({highRiskPct}%)</span>
          </div>
        </div>
      </div>

      {/* Fleet Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Fleet Inventory Audit</h3>
            <p className="text-xs text-slate-500">Individual status and direct assessment triggers</p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter fleet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              {pendingCount > 0 && <option value="PENDING">Pending Scan ({pendingCount})</option>}
              <option value="SECURE">Secure Only</option>
              <option value="WARNING">Needs Attention</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase">
                <th className="py-2.5 px-3 font-bold">Vehicle ID</th>
                <th className="py-2.5 px-3 font-bold">Model</th>
                <th className="py-2.5 px-3 font-bold">BMS Hardware</th>
                <th className="py-2.5 px-3 font-bold">Workshop Station</th>
                <th className="py-2.5 px-3 font-bold">Risk Level</th>
                <th className="py-2.5 px-3 font-bold text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((vehicle) => {
                const isHigh = vehicle.status === "High Risk";
                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <Link to={`/vehicles/${vehicle.id}`} className="hover:text-blue-600">
                        {vehicle.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{vehicle.model}</p>
                      <p className="text-[11px] font-mono text-slate-500">{vehicle.regNumber}</p>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <p className="text-slate-800">{vehicle.bmsModel}</p>
                      <p className="text-[11px] text-slate-500">{vehicle.batterySpec}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {vehicle.workshopStation}
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge status={vehicle.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/assessment/${vehicle.id}`}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                          isHigh
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>Assess</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
