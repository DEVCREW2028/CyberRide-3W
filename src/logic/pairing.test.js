import test from "node:test";
import assert from "node:assert/strict";
import {
  PAIRING_METHODS,
  AUTH_MODES,
  ENCRYPTION_MODES,
  PAIRING_RESULTS,
  INITIAL_DEMO_PAIRING_LOGS,
  evaluatePairingSecurity,
  getPairingLogs,
  appendPairingLog,
  clearPairingLogs,
  resetPairingDemoData
} from "./pairing.js";
import {
  revokeDevice,
  reauthorizeDevice,
  INITIAL_DEMO_DEVICES
} from "./whitelisting.js";

// Mock localStorage for Node environment testing
const mockStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
  }
};

test("1. Authorized device + LE Secure Connections + authenticated pairing + encryption enabled => simulated secure result", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const result = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(result.result, PAIRING_RESULTS.SECURE_CONFIG);
  assert.equal(result.isSecure, true);
  assert.equal(result.isAllowed, true);
  assert.equal(result.isSimulated, true);
  assert.ok(result.reasons.some(r => r.includes("LE Secure Connections")));
  assert.ok(result.reasons.some(r => r.includes("AES-CCM")));
});

test("2. Unknown device is denied pairing", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const result = evaluatePairingSecurity({
    deviceId: "UNKNOWN-SCANNER-99",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(result.result, PAIRING_RESULTS.PAIRING_DENIED);
  assert.equal(result.isSecure, false);
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some(r => r.includes("not registered in active whitelist")));
});

test("3. Revoked device is denied pairing", () => {
  const registry = [
    { id: "TECH-PHN-OLD", name: "Retired Phone", status: "Revoked" }
  ];

  const result = evaluatePairingSecurity({
    deviceId: "TECH-PHN-OLD",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(result.result, PAIRING_RESULTS.PAIRING_DENIED);
  assert.equal(result.isSecure, false);
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some(r => r.includes("revoked in whitelist registry")));
});

test("4. Unknown device cannot pass even with all strong pairing options selected", () => {
  const registry = [
    { id: "AUTHORIZED-DEVICE", name: "Tablet", status: "Authorized" }
  ];

  const result = evaluatePairingSecurity({
    deviceId: "ATTACKER-ROGUE-BLE",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(result.result, PAIRING_RESULTS.PAIRING_DENIED);
  assert.equal(result.isSecure, false);
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some(r => r.includes("not registered")));
});

test("5. Weak/unauthenticated pairing is never labelled secure", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  // Case 5a: Legacy Just Works pairing
  const resultJustWorks = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LEGACY_JUST_WORKS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(resultJustWorks.result, PAIRING_RESULTS.WEAK_CONFIG);
  assert.equal(resultJustWorks.isSecure, false);
  assert.ok(resultJustWorks.reasons.some(r => r.includes("Legacy Just Works")));

  // Case 5b: Unauthenticated pairing mode
  const resultUnauth = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.UNAUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(resultUnauth.result, PAIRING_RESULTS.WEAK_CONFIG);
  assert.equal(resultUnauth.isSecure, false);
  assert.ok(resultUnauth.reasons.some(r => r.includes("Unauthenticated pairing")));
});

test("6. Encryption disabled is never labelled secure", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const result = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.DISABLED
  }, registry);

  assert.equal(result.result, PAIRING_RESULTS.WEAK_CONFIG);
  assert.equal(result.isSecure, false);
  assert.ok(result.reasons.some(r => r.includes("Link encryption is disabled")));
});

test("7. Empty or invalid device ID is rejected and never allowed", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const emptyResult = evaluatePairingSecurity({
    deviceId: "",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS
  }, registry);

  assert.equal(emptyResult.result, PAIRING_RESULTS.INVALID);
  assert.equal(emptyResult.isAllowed, false);
  assert.equal(emptyResult.isSecure, false);

  const spacesResult = evaluatePairingSecurity({
    deviceId: "   ",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS
  }, registry);

  assert.equal(spacesResult.result, PAIRING_RESULTS.INVALID);
  assert.equal(spacesResult.isAllowed, false);

  const nullResult = evaluatePairingSecurity({
    deviceId: null
  }, registry);

  assert.equal(nullResult.result, PAIRING_RESULTS.INVALID);
  assert.equal(nullResult.isAllowed, false);
});

test("8. Revoking a device after a previous successful simulated attempt causes the next attempt to be denied", () => {
  let registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  // First pairing attempt succeeds
  const firstAttempt = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(firstAttempt.result, PAIRING_RESULTS.SECURE_CONFIG);

  // Revoke device in whitelist
  const revokeResult = revokeDevice("TECH-TAB-01", registry, "Decommissioned tablet");
  assert.equal(revokeResult.success, true);
  registry = revokeResult.registry;

  // Next pairing attempt with identical parameters MUST BE DENIED
  const secondAttempt = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(secondAttempt.result, PAIRING_RESULTS.PAIRING_DENIED);
  assert.equal(secondAttempt.isSecure, false);
  assert.equal(secondAttempt.isAllowed, false);
  assert.ok(secondAttempt.reasons.some(r => r.includes("revoked in whitelist registry")));

  // Re-authorize device restores pairing eligibility
  const reauthResult = reauthorizeDevice("TECH-TAB-01", registry);
  assert.equal(reauthResult.success, true);
  registry = reauthResult.registry;

  const thirdAttempt = evaluatePairingSecurity({
    deviceId: "TECH-TAB-01",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED
  }, registry);

  assert.equal(thirdAttempt.result, PAIRING_RESULTS.SECURE_CONFIG);
});

test("9. Correct audit log entries are created and stored (newest first)", () => {
  mockStorage.clear();
  resetPairingDemoData();

  const logsBefore = getPairingLogs();
  const countBefore = logsBefore.length;

  const newLog = appendPairingLog({
    deviceId: "TECH-TAB-01",
    deviceName: "Diagnostic Tablet",
    pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
    authMode: AUTH_MODES.AUTHENTICATED,
    encryptionMode: ENCRYPTION_MODES.ENABLED,
    result: PAIRING_RESULTS.SECURE_CONFIG,
    isSecure: true,
    isAllowed: true,
    reasons: ["Test evaluation completed"]
  });

  assert.equal(newLog.deviceId, "TECH-TAB-01");
  assert.equal(newLog.isSimulated, true);
  assert.equal(newLog.result, PAIRING_RESULTS.SECURE_CONFIG);

  const logsAfter = getPairingLogs();
  assert.equal(logsAfter.length, countBefore + 1);
  assert.equal(logsAfter[0].id, newLog.id); // Newest first

  // Clearing pairing log only empties pairing logs
  clearPairingLogs();
  assert.equal(getPairingLogs().length, 0);
});
