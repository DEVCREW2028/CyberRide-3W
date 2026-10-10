import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Bluetooth, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  KeyRound, 
  Lock, 
  Unlock, 
  Cpu, 
  Radio, 
  Clock, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  RefreshCw,
  Fingerprint,
  Smartphone
} from "lucide-react";
import { 
  PAIRING_METHODS,
  PAIRING_METHOD_LABELS,
  AUTH_MODES,
  AUTH_MODE_LABELS,
  ENCRYPTION_MODES,
  ENCRYPTION_MODE_LABELS,
  PAIRING_RESULTS,
  evaluatePairingSecurity,
  getPairingLogs,
  appendPairingLog,
  clearPairingLogs,
  resetPairingDemoData
} from "../logic/pairing.js";
import { 
  getWhitelistRegistry, 
  findDeviceInRegistry, 
  isStorageAvailable 
} from "../logic/whitelisting.js";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/EmptyState";

export function Pairing() {
  const { addToast } = useToast();

  // Registry & Pairing Logs
  const [registry, setRegistry] = useState([]);
  const [logs, setLogs] = useState([]);
  const [storageActive, setStorageActive] = useState(true);

  // Form State
  const [selectedDeviceId, setSelectedDeviceId] = useState("TECH-TAB-01");
  const [pairingMethod, setPairingMethod] = useState(PAIRING_METHODS.LE_SECURE_CONNECTIONS);
  const [authMode, setAuthMode] = useState(AUTH_MODES.AUTHENTICATED);
  const [encryptionMode, setEncryptionMode] = useState(ENCRYPTION_MODES.ENABLED);

  // Simulation execution & result state
  const [isSimulating, setIsSimulating] = useState(false);
  const [pairingResult, setPairingResult] = useState(null);

  // Load latest registry and logs on mount
  useEffect(() => {
    setStorageActive(isStorageAvailable());
    const reg = getWhitelistRegistry();
    const l = getPairingLogs();
    setRegistry(reg);
    setLogs(l);

    // Initial evaluation for the default state
    const initialEval = evaluatePairingSecurity({
      deviceId: "TECH-TAB-01",
      pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
      authMode: AUTH_MODES.AUTHENTICATED,
      encryptionMode: ENCRYPTION_MODES.ENABLED
    }, reg);
    setPairingResult(initialEval);
  }, []);

  // Current matched device from registry
  const currentDevice = findDeviceInRegistry(registry, selectedDeviceId);

  // Handle Run Pairing Test
  const handleRunPairingTest = (overrideParams) => {
    const params = {
      deviceId: overrideParams?.deviceId !== undefined ? overrideParams.deviceId : selectedDeviceId,
      pairingMethod: overrideParams?.pairingMethod || pairingMethod,
      authMode: overrideParams?.authMode || authMode,
      encryptionMode: overrideParams?.encryptionMode || encryptionMode
    };

    setIsSimulating(true);

    setTimeout(() => {
      // Re-fetch latest registry state at the exact moment of evaluation
      const latestRegistry = getWhitelistRegistry();
      setRegistry(latestRegistry);

      const evaluation = evaluatePairingSecurity(params, latestRegistry);
      setPairingResult(evaluation);
      setIsSimulating(false);

      if (evaluation.result === PAIRING_RESULTS.INVALID) {
        addToast(evaluation.reasons[0], "warning");
        return;
      }

      // Record in audit log
      appendPairingLog({
        deviceId: evaluation.searchedId,
        deviceName: evaluation.device ? evaluation.device.name : "(Unregistered Device)",
        pairingMethod: params.pairingMethod,
        authMode: params.authMode,
        encryptionMode: params.encryptionMode,
        result: evaluation.result,
        isSecure: evaluation.isSecure,
        isAllowed: evaluation.isAllowed,
        reasons: evaluation.reasons
      });

      // Update log display
      setLogs(getPairingLogs());

      if (evaluation.result === PAIRING_RESULTS.SECURE_CONFIG) {
        addToast(`Pairing SUCCESS: ${evaluation.result} for ${evaluation.searchedId}.`, "success");
      } else if (evaluation.result === PAIRING_RESULTS.WEAK_CONFIG) {
        addToast(`Pairing FLAGGED: Weak pairing configuration detected.`, "warning");
      } else {
        addToast(`Pairing DENIED for ${evaluation.searchedId}: Unauthorized or Revoked.`, "error");
      }
    }, 280);
  };

  // Demo Scenarios Handler
  const handleApplyScenario = (scenarioKey) => {
    let params = {};
    if (scenarioKey === "SECURE") {
      // Scenario A: Authorized + LE Secure Connections + Authenticated + Encryption
      params = {
        deviceId: "TECH-TAB-01",
        pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
        authMode: AUTH_MODES.AUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.ENABLED
      };
    } else if (scenarioKey === "UNKNOWN") {
      // Scenario B: Unknown device
      params = {
        deviceId: "ROGUE-BLE-SCANNER-99",
        pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
        authMode: AUTH_MODES.AUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.ENABLED
      };
    } else if (scenarioKey === "REVOKED") {
      // Scenario C: Revoked device
      params = {
        deviceId: "TECH-PHN-OLD",
        pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
        authMode: AUTH_MODES.AUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.ENABLED
      };
    } else if (scenarioKey === "WEAK_METHOD") {
      // Scenario D: Legacy Just Works pairing
      params = {
        deviceId: "TECH-TAB-01",
        pairingMethod: PAIRING_METHODS.LEGACY_JUST_WORKS,
        authMode: AUTH_MODES.UNAUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.ENABLED
      };
    } else if (scenarioKey === "PLAINTEXT") {
      // Scenario E: Encryption disabled
      params = {
        deviceId: "TECH-TAB-01",
        pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
        authMode: AUTH_MODES.AUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.DISABLED
      };
    } else if (scenarioKey === "ROGUE_SECURE") {
      // Scenario F: Unauthorized/unknown device attempting secure method
      params = {
        deviceId: "UNAUTHORIZED-DIAG-00",
        pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
        authMode: AUTH_MODES.AUTHENTICATED,
        encryptionMode: ENCRYPTION_MODES.ENABLED
      };
    }

    setSelectedDeviceId(params.deviceId);
    setPairingMethod(params.pairingMethod);
    setAuthMode(params.authMode);
    setEncryptionMode(params.encryptionMode);

    handleRunPairingTest(params);
  };

  // Clear Pairing Logs
  const handleClearLogs = () => {
    if (!window.confirm("Clear pairing simulation audit log? (Device Whitelist registry and vehicles will not be affected).")) {
      return;
    }
    clearPairingLogs();
    setLogs([]);
    addToast("Pairing audit log cleared.", "info");
  };

  // Reset Demo State
  const handleResetDemo = () => {
    if (!window.confirm("Reset pairing demo state and audit logs to initial baseline?")) {
      return;
    }
    const resetLogs = resetPairingDemoData();
    setLogs(resetLogs);
    setSelectedDeviceId("TECH-TAB-01");
    setPairingMethod(PAIRING_METHODS.LE_SECURE_CONNECTIONS);
    setAuthMode(AUTH_MODES.AUTHENTICATED);
    setEncryptionMode(ENCRYPTION_MODES.ENABLED);

    const initialEval = evaluatePairingSecurity({
      deviceId: "TECH-TAB-01",
      pairingMethod: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
      authMode: AUTH_MODES.AUTHENTICATED,
      encryptionMode: ENCRYPTION_MODES.ENABLED
    }, getWhitelistRegistry());
    setPairingResult(initialEval);

    addToast("Strong BLE Pairing demo baseline restored.", "info");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Prominent Mandatory Simulation Label */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
            <Bluetooth className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                SIMULATED BLE PAIRING — NO PHYSICAL BMS/BLE CONNECTION
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed max-w-3xl">
              <strong>Why secure pairing matters:</strong> Connected e-rickshaw BMS systems broadcast telemetry over Bluetooth. Weak or unauthenticated pairing allows unauthorized devices to eavesdrop or issue malicious disconnect commands. Real-world <strong>LE Secure Connections</strong> requires Bluetooth 4.2+ compliant hardware, compliant firmware, and ECDH P-256 key exchange; a web UI alone cannot enable it on a physical BMS.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Reset pairing simulation logs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Pairing Demo</span>
        </button>
      </div>

      {!storageActive && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Storage Notice: Browser localStorage is restricted. Running pairing simulation in-memory for this session.
          </span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Bluetooth className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Strong BLE Pairing Security
              </h2>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                BLE Security Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate cryptographic key exchange, mutual authentication, and whitelist-bound access control
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            to="/whitelist"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Device Whitelist ({registry.length})</span>
          </Link>
        </div>
      </div>

      {/* Pairing Security Profile - 4 Security Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-blue-600 font-bold">
            <Fingerprint className="w-4 h-4" />
            <span>1. Device Authorization</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Device identity must be present and <strong>Authorized</strong> in the active Whitelist. Unregistered or Revoked devices are strictly denied.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold">
            <Radio className="w-4 h-4" />
            <span>2. LE Secure Connections</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Uses <strong>ECDH P-256</strong> asymmetric cryptography to establish shared secret keys without exposing them over the radio.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold">
            <KeyRound className="w-4 h-4" />
            <span>3. Authenticated Pairing</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Enforces <strong>Numeric Comparison</strong> with Man-in-the-Middle (MITM) protection. Rejects unauthenticated Just Works links.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-purple-600 font-bold">
            <Lock className="w-4 h-4" />
            <span>4. AES-CCM Encryption</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            All post-pairing telemetry and diagnostic commands must be encrypted via <strong>128-bit AES-CCM</strong> over the wireless link.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Pairing Simulator Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Pairing Profile Configuration
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure simulated pairing parameters and test the security verdict.
              </p>
            </div>

            {/* Quick Demo Scenarios Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Pre-configured Demo Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyScenario("SECURE")}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario A: Authorized + LE Secure + Authenticated + Encryption"
                >
                  <span className="truncate">A. Secure LE Pairing</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario("UNKNOWN")}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario B: Unknown device"
                >
                  <span className="truncate">B. Unknown Device</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario("REVOKED")}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario C: Revoked device"
                >
                  <span className="truncate">C. Revoked Device</span>
                  <ShieldX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario("WEAK_METHOD")}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario D: Legacy Just Works pairing"
                >
                  <span className="truncate">D. Weak Just Works</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario("PLAINTEXT")}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario E: Encryption disabled"
                >
                  <span className="truncate">E. Plaintext (No Enc)</span>
                  <Unlock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario("ROGUE_SECURE")}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario F: Unauthorized device attempting secure method"
                >
                  <span className="truncate">F. Rogue + Secure Opts</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              </div>
            </div>

            {/* Config Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunPairingTest();
              }}
              className="space-y-4 text-xs"
            >
              {/* Target Device Input & Quick Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pairingDevId" className="font-semibold text-slate-700">
                    Target Device ID (MAC / Tag) *
                  </label>
                  {currentDevice && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded border ${
                        currentDevice.status === "Authorized"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      Whitelist: {currentDevice.status}
                    </span>
                  )}
                  {!currentDevice && selectedDeviceId && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      Unregistered in Whitelist
                    </span>
                  )}
                </div>

                <input
                  id="pairingDevId"
                  type="text"
                  required
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  placeholder="e.g. TECH-TAB-01 or ROGUE-BLE-SCANNER-99"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />

                {/* Dropdown helper */}
                <div className="mt-1.5 flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Quick select:</span>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose registered device --</option>
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
              </div>

              {/* Pairing Method Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  BLE Pairing Method (Simulated)
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: PAIRING_METHODS.LE_SECURE_CONNECTIONS,
                      title: "LE Secure Connections (Bluetooth 4.2+ ECDH P-256)",
                      badge: "SECURE",
                      desc: "Uses Diffie-Hellman elliptic curve exchange; protects against passive eavesdropping."
                    },
                    {
                      id: PAIRING_METHODS.LEGACY_JUST_WORKS,
                      title: "Legacy Just Works (Unauthenticated)",
                      badge: "WEAK",
                      desc: "Generates Temporary Key = 0; no MITM protection or mutual verification."
                    },
                    {
                      id: PAIRING_METHODS.LEGACY_PASSKEY,
                      title: "Legacy Passkey Entry (6-Digit PIN)",
                      badge: "WEAK",
                      desc: "6-digit PIN can be trivially cracked over the air by an eavesdropper."
                    }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        pairingMethod === method.id
                          ? "bg-blue-50/70 border-blue-400 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pairingMethod"
                        value={method.id}
                        checked={pairingMethod === method.id}
                        onChange={() => setPairingMethod(method.id)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{method.title}</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              method.badge === "SECURE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {method.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Authentication Mode Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Authentication & MITM Protection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      authMode === AUTH_MODES.AUTHENTICATED
                        ? "bg-blue-50/70 border-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="authMode"
                      value={AUTH_MODES.AUTHENTICATED}
                      checked={authMode === AUTH_MODES.AUTHENTICATED}
                      onChange={() => setAuthMode(AUTH_MODES.AUTHENTICATED)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">Authenticated</span>
                      <span className="text-[10px] text-slate-500">Numeric comparison / MITM protected</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      authMode === AUTH_MODES.UNAUTHENTICATED
                        ? "bg-amber-50/70 border-amber-300 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="authMode"
                      value={AUTH_MODES.UNAUTHENTICATED}
                      checked={authMode === AUTH_MODES.UNAUTHENTICATED}
                      onChange={() => setAuthMode(AUTH_MODES.UNAUTHENTICATED)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-amber-950 block">Unauthenticated</span>
                      <span className="text-[10px] text-amber-700">No mutual identity verification</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Encryption Toggle */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Link Encryption (AES-CCM)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      encryptionMode === ENCRYPTION_MODES.ENABLED
                        ? "bg-blue-50/70 border-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="encryptionMode"
                      value={ENCRYPTION_MODES.ENABLED}
                      checked={encryptionMode === ENCRYPTION_MODES.ENABLED}
                      onChange={() => setEncryptionMode(ENCRYPTION_MODES.ENABLED)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 block">Encryption Enabled</span>
                        <span className="text-[10px] text-slate-500">AES-CCM 128-bit payload encryption</span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      encryptionMode === ENCRYPTION_MODES.DISABLED
                        ? "bg-rose-50/70 border-rose-300 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="encryptionMode"
                      value={ENCRYPTION_MODES.DISABLED}
                      checked={encryptionMode === ENCRYPTION_MODES.DISABLED}
                      onChange={() => setEncryptionMode(ENCRYPTION_MODES.DISABLED)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex items-center space-x-1.5">
                      <Unlock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-rose-950 block">Encryption Disabled</span>
                        <span className="text-[10px] text-rose-700">Plaintext transmission</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating BLE Pairing Security...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    <span>Run Pairing Test</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Pairing Result Panel & Security Analysis (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Result Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pairing Security Evaluation</h3>
                <p className="text-xs text-slate-500">Real-time outcome derived from active whitelist and pairing options</p>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                Simulated Result
              </span>
            </div>

            {pairingResult ? (
              <div
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  pairingResult.result === PAIRING_RESULTS.SECURE_CONFIG
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                    : pairingResult.result === PAIRING_RESULTS.WEAK_CONFIG
                    ? "bg-amber-50/80 border-amber-300 text-amber-950"
                    : "bg-rose-50/80 border-rose-300 text-rose-950"
                }`}
              >
                {/* Result Status Header */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                    {pairingResult.result === PAIRING_RESULTS.SECURE_CONFIG ? (
                      <ShieldCheck className="w-7 h-7 text-emerald-600" />
                    ) : pairingResult.result === PAIRING_RESULTS.WEAK_CONFIG ? (
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    ) : (
                      <ShieldX className="w-7 h-7 text-rose-600" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500">
                      Security Verdict:
                    </span>
                    <h4 className="text-base sm:text-lg font-black tracking-tight font-mono">
                      {pairingResult.result}
                    </h4>

                    <p className="text-xs font-mono text-slate-700">
                      Target: <strong>{pairingResult.searchedId || "(Empty)"}</strong>
                      {pairingResult.device && (
                        <span> — {pairingResult.device.name} ({pairingResult.device.status})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Reason & Deficiency List */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2 text-xs">
                  <span className="font-semibold block text-slate-800">Audit Reasons & Analysis:</span>
                  <ul className="space-y-1.5">
                    {pairingResult.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        {pairingResult.result === PAIRING_RESULTS.SECURE_CONFIG ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : pairingResult.result === PAIRING_RESULTS.WEAK_CONFIG ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Simulated Verification Notice */}
                <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Method: {PAIRING_METHOD_LABELS[pairingMethod] || pairingMethod}</span>
                  <span className="font-bold">Result: {pairingResult.isSecure ? "PASS" : "REJECT / WEAK"}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Test Run Yet"
                description="Select a device and click 'Run Pairing Test' to simulate."
                icon={Bluetooth}
              />
            )}

            {/* Educational Workshop Guidance Note */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Workshop Technician Security Guidance</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-600">
                In electric 3-wheeler maintenance, BMS telemetry and cell balancer calibration must never be configured with unauthenticated Just Works pairing. A compromised or open wireless channel permits drive-by battery disconnects while the e-rickshaw is operating.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pairing Security Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Pairing Security Audit Log</h3>
            </div>
            <p className="text-xs text-slate-500">
              Audit trail of simulated BLE pairing attempts and security verdicts (newest first)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-semibold text-slate-500">
              {logs.length} logged pairing attempts
            </span>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear pairing audit log"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Pairing Log</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            title="Pairing Audit Log is Empty"
            description="Run a pairing test above to generate simulated audit events."
            icon={Clock}
            actionLabel="Run Secure Pairing Scenario"
            onAction={() => handleApplyScenario("SECURE")}
          />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[11px]">
                  <th className="py-2.5 px-3 font-bold">Timestamp</th>
                  <th className="py-2.5 px-3 font-bold">Device ID & Name</th>
                  <th className="py-2.5 px-3 font-bold">Pairing Method</th>
                  <th className="py-2.5 px-3 font-bold">Auth / Encryption</th>
                  <th className="py-2.5 px-3 font-bold text-center">Verdict</th>
                  <th className="py-2.5 px-3 font-bold">Audit Reasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const isSec = log.result === PAIRING_RESULTS.SECURE_CONFIG;
                  const isWeak = log.result === PAIRING_RESULTS.WEAK_CONFIG;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{log.deviceId}</span>
                        <span className="text-[11px] text-slate-500">{log.deviceName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {log.pairingMethod === PAIRING_METHODS.LE_SECURE_CONNECTIONS ? (
                          <span className="text-emerald-700 font-semibold">LE Secure (ECDH)</span>
                        ) : log.pairingMethod === PAIRING_METHODS.LEGACY_JUST_WORKS ? (
                          <span className="text-amber-700 font-semibold">Just Works</span>
                        ) : (
                          <span className="text-slate-600">{log.pairingMethod}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className="block font-medium">
                          {log.authMode === AUTH_MODES.AUTHENTICATED ? "Authenticated" : "Unauthenticated"}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {log.encryptionMode === ENCRYPTION_MODES.ENABLED ? "AES-CCM Encrypted" : "Plaintext"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase whitespace-nowrap ${
                            isSec
                              ? "bg-emerald-100 text-emerald-800"
                              : isWeak
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isSec ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isWeak ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{isSec ? "SECURE" : isWeak ? "WEAK" : "DENIED"}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs">
                        <ul className="list-disc list-inside space-y-0.5">
                          {(log.reasons || []).slice(0, 2).map((r, i) => (
                            <li key={i} className="truncate" title={r}>{r}</li>
                          ))}
                        </ul>
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

export default Pairing;
