import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_DEMO_DEVICES,
  INITIAL_DEMO_LOGS,
  normalizeDeviceId,
  findDeviceInRegistry,
  validateDeviceRegistration,
  evaluateAccessRequest,
  registerDevice,
  revokeDevice,
  reauthorizeDevice,
  getWhitelistRegistry,
  getWhitelistLogs,
  clearWhitelistLogs,
  resetWhitelistDemoData,
  appendWhitelistLog,
  isStorageAvailable
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

test("1. Authorized device is allowed", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Tablet 1", status: "Authorized" }
  ];

  const result = evaluateAccessRequest("TECH-TAB-01", registry);
  assert.equal(result.decision, "ALLOWED");
  assert.equal(result.isAllowed, true);
  assert.match(result.reason, /authorized/i);
  assert.equal(result.device.id, "TECH-TAB-01");
});

test("2. Unknown device is denied with reason 'Device not registered'", () => {
  const registry = [
    { id: "TECH-TAB-01", name: "Tablet 1", status: "Authorized" }
  ];

  const result = evaluateAccessRequest("UNKNOWN-DEVICE-999", registry);
  assert.equal(result.decision, "DENIED");
  assert.equal(result.isAllowed, false);
  assert.equal(result.reason, "Device not registered.");
  assert.equal(result.device, null);
});

test("3. Revoked device is denied with reason 'Device authorization revoked'", () => {
  const registry = [
    { id: "TECH-PHN-OLD", name: "Old Phone", status: "Revoked" }
  ];

  const result = evaluateAccessRequest("TECH-PHN-OLD", registry);
  assert.equal(result.decision, "DENIED");
  assert.equal(result.isAllowed, false);
  assert.equal(result.reason, "Device authorization revoked.");
  assert.notEqual(result.device, null);
  assert.equal(result.device.status, "Revoked");
});

test("4. Revoking an authorized device causes the next request to be denied immediately", () => {
  let registry = [
    { id: "ACTIVE-DEV-01", name: "Bay 2 Laptop", status: "Authorized" }
  ];

  // First request should be allowed
  const beforeRevoke = evaluateAccessRequest("ACTIVE-DEV-01", registry);
  assert.equal(beforeRevoke.decision, "ALLOWED");

  // Revoke device
  const revokeResult = revokeDevice("ACTIVE-DEV-01", registry, "Decommissioned for testing");
  assert.equal(revokeResult.success, true);
  registry = revokeResult.registry;

  // Next request must be denied
  const afterRevoke = evaluateAccessRequest("ACTIVE-DEV-01", registry);
  assert.equal(afterRevoke.decision, "DENIED");
  assert.equal(afterRevoke.reason, "Device authorization revoked.");

  // Also test case-insensitivity on the revoked check
  const caseInsensitiveCheck = evaluateAccessRequest("active-dev-01", registry);
  assert.equal(caseInsensitiveCheck.decision, "DENIED");
});

test("5. Duplicate IDs are rejected case-insensitively and do not allow re-adding revoked as authorized", () => {
  const registry = [
    { id: "DIAG-TAB-05", name: "Bay 5 Tablet", status: "Authorized" },
    { id: "RET-PHN-02", name: "Retired Phone", status: "Revoked" }
  ];

  // Exact duplicate
  const dup1 = validateDeviceRegistration({ id: "DIAG-TAB-05", name: "Duplicate" }, registry);
  assert.equal(dup1.valid, false);
  assert.match(dup1.error, /already registered/i);

  // Lowercase duplicate
  const dup2 = validateDeviceRegistration({ id: "diag-tab-05", name: "Lower Dup" }, registry);
  assert.equal(dup2.valid, false);
  assert.match(dup2.error, /already registered/i);

  // Whitespace-padded duplicate
  const dup3 = validateDeviceRegistration({ id: "  DIAG-TAB-05  ", name: "Padded Dup" }, registry);
  assert.equal(dup3.valid, false);
  assert.match(dup3.error, /already registered/i);

  // Trying to register an already revoked ID must fail and instruct to use Re-authorize
  const dupRevoked = validateDeviceRegistration({ id: "ret-phn-02", name: "Try Revoked" }, registry);
  assert.equal(dupRevoked.valid, false);
  assert.match(dupRevoked.error, /already exists with REVOKED status/i);
});

test("6. Empty, whitespace-only, or invalid IDs are rejected and never allowed", () => {
  const registry = [
    { id: "DIAG-01", name: "Valid Tool", status: "Authorized" }
  ];

  const emptyReq = evaluateAccessRequest("", registry);
  assert.equal(emptyReq.decision, "INVALID");
  assert.equal(emptyReq.isAllowed, false);

  const spaceReq = evaluateAccessRequest("   ", registry);
  assert.equal(spaceReq.decision, "INVALID");
  assert.equal(spaceReq.isAllowed, false);

  const nullReq = evaluateAccessRequest(null, registry);
  assert.equal(nullReq.decision, "INVALID");
  assert.equal(nullReq.isAllowed, false);

  const regEmpty = validateDeviceRegistration({ id: "   ", name: "Test" }, registry);
  assert.equal(regEmpty.valid, false);
  assert.match(regEmpty.error, /required/i);
});

test("7. Each access attempt produces the correct log entry (newest first)", () => {
  mockStorage.clear();
  resetWhitelistDemoData();

  const initialLogs = getWhitelistLogs();
  const initialCount = initialLogs.length;

  const logEntry = appendWhitelistLog({
    deviceId: "TEST-AUDIT-ID",
    deviceName: "Audit Test Console",
    decision: "ALLOWED",
    reason: "Unit test validation log.",
    eventType: "ACCESS_ATTEMPT"
  });

  assert.equal(logEntry.deviceId, "TEST-AUDIT-ID");
  assert.equal(logEntry.decision, "ALLOWED");

  const logsAfter = getWhitelistLogs();
  assert.equal(logsAfter.length, initialCount + 1);
  assert.equal(logsAfter[0].deviceId, "TEST-AUDIT-ID"); // Newest first
  assert.equal(logsAfter[0].decision, "ALLOWED");
});

test("8. Registry changes are reflected immediately in access decisions", () => {
  let registry = [...INITIAL_DEMO_DEVICES];

  // Unknown before registration
  const beforeAdd = evaluateAccessRequest("NEW-DIAG-007", registry);
  assert.equal(beforeAdd.decision, "DENIED");
  assert.equal(beforeAdd.reason, "Device not registered.");

  // Register device
  const regResult = registerDevice({
    id: "NEW-DIAG-007",
    name: "New Workshop Diagnostic Dongle",
    deviceType: "OBD/BLE Bridge"
  }, registry);
  assert.equal(regResult.success, true);
  registry = regResult.registry;

  // Immediate access check is ALLOWED
  const afterAdd = evaluateAccessRequest("new-diag-007", registry);
  assert.equal(afterAdd.decision, "ALLOWED");

  // Revoke device
  const revResult = revokeDevice("NEW-DIAG-007", registry, "Safety audit fail");
  assert.equal(revResult.success, true);
  registry = revResult.registry;

  // Immediate access check is DENIED
  const afterRevoke = evaluateAccessRequest("NEW-DIAG-007", registry);
  assert.equal(afterRevoke.decision, "DENIED");
  assert.equal(afterRevoke.reason, "Device authorization revoked.");

  // Re-authorize device
  const reauthResult = reauthorizeDevice("NEW-DIAG-007", registry);
  assert.equal(reauthResult.success, true);
  registry = reauthResult.registry;

  // Immediate access check is ALLOWED again
  const afterReauth = evaluateAccessRequest("NEW-DIAG-007", registry);
  assert.equal(afterReauth.decision, "ALLOWED");
});

test("9. Reset restores demo data without affecting unrelated app functionality", () => {
  mockStorage.clear();
  
  // Set some unrelated app data (e.g. vehicles)
  mockStorage.set("cyberride_3w_vehicles", JSON.stringify([{ id: "CR3W-001", status: "Secure" }]));

  // Mutate whitelist data
  const customReg = [{ id: "CUSTOM-99", name: "Custom", status: "Authorized" }];
  mockStorage.set("cyberride_3w_whitelist_registry", JSON.stringify(customReg));
  mockStorage.set("cyberride_3w_whitelist_logs", JSON.stringify([{ id: "LOG-CUSTOM" }]));

  // Reset whitelist demo data only
  const resetRes = resetWhitelistDemoData();
  assert.equal(resetRes.registry.length, INITIAL_DEMO_DEVICES.length);
  assert.equal(resetRes.logs.length, INITIAL_DEMO_LOGS.length);

  // Verify unrelated vehicle data was NOT erased or modified
  const vehicleData = mockStorage.get("cyberride_3w_vehicles");
  assert.notEqual(vehicleData, null);
  const parsedVehicles = JSON.parse(vehicleData);
  assert.equal(parsedVehicles[0].id, "CR3W-001");
});

test("10. Persistence & corruption handling: recovers safely from malformed storage", () => {
  mockStorage.clear();

  // Write corrupt json
  mockStorage.set("cyberride_3w_whitelist_registry", "MALFORMED_JSON{{{");
  
  const recoveredReg = getWhitelistRegistry();
  assert.equal(Array.isArray(recoveredReg), true);
  assert.equal(recoveredReg.length, INITIAL_DEMO_DEVICES.length);

  // Write invalid schema (array of non-devices)
  mockStorage.set("cyberride_3w_whitelist_registry", JSON.stringify([1, 2, "string"]));
  const recoveredSchema = getWhitelistRegistry();
  assert.equal(Array.isArray(recoveredSchema), true);
  assert.equal(recoveredSchema.length, INITIAL_DEMO_DEVICES.length);
});

test("11. Clear log button empties log without modifying device registry", () => {
  mockStorage.clear();
  resetWhitelistDemoData();

  const regBefore = getWhitelistRegistry();
  assert.equal(regBefore.length, INITIAL_DEMO_DEVICES.length);

  clearWhitelistLogs();

  const logsAfter = getWhitelistLogs();
  assert.equal(logsAfter.length, 0);

  const regAfter = getWhitelistRegistry();
  assert.equal(regAfter.length, INITIAL_DEMO_DEVICES.length);
  assert.equal(regAfter[0].id, regBefore[0].id);
});
