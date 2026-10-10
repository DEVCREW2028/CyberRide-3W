import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_RESULTS,
  CHALLENGE_STATUS,
  createChallenge,
  verifyChallengeResponse,
  computeHmacResponse,
  getChallenge,
  getAuthLogs,
  clearAuthLogs,
  resetAuthDemoData,
  _setCryptoOverride,
  _setTimeOverride
} from "./challengeAuth.js";
import {
  revokeDevice,
  reauthorizeDevice
} from "./whitelisting.js";

// Mock localStorage for Node testing environment
const mockStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
  }
};

test("1. Authorized device + valid fresh response succeeds (simulated)", async () => {
  _setCryptoOverride(null);
  _setTimeOverride(null);
  resetAuthDemoData();

  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  // Create fresh challenge
  const chalRes = createChallenge("TECH-TAB-01", registry);
  assert.equal(chalRes.success, true);
  const chal = chalRes.challenge;
  assert.equal(chal.status, CHALLENGE_STATUS.UNUSED);
  assert.ok(chal.nonce.length >= 32);

  // Compute expected HMAC response
  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");
  assert.equal(respRes.success, true);
  assert.ok(respRes.responseHex.length > 0);

  // Verify challenge response
  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.SUCCESS);
  assert.equal(verifyRes.isAllowed, true);
  assert.equal(verifyRes.isSecure, true);
});

test("2. Unknown device is denied challenge generation and response verification", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  // Try creating challenge for unknown device
  const chalRes = createChallenge("ROGUE-UNKNOWN-DEVICE", registry);
  assert.equal(chalRes.success, false);
  assert.equal(chalRes.result, AUTH_RESULTS.DEVICE_NOT_AUTHORIZED);

  // Try verifying with unknown device
  const verifyRes = await verifyChallengeResponse({
    challengeId: "CHAL-NONEXISTENT",
    deviceId: "ROGUE-UNKNOWN-DEVICE",
    providedResponse: "deadbeef"
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.DEVICE_NOT_AUTHORIZED);
  assert.equal(verifyRes.isAllowed, false);
});

test("3. Revoked device is denied challenge generation and verification", async () => {
  const registry = [
    { id: "TECH-PHN-OLD", name: "Retired Phone", status: "Revoked" }
  ];

  const chalRes = createChallenge("TECH-PHN-OLD", registry);
  assert.equal(chalRes.success, false);
  assert.equal(chalRes.result, AUTH_RESULTS.DEVICE_NOT_AUTHORIZED);

  const verifyRes = await verifyChallengeResponse({
    challengeId: "CHAL-FAKE",
    deviceId: "TECH-PHN-OLD",
    providedResponse: "deadbeef"
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.DEVICE_NOT_AUTHORIZED);
  assert.equal(verifyRes.isAllowed, false);
});

test("4. Revocation after challenge generation is denied on verification", async () => {
  let registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  // Generate challenge while authorized
  const chalRes = createChallenge("TECH-TAB-01", registry);
  assert.equal(chalRes.success, true);
  const chal = chalRes.challenge;

  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");

  // Revoke device in whitelist
  const revokeRes = revokeDevice("TECH-TAB-01", registry, "Emergency technician lockout");
  registry = revokeRes.registry;

  // Verification must now be DENIED
  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.DEVICE_NOT_AUTHORIZED);
  assert.equal(verifyRes.isAllowed, false);
});

test("5. Incorrect or modified response signature is denied", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const chalRes = createChallenge("TECH-TAB-01", registry);
  assert.equal(chalRes.success, true);
  const chal = chalRes.challenge;

  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");
  // Tamper with first character of signature
  const tamperedHex = respRes.responseHex[0] === "a" ? "b" + respRes.responseHex.slice(1) : "a" + respRes.responseHex.slice(1);

  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: tamperedHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.INVALID_RESPONSE);
  assert.equal(verifyRes.isAllowed, false);
  assert.ok(verifyRes.reasons.some(r => r.includes("Cryptographic signature mismatch")));
});

test("6. Missing or empty response is rejected", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const chalRes = createChallenge("TECH-TAB-01", registry);
  const chal = chalRes.challenge;

  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: "   ",
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.INVALID_RESPONSE);
  assert.equal(verifyRes.isAllowed, false);
});

test("7. Expired challenge is rejected", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  let currentTime = 1000000;
  _setTimeOverride(() => currentTime);

  // Create challenge with 5 second validity
  const chalRes = createChallenge("TECH-TAB-01", registry, 5000);
  const chal = chalRes.challenge;
  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");

  // Advance time past expiry
  currentTime += 10000; // 10s later

  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.EXPIRED);
  assert.equal(verifyRes.isAllowed, false);

  _setTimeOverride(null);
});

test("8. Reused / replayed challenge is rejected (CHALLENGE ALREADY USED)", async () => {
  _setTimeOverride(null);
  const registry = [
    { id: "TECH-TAB-01", name: "Workshop Tablet", status: "Authorized" }
  ];

  const chalRes = createChallenge("TECH-TAB-01", registry);
  const chal = chalRes.challenge;
  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");

  // First verification succeeds
  const firstVerify = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(firstVerify.result, AUTH_RESULTS.SUCCESS);

  // Immediate second attempt with same challenge (replay attack)
  const replayVerify = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(replayVerify.result, AUTH_RESULTS.ALREADY_USED);
  assert.equal(replayVerify.isAllowed, false);
  assert.ok(replayVerify.reasons.some(r => r.includes("already been consumed")));
});

test("9. Challenge issued for one device cannot be used by a different device", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Tablet 1", status: "Authorized" },
    { id: "INSP-TOOL-04", name: "Gateway", status: "Authorized" }
  ];

  // Challenge issued for TECH-TAB-01
  const chalRes = createChallenge("TECH-TAB-01", registry);
  const chal = chalRes.challenge;
  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");

  // Attempting to present it on behalf of INSP-TOOL-04
  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "INSP-TOOL-04",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: true
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.DENIED);
  assert.equal(verifyRes.isAllowed, false);
  assert.ok(verifyRes.reasons.some(r => r.includes("different device ID")));
});

test("10. Required BLE pairing is mandatory and cannot be bypassed", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Tablet 1", status: "Authorized" }
  ];

  const chalRes = createChallenge("TECH-TAB-01", registry);
  const chal = chalRes.challenge;
  const respRes = await computeHmacResponse(chal.nonce, "TECH-TAB-01");

  // When BLE pairing prerequisite is false/unpaired
  const verifyRes = await verifyChallengeResponse({
    challengeId: chal.challengeId,
    deviceId: "TECH-TAB-01",
    providedResponse: respRes.responseHex,
    requireBlePairing: true,
    blePairingOverride: false
  }, registry);

  assert.equal(verifyRes.result, AUTH_RESULTS.DENIED);
  assert.equal(verifyRes.isAllowed, false);
  assert.ok(verifyRes.reasons.some(r => r.includes("BLE Pairing security requirement not met")));
});

test("11. Cryptographic API unavailable fails closed", async () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Tablet 1", status: "Authorized" }
  ];

  // Simulate missing crypto API
  _setCryptoOverride({});

  const chalRes = createChallenge("TECH-TAB-01", registry);
  assert.equal(chalRes.success, false);
  assert.equal(chalRes.result, AUTH_RESULTS.CRYPTO_UNAVAILABLE);

  _setCryptoOverride(null);
});

test("12. Audit logs record events properly with no keys or secrets exposed", () => {
  mockStorage.clear();
  resetAuthDemoData();

  const logs = getAuthLogs();
  assert.ok(logs.length > 0);

  // Check that no secret or key material is present in log objects
  const rawLogString = JSON.stringify(logs);
  assert.equal(rawLogString.includes("CYBERRIDE_3W_SECRET"), false);
  assert.equal(rawLogString.includes("AUTHKEY"), false);
});
