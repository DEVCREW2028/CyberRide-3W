import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  Activity, 
  FileText, 
  Wrench,
  Zap,
  Info,
  Fingerprint,
  Bluetooth,
  KeyRound
} from "lucide-react";
import { getVehicles } from "../logic/storage";
import { StatCard } from "../components/StatCard";
import { VehicleCard } from "../components/VehicleCard";
import { RiskBadge } from "../components/RiskBadge";

export function Dashboard() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const totalCount = vehicles.length;
  const secureCount = vehicles.filter(v => v.status === "Secure").length;
  const warningCount = vehicles.filter(v => v.status === "Needs Attention").length;
  const highRiskCount = vehicles.filter(v => v.status === "High Risk").length;
  const pendingCount = vehicles.filter(v => v.status === "Pending Scan" || !v.status).length;

  const highRiskVehicles = vehicles.filter(v => v.status === "High Risk" || v.status === "Needs Attention");
  const vehiclesToDisplay = highRiskVehicles.length > 0 ? highRiskVehicles : vehicles.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Connected E-Rickshaw Cybersecurity Readiness</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            CyberRide 3W
          </h2>
          <p className="text-sm sm:text-base font-semibold text-blue-300 mt-1">
            Security Readiness for Connected E-Rickshaws
          </p>
          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            Assess whether a connected e-rickshaw BMS exposes unsafe wireless access — before a security weakness becomes a vehicle-safety incident. Designed for small EV workshops and fleet operators.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/assessment/CR3W-003"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Security Assessment</span>
            </Link>

            <Link
              to="/intake"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Workshop intake (7 questions)</span>
            </Link>

            <Link
              to="/vehicles"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Car className="w-4 h-4" />
              <span>Browse Fleet ({totalCount})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assessed Fleet"
          value={totalCount}
          subtitle="Active e-rickshaw profiles"
          icon={Car}
          color="blue"
        />
        <StatCard
          title="Secure Baseline"
          value={secureCount}
          subtitle="Passing baseline checks"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Needs Attention"
          value={warningCount}
          subtitle="Config warnings detected"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="High Risk Vehicles"
          value={highRiskCount}
          subtitle="Abrupt shutoff / open UART risk"
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* How CyberRide Works Workflow */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Workflow Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic 5-stage readiness assessment and remediation lifecycle
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Workshop Guided
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {[
            { step: "01", title: "Assess", desc: "Scan simulated Bluetooth BMS parameters & service GATTs", icon: Search, color: "bg-blue-50 text-blue-600 border-blue-200" },
            { step: "02", title: "Explain", desc: "Identify exact safety risks & unauthenticated endpoints", icon: Info, color: "bg-amber-50 text-amber-600 border-amber-200" },
            { step: "03", title: "Fix", desc: "Guided technician checklist to harden credentials & lockout commands", icon: Wrench, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
            { step: "04", title: "Re-test", desc: "Verify improved security score and closed vulnerability vectors", icon: Activity, color: "bg-purple-50 text-purple-600 border-purple-200" },
            { step: "05", title: "Report", desc: "Generate print-ready Security Readiness Report for fleet records", icon: FileText, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
          ].map((item) => {
            const StepIcon = item.icon;
            return (
              <div key={item.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-extrabold text-slate-400">STAGE {item.step}</span>
                    <div className={`p-1.5 rounded-lg border ${item.color}`}>
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Wireless Security Modules (Whitelisting, BLE Pairing, Challenge-Response) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Device Whitelisting Module */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">Device Whitelisting</h3>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Access Control
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Maintain authorized technician tools, reject unbonded third-party devices, and log access attempts.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Link
              to="/whitelist"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <span>Whitelist Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Strong BLE Pairing Module */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
              <Bluetooth className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">Strong BLE Pairing</h3>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  LE Secure Conn.
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Simulate ECDH P-256 key exchange, numeric comparison MITM protection, and AES-CCM link encryption.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Link
              to="/pairing"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <span>Pairing Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Strong Challenge–Response Authentication Module */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">Challenge–Response Auth</h3>
                <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                  HMAC-SHA-256
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Prove diagnostic tool identity via fresh nonces, prevent replay attacks, and enforce pairing prerequisites.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Link
              to="/auth"
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <span>Auth Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Priority Vehicles Requiring Attention */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {highRiskVehicles.length > 0 ? "Vehicles Requiring Attention" : "Fleet Awaiting Live Security Scan"}
            </h3>
            <p className="text-xs text-slate-500">
              {highRiskVehicles.length > 0
                ? "Live scan detected weaknesses requiring workshop hardening"
                : "Select any vehicle below to run the live BLE GATT assessment engine"}
            </p>
          </div>
          <Link
            to="/vehicles"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Vehicles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiclesToDisplay.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>

      {/* Quick Demo Walkthrough Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">Recommended Hackathon Demonstration Flow</h4>
            <p className="text-xs text-amber-900/80 mt-0.5 max-w-2xl leading-relaxed">
              Experience the complete lifecycle with vehicle <strong>CR3W-003</strong>: Run Assessment (High Risk) → View findings → Simulate workshop fixes → Re-assess (Score drops to Low Risk) → Download readiness report.
            </p>
          </div>
        </div>

        <Link
          to="/assessment/CR3W-003"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Launch Demo Flow</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
