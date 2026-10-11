import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { INTAKE_QUESTIONS } from "../data/intakeQuestions";
import { buildVehicleFromIntake } from "../logic/intakeMapper";
import { getVehicles, saveVehicle } from "../logic/storage";
import { useToast } from "../context/ToastContext";

const EMPTY_META = {
  driverName: "",
  regNumber: "",
  model: "",
  bmsModel: "",
  workshopStation: ""
};

export function WorkshopIntake() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState(EMPTY_META);
  const [answers, setAnswers] = useState({});

  const totalSteps = INTAKE_QUESTIONS.length + 1;
  const isMetaStep = step === 0;
  const question = !isMetaStep ? INTAKE_QUESTIONS[step - 1] : null;
  const answeredCount = INTAKE_QUESTIONS.filter((q) => answers[q.field]).length;
  const canContinueMeta = true;
  const canContinueQuestion = question ? Boolean(answers[question.field]) : false;

  const progressPct = useMemo(() => {
    const filled = answeredCount + (meta.workshopStation ? 0.25 : 0);
    return Math.min(100, Math.round((filled / INTAKE_QUESTIONS.length) * 100));
  }, [answeredCount, meta.workshopStation]);

  const handleSelect = (field, optionId) => {
    setAnswers((prev) => ({ ...prev, [field]: optionId }));
  };

  const handleNext = () => {
    if (isMetaStep) {
      setStep(1);
      return;
    }
    if (!canContinueQuestion) {
      addToast("Select what the mechanic observed before continuing.", "warning");
      return;
    }
    if (step < INTAKE_QUESTIONS.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    const missing = INTAKE_QUESTIONS.filter((q) => !answers[q.field]);
    if (missing.length) {
      addToast("Answer all 7 observation questions first.", "warning");
      const firstMissing = INTAKE_QUESTIONS.findIndex((q) => !answers[q.field]);
      setStep(firstMissing + 1);
      return;
    }

    const vehicles = getVehicles();
    const { vehicle } = buildVehicleFromIntake({ vehicles, answers, meta });
    saveVehicle(vehicle);
    addToast(`Workshop profile ${vehicle.id} saved (${vehicle.status}).`, "success");
    navigate(`/assessment/${vehicle.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-mono mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Workshop intake</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              What does this mechanic see on the vehicle?
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              No Bluetooth hack. The technician answers 7 questions from what they can already observe
              on the bay. Answers become a BMS profile, then the same rule engine scores it.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {isMetaStep ? "Vehicle" : `Q${step} / ${INTAKE_QUESTIONS.length}`}
          </span>
        </div>

        <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(8, (step / (totalSteps - 1)) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
          {answeredCount} of 7 security observations recorded
          {progressPct >= 100 ? " — ready to score" : ""}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-950 leading-relaxed">
          This is a readiness interview, not a live scan. Demo fleet vehicles (CR3W-001 to 006) stay as
          baselines. Intake vehicles get IDs like <strong>CR3W-WK-001</strong>.
        </p>
      </div>

      {isMetaStep ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Vehicle on the bay (optional details)</h3>
          <p className="text-xs text-slate-500">
            Skip any field you do not know. The 7 observation questions are what the score uses.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "workshopStation", label: "Workshop / bay", placeholder: "e.g. Bay 3 — Okhla" },
              { key: "driverName", label: "Driver name", placeholder: "e.g. Mohammad Salim" },
              { key: "regNumber", label: "Registration", placeholder: "e.g. DL-3ER-7749" },
              { key: "model", label: "Vehicle model", placeholder: "e.g. Mayuri Deluxe" },
              { key: "bmsModel", label: "BMS label if visible", placeholder: "e.g. AntBMS / JBD / Daly" }
            ].map((field) => (
              <label key={field.key} className="block sm:last:col-span-2">
                <span className="text-[11px] font-semibold text-slate-600">{field.label}</span>
                <input
                  type="text"
                  value={meta[field.key]}
                  onChange={(e) => setMeta((m) => ({ ...m, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{question.title}</h3>
            <p className="text-xs text-slate-500 italic mt-0.5">{question.titleHi}</p>
            <p className="text-xs text-slate-600 mt-2">{question.hint}</p>
          </div>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const selected = answers[question.field] === opt.id;
              const tone =
                opt.id === "pass"
                  ? "border-emerald-300 bg-emerald-50"
                  : opt.id === "warn"
                    ? "border-amber-300 bg-amber-50"
                    : "border-rose-300 bg-rose-50";
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(question.field, opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all ${
                    selected
                      ? `${tone} ring-2 ring-offset-1 ring-slate-400`
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {selected ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 mt-0.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {step === 0 ? (
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {step < INTAKE_QUESTIONS.length ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isMetaStep ? !canContinueMeta : !canContinueQuestion}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{isMetaStep ? "Start observations" : "Next question"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canContinueQuestion}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Save profile and run assessment</span>
          </button>
        )}
      </div>
    </div>
  );
}
