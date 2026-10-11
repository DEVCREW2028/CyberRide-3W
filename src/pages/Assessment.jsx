import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Activity, 
  Car, 
  Bluetooth, 
  BatteryCharging, 
  ArrowLeft, 
  Play, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Zap,
  Radio
} from "lucide-react";
import { getVehicleById, saveAssessmentResult } from "../logic/storage";
import { runSecurityAssessment } from "../logic/assessmentEngine";
import { assessVehicle } from "../logic/api";
import { AssessmentCheck } from "../components/AssessmentCheck";
import { RiskBadge } from "../components/RiskBadge";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/EmptyState";

export function Assessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [vehicle, setVehicle] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = [
    "Discovering BLE GATT Services & Advertised UUIDs...",
    "Querying Authentication Handshake & Pairing PIN Requirement...",
    "Transmitting Telemetry to Backend Engine (POST /api/assess)...",
    "Testing Access Control Policies & Whitelisting...",
    "Probing Safety-Critical Command Handlers (Discharge Cutoff)...",
    "Auditing BMS Parameter Registers & Calibration Lock...",
    "Calculating Penalty Sum & Normalized Risk Index (0-10)...",
    "Evaluating Firmware Bootloader & Finalizing Posture..."
  ];

  useEffect(() => {
    const v = getVehicleById(id);
    setVehicle(v);
    if (v) {
      const res = runSecurityAssessment(v);
      setAssessment(res);
    }
  }, [id]);

  const handleRunAssessment = async () => {
    if (!vehicle) return;
    setIsScanning(true);
    setScanStep(0);

    // Realistic step progression
    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < scanSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 220);

    try {
      const outcome = await assessVehicle(vehicle);
      setTimeout(() => {
        clearInterval(interval);
        setAssessment(outcome.assessment);
        setIsScanning(false);
        addToast(
          outcome.source === "backend-api"
            ? `Backend engine successfully evaluated ${vehicle.id}.`
            : `Security assessment completed for ${vehicle.id}.`,
          "success"
        );
        navigate(`/results/${vehicle.id}`);
      }, 1600);
    } catch (e) {
      clearInterval(interval);
      setIsScanning(false);
      navigate(`/results/${vehicle.id}`);
    }
  };

  if (!vehicle || !assessment) {
    return (
      <EmptyState
        title="Vehicle Not Found"
        description={`Unable to load vehicle assessment profile for "${id}".`}
        actionLabel="Back to Fleet"
        onAction={() => navigate("/vehicles")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vehicle Details</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Deterministic Rule-Based Engine</span>
      </div>

      {/* Main Vehicle Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Assessment Target
            </span>
            <RiskBadge status={vehicle.status} size="sm" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight flex items-center gap-2">
            <span>{vehicle.id}</span>
            <span className="text-sm font-sans font-normal text-slate-500">({vehicle.model})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            <span>BMS: <strong className="text-slate-800 font-mono">{vehicle.bmsModel}</strong></span>
            <span>•</span>
            <span>Link: <strong className="text-slate-800 font-mono">{vehicle.connectionType}</strong></span>
            <span>•</span>
            <span>Station: <strong className="text-slate-800">{vehicle.workshopStation}</strong></span>
          </div>
        </div>

        {/* Big Action CTA */}
        <div className="w-full md:w-auto">
          <button
            type="button"
            onClick={handleRunAssessment}
            disabled={isScanning}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running Simulated Assessment...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scanning Active Overlay / Progress */}
      {isScanning && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="font-bold text-sm">Evaluating Simulated BMS Wireless Profile</span>
            </div>
            <span className="text-xs font-mono text-blue-300">
              Check {scanStep + 1} of {scanSteps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-200 rounded-full"
              style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
            />
          </div>

          <p className="text-xs font-mono text-slate-300">
            &gt; {scanSteps[scanStep]}
          </p>
        </div>
      )}

      {/* Security Checks Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-base font-bold text-slate-900">Evaluated Security Checks</h3>
            <p className="text-xs text-slate-500">
              7 baseline wireless BMS readiness checks. Click any check to view explanation and workshop remediation.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
              {assessment.passedCount} Pass
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
              {assessment.warningCount} Warn
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold border border-rose-200">
              {assessment.failedCount} Fail
            </span>
          </div>
        </div>

        <div>
          {assessment.checks.map((check, index) => (
            <AssessmentCheck
              key={check.id}
              check={check}
              index={index}
              defaultOpen={index === 0 || check.status === "FAIL"}
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          <p className="font-semibold text-slate-800">Deterministic scoring applied.</p>
          <p>Click "Run Assessment" to re-evaluate or proceed directly to results.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            to={`/results/${vehicle.id}`}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Full Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
