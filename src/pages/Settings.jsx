import React from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  Info, 
  Car, 
  Award, 
  Wrench, 
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ExternalLink
} from "lucide-react";
import { resetFleetToInitial } from "../logic/storage";
import { useToast } from "../context/ToastContext";

export function Settings() {
  const { addToast } = useToast();

  const handleReset = () => {
    if (window.confirm("Reset all fleet vehicles and assessment results back to default demo state?")) {
      resetFleetToInitial();
      addToast("Demo baseline successfully restored.", "info");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          About CyberRide 3W & Prototype Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Architectural overview, safety positioning, AIS-156 context, and demo environment controls.
        </p>
      </div>

      {/* Mandatory Hackathon Prototype Disclaimers Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-amber-300">Hackathon Prototype Notice</h3>
        </div>

        <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
          <p>
            <strong>CyberRide 3W</strong> is a hackathon prototype developed for the <em>SHIFT Sustainable e-Micromobility Hackathon</em>.
          </p>
          <p>
            This application provides a lightweight <strong>security-readiness assessment workflow</strong> using simulated BMS profiles. It does <strong>NOT</strong> perform real-world hardware penetration testing, regulatory certification, or provide guaranteed cybersecurity immunity.
          </p>
          <p className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-slate-300">
            <strong>AIS-156 Positioning:</strong> Assessment is informed by wireless-BMS security considerations relevant to Indian EV battery safety requirements. It does not replace formal AIS-156 laboratory certification or government approval.
          </p>
        </div>
      </div>

      {/* Product Architecture & Purpose */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
          Product Understanding & Core Purpose
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-600" />
              The Problem
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Low-cost e-rickshaws increasingly feature Bluetooth BMS units. Default PINs and open GATT UARTs can allow nearby phones to issue unauthorized cutoff commands.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              The Solution
            </h4>
            <p className="text-slate-600 leading-relaxed">
              A straightforward diagnostic tool for workshop mechanics: Assess wireless exposure, explain risks simply, guide simulated remediation, and re-test.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-600" />
              Target Users
            </h4>
            <p className="text-slate-600 leading-relaxed">
              1. Small EV workshops<br />
              2. E-rickshaw service technicians<br />
              3. Local fleet operators & depot supervisors
            </p>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider mb-1">
            Demo Environment Resets
          </h3>
          <p className="text-xs text-slate-500">
            Selectively reset simulated demo data without affecting other browser storage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Reset Vehicle Fleet & Assessments</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Restores CR3W-001, CR3W-002, and CR3W-003 initial risk scores and profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fleet Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
