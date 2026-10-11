import React, { useState } from "react";
import { 
  Calculator, 
  Binary, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Sliders,
  ShieldCheck,
  Radio,
  KeyRound,
  ShieldAlert,
  ZapOff,
  WifiOff,
  Cpu,
  Layers
} from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import { RiskScore } from "./RiskScore";
import { CHECK_DEFINITIONS } from "../logic/assessmentEngine";

const PROFILE_FIELD_LABELS = [
  { key: "wirelessInterface", label: "Wireless Interface", icon: Radio },
  { key: "authentication", label: "Authentication Credentials", icon: KeyRound },
  { key: "unauthorizedAccess", label: "Access Controls", icon: ShieldAlert },
  { key: "safetyCommands", label: "Safety Commands (Discharge/MOSFET)", icon: ZapOff },
  { key: "configProtection", label: "Configuration Protection", icon: Sliders },
  { key: "wirelessAccessControl", label: "Session & Broadcast Control", icon: WifiOff },
  { key: "firmwareAccess", label: "Firmware / OTA Integrity", icon: Cpu }
];

export function ExplainableScoring({ vehicle, assessment }) {
  const [inputsOpen, setInputsOpen] = useState(true);

  if (!vehicle || !assessment) return null;

  const rawProfile = vehicle.rawProfile || {};
  const checks = assessment.checks || [];

  // Compute or format values
  const checkScores = checks.map(c => typeof c.score === "number" ? c.score : 0);
  const totalPenaltyPoints = checks.reduce((sum, c) => sum + (c.score || 0), 0);
  const maxPossibleScore = checks.length * 2 || 14;
  const rawNormalized = (totalPenaltyPoints / maxPossibleScore) * 10;
  const roundedRiskScore = Math.min(10, Math.round(rawNormalized));

  // Threshold bracket determination
  let selectedBracket = "LOW";
  let bracketReason = "";
  if (totalPenaltyPoints >= 6) {
    selectedBracket = "HIGH";
    bracketReason = `Total penalty points (${totalPenaltyPoints}) ≥ 6 threshold`;
  } else if (totalPenaltyPoints >= 3) {
    selectedBracket = "MEDIUM";
    bracketReason = `Total penalty points (${totalPenaltyPoints}) falls in the 3 – 5 range`;
  } else {
    selectedBracket = "LOW";
    bracketReason = `Total penalty points (${totalPenaltyPoints}) falls in the 0 – 2 range`;
  }

  return (
    <div id="explainable-scoring" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 scroll-mt-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>DETERMINISTIC PIPELINE CALCULATION</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>How CyberRide Calculated This (Explainable Engine)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Step-by-step pipeline calculation for vehicle <strong className="font-mono text-slate-900">{vehicle.id}</strong>. Similar to solving a quadratic equation, every intermediate penalty value, formula substitution, and threshold decision is transparently revealed below.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
            <span className="text-slate-500">Overall Status:</span>
            <RiskBadge status={assessment.status || assessment.overallRisk} size="sm" />
          </div>
        </div>

        {/* Visual Pipeline Progression (Input Profile → Check Results → Penalty Sum → Risk Score Formula → Threshold → Final) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] font-mono text-slate-600">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mr-1">Pipeline:</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">1. Input Profile</span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">2. Check Results</span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">3. Penalty Sum ({totalPenaltyPoints} pts)</span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">4. Formula ({roundedRiskScore}/10)</span>
          <span className="text-slate-400">→</span>
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-xs">5. Threshold ({selectedBracket})</span>
        </div>
      </div>

      {/* Step 1: Input Used */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
              1
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Input Parameters Extracted (Simulated BMS Profile)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setInputsOpen(!inputsOpen)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200"
          >
            <span>{inputsOpen ? "Hide Profile Inputs" : "View 7 Profile Inputs"}</span>
            {inputsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-slate-500 pl-8">
          The assessment engine reads these 7 simulated wireless configuration fields from profile <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">{vehicle.id}</code>:
        </p>

        {/* Collapsible / Expandable Grid of Profile Inputs */}
        {inputsOpen && (
          <div className="pl-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 animate-fade-in">
            {PROFILE_FIELD_LABELS.map(({ key, label, icon: Icon }) => {
              const val = rawProfile[key] || "Not configured";
              return (
                <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                      <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    <code className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      {key}
                    </code>
                  </div>
                  <p className="font-mono text-slate-700 text-[11px] bg-white p-2 rounded-lg border border-slate-100 break-words leading-relaxed">
                    {val}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Per-Check Evaluation Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
            2
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            Per-Check Rule Evaluation & Penalty Scoring (7 Checks)
          </h4>
        </div>
        <p className="text-xs text-slate-500 pl-8">
          Each check applies an explainable pattern matching rule. Penalty scores: <strong className="text-emerald-700">PASS = 0 pts</strong>, <strong className="text-amber-700">WARNING = 1 pt</strong>, <strong className="text-rose-700">FAIL = 2 pts</strong>.
        </p>

        <div className="pl-8 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
                <th className="py-3 px-3 font-bold w-10 text-center whitespace-nowrap">#</th>
                <th className="py-3 px-3 font-bold min-w-[190px]">Security Check</th>
                <th className="py-3 px-3 font-bold min-w-[210px]">Detected Value</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">Rule Matched</th>
                <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {checks.map((check, idx) => {
                const fallbackRule = CHECK_DEFINITIONS.find(d => d.id === check.id)?.evaluate(rawProfile)?.matchedRule || "rule_matched";
                const ruleName = check.matchedRule || fallbackRule;
                const isFail = check.status === "FAIL";
                const isWarn = check.status === "WARNING";
                const rowBg = isFail ? "bg-rose-50/30" : isWarn ? "bg-amber-50/20" : "bg-white";

                return (
                  <tr key={check.id} className={`${rowBg} hover:bg-slate-50 transition-colors`}>
                    <td className="py-3 px-3 font-mono font-bold text-slate-400 text-center">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 leading-snug">{check.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{check.id}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700 leading-relaxed">
                      {check.detected}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <code className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block whitespace-nowrap">
                        {ruleName}
                      </code>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <RiskBadge status={check.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded text-xs ${
                        isFail 
                          ? "bg-rose-100 text-rose-800 border border-rose-200" 
                          : isWarn 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        +{check.score} pt{check.score !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-mono font-bold text-slate-900">
                <td colSpan={5} className="py-3 px-3 text-right text-xs uppercase tracking-wider">
                  Total Accumulated Penalty Points (sum):
                </td>
                <td className="py-3 px-3 text-right text-sm text-blue-700 bg-blue-50/50 whitespace-nowrap">
                  {totalPenaltyPoints} pts
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Step 3: Formula & Mathematical Substitution */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
            3
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            Formula & Mathematical Substitution
          </h4>
        </div>
        <p className="text-xs text-slate-500 pl-8">
          The normalized risk score is calculated by scaling penalty points over the maximum possible penalty score (14 points) onto a 10-point scale:
        </p>

        <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Sum */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              STEP 3.1 • TOTAL PENALTY
            </span>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
              <p className="text-[11px] text-slate-500">totalPenaltyPoints = Σ(check.score)</p>
              <p className="font-bold text-blue-600">
                = {checkScores.join(" + ")}
              </p>
              <p className="text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                = {totalPenaltyPoints} pts
              </p>
            </div>
          </div>

          {/* Card 2: Max Possible */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              STEP 3.2 • MAXIMUM POSSIBLE
            </span>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
              <p className="text-[11px] text-slate-500">maxPossibleScore = checks.length × 2</p>
              <p className="font-bold text-blue-600">
                = {checks.length} checks × 2 pts
              </p>
              <p className="text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                = {maxPossibleScore} pts
              </p>
            </div>
          </div>

          {/* Card 3: Normalization */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-700">
              STEP 3.3 • NORMALIZATION
            </span>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 font-mono text-xs text-slate-800 space-y-1">
              <p className="text-[11px] text-slate-500">normalizedRisk = round((total / max) × 10)</p>
              <p className="font-bold text-blue-600">
                = round(({totalPenaltyPoints} / {maxPossibleScore}) × 10)
              </p>
              <p className="text-blue-900 font-black text-sm pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>= {roundedRiskScore} / 10</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({rawNormalized.toFixed(1)} raw)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Threshold Mapping */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
            4
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            Decision Matrix & Threshold Classification
          </h4>
        </div>
        <p className="text-xs text-slate-500 pl-8">
          The overall risk category is classified using deterministic penalty point thresholds:
        </p>

        <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bracket 1: LOW */}
          <div className={`p-4 rounded-xl border transition-all ${
            selectedBracket === "LOW"
              ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-sm"
              : "bg-slate-50 border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-700">0 – 2 Penalty Pts</span>
              {selectedBracket === "LOW" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-600 text-white animate-pulse">
                  ACTIVE BRACKET
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-sm text-slate-900">LOW RISK → "Secure"</h5>
            </div>
            <p className="text-[11px] text-slate-600">
              Minimal or zero exposure. Interfaces adhere to baseline workshop security requirements.
            </p>
          </div>

          {/* Bracket 2: MEDIUM */}
          <div className={`p-4 rounded-xl border transition-all ${
            selectedBracket === "MEDIUM"
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-sm"
              : "bg-slate-50 border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-700">3 – 5 Penalty Pts</span>
              {selectedBracket === "MEDIUM" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-600 text-white animate-pulse">
                  ACTIVE BRACKET
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h5 className="font-bold text-sm text-slate-900">MEDIUM RISK → "Needs Attention"</h5>
            </div>
            <p className="text-[11px] text-slate-600">
              Weak PINs, soft locks, or generic broadcast detected. Workshop hardening advised.
            </p>
          </div>

          {/* Bracket 3: HIGH */}
          <div className={`p-4 rounded-xl border transition-all ${
            selectedBracket === "HIGH"
              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400 shadow-sm"
              : "bg-slate-50 border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-700">6+ Penalty Pts</span>
              {selectedBracket === "HIGH" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-600 text-white animate-pulse">
                  ACTIVE BRACKET
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <h5 className="font-bold text-sm text-slate-900">HIGH RISK → "High Risk"</h5>
            </div>
            <p className="text-[11px] text-slate-600">
              Safety-critical MOSFET/discharge commands exposed or missing auth. Immediate remediation required.
            </p>
          </div>
        </div>

        {/* Explainability Conclusion Pill */}
        <div className="pl-8 pt-2">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-slate-800 leading-relaxed">
                <strong>Audit Decision:</strong> Vehicle <code className="font-mono font-bold text-slate-900">{vehicle.id}</code> accumulated <strong>{totalPenaltyPoints} penalty points</strong> ({bracketReason}), resulting in <strong>{assessment.overallRisk} RISK ({assessment.status})</strong> with a <strong>{roundedRiskScore}/10</strong> normalized risk score.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
              <RiskScore score={roundedRiskScore} max={10} size="compact" showLabel={false} />
              <div className="text-right font-mono text-[11px] text-blue-800 font-bold border-l border-slate-200 pl-3">
                Readiness: {assessment.readinessPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplainableScoring;
