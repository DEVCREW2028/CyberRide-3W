import { INTAKE_QUESTIONS } from "../data/intakeQuestions";
import { runSecurityAssessment } from "./assessmentEngine";

export function nextWorkshopVehicleId(vehicles) {
  const nums = vehicles
    .map((v) => v.id && v.id.match(/^CR3W-WK-(\d+)$/i))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CR3W-WK-${String(next).padStart(3, "0")}`;
}

/**
 * Turns mechanic answers into a vehicle profile the existing engine can score.
 */
export function buildVehicleFromIntake({ vehicles, answers, meta }) {
  const rawProfile = {};
  let connectionType = "BLE (workshop observed)";

  INTAKE_QUESTIONS.forEach((q) => {
    const optionId = answers[q.field];
    const option = q.options.find((o) => o.id === optionId) || q.options[2];
    rawProfile[q.field] = option.profileValue;
    if (option.connectionType) {
      connectionType = option.connectionType;
    }
  });

  const id = nextWorkshopVehicleId(vehicles);
  const now = new Date();
  const timestamp =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    ", " +
    now.toLocaleDateString();

  const vehicle = {
    id,
    model: meta.model?.trim() || "Workshop intake — unidentified 3W pack",
    regNumber: meta.regNumber?.trim() || "UNREGISTERED",
    bmsModel: meta.bmsModel?.trim() || "Observed on bay (generic BLE BMS)",
    batterySpec: meta.batterySpec?.trim() || "48V pack (workshop estimate)",
    connectionType,
    workshopStation: meta.workshopStation?.trim() || "Walk-in bay",
    driverName: meta.driverName?.trim() || "Not recorded",
    status: "Needs Attention",
    lastAssessed: timestamp,
    rawProfile,
    isRemediated: false,
    remediationHistory: [],
    source: "workshop_intake"
  };

  const preview = runSecurityAssessment(vehicle);
  vehicle.status = preview.status;
  vehicle.lastAssessed = "Just now";

  return { vehicle, preview };
}
