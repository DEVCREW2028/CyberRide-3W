/**
 * CyberRide 3W - Backend API Client & Local Fallback
 * 
 * Interacts with the Node.js / Express backend server.
 * Gracefully falls back to local deterministic engine if the backend server is offline.
 */

import { runSecurityAssessment } from "./assessmentEngine";
import { saveAssessmentResult, getVehicleById } from "./storage";

const API_BASE = "/api";

/**
 * Checks if the Node.js backend server is online
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Backend server offline
  }
  return { status: "offline", mode: "in-browser-engine" };
}

/**
 * Executes vehicle security assessment via backend API (or local fallback)
 */
export async function assessVehicle(vehicle) {
  try {
    const res = await fetch(`${API_BASE}/assess/${vehicle.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const data = await res.json();
      // Re-hydrate local storage to keep state in sync
      const localResult = runSecurityAssessment(vehicle);
      saveAssessmentResult(vehicle.id, localResult, vehicle.isRemediated);
      return {
        source: "backend-api",
        data,
        assessment: localResult
      };
    }
  } catch (e) {
    console.info("[CyberRide 3W] Backend unreachable, executing in-browser assessment engine.");
  }

  // Fallback to local in-browser engine
  const localResult = runSecurityAssessment(vehicle);
  saveAssessmentResult(vehicle.id, localResult, vehicle.isRemediated);
  return {
    source: "in-browser-engine",
    assessment: localResult
  };
}

/**
 * Fetches formal methodology data from backend
 */
export async function getMethodology() {
  try {
    const res = await fetch(`${API_BASE}/methodology`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback
  }
  return null;
}
