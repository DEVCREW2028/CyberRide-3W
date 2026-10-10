/**
 * CyberRide 3W - Strong BLE Pairing Security Simulation Engine
 * 
 * NOTE: SIMULATED BLE PAIRING — NO PHYSICAL BMS/BLE CONNECTION.
 * This module models Bluetooth Low Energy (BLE) pairing security profiles and access control
 * for connected e-rickshaw Battery Management Systems.
 * 
 * Hardware Requirement Notice:
 * Real BLE LE Secure Connections requires Bluetooth 4.2+ compatible hardware, a compliant BLE stack,
 * and ECDH P-256 cryptographic support. A web UI alone cannot enable or enforce this on a physical BMS.
 */

import { findDeviceInRegistry, getWhitelistRegistry, formatTimestamp, isStorageAvailable } from "./whitelisting.js";

export const STORAGE_KEY_PAIRING_LOGS = "cyberride_3w_pairing_logs";

export const PAIRING_METHODS = {
  LE_SECURE_CONNECTIONS: "LE_SECURE_CONNECTIONS", // Bluetooth 4.2+ ECDH P-256 key exchange
  LEGACY_JUST_WORKS: "LEGACY_JUST_WORKS",         // Unauthenticated, zero MITM protection
  LEGACY_PASSKEY: "LEGACY_PASSKEY"                // Legacy 6-digit static PIN, vulnerable to eavesdropping
};

export const PAIRING_METHOD_LABELS = {
  [PAIRING_METHODS.LE_SECURE_CONNECTIONS]: "LE Secure Connections (ECDH P-256)",
  [PAIRING_METHODS.LEGACY_JUST_WORKS]: "Legacy Just Works (Unauthenticated)",
  [PAIRING_METHODS.LEGACY_PASSKEY]: "Legacy Passkey Entry (Weak Static PIN)"
};

export const AUTH_MODES = {
  AUTHENTICATED: "AUTHENTICATED",     // Numeric comparison or authenticated passkey with MITM protection
  UNAUTHENTICATED: "UNAUTHENTICATED" // No MITM protection, unbonded or unverified
};

export const AUTH_MODE_LABELS = {
  [AUTH_MODES.AUTHENTICATED]: "Authenticated (Numeric Comparison / MITM Protection)",
  [AUTH_MODES.UNAUTHENTICATED]: "Unauthenticated (No MITM Protection)"
};

export const ENCRYPTION_MODES = {
  ENABLED: "ENABLED",   // AES-CCM link encryption active
  DISABLED: "DISABLED"  // Plaintext session (no link encryption)
};

export const ENCRYPTION_MODE_LABELS = {
  [ENCRYPTION_MODES.ENABLED]: "Link Encryption Enabled (AES-CCM)",
  [ENCRYPTION_MODES.DISABLED]: "Link Encryption Disabled (Plaintext)"
};

export const PAIRING_RESULTS = {
  SECURE_CONFIG: "SECURE CONFIGURATION (SIMULATED)",
  WEAK_CONFIG: "WEAK CONFIGURATION (SIMULATED)",
  PAIRING_DENIED: "PAIRING DENIED",
  INVALID: "INVALID INPUT"
};

export const INITIAL_DEMO_PAIRING_LOGS = [
  {
    id: "LOG-PAIR-01",
    timestamp: "10-Oct-2026 10:20:15 AM",
    deviceId: "TECH-TAB-01",
    deviceName: "Workshop Diagnostic Tablet (Bay 1)",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED,
    result: PAIRING_RESULTS.SECURE_CONFIG,
    isSecure: true,
    isAllowed: true,
    reasons: [
      "Device identity verified in active authorized whitelist.",
      "LE Secure Connections ECDH P-256 key exchange verified.",
      "Authenticated numeric comparison protects against MITM.",
      "AES-CCM link encryption active for wireless telemetry."
    ],
    isSimulated: true
  },
  {
    id: "LOG-PAIR-02",
    timestamp: "10-Oct-2026 10:18:40 AM",
    deviceId: "TECH-PHN-OLD",
    deviceName: "Decommissioned Service Phone",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED,
    result: PAIRING_RESULTS.PAIRING_DENIED,
    isSecure: false,
    isAllowed: false,
    reasons: [
      "Device authorization revoked in whitelist registry. Blocked from pairing regardless of pairing parameters."
    ],
    isSimulated: true
  },
  {
    id: "LOG-PAIR-03",
    timestamp: "10-Oct-2026 10:17:05 AM",
    deviceId: "TECH-TAB-01",
    deviceName: "Workshop Diagnostic Tablet (Bay 1)",
    pairingMethod: PAIRING_METHODS.LEGACY_JUST_WORKS,
    authMode: AUTH_MODES.UNAUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.DISABLED,
    result: PAIRING_RESULTS.WEAK_CONFIG,
    isSecure: false,
    isAllowed: false,
    reasons: [
      "Legacy Just Works in use: vulnerable to passive eavesdropping and impersonation.",
      "Unauthenticated pairing lacks MITM protection.",
      "Link encryption is disabled: data would transmit unencrypted."
    ],
    isSimulated: true
  }
];

// In-memory fallback if localStorage is disabled/restricted
let memoryPairingLogs = null;

/**
 * Pure evaluation function for Strong BLE Pairing security.
 * 
 * Rules:
 * 1. Device ID must be non-empty and valid.
 * 2. Device must exist in the active registry and have status === 'Authorized'.
 *    - Unknown device => PAIRING_DENIED.
 *    - Revoked device => PAIRING_DENIED.
 *    - A strong pairing method must NEVER bypass device authorization.
 * 3. To achieve SECURE CONFIGURATION (SIMULATED):
 *    - Device must be currently Authorized.
 *    - Pairing method must be LE_SECURE_CONNECTIONS.
 *    - Auth mode must be AUTHENTICATED.
 *    - Encryption mode must be ENABLED.
 * 4. If device is Authorized but any security setting is deficient:
 *    - Result is WEAK CONFIGURATION (SIMULATED).
 *    - Never call it secure. Provide exact reasons for each deficiency.
 */
export function evaluatePairingSecurity(
  {
    deviceId,
    pairingMethod = PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode = AUTH_MODES.AUTHENTICATED,
    encryptionMode = ENCRYPTION_MODES.ENABLED
  },
  registry = []
) {
  const trimmedId = typeof deviceId === "string" ? deviceId.trim() : "";

  if (!trimmedId) {
    return {
      result: PAIRING_RESULTS.INVALID,
      isSecure: false,
      isAllowed: false,
      reasons: ["Device identifier is required. Please specify a device ID to test."],
      device: null,
      searchedId: "",
      pairingMethod,
      authMode,
      encryptionMode,
      isSimulated: true
    };
  }

  const device = findDeviceInRegistry(registry, trimmedId);

  // 1. Unknown device check: MUST DENY regardless of other settings
  if (!device) {
    return {
      result: PAIRING_RESULTS.PAIRING_DENIED,
      isSecure: false,
      isAllowed: false,
      reasons: [
        "Device not registered in active whitelist registry.",
        "Unregistered devices cannot establish a trusted pairing relationship with the BMS."
      ],
      device: null,
      searchedId: trimmedId,
      pairingMethod,
      authMode,
      encryptionMode,
      isSimulated: true
    };
  }

  // 2. Revoked device check: MUST DENY regardless of other settings
  if (device.status === "Revoked") {
    return {
      result: PAIRING_RESULTS.PAIRING_DENIED,
      isSecure: false,
      isAllowed: false,
      reasons: [
        "Device authorization revoked in whitelist registry.",
        "Revoked diagnostic devices are strictly prohibited from establishing BLE pairing sessions."
      ],
      device,
      searchedId: trimmedId,
      pairingMethod,
      authMode,
      encryptionMode,
      isSimulated: true
    };
  }

  // 3. Fallback check for any non-authorized status
  if (device.status !== "Authorized") {
    return {
      result: PAIRING_RESULTS.PAIRING_DENIED,
      isSecure: false,
      isAllowed: false,
      reasons: [`Device status is '${device.status}'. Only Authorized devices may pair.`],
      device,
      searchedId: trimmedId,
      pairingMethod,
      authMode,
      encryptionMode,
      isSimulated: true
    };
  }

  // 4. Device is Authorized — Evaluate BLE pairing security parameters
  const deficiencies = [];
  const securePassedPoints = [];

  // Check pairing method
  if (pairingMethod === PAIRING_METHODS.LE_SECURE_CONNECTIONS) {
    securePassedPoints.push("LE Secure Connections with ECDH P-256 key exchange active.");
  } else if (pairingMethod === PAIRING_METHODS.LEGACY_JUST_WORKS) {
    deficiencies.push("Legacy Just Works pairing method in use: lacks cryptographic key authentication; vulnerable to eavesdropping and MITM spoofing.");
  } else if (pairingMethod === PAIRING_METHODS.LEGACY_PASSKEY) {
    deficiencies.push("Legacy Passkey entry in use: uses static or crackable 6-digit PIN prone to passive over-the-air brute force.");
  } else {
    deficiencies.push(`Unrecognized or non-standard pairing method selected (${pairingMethod}).`);
  }

  // Check authentication mode
  if (authMode === AUTH_MODES.AUTHENTICATED) {
    securePassedPoints.push("Authenticated pairing enforced (Numeric Comparison / MITM protection).");
  } else {
    deficiencies.push("Unauthenticated pairing: pairing link lacks mutual identity verification against Man-in-the-Middle attacks.");
  }

  // Check encryption
  if (encryptionMode === ENCRYPTION_MODES.ENABLED) {
    securePassedPoints.push("AES-CCM authenticated link encryption enabled.");
  } else {
    deficiencies.push("Link encryption is disabled: BMS telemetry, state-of-charge, and control commands transmit in plaintext over the air.");
  }

  // If ALL checks pass => SECURE CONFIGURATION (SIMULATED)
  if (deficiencies.length === 0) {
    return {
      result: PAIRING_RESULTS.SECURE_CONFIG,
      isSecure: true,
      isAllowed: true,
      reasons: [
        `Device '${device.id}' (${device.name}) is authorized in active whitelist.`,
        ...securePassedPoints
      ],
      device,
      searchedId: trimmedId,
      pairingMethod,
      authMode,
      encryptionMode,
      isSimulated: true
    };
  }

  // Otherwise => WEAK CONFIGURATION (SIMULATED)
  return {
    result: PAIRING_RESULTS.WEAK_CONFIG,
    isSecure: false,
    isAllowed: false, // In high-security workshop profile, weak configurations are rejected from production BMS sessions
    reasons: [
      `Device '${device.id}' is authorized, but pairing parameters fail baseline security readiness:`,
      ...deficiencies
    ],
    device,
    searchedId: trimmedId,
    pairingMethod,
    authMode,
    encryptionMode,
    isSimulated: true
  };
}

/**
 * Safely parse and sanitize pairing logs array from storage.
 */
function sanitizePairingLogs(parsed) {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(log =>
    log &&
    typeof log.id === "string" &&
    typeof log.timestamp === "string" &&
    typeof log.deviceId === "string" &&
    (log.result === PAIRING_RESULTS.SECURE_CONFIG ||
     log.result === PAIRING_RESULTS.WEAK_CONFIG ||
     log.result === PAIRING_RESULTS.PAIRING_DENIED ||
     log.result === PAIRING_RESULTS.INVALID)
  );
}

/**
 * Get pairing security event logs.
 */
export function getPairingLogs() {
  if (!isStorageAvailable()) {
    if (!memoryPairingLogs) memoryPairingLogs = JSON.parse(JSON.stringify(INITIAL_DEMO_PAIRING_LOGS));
    return memoryPairingLogs;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PAIRING_LOGS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_PAIRING_LOGS, JSON.stringify(INITIAL_DEMO_PAIRING_LOGS));
      return INITIAL_DEMO_PAIRING_LOGS;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizePairingLogs(parsed);
    if (!sanitized) {
      window.localStorage.setItem(STORAGE_KEY_PAIRING_LOGS, JSON.stringify(INITIAL_DEMO_PAIRING_LOGS));
      return INITIAL_DEMO_PAIRING_LOGS;
    }
    return sanitized;
  } catch (err) {
    console.warn("Error reading pairing logs from localStorage:", err);
    return INITIAL_DEMO_PAIRING_LOGS;
  }
}

/**
 * Save pairing logs to storage.
 */
export function savePairingLogs(logs) {
  if (!Array.isArray(logs)) return getPairingLogs();

  if (!isStorageAvailable()) {
    memoryPairingLogs = logs;
    return logs;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_PAIRING_LOGS, JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.error("Failed to save pairing logs to localStorage:", err);
    memoryPairingLogs = logs;
    return logs;
  }
}

/**
 * Clear pairing logs ONLY (never touches device registry or other state).
 */
export function clearPairingLogs() {
  if (!isStorageAvailable()) {
    memoryPairingLogs = [];
    return [];
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_PAIRING_LOGS, JSON.stringify([]));
    return [];
  } catch (e) {
    memoryPairingLogs = [];
    return [];
  }
}

/**
 * Reset pairing demo logs and state back to default baseline.
 */
export function resetPairingDemoData() {
  const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_PAIRING_LOGS));
  if (!isStorageAvailable()) {
    memoryPairingLogs = initial;
    return initial;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_PAIRING_LOGS, JSON.stringify(initial));
  } catch (e) {
    memoryPairingLogs = initial;
  }
  return initial;
}

/**
 * Record a pairing attempt in the pairing audit log (newest first).
 * Does NOT store passwords, cryptographic keys, or secrets.
 */
export function appendPairingLog({
  deviceId,
  deviceName,
  pairingMethod,
  authMode,
  encryptionMode,
  result,
  isSecure,
  isAllowed,
  reasons
}) {
  const currentLogs = getPairingLogs();
  const newLog = {
    id: `LOG-PAIR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: formatTimestamp(),
    deviceId: deviceId || "UNKNOWN",
    deviceName: deviceName || "(Unregistered Device)",
    pairingMethod: pairingMethod || "UNKNOWN",
    authMode: authMode || "UNKNOWN",
    encryptionMode: encryptionMode || "UNKNOWN",
    result,
    isSecure: Boolean(isSecure),
    isAllowed: Boolean(isAllowed),
    reasons: Array.isArray(reasons) ? reasons : [String(reasons)],
    isSimulated: true
  };

  const updatedLogs = [newLog, ...currentLogs.slice(0, 99)]; // Cap at 100 entries
  savePairingLogs(updatedLogs);
  return newLog;
}
