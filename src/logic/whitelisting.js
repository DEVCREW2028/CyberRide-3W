/**
 * CyberRide 3W - Simulated Device Whitelisting & Access Control Engine
 * 
 * NOTE: SIMULATED PROTOTYPE ONLY — NOT CONNECTED TO PHYSICAL BMS HARDWARE.
 * This module models wireless device whitelisting access control for connected e-rickshaw BMS.
 */

export const STORAGE_KEY_WHITELIST_REGISTRY = "cyberride_3w_whitelist_registry";
export const STORAGE_KEY_WHITELIST_LOGS = "cyberride_3w_whitelist_logs";

export const INITIAL_DEMO_DEVICES = [
  {
    id: "TECH-TAB-01",
    name: "Workshop Diagnostic Tablet (Bay 1)",
    status: "Authorized",
    deviceType: "Diagnostic Tool",
    registeredBy: "Lead EV Tech (Bay 1)",
    registeredAt: "10-Oct-2026 09:30 AM",
    notes: "Primary workshop tablet for BMS parameter diagnostics.",
    isDemo: true
  },
  {
    id: "INSP-TOOL-04",
    name: "Fleet Telemetry Gateway",
    status: "Authorized",
    deviceType: "Depot Gateway",
    registeredBy: "Depot Supervisor",
    registeredAt: "08-Oct-2026 02:15 PM",
    notes: "Authorized wireless gateway for battery health sync.",
    isDemo: true
  },
  {
    id: "TECH-PHN-OLD",
    name: "Decommissioned Service Phone",
    status: "Revoked",
    deviceType: "Mobile Diagnostic App",
    registeredBy: "Workshop Assistant",
    registeredAt: "01-Oct-2026 11:00 AM",
    revokedAt: "05-Oct-2026 04:20 PM",
    revokeReason: "Device decommissioned after hardware upgrade.",
    notes: "Access explicitly revoked; prohibited from establishing BMS sessions.",
    isDemo: true
  }
];

export const INITIAL_DEMO_LOGS = [
  {
    id: "LOG-INIT-03",
    timestamp: "10-Oct-2026 10:15:30 AM",
    deviceId: "TECH-TAB-01",
    deviceName: "Workshop Diagnostic Tablet (Bay 1)",
    decision: "ALLOWED",
    reason: "Device verified in active authorized whitelist.",
    eventType: "ACCESS_ATTEMPT"
  },
  {
    id: "LOG-INIT-02",
    timestamp: "10-Oct-2026 10:14:10 AM",
    deviceId: "TECH-PHN-OLD",
    deviceName: "Decommissioned Service Phone",
    decision: "DENIED",
    reason: "Device authorization revoked.",
    eventType: "ACCESS_ATTEMPT"
  },
  {
    id: "LOG-INIT-01",
    timestamp: "10-Oct-2026 09:45:00 AM",
    deviceId: "UNAUTHORIZED-SCANNER-99",
    deviceName: "(Unregistered Device)",
    decision: "DENIED",
    reason: "Device not registered.",
    eventType: "ACCESS_ATTEMPT"
  }
];

// In-memory fallback if localStorage is disabled or unavailable
let memoryRegistry = null;
let memoryLogs = null;
let storageAvailableCache = null;

/**
 * Checks if browser localStorage is functional.
 */
export function isStorageAvailable() {
  if (storageAvailableCache !== null) return storageAvailableCache;
  try {
    const testKey = "__cyberride_storage_test__";
    if (typeof window === "undefined" || !window.localStorage) {
      storageAvailableCache = false;
      return false;
    }
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    storageAvailableCache = true;
    return true;
  } catch (e) {
    storageAvailableCache = false;
    return false;
  }
}

/**
 * Normalize device ID for case-insensitive lookup while trimming whitespace.
 */
export function normalizeDeviceId(id) {
  if (typeof id !== "string") return "";
  return id.trim().toUpperCase();
}

/**
 * Find device in registry case-insensitively.
 */
export function findDeviceInRegistry(registry, rawId) {
  if (!Array.isArray(registry)) return null;
  const normalized = normalizeDeviceId(rawId);
  if (!normalized) return null;
  return registry.find(device => normalizeDeviceId(device.id) === normalized) || null;
}

/**
 * Validates device registration parameters.
 */
export function validateDeviceRegistration({ id, name }, existingRegistry = []) {
  const trimmedId = typeof id === "string" ? id.trim() : "";
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!trimmedId) {
    return { valid: false, error: "Device ID is required and cannot be empty." };
  }

  if (trimmedId.length < 3) {
    return { valid: false, error: "Device ID must be at least 3 characters long." };
  }

  // Alphanumeric, hyphens, colons, underscores permitted (e.g. MAC address or technician tag)
  if (!/^[A-Za-z0-9:_-]+$/.test(trimmedId)) {
    return { valid: false, error: "Device ID may only contain letters, numbers, hyphens, colons, and underscores." };
  }

  if (!trimmedName) {
    return { valid: false, error: "Device Name is required and cannot be empty." };
  }

  if (trimmedName.length < 2) {
    return { valid: false, error: "Device Name must be at least 2 characters long." };
  }

  const existing = findDeviceInRegistry(existingRegistry, trimmedId);
  if (existing) {
    if (existing.status === "Revoked") {
      return {
        valid: false,
        error: `Device "${existing.id}" already exists with REVOKED status. To restore access, use the explicit Re-authorize action.`
      };
    }
    return {
      valid: false,
      error: `Device ID "${trimmedId}" is already registered (matches "${existing.id}" case-insensitively).`
    };
  }

  return { valid: true, error: null };
}

/**
 * Pure evaluation function for simulated access requests.
 * 
 * Rules:
 * - Empty or invalid ID => reject input, do NOT grant access
 * - Known Authorized ID => ALLOWED
 * - Unknown ID => DENIED, reason: "Device not registered"
 * - Known Revoked ID => DENIED, reason: "Device authorization revoked"
 * 
 * Returns { decision: 'ALLOWED' | 'DENIED' | 'INVALID', reason: string, device: object | null }
 */
export function evaluateAccessRequest(rawId, registry = []) {
  const trimmedId = typeof rawId === "string" ? rawId.trim() : "";
  
  if (!trimmedId) {
    return {
      decision: "INVALID",
      isAllowed: false,
      reason: "Device ID is required. Please provide a valid device identifier.",
      device: null,
      searchedId: ""
    };
  }

  const device = findDeviceInRegistry(registry, trimmedId);

  if (!device) {
    return {
      decision: "DENIED",
      isAllowed: false,
      reason: "Device not registered.",
      device: null,
      searchedId: trimmedId
    };
  }

  if (device.status === "Authorized") {
    return {
      decision: "ALLOWED",
      isAllowed: true,
      reason: "Device verified in active authorized whitelist.",
      device,
      searchedId: trimmedId
    };
  }

  if (device.status === "Revoked") {
    return {
      decision: "DENIED",
      isAllowed: false,
      reason: "Device authorization revoked.",
      device,
      searchedId: trimmedId
    };
  }

  // Fallback safe denial for any unexpected status
  return {
    decision: "DENIED",
    isAllowed: false,
    reason: `Access blocked: unrecognized authorization status (${device.status}).`,
    device,
    searchedId: trimmedId
  };
}

/**
 * Format current date-time string consistently for demo logs.
 */
export function formatTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
    ', ' + d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Safely parse and sanitize registry array from storage.
 */
function sanitizeRegistry(parsed) {
  if (!Array.isArray(parsed)) return null;
  const valid = parsed.filter(item => 
    item && 
    typeof item.id === "string" && 
    typeof item.name === "string" && 
    (item.status === "Authorized" || item.status === "Revoked")
  );
  return valid.length > 0 ? valid : null;
}

/**
 * Safely parse and sanitize logs array from storage.
 */
function sanitizeLogs(parsed) {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(log =>
    log &&
    typeof log.id === "string" &&
    typeof log.timestamp === "string" &&
    typeof log.deviceId === "string" &&
    (log.decision === "ALLOWED" || log.decision === "DENIED" || log.decision === "INVALID")
  );
}

/**
 * Get device registry with safe fallback to initial demo devices.
 */
export function getWhitelistRegistry() {
  if (!isStorageAvailable()) {
    if (!memoryRegistry) memoryRegistry = JSON.parse(JSON.stringify(INITIAL_DEMO_DEVICES));
    return memoryRegistry;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_WHITELIST_REGISTRY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_WHITELIST_REGISTRY, JSON.stringify(INITIAL_DEMO_DEVICES));
      return INITIAL_DEMO_DEVICES;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeRegistry(parsed);
    if (!sanitized) {
      console.warn("Corrupt whitelist registry detected in localStorage. Reverting to initial demo devices.");
      window.localStorage.setItem(STORAGE_KEY_WHITELIST_REGISTRY, JSON.stringify(INITIAL_DEMO_DEVICES));
      return INITIAL_DEMO_DEVICES;
    }
    return sanitized;
  } catch (err) {
    console.warn("Error reading whitelist registry from localStorage:", err);
    return INITIAL_DEMO_DEVICES;
  }
}

/**
 * Save device registry to storage or in-memory fallback.
 */
export function saveWhitelistRegistry(registry) {
  if (!Array.isArray(registry)) return getWhitelistRegistry();

  if (!isStorageAvailable()) {
    memoryRegistry = registry;
    return registry;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_WHITELIST_REGISTRY, JSON.stringify(registry));
    return registry;
  } catch (err) {
    console.error("Failed to save whitelist registry to localStorage:", err);
    memoryRegistry = registry;
    return registry;
  }
}

/**
 * Get security event log with safe fallback.
 */
export function getWhitelistLogs() {
  if (!isStorageAvailable()) {
    if (!memoryLogs) memoryLogs = JSON.parse(JSON.stringify(INITIAL_DEMO_LOGS));
    return memoryLogs;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_WHITELIST_LOGS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_WHITELIST_LOGS, JSON.stringify(INITIAL_DEMO_LOGS));
      return INITIAL_DEMO_LOGS;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeLogs(parsed);
    if (!sanitized) {
      window.localStorage.setItem(STORAGE_KEY_WHITELIST_LOGS, JSON.stringify(INITIAL_DEMO_LOGS));
      return INITIAL_DEMO_LOGS;
    }
    return sanitized;
  } catch (err) {
    console.warn("Error reading whitelist logs from localStorage:", err);
    return INITIAL_DEMO_LOGS;
  }
}

/**
 * Save security event logs to storage.
 */
export function saveWhitelistLogs(logs) {
  if (!Array.isArray(logs)) return getWhitelistLogs();

  if (!isStorageAvailable()) {
    memoryLogs = logs;
    return logs;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_WHITELIST_LOGS, JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.error("Failed to save whitelist logs to localStorage:", err);
    memoryLogs = logs;
    return logs;
  }
}

/**
 * Clear event logs ONLY. Never touches or clears the device registry!
 */
export function clearWhitelistLogs() {
  if (!isStorageAvailable()) {
    memoryLogs = [];
    return [];
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_WHITELIST_LOGS, JSON.stringify([]));
    return [];
  } catch (e) {
    memoryLogs = [];
    return [];
  }
}

/**
 * Reset Whitelist Demo Data back to initial baseline without touching unrelated project data.
 */
export function resetWhitelistDemoData() {
  const initialReg = JSON.parse(JSON.stringify(INITIAL_DEMO_DEVICES));
  const initialLogs = JSON.parse(JSON.stringify(INITIAL_DEMO_LOGS));

  if (!isStorageAvailable()) {
    memoryRegistry = initialReg;
    memoryLogs = initialLogs;
    return { registry: initialReg, logs: initialLogs };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_WHITELIST_REGISTRY, JSON.stringify(initialReg));
    window.localStorage.setItem(STORAGE_KEY_WHITELIST_LOGS, JSON.stringify(initialLogs));
  } catch (e) {
    console.warn("Reset failed to write to localStorage; using memory fallback:", e);
    memoryRegistry = initialReg;
    memoryLogs = initialLogs;
  }

  return { registry: initialReg, logs: initialLogs };
}

/**
 * Register a new device.
 */
export function registerDevice(deviceData, currentRegistry) {
  const registry = currentRegistry || getWhitelistRegistry();
  const validation = validateDeviceRegistration(deviceData, registry);

  if (!validation.valid) {
    return { success: false, error: validation.error, registry };
  }

  const newDevice = {
    id: deviceData.id.trim(),
    name: deviceData.name.trim(),
    status: "Authorized",
    deviceType: (deviceData.deviceType || "Diagnostic Tool").trim(),
    registeredBy: (deviceData.registeredBy || "Workshop Lead").trim(),
    registeredAt: formatTimestamp(),
    notes: (deviceData.notes || "").trim(),
    isDemo: false
  };

  const updatedRegistry = [newDevice, ...registry];
  saveWhitelistRegistry(updatedRegistry);

  // Log event
  appendWhitelistLog({
    deviceId: newDevice.id,
    deviceName: newDevice.name,
    decision: "ALLOWED",
    reason: "New device registered and granted authorized access.",
    eventType: "DEVICE_REGISTERED"
  });

  return { success: true, device: newDevice, registry: updatedRegistry };
}

/**
 * Explicitly revoke an authorized device.
 */
export function revokeDevice(rawId, currentRegistry, reason = "Manual administrative revocation") {
  const registry = currentRegistry || getWhitelistRegistry();
  const normalized = normalizeDeviceId(rawId);
  const target = registry.find(d => normalizeDeviceId(d.id) === normalized);

  if (!target) {
    return { success: false, error: `Device ID "${rawId}" not found in registry.`, registry };
  }

  if (target.status === "Revoked") {
    return { success: false, error: `Device "${target.id}" is already revoked.`, registry };
  }

  const updatedRegistry = registry.map(d => {
    if (normalizeDeviceId(d.id) === normalized) {
      return {
        ...d,
        status: "Revoked",
        revokedAt: formatTimestamp(),
        revokeReason: reason
      };
    }
    return d;
  });

  saveWhitelistRegistry(updatedRegistry);

  appendWhitelistLog({
    deviceId: target.id,
    deviceName: target.name,
    decision: "DENIED",
    reason: `Device access revoked. Reason: ${reason}`,
    eventType: "DEVICE_REVOKED"
  });

  return { success: true, deviceId: target.id, registry: updatedRegistry };
}

/**
 * Explicitly re-authorize a revoked device.
 */
export function reauthorizeDevice(rawId, currentRegistry) {
  const registry = currentRegistry || getWhitelistRegistry();
  const normalized = normalizeDeviceId(rawId);
  const target = registry.find(d => normalizeDeviceId(d.id) === normalized);

  if (!target) {
    return { success: false, error: `Device ID "${rawId}" not found in registry.`, registry };
  }

  if (target.status === "Authorized") {
    return { success: false, error: `Device "${target.id}" is already authorized.`, registry };
  }

  const updatedRegistry = registry.map(d => {
    if (normalizeDeviceId(d.id) === normalized) {
      return {
        ...d,
        status: "Authorized",
        reauthorizedAt: formatTimestamp(),
        revokeReason: null
      };
    }
    return d;
  });

  saveWhitelistRegistry(updatedRegistry);

  appendWhitelistLog({
    deviceId: target.id,
    deviceName: target.name,
    decision: "ALLOWED",
    reason: "Device explicitly re-authorized by workshop technician.",
    eventType: "DEVICE_REAUTHORIZED"
  });

  return { success: true, deviceId: target.id, registry: updatedRegistry };
}

/**
 * Appends a log entry to the security event log (newest first).
 */
export function appendWhitelistLog({ deviceId, deviceName, decision, reason, eventType = "ACCESS_ATTEMPT" }) {
  const currentLogs = getWhitelistLogs();
  const newLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: formatTimestamp(),
    deviceId: deviceId || "UNKNOWN",
    deviceName: deviceName || "(Unregistered Device)",
    decision,
    reason,
    eventType
  };

  const updatedLogs = [newLog, ...currentLogs.slice(0, 99)]; // Cap at 100 entries
  saveWhitelistLogs(updatedLogs);
  return newLog;
}
