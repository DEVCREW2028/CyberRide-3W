import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Car, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Wrench,
  FileText,
  Activity
} from "lucide-react";
import { getVehicles } from "../logic/storage";
import { VehicleCard } from "../components/VehicleCard";
import { RiskBadge } from "../components/RiskBadge";
import { EmptyState } from "../components/EmptyState";

export function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bmsModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.workshopStation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return v.status === "Pending Scan" || !v.riskScore;
    if (statusFilter === "SECURE") return v.status === "Secure";
    if (statusFilter === "WARNING") return v.status === "Needs Attention";
    if (statusFilter === "HIGH_RISK") return v.status === "High Risk";

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Connected E-Rickshaw Fleet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered 3-wheelers, inspect wireless BMS configurations, and trigger readiness assessments.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <Link
            to="/intake"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>New workshop intake</span>
          </Link>
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, model, BMS, or station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All (${vehicles.length})` },
            { id: "PENDING", label: `Pending Scan (${vehicles.filter(v => v.status === "Pending Scan" || !v.riskScore).length})` },
            { id: "SECURE", label: `Secure (${vehicles.filter(v => v.status === "Secure").length})` },
            { id: "WARNING", label: `Needs Attention (${vehicles.filter(v => v.status === "Needs Attention").length})` },
            { id: "HIGH_RISK", label: `High Risk (${vehicles.filter(v => v.status === "High Risk").length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Table or Grid */}
      {filteredVehicles.length === 0 ? (
        <EmptyState
          title="No vehicles match criteria"
          description="Try modifying your search keywords or switching filter tabs."
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
          actionLabel="Clear Filters"
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Vehicle ID</th>
                  <th className="py-3 px-4 font-bold">Model & Reg</th>
                  <th className="py-3 px-4 font-bold">BMS Profile</th>
                  <th className="py-3 px-4 font-bold">Workshop Hub</th>
                  <th className="py-3 px-4 font-bold">Last Assessment</th>
                  <th className="py-3 px-4 font-bold">Security Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVehicles.map((vehicle) => {
                  const isHighRisk = vehicle.status === "High Risk";
                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          to={`/vehicles/${vehicle.id}`}
                          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                        >
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.id}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{vehicle.model}</p>
                        <p className="text-[11px] font-mono text-slate-600">{vehicle.regNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <p className="text-slate-800 font-medium">{vehicle.bmsModel}</p>
                        <p className="text-[11px] text-slate-600">{vehicle.batterySpec}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {vehicle.workshopStation}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {vehicle.lastAssessed || "Not assessed"}
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge status={vehicle.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/vehicles/${vehicle.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/assessment/${vehicle.id}`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                              isHighRisk
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            <Activity className="w-3 h-3" />
                            <span>Assess</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
