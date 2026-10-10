/**
 * CyberRide 3W - Strong Challenge–Response Authentication Simulation Engine
 * 
 * NOTE: SOFTWARE PROTOTYPE ONLY — NOT CONNECTED TO PHYSICAL BMS HARDWARE.
 * Demonstrates mutual cryptographic authentication between an authorized workshop diagnostic
 * tool and an electric three-wheeler Battery Management System.
 * 
 * Cryptographic Mechanics:
 * - Fresh, single-use, cryptographically secure random challenge (nonce)
 * - Independent verification using HMAC-SHA-256 via Web Crypto API
 * - Replay attack prevention via strict single-use consumption & validity timeout
 * - Whitelist authorization and BLE pairing security prerequisites enforced
 * 
 * Notice on Key Handling:
 * In-browser demonstration secrets are derived in-memory for testing purposes only.
 * Real EV BMS deployments require hardware security modules (HSM), secure enclaves,
 * or tamper-resistant EEPROM. Secrets are NEVER logged or persisted.
 */

import { findDeviceInRegistry, getWhitelistRegistry, normalizeDeviceId, formatTimestamp, isStorageAvailable } from "./whitelisting.js";
import { getPairingLogs, PAIRING_RESULTS } from "./pairing.js";

export const STORAGE_KEY_AUTH_LOGS = "cyberride_3w_auth_logs";

export const AUTH_RESULTS = {
  SUCCESS: "AUTHENTICATION SUCCESSFUL (SIMULATED)",
  DENIED: "AUTHENTICATION DENIED",
  EXPIRED: "CHALLENGE EXPIRED",
  ALREADY_USED: "CHALLENGE ALREADY USED",
  INVALID_RESPONSE: "INVALID RESPONSE",
  DEVICE_NOT_AUTHORIZED: "DEVICE NOT AUTHORIZED",
  CRYPTO_UNAVAILABLE: "CRYPTOGRAPHIC API UNAVAILABLE"
};

export const CHALLENGE_STATUS = {
  UNUSED: "UNUSED",
  CONSUMED: "CONSUMED",
  EXPIRED: "EXPIRED"
};

export const DEFAULT_CHALLENGE_VALIDITY_MS = 60000; // 60 seconds

// In-memory challenge repository (never stored in localStorage)
const activeChallenges = new Map();

// In-memory fallback for audit logs if localStorage is unavailable
let memoryAuthLogs = null;

// Allow mocking crypto / time in test runner without weakening real generation
let cryptoOverride = null;
let timeOverride = null;

export function _setCryptoOverride(mockCrypto) {
  cryptoOverride = mockCrypto;
}

export function _setTimeOverride(mockTimeFn) {
  timeOverride = mockTimeFn;
}

function getNow() {
  if (typeof timeOverride === "function") return timeOverride();
  return Date.now();
}

function getCryptoApi() {
  if (cryptoOverride !== null) return cryptoOverride;
  if (typeof globalThis !== "undefined" && globalThis.crypto) return globalThis.crypto;
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  return null;
}

/**
 * Generates a fresh, unpredictable challenge nonce using cryptographically secure random bytes.
 * Never uses Math.random() for security-sensitive generation.
 */
export function generateSecureNonce(byteLength = 32) {
  const cryptoApi = getCryptoApi();
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    return null;
  }
  const buffer = new Uint8Array(byteLength);
  cryptoApi.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derives a per-device demonstration secret in memory.
 * Never displayed, persisted, or logged.
 */
function deriveDemoSecret(deviceId) {
  const norm = normalizeDeviceId(deviceId);
  return `CYBERRIDE_3W_SECRET_${norm}_AUTHKEY_DEMO_2026`;
}

/**
 * Computes HMAC-SHA-256 over challenge nonce and device context.
 * Uses Web Crypto API (crypto.subtle).
 */
export async function computeHmacResponse(nonce, deviceId, sessionContext = "") {
  const cryptoApi = getCryptoApi();
  if (!cryptoApi || !cryptoApi.subtle || typeof cryptoApi.subtle.importKey !== "function") {
    return { success: false, error: AUTH_RESULTS.CRYPTO_UNAVAILABLE };
  }

  const rawSecret = deriveDemoSecret(deviceId);
  const enc = new TextEncoder();
  const secretKeyData = enc.encode(rawSecret);
  const messageData = enc.encode(`${nonce}:${normalizeDeviceId(deviceId)}${sessionContext ? `:${sessionContext}` : ""}`);

  try {
    const cryptoKey = await cryptoApi.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await cryptoApi.subtle.sign("HMAC", cryptoKey, messageData);
    const hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return { success: true, responseHex: hex };
  } catch (err) {
    return { success: false, error: AUTH_RESULTS.CRYPTO_UNAVAILABLE, detail: err.message };
  }
}

/**
 * Creates a fresh, unpredictable challenge for an authorized device.
 * Enforces that only currently Authorized devices proceed.
 */
export function createChallenge(deviceId, registry = [], validityMs = DEFAULT_CHALLENGE_VALIDITY_MS) {
  const trimmedId = typeof deviceId === "string" ? deviceId.trim() : "";
  if (!trimmedId) {
    return {
      success: false,
      result: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
      reason: "Device identifier is required."
    };
  }

  // 1. Whitelist verification
  const device = findDeviceInRegistry(registry, trimmedId);
  if (!device || device.status !== "Authorized") {
    const reason = !device
      ? "Device not registered in active whitelist registry."
      : "Device authorization revoked in whitelist registry. Blocked from authentication.";

    appendAuthLog({
      deviceId: trimmedId,
      challengeId: "N/A",
      event: "CHALLENGE_REQUEST_REJECTED",
      outcome: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
      reason
    });

    return {
      success: false,
      result: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
      reason,
      device: device || null
    };
  }

  // 2. Generate secure nonce
  const nonce = generateSecureNonce(32);
  if (!nonce) {
    return {
      success: false,
      result: AUTH_RESULTS.CRYPTO_UNAVAILABLE,
      reason: "Cryptographically secure random generator is unavailable."
    };
  }

  const now = getNow();
  const randomSuffix = generateSecureNonce(4) || "0000";
  const challengeId = `CHAL-${now.toString().slice(-6)}-${randomSuffix.slice(0, 4).toUpperCase()}`;

  const challengeRecord = {
    challengeId,
    deviceId: device.id,
    deviceName: device.name,
    nonce,
    createdAt: now,
    expiresAt: now + validityMs,
    status: CHALLENGE_STATUS.UNUSED,
    consumedAt: null,
    isSimulated: true
  };

  activeChallenges.set(challengeId, challengeRecord);

  appendAuthLog({
    deviceId: device.id,
    challengeId,
    event: "CHALLENGE_GENERATED",
    outcome: "GENERATED",
    reason: `Fresh challenge nonce issued (valid for ${Math.round(validityMs / 1000)}s).`
  });

  return {
    success: true,
    challenge: { ...challengeRecord }
  };
}

/**
 * Retrieves a challenge by ID from the active in-memory repository.
 * Automatically updates status to EXPIRED if time has elapsed.
 */
export function getChallenge(challengeId) {
  if (!challengeId) return null;
  const record = activeChallenges.get(challengeId);
  if (!record) return null;

  const now = getNow();
  if (record.status === CHALLENGE_STATUS.UNUSED && now > record.expiresAt) {
    record.status = CHALLENGE_STATUS.EXPIRED;
  }
  return { ...record };
}

/**
 * Checks whether the device currently has an active, secure BLE pairing configuration.
 * Validates against latest pairing logs or explicit pairing checks.
 */
export function checkDevicePairingPrerequisite(deviceId) {
  const norm = normalizeDeviceId(deviceId);
  const logs = getPairingLogs();
  // Find the latest pairing log for this device
  const latestLog = logs.find(l => normalizeDeviceId(l.deviceId) === norm);
  if (latestLog && latestLog.result === PAIRING_RESULTS.SECURE_CONFIG) {
    return { isPaired: true, status: "LE Secure Connections Verified" };
  }
  return { isPaired: false, status: "Unpaired or Weak Pairing" };
}

/**
 * Verifies a device's response against an issued challenge.
 * 
 * Strict Enforcement:
 * 1. Re-checks whitelist authorization at verification time (handles mid-session revocation).
 * 2. Enforces required BLE pairing security state.
 * 3. Checks challenge freshness, device ownership, and unexpired status.
 * 4. Checks single-use status (rejects consumed challenges to block replay).
 * 5. Consumes the challenge immediately on any attempt.
 * 6. Cryptographically verifies response with HMAC-SHA-256.
 * 7. Never logs secrets or keys.
 */
export async function verifyChallengeResponse(
  {
    challengeId,
    deviceId,
    providedResponse,
    requireBlePairing = true,
    blePairingOverride = null,
    sessionContext = ""
  },
  registry = []
) {
  const trimmedDevId = typeof deviceId === "string" ? deviceId.trim() : "";
  const trimmedChalId = typeof challengeId === "string" ? challengeId.trim() : "";

  // 1. Check device whitelist authorization at verification moment
  const device = findDeviceInRegistry(registry, trimmedDevId);
  if (!device || device.status !== "Authorized") {
    // If challenge exists in store, consume it so it cannot be salvaged
    if (activeChallenges.has(trimmedChalId)) {
      const chal = activeChallenges.get(trimmedChalId);
      chal.status = CHALLENGE_STATUS.CONSUMED;
      chal.consumedAt = getNow();
    }

    const reason = !device
      ? "Device not registered in active whitelist registry."
      : "Device authorization revoked in whitelist registry.";

    appendAuthLog({
      deviceId: trimmedDevId || "UNKNOWN",
      challengeId: trimmedChalId || "N/A",
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
      reason
    });

    return {
      result: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 2. BLE Pairing state verification
  if (requireBlePairing) {
    const isPaired = blePairingOverride !== null ? Boolean(blePairingOverride) : checkDevicePairingPrerequisite(device.id).isPaired;
    if (!isPaired) {
      if (activeChallenges.has(trimmedChalId)) {
        const chal = activeChallenges.get(trimmedChalId);
        chal.status = CHALLENGE_STATUS.CONSUMED;
        chal.consumedAt = getNow();
      }

      const reason = "BLE Pairing security requirement not met. Strong BLE Pairing (LE Secure Connections + AES-CCM) is mandatory before challenge authentication.";
      appendAuthLog({
        deviceId: device.id,
        challengeId: trimmedChalId || "N/A",
        event: "AUTH_VERIFICATION_FAILED",
        outcome: AUTH_RESULTS.DENIED,
        reason
      });

      return {
        result: AUTH_RESULTS.DENIED,
        isAllowed: false,
        reasons: [reason],
        challengeId: trimmedChalId
      };
    }
  }

  // 3. Challenge retrieval
  const chalRecord = activeChallenges.get(trimmedChalId);
  if (!chalRecord) {
    const reason = "Challenge ID not found or unrecognized in active challenge pool.";
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId || "N/A",
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.DENIED,
      reason
    });

    return {
      result: AUTH_RESULTS.DENIED,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 4. Challenge ownership verification
  if (normalizeDeviceId(chalRecord.deviceId) !== normalizeDeviceId(device.id)) {
    // Challenge was issued for a different device: consume to prevent cross-device leakage
    chalRecord.status = CHALLENGE_STATUS.CONSUMED;
    chalRecord.consumedAt = getNow();

    const reason = `Challenge was issued for a different device ID ('${chalRecord.deviceId}', not '${device.id}'). Cross-session replay rejected.`;
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.DENIED,
      reason
    });

    return {
      result: AUTH_RESULTS.DENIED,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 5. Replay Attack Detection: Challenge already consumed?
  if (chalRecord.status === CHALLENGE_STATUS.CONSUMED) {
    const reason = "Challenge has already been consumed. Replay attack blocked.";
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "REPLAY_ATTEMPT_DETECTED",
      outcome: AUTH_RESULTS.ALREADY_USED,
      reason
    });

    return {
      result: AUTH_RESULTS.ALREADY_USED,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 6. Expiry check
  const now = getNow();
  if (chalRecord.status === CHALLENGE_STATUS.EXPIRED || now > chalRecord.expiresAt) {
    chalRecord.status = CHALLENGE_STATUS.EXPIRED;
    const reason = `Challenge expired at ${new Date(chalRecord.expiresAt).toLocaleTimeString()}. Fresh challenge required.`;

    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.EXPIRED,
      reason
    });

    return {
      result: AUTH_RESULTS.EXPIRED,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 7. SINGLE-USE CONSUMPTION: Consume challenge immediately on attempt
  chalRecord.status = CHALLENGE_STATUS.CONSUMED;
  chalRecord.consumedAt = now;

  // 8. Validate presence of provided response
  const trimmedResponse = typeof providedResponse === "string" ? providedResponse.trim() : "";
  if (!trimmedResponse) {
    const reason = "Authentication response is missing or empty.";
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.INVALID_RESPONSE,
      reason
    });

    return {
      result: AUTH_RESULTS.INVALID_RESPONSE,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 9. Cryptographic verification with independently computed HMAC
  const expectedResult = await computeHmacResponse(chalRecord.nonce, device.id, sessionContext);
  if (!expectedResult.success) {
    const reason = "Cryptographic API is unavailable or failed to compute HMAC-SHA-256.";
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "CRYPTO_ERROR",
      outcome: AUTH_RESULTS.CRYPTO_UNAVAILABLE,
      reason
    });

    return {
      result: AUTH_RESULTS.CRYPTO_UNAVAILABLE,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  const expectedHex = expectedResult.responseHex.toLowerCase();
  const actualHex = trimmedResponse.toLowerCase();

  if (expectedHex !== actualHex) {
    const reason = "Cryptographic signature mismatch: provided HMAC does not match expected response. Potential credential corruption or unauthorized spoofing.";
    appendAuthLog({
      deviceId: device.id,
      challengeId: trimmedChalId,
      event: "AUTH_VERIFICATION_FAILED",
      outcome: AUTH_RESULTS.INVALID_RESPONSE,
      reason
    });

    return {
      result: AUTH_RESULTS.INVALID_RESPONSE,
      isAllowed: false,
      reasons: [reason],
      challengeId: trimmedChalId
    };
  }

  // 10. SUCCESS: All checks passed
  const successReasons = [
    `Device '${device.id}' verified as Authorized in whitelist.`,
    "Fresh unpredictable challenge nonce verified.",
    "Single-use challenge consumed (replay protection enforced).",
    "HMAC-SHA-256 cryptographic response verified successfully.",
    "Strong BLE Pairing link prerequisite verified."
  ];

  appendAuthLog({
    deviceId: device.id,
    challengeId: trimmedChalId,
    event: "AUTH_VERIFICATION_SUCCESSFUL",
    outcome: AUTH_RESULTS.SUCCESS,
    reason: "Mutual cryptographic verification succeeded."
  });

  return {
    result: AUTH_RESULTS.SUCCESS,
    isAllowed: true,
    isSecure: true,
    reasons: successReasons,
    challengeId: trimmedChalId,
    device
  };
}

export const INITIAL_DEMO_AUTH_LOGS = [
  {
    id: "LOG-AUTH-01",
    timestamp: "10-Oct-2026 10:25:30 AM",
    deviceId: "TECH-TAB-01",
    challengeId: "CHAL-821041-A79B",
    event: "AUTH_VERIFICATION_SUCCESSFUL",
    outcome: AUTH_RESULTS.SUCCESS,
    reason: "Mutual cryptographic verification succeeded.",
    isSimulated: true
  },
  {
    id: "LOG-AUTH-02",
    timestamp: "10-Oct-2026 10:24:10 AM",
    deviceId: "TECH-TAB-01",
    challengeId: "CHAL-821041-A79B",
    event: "REPLAY_ATTEMPT_DETECTED",
    outcome: AUTH_RESULTS.ALREADY_USED,
    reason: "Challenge has already been consumed. Replay attack blocked.",
    isSimulated: true
  },
  {
    id: "LOG-AUTH-03",
    timestamp: "10-Oct-2026 10:22:00 AM",
    deviceId: "TECH-PHN-OLD",
    challengeId: "N/A",
    event: "CHALLENGE_REQUEST_REJECTED",
    outcome: AUTH_RESULTS.DEVICE_NOT_AUTHORIZED,
    reason: "Device authorization revoked in whitelist registry.",
    isSimulated: true
  }
];

function sanitizeAuthLogs(parsed) {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(l => l && typeof l.id === "string" && typeof l.timestamp === "string" && typeof l.deviceId === "string");
}

export function getAuthLogs() {
  if (!isStorageAvailable()) {
    if (!memoryAuthLogs) memoryAuthLogs = JSON.parse(JSON.stringify(INITIAL_DEMO_AUTH_LOGS));
    return memoryAuthLogs;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_AUTH_LOGS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(INITIAL_DEMO_AUTH_LOGS));
      return INITIAL_DEMO_AUTH_LOGS;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeAuthLogs(parsed);
    if (!sanitized) {
      window.localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(INITIAL_DEMO_AUTH_LOGS));
      return INITIAL_DEMO_AUTH_LOGS;
    }
    return sanitized;
  } catch (e) {
    return INITIAL_DEMO_AUTH_LOGS;
  }
}

export function saveAuthLogs(logs) {
  if (!Array.isArray(logs)) return getAuthLogs();
  if (!isStorageAvailable()) {
    memoryAuthLogs = logs;
    return logs;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(logs));
    return logs;
  } catch (e) {
    memoryAuthLogs = logs;
    return logs;
  }
}

export function clearAuthLogs() {
  if (!isStorageAvailable()) {
    memoryAuthLogs = [];
    return [];
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify([]));
    return [];
  } catch (e) {
    memoryAuthLogs = [];
    return [];
  }
}

export function resetAuthDemoData() {
  activeChallenges.clear();
  const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_AUTH_LOGS));
  if (!isStorageAvailable()) {
    memoryAuthLogs = initial;
    return initial;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(initial));
  } catch (e) {
    memoryAuthLogs = initial;
  }
  return initial;
}

export function appendAuthLog({ deviceId, challengeId, event, outcome, reason }) {
  const current = getAuthLogs();
  const newEntry = {
    id: `LOG-AUTH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: formatTimestamp(),
    deviceId: deviceId || "UNKNOWN",
    challengeId: challengeId || "N/A",
    event: event || "AUTH_EVENT",
    outcome: outcome || "UNKNOWN",
    reason: reason || "",
    isSimulated: true
  };
  const updated = [newEntry, ...current.slice(0, 99)];
  saveAuthLogs(updated);
  return newEntry;
}
