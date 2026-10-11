import express from "express";
import cors from "cors";
import { CHECK_DEFINITIONS, runSecurityAssessment, getRemediatedProfile } from "../src/logic/assessmentEngine.js";
import { INITIAL_VEHICLES } from "../src/data/mockVehicles.js";
import { REMEDIATION_STEPS } from "../src/data/remediationActions.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory runtime state (backed by mock vehicles baseline)
let runtimeVehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
let runtimeAssessments = {};

/**
 * Health check & runtime telemetry
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "CyberRide 3W Assessment Engine API",
    version: "1.0.0",
    engine: "Deterministic Rule-Based Automotive BMS Evaluator",
    standards: ["AIS-156 Amd 3", "AIS-038 Rev 2", "ISO/SAE 21434"],
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * Formal Methodology & Architectural Blueprint
 * Used for judges/audit inspection
 */
app.get("/api/methodology", (req, res) => {
  res.json({
    methodologyTitle: "CyberRide 3W: Connected E-Rickshaw Wireless BMS Security Assessment Pipeline",
    purpose: "Explainable, standards-aligned cybersecurity auditing for light electric micromobility BMS interfaces.",
    pipelineStages: [
      {
        stage: 1,
        name: "BLE GATT Interrogation & Telemetry Ingestion",
        description: "Simulates active interrogation of BLE GATT services, advertising packets, and characteristics (e.g. 0xFFE0 UART, 0x2A00 Device Info) from the target BMS controller."
      },
      {
        stage: 2,
        name: "Security Feature Vector Extraction",
        description: "Normalizes raw GATT attributes into 7 evaluated security parameters: Interface Exposure, Authentication, Unauthorized Access, Safety Commands, Config Lock, Session Timing, and OTA Firmware Integrity."
      },
      {
        stage: 3,
        name: "Deterministic Automotive Cyber Assessment Engine",
        description: "Executes 7 deterministic evaluation checks without opaque machine learning. Each check applies a verified automotive safety rule and assigns penalty points (PASS: 0, WARNING: 1, FAIL: 2)."
      },
      {
        stage: 4,
        name: "Quantitative Normalization & Risk Tier Classification",
        description: "Sums penalty points and normalizes to a 10-point scale: normalizedRisk = round((totalPenalty / maxPenalty) * 10). Classifies into LOW (0-2), MEDIUM (3-5), or HIGH (6+) risk."
      },
      {
        stage: 5,
        name: "Technician Remediation Verification Loop",
        description: "Workshop mechanics apply specific configuration hardening procedures. The engine re-tests the modified profile and generates before/after improvement proofs."
      }
    ],
    checks: CHECK_DEFINITIONS.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      scoring: "PASS = 0 pts penalty, WARNING = 1 pt penalty, FAIL = 2 pts penalty"
    })),
    scoringFormula: {
      totalPenalty: "sum(check.score)",
      maxScore: "checks.length * 2 = 14",
      normalizedRiskScore: "round((totalPenalty / 14) * 10)",
      thresholds: {
        "LOW (Secure)": "0 - 2 penalty points",
        "MEDIUM (Needs Attention)": "3 - 5 penalty points",
        "HIGH (High Risk)": "6+ penalty points"
      }
    }
  });
});

/**
 * Get all vehicles with live status
 */
app.get("/api/vehicles", (req, res) => {
  res.json({
    count: runtimeVehicles.length,
    vehicles: runtimeVehicles
  });
});

/**
 * Get single vehicle by ID
 */
app.get("/api/vehicles/:id", (req, res) => {
  const vehicle = runtimeVehicles.find(v => v.id.toLowerCase() === req.params.id.toLowerCase());
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle ${req.params.id} not found.` });
  }
  const assessment = runtimeAssessments[vehicle.id] || null;
  res.json({
    vehicle,
    assessment
  });
});

/**
 * Run Security Assessment on Backend (Live evaluation)
 */
app.post("/api/assess/:id", (req, res) => {
  const vehicle = runtimeVehicles.find(v => v.id.toLowerCase() === req.params.id.toLowerCase());
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle ${req.params.id} not found.` });
  }

  // Execute assessment engine logic on the backend
  const result = runSecurityAssessment(vehicle);

  // Update vehicle status live based on calculation
  vehicle.status = result.status; // 'Secure' | 'Needs Attention' | 'High Risk'
  vehicle.lastAssessed = "Just now (Backend Scan)";

  // Store assessment result with history tracking
  const existing = runtimeAssessments[vehicle.id];
  runtimeAssessments[vehicle.id] = {
    current: result,
    initial: existing ? existing.initial : result,
    before: existing ? (existing.before || existing.current) : null,
    history: existing ? [result, ...existing.history] : [result]
  };

  res.json({
    message: `Assessment successfully executed on backend for vehicle ${vehicle.id}`,
    vehicleId: vehicle.id,
    calculatedStatus: vehicle.status,
    normalizedRiskScore: result.normalizedRiskScore,
    totalPenaltyPoints: result.checks.reduce((sum, c) => sum + c.score, 0),
    maxPossibleScore: result.checks.length * 2,
    readinessPercentage: result.readinessPercentage,
    overallRisk: result.overallRisk,
    checks: result.checks,
    keyFindings: result.keyFindings,
    recommendedActions: result.recommendedActions,
    assessedAt: result.assessedAt,
    calculationProof: {
      formula: "normalizedRiskScore = round((totalPenaltyPoints / maxPossibleScore) * 10)",
      substitution: `round((${result.checks.reduce((sum, c) => sum + c.score, 0)} / ${result.checks.length * 2}) * 10) = ${result.normalizedRiskScore}/10`,
      classificationReason: `Total penalty (${result.checks.reduce((sum, c) => sum + c.score, 0)}) maps to ${result.overallRisk} risk bracket.`
    }
  });
});

/**
 * Get assessment result for a vehicle
 */
app.get("/api/assess/:id", (req, res) => {
  const assessment = runtimeAssessments[req.params.id];
  if (!assessment) {
    return res.status(404).json({ error: `No assessment found for vehicle ${req.params.id}` });
  }
  res.json(assessment);
});

/**
 * Apply remediation on Backend
 */
app.post("/api/remediate/:id", (req, res) => {
  const vehicle = runtimeVehicles.find(v => v.id.toLowerCase() === req.params.id.toLowerCase());
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle ${req.params.id} not found.` });
  }

  const { completedActionIds = [] } = req.body;
  const updatedProfile = getRemediatedProfile(vehicle.rawProfile, completedActionIds);
  vehicle.rawProfile = updatedProfile;
  vehicle.isRemediated = completedActionIds.length > 0;

  res.json({
    message: `Remediation applied to ${vehicle.id}`,
    vehicle,
    completedActionIds
  });
});

/**
 * Reset fleet data
 */
app.post("/api/reset", (req, res) => {
  runtimeVehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
  runtimeAssessments = {};
  res.json({ message: "Fleet baseline reset successfully." });
});

app.listen(PORT, () => {
  console.log(`[CyberRide 3W Backend] Assessment API listening on http://localhost:${PORT}`);
});
