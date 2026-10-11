import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowLeft, 
  ArrowRight, 
  Wrench, 
  FileText, 
  RotateCcw, 
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Info,
  Car,
  Calculator
} from "lucide-react";
import { getVehicleById, getAssessmentResult } from "../logic/storage";
import { runSecurityAssessment } from "../logic/assessmentEngine";
import { RiskBadge } from "../components/RiskBadge";
import { RiskScore } from "../components/RiskScore";
import { FindingCard } from "../components/FindingCard";
import { AssessmentCheck } from "../components/AssessmentCheck";
import { EmptyState } from "../components/EmptyState";
import { ExplainableScoring } from "../components/ExplainableScoring";

export function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);

  useEffect(() => {
    const v = getVehicleById(id);
    setVehicle(v);
    if (v) {
      const data = getAssessmentResult(v.id);
      setAssessmentData(data);
    }
  }, [id]);

  if (!vehicle || !assessmentData) {
    return (
      <EmptyState
        title="Assessment Result Not Found"
        description={`No assessment data available for vehicle "${id}".`}
        actionLabel="Go to Assessment"
        onAction={() => navigate(`/assessment/${id || ""}`)}
      />
    );
  }

  const current = assessmentData.current || runSecurityAssessment(vehicle);
  const before = assessmentData.before;
  const hasImproved = before && before.normalizedRiskScore > current.normalizedRiskScore;

  const isHighRisk = current.overallRisk === "HIGH";
  const isMediumRisk = current.overallRisk === "MEDIUM";
  const isSecure = current.overallRisk === "LOW";

  let bannerBg = "from-slate-900 to-emerald-950 border-emerald-700/50";
  let statusText = "SECURE / LOW RISK";
  let statusSubtitle = "Wireless BMS interfaces meet baseline security readiness standards.";

  if (isHighRisk) {
    bannerBg = "from-slate-900 via-slate-850 to-rose-950 border-rose-800/50";
    statusText = "HIGH RISK DETECTED";
    statusSubtitle = "Unsafe wireless exposure: unauthorized device access and safety command vulnerability.";
  } else if (isMediumRisk) {
    bannerBg = "from-slate-900 to-amber-950 border-amber-800/50";
    statusText = "NEEDS ATTENTION";
    statusSubtitle = "Weak authentication and configuration parameters require workshop hardening.";
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/assessment/${vehicle.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessment Checks</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Assessed: {current.assessedAt}</span>
      </div>

      {/* Top Banner: SECURITY READINESS HERO */}
      <div className={`bg-gradient-to-r ${bannerBg} text-white rounded-2xl p-6 sm:p-8 border shadow-xl relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono uppercase tracking-wider">
              <span>SECURITY READINESS ASSESSMENT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{statusText}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {statusSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
              <span className="bg-white/10 px-2 py-1 rounded">Target: <strong>{vehicle.id}</strong></span>
              <span className="bg-white/10 px-2 py-1 rounded">Model: <strong>{vehicle.model}</strong></span>
              <span className="bg-white/10 px-2 py-1 rounded">BMS: <strong>{vehicle.bmsModel}</strong></span>
            </div>

            <div className="pt-2">
              <a
                href="#explainable-scoring"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-all backdrop-blur-xs"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-300" />
                <span>Explain How We Calculated This ↓</span>
              </a>
            </div>
          </div>

          {/* Risk Score Dial Card */}
          <div className="bg-white rounded-2xl p-5 shadow-2xl text-slate-900 flex flex-col items-center shrink-0 w-full md:w-48 border border-slate-200">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Risk Score
            </p>
            <RiskScore score={current.normalizedRiskScore} max={10} showLabel={true} />
            <p className="text-[11px] text-slate-500 font-mono mt-2">
              Readiness: <strong>{current.readinessPercentage}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Before / After Comparison Banner if Improved */}
      {hasImproved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Security Posture Successfully Improved!</span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Risk score decreased from <strong>{before.normalizedRiskScore}/10 ({before.overallRisk} RISK)</strong> down to <strong>{current.normalizedRiskScore}/10 ({current.overallRisk} RISK)</strong> after workshop remediation.
              </p>
            </div>
          </div>

          <Link
            to={`/report/${vehicle.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>View Full Report</span>
          </Link>
        </div>
      )}

      {/* How CyberRide Reached This Result (Explainable Scoring) */}
      <ExplainableScoring vehicle={vehicle} assessment={current} />

      {/* Two Column Layout: Key Findings & Recommended Fixes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Why is this vehicle at risk? */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Why is this vehicle at risk?</h3>
              <p className="text-xs text-slate-500">Key weakness findings identified by the assessment engine</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {current.keyFindings.length} FINDINGS
            </span>
          </div>

          <div className="space-y-3">
            {current.keyFindings.map((finding, idx) => (
              <FindingCard key={idx} finding={finding} index={idx} />
            ))}
          </div>
        </div>

        {/* Right: Recommended Workshop Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recommended Workshop Actions</h3>
                <p className="text-xs text-slate-500">Prioritized hardening procedures for EV mechanics</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                PRIORITIZED
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {current.recommendedActions.length > 0 ? (
                current.recommendedActions.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 flex items-start space-x-3"
                  >
                    <div className="px-2 py-1 rounded-md bg-blue-600 text-white font-mono font-extrabold text-[10px] shrink-0">
                      P{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-950">{rec.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{rec.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    No urgent actions required
                  </p>
                  <p>All baseline security checks passed. Maintain standard maintenance cycle.</p>
                </div>
              )}
            </div>
          </div>

          {/* Remediation CTA */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to={`/remediation/${vehicle.id}`}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Start Remediation Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Security Checks Detail List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">All Security Check Details</h3>
            <p className="text-xs text-slate-500">Exhaustive breakdown of all 7 evaluated parameters</p>
          </div>
          <Link
            to={`/report/${vehicle.id}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Generate Official Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div>
          {current.checks.map((check, index) => (
            <AssessmentCheck
              key={check.id}
              check={check}
              index={index}
              defaultOpen={check.status === "FAIL"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
