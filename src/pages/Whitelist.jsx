import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Smartphone, 
  Tablet, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Info, 
  Fingerprint, 
  KeyRound, 
  Radio, 
  FileText,
  UserCheck,
  UserX,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { 
  getWhitelistRegistry, 
  getWhitelistLogs, 
  registerDevice, 
  revokeDevice, 
  reauthorizeDevice, 
  evaluateAccessRequest, 
  appendWhitelistLog, 
  clearWhitelistLogs, 
  resetWhitelistDemoData, 
  isStorageAvailable,
  INITIAL_DEMO_DEVICES
} from "../logic/whitelisting";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/EmptyState";

export function Whitelist() {
  const { addToast } = useToast();

  // Registry & Logs state
  const [registry, setRegistry] = useState([]);
  const [logs, setLogs] = useState([]);
  const [storageActive, setStorageActive] = useState(true);

  // Access Simulator state
  const [simulatorInputId, setSimulatorInputId] = useState("TECH-TAB-01");
  const [accessResult, setAccessResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Device Registration form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("Diagnostic Tool");
  const [newDeviceNotes, setNewDeviceNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Registry search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, AUTHORIZED, REVOKED

  // Load initial data
  useEffect(() => {
    const isAvail = isStorageAvailable();
    setStorageActive(isAvail);
    const reg = getWhitelistRegistry();
    const l = getWhitelistLogs();
    setRegistry(reg);
    setLogs(l);
  }, []);

  // Handle Access Simulation Request
  const handleRequestAccess = (overrideId) => {
    const targetId = overrideId !== undefined ? overrideId : simulatorInputId;
    setIsSimulating(true);

    setTimeout(() => {
      const evaluation = evaluateAccessRequest(targetId, registry);
      setAccessResult(evaluation);
      setIsSimulating(false);

      if (evaluation.decision === "INVALID") {
        addToast(evaluation.reason, "warning");
        return;
      }

      // Record in security event log
      appendWhitelistLog({
        deviceId: evaluation.searchedId,
        deviceName: evaluation.device ? evaluation.device.name : "(Unregistered Device)",
        decision: evaluation.decision,
        reason: evaluation.reason,
        eventType: "ACCESS_ATTEMPT"
      });

      // Refresh logs
      setLogs(getWhitelistLogs());

      if (evaluation.decision === "ALLOWED") {
        addToast(`Access GRANTED for device "${evaluation.searchedId}".`, "success");
      } else {
        addToast(`Access DENIED for device "${evaluation.searchedId}": ${evaluation.reason}`, "error");
      }
    }, 250);
  };

  // Run Pre-configured Demo Scenarios
  const runDemoScenario = (scenarioType) => {
    if (scenarioType === "AUTHORIZED") {
      setSimulatorInputId("TECH-TAB-01");
      handleRequestAccess("TECH-TAB-01");
    } else if (scenarioType === "REVOKED") {
      setSimulatorInputId("TECH-PHN-OLD");
      handleRequestAccess("TECH-PHN-OLD");
    } else if (scenarioType === "UNKNOWN") {
      setSimulatorInputId("ROGUE-BLE-SCANNER-99");
      handleRequestAccess("ROGUE-BLE-SCANNER-99");
    }
  };

  // Handle Device Registration
  const handleRegisterDevice = (e) => {
    e.preventDefault();
    setFormError("");

    const result = registerDevice(
      {
        id: newDeviceId,
        name: newDeviceName,
        deviceType: newDeviceType,
        registeredBy: "Workshop Technician",
        notes: newDeviceNotes
      },
      registry
    );

    if (!result.success) {
      setFormError(result.error);
      addToast(result.error, "error");
      return;
    }

    setRegistry(result.registry);
    setLogs(getWhitelistLogs());
    addToast(`Device "${result.device.id}" successfully registered and authorized!`, "success");

    // Reset form
    setNewDeviceId("");
    setNewDeviceName("");
    setNewDeviceNotes("");
    setShowAddForm(false);
  };

  // Handle Revoking Device
  const handleRevokeDevice = (deviceId) => {
    if (!window.confirm(`Revoke authorization for device "${deviceId}"? This device will be blocked from establishing BMS access sessions.`)) {
      return;
    }

    const result = revokeDevice(deviceId, registry, "Manual revocation by technician");
    if (!result.success) {
      addToast(result.error, "error");
      return;
    }

    setRegistry(result.registry);
    setLogs(getWhitelistLogs());
    addToast(`Authorization revoked for device "${deviceId}".`, "warning");

    // Re-evaluate current simulator if it matches the revoked device
    if (accessResult && accessResult.device && accessResult.device.id.toLowerCase() === deviceId.toLowerCase()) {
      setAccessResult(evaluateAccessRequest(deviceId, result.registry));
    }
  };

  // Handle Re-authorizing Revoked Device
  const handleReauthorizeDevice = (deviceId) => {
    if (!window.confirm(`Restore authorization for device "${deviceId}"?`)) {
      return;
    }

    const result = reauthorizeDevice(deviceId, registry);
    if (!result.success) {
      addToast(result.error, "error");
      return;
    }

    setRegistry(result.registry);
    setLogs(getWhitelistLogs());
    addToast(`Device "${deviceId}" has been re-authorized.`, "success");

    // Re-evaluate current simulator if it matches
    if (accessResult && accessResult.device && accessResult.device.id.toLowerCase() === deviceId.toLowerCase()) {
      setAccessResult(evaluateAccessRequest(deviceId, result.registry));
    }
  };

  // Clear Event Log Only (never touches registry)
  const handleClearLogs = () => {
    if (!window.confirm("Are you sure you want to clear the security event log? (The device registry will remain unchanged.)")) {
      return;
    }
    clearWhitelistLogs();
    setLogs([]);
    addToast("Security event log cleared.", "info");
  };

  // Reset Demo Data
  const handleResetDemo = () => {
    if (!window.confirm("Reset Whitelist Registry and Event Logs to initial demo state? (Unrelated vehicle fleet data will NOT be touched).")) {
      return;
    }
    const res = resetWhitelistDemoData();
    setRegistry(res.registry);
    setLogs(res.logs);
    setAccessResult(null);
    setSimulatorInputId("TECH-TAB-01");
    addToast("Device whitelisting demo data restored to initial baseline.", "info");
  };

  // Filtered Registry list
  const filteredRegistry = registry.filter(dev => {
    const matchesSearch = 
      dev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.deviceType && dev.deviceType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dev.notes && dev.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "AUTHORIZED") return dev.status === "Authorized";
    if (statusFilter === "REVOKED") return dev.status === "Revoked";
    return true;
  });

  const authorizedCount = registry.filter(d => d.status === "Authorized").length;
  const revokedCount = registry.filter(d => d.status === "Revoked").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Simulation Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                SIMULATED — NOT CONNECTED TO PHYSICAL BMS HARDWARE
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed max-w-3xl">
              Demonstrates simulated access control for connected e-rickshaw BMS devices. Evaluates whether a wireless diagnostic tablet or mobile scanner is authorized before granting telemetry or control session access.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Reset only the whitelisting demo data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {!storageActive && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Notice: LocalStorage is unavailable or restricted. Operating in memory-backed mode for this session.
          </span>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Device Whitelisting & Access Control
              </h2>
              <p className="text-xs text-slate-500">
                Manage trusted workshop diagnostic devices and simulate BLE connection authorization
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Devices</span>
            <span className="text-base font-black text-slate-900">{registry.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800">
            <span className="text-emerald-600 block text-[10px] uppercase font-bold">Authorized</span>
            <span className="text-base font-black text-emerald-900">{authorizedCount}</span>
          </div>
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-rose-800">
            <span className="text-rose-600 block text-[10px] uppercase font-bold">Revoked</span>
            <span className="text-base font-black text-rose-900">{revokedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Access Request Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Access Request Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter or select a device identifier to test real-time whitelist evaluation.
              </p>
            </div>

            {/* Quick Demo Scenario Buttons */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Quick Test Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => runDemoScenario("AUTHORIZED")}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Test Authorized Device (TECH-TAB-01)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Authorized</span>
                </button>
                <button
                  type="button"
                  onClick={() => runDemoScenario("REVOKED")}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Test Revoked Device (TECH-PHN-OLD)"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">Revoked</span>
                </button>
                <button
                  type="button"
                  onClick={() => runDemoScenario("UNKNOWN")}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Test Unknown Device (ROGUE-BLE-SCANNER-99)"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Unknown</span>
                </button>
              </div>
            </div>

            {/* Interactive Simulator Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequestAccess();
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="deviceIdInput" className="block text-xs font-semibold text-slate-700 mb-1">
                  Device ID (MAC Address / Hardware Tag)
                </label>
                <div className="relative">
                  <input
                    id="deviceIdInput"
                    type="text"
                    value={simulatorInputId}
                    onChange={(e) => setSimulatorInputId(e.target.value)}
                    placeholder="e.g. TECH-TAB-01 or 00:1A:7D:DA:71:13"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
                  />
                  {simulatorInputId && (
                    <button
                      type="button"
                      onClick={() => setSimulatorInputId("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Select from Registry */}
              <div>
                <label htmlFor="quickSelectDropdown" className="block text-[11px] font-medium text-slate-500 mb-1">
                  Or select from known devices:
                </label>
                <select
                  id="quickSelectDropdown"
                  value={simulatorInputId}
                  onChange={(e) => setSimulatorInputId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
                >
                  <option value="">-- Select Registered Device --</option>
                  {registry.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.id} — {dev.name} ({dev.status})
                    </option>
                  ))}
                  <option value="ROGUE-BLE-SCANNER-99">
                    ROGUE-BLE-SCANNER-99 — (Unregistered Third-Party)
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Access Request...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Request Access</span>
                  </>
                )}
              </button>
            </form>

            {/* Decision Result Display */}
            {accessResult && (
              <div
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  accessResult.decision === "ALLOWED"
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                    : accessResult.decision === "DENIED"
                    ? "bg-rose-50/70 border-rose-300 text-rose-950"
                    : "bg-amber-50/70 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {accessResult.decision === "ALLOWED" ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    ) : accessResult.decision === "DENIED" ? (
                      <ShieldX className="w-6 h-6 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold">
                        Decision:{" "}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase ${
                            accessResult.decision === "ALLOWED"
                              ? "bg-emerald-200 text-emerald-900"
                              : accessResult.decision === "DENIED"
                              ? "bg-rose-200 text-rose-900"
                              : "bg-amber-200 text-amber-900"
                          }`}
                        >
                          {accessResult.decision}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Evaluated against active registry
                      </span>
                    </div>

                    <p className="text-xs font-medium leading-relaxed">
                      <strong>Reason:</strong> {accessResult.reason}
                    </p>

                    {accessResult.searchedId && (
                      <p className="text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200/50">
                        Device ID: <strong>{accessResult.searchedId}</strong>
                        {accessResult.device && (
                          <span> • Name: <strong>{accessResult.device.name}</strong> ({accessResult.device.status})</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Device Registry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Device Registry</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Authorized diagnostic tablets, inspection tools, and telemetry receivers
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setFormError("");
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? "Close Form" : "Register Device"}</span>
              </button>
            </div>

            {/* Expandable Register New Device Form */}
            {showAddForm && (
              <form
                onSubmit={handleRegisterDevice}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Register New Trusted Device
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Case-insensitive validation applied
                  </span>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newDevId" className="block font-semibold text-slate-700 mb-1">
                      Device ID *
                    </label>
                    <input
                      id="newDevId"
                      type="text"
                      required
                      value={newDeviceId}
                      onChange={(e) => {
                        setNewDeviceId(e.target.value);
                        setFormError("");
                      }}
                      placeholder="e.g. TECH-TAB-02"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="newDevName" className="block font-semibold text-slate-700 mb-1">
                      Device Name *
                    </label>
                    <input
                      id="newDevName"
                      type="text"
                      required
                      value={newDeviceName}
                      onChange={(e) => {
                        setNewDeviceName(e.target.value);
                        setFormError("");
                      }}
                      placeholder="e.g. Diagnostic Tablet Bay 2"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newDevType" className="block font-semibold text-slate-700 mb-1">
                      Device Role / Type
                    </label>
                    <select
                      id="newDevType"
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Diagnostic Tool">Diagnostic Tool (Workshop)</option>
                      <option value="Mobile App">Technician Mobile App</option>
                      <option value="Depot Gateway">Depot Telemetry Gateway</option>
                      <option value="Service Laptop">Service Engineer Laptop</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="newDevNotes" className="block font-semibold text-slate-700 mb-1">
                      Notes / Serial / Assigned Bay
                    </label>
                    <input
                      id="newDevNotes"
                      type="text"
                      value={newDeviceNotes}
                      onChange={(e) => setNewDeviceNotes(e.target.value)}
                      placeholder="Optional technician notes"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormError("");
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Save & Authorize
                  </button>
                </div>
              </form>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search registered devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                {[
                  { id: "ALL", label: `All (${registry.length})` },
                  { id: "AUTHORIZED", label: `Authorized (${authorizedCount})` },
                  { id: "REVOKED", label: `Revoked (${revokedCount})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === pill.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Device List Table */}
            {filteredRegistry.length === 0 ? (
              <EmptyState
                title="No Devices Found"
                description="Try clearing your search query or switching filters."
                onAction={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                actionLabel="Clear Filters"
              />
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[11px]">
                      <th className="py-2.5 px-3 font-bold">Device ID</th>
                      <th className="py-2.5 px-3 font-bold">Name & Role</th>
                      <th className="py-2.5 px-3 font-bold text-center">Status</th>
                      <th className="py-2.5 px-3 font-bold text-right">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRegistry.map((dev) => {
                      const isAuth = dev.status === "Authorized";
                      return (
                        <tr key={dev.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900">{dev.id}</span>
                              {dev.isDemo && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Reg: {dev.registeredAt || "Initial"}
                            </p>
                          </td>

                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900">{dev.name}</p>
                            <p className="text-[11px] text-slate-500">{dev.deviceType}</p>
                            {dev.revokeReason && (
                              <p className="text-[10px] text-rose-600 font-mono mt-0.5">
                                Reason: {dev.revokeReason}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                                isAuth
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {isAuth ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>{dev.status}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSimulatorInputId(dev.id);
                                  handleRequestAccess(dev.id);
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                                title="Test access for this device"
                              >
                                Test
                              </button>

                              {isAuth ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeDevice(dev.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Revoke authorization"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Revoke</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReauthorizeDevice(dev.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Re-authorize device"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Re-authorize</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Event Audit Log Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Security Event Audit Log</h3>
            </div>
            <p className="text-xs text-slate-500">
              Audit trail of access decisions, registrations, and revocations (newest events first)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-semibold text-slate-500">
              {logs.length} logged events
            </span>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear audit log"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Log</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            title="Audit Log is Empty"
            description="Run access requests above to generate security audit trail entries."
            icon={Clock}
            actionLabel="Run Sample Access Attempt"
            onAction={() => runDemoScenario("AUTHORIZED")}
          />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[11px]">
                  <th className="py-2.5 px-3 font-bold">Timestamp</th>
                  <th className="py-2.5 px-3 font-bold">Device ID</th>
                  <th className="py-2.5 px-3 font-bold">Device Name</th>
                  <th className="py-2.5 px-3 font-bold text-center">Decision</th>
                  <th className="py-2.5 px-3 font-bold">Event Type & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const isAllow = log.decision === "ALLOWED";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {log.deviceId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {log.deviceName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase ${
                            isAllow
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isAllow ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{log.decision}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 uppercase mr-1">
                          [{log.eventType}]
                        </span>
                        {log.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Whitelist;
