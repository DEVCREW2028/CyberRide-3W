import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  KeyRound, 
  Lock, 
  Unlock, 
  Cpu, 
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
  Bluetooth,
  Copy,
  Terminal,
  FileCheck
} from "lucide-react";
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
  checkDevicePairingPrerequisite
} from "../logic/challengeAuth.js";
import { 
  getWhitelistRegistry, 
  findDeviceInRegistry, 
  isStorageAvailable 
} from "../logic/whitelisting.js";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/EmptyState";

export function ChallengeAuth() {
  const { addToast } = useToast();

  // Registry & Audit Logs
  const [registry, setRegistry] = useState([]);
  const [logs, setLogs] = useState([]);
  const [storageActive, setStorageActive] = useState(true);

  // Form & Challenge State
  const [selectedDeviceId, setSelectedDeviceId] = useState("TECH-TAB-01");
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [responseInput, setResponseInput] = useState("");
  const [blePairingActive, setBlePairingActive] = useState(true);

  // Evaluation & Result State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authResult, setAuthResult] = useState(null);

  // Expiry countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Load initial data
  useEffect(() => {
    setStorageActive(isStorageAvailable());
    const reg = getWhitelistRegistry();
    const l = getAuthLogs();
    setRegistry(reg);
    setLogs(l);

    // Initial fresh challenge for demo convenience
    const initialChal = createChallenge("TECH-TAB-01", reg, 60000);
    if (initialChal.success) {
      setActiveChallenge(initialChal.challenge);
      computeHmacResponse(initialChal.challenge.nonce, "TECH-TAB-01").then(resp => {
        if (resp.success) setResponseInput(resp.responseHex);
      });
    }
  }, []);

  // Update countdown for active challenge
  useEffect(() => {
    if (!activeChallenge || activeChallenge.status !== CHALLENGE_STATUS.UNUSED) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remainingMs = Math.max(0, activeChallenge.expiresAt - Date.now());
      const secs = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(secs);

      if (secs <= 0 && activeChallenge.status === CHALLENGE_STATUS.UNUSED) {
        setActiveChallenge(prev => prev ? { ...prev, status: CHALLENGE_STATUS.EXPIRED } : null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  // Current matched device from whitelist registry
  const currentDevice = findDeviceInRegistry(registry, selectedDeviceId);

  // Handle Generate New Challenge
  const handleGenerateChallenge = (targetDeviceId) => {
    const idToUse = targetDeviceId !== undefined ? targetDeviceId : selectedDeviceId;
    setIsGenerating(true);

    setTimeout(() => {
      const latestRegistry = getWhitelistRegistry();
      setRegistry(latestRegistry);

      const res = createChallenge(idToUse, latestRegistry, 60000);
      setIsGenerating(false);

      if (!res.success) {
        setActiveChallenge(null);
        setResponseInput("");
        setAuthResult({
          result: res.result,
          isAllowed: false,
          reasons: [res.reason]
        });
        addToast(res.reason, "error");
        setLogs(getAuthLogs());
        return;
      }

      setActiveChallenge(res.challenge);
      setResponseInput("");
      setAuthResult(null);
      addToast(`Fresh challenge ${res.challenge.challengeId} generated.`, "info");
      setLogs(getAuthLogs());
    }, 200);
  };

  // Handle Generate Demo HMAC Response
  const handleGenerateResponse = async () => {
    if (!activeChallenge) {
      addToast("Please generate a challenge first.", "warning");
      return;
    }
    const res = await computeHmacResponse(activeChallenge.nonce, selectedDeviceId);
    if (res.success) {
      setResponseInput(res.responseHex);
      addToast("Demo HMAC-SHA-256 response calculated using device secret.", "success");
    } else {
      addToast(res.error || "Failed to compute HMAC response.", "error");
    }
  };

  // Handle Verification Attempt
  const handleVerify = async (overrideParams) => {
    const chalId = overrideParams?.challengeId || (activeChallenge ? activeChallenge.challengeId : "");
    const devId = overrideParams?.deviceId !== undefined ? overrideParams.deviceId : selectedDeviceId;
    const resp = overrideParams?.response !== undefined ? overrideParams.response : responseInput;
    const bleState = overrideParams?.blePairingActive !== undefined ? overrideParams.blePairingActive : blePairingActive;

    setIsVerifying(true);

    setTimeout(async () => {
      const latestRegistry = getWhitelistRegistry();
      setRegistry(latestRegistry);

      const verification = await verifyChallengeResponse(
        {
          challengeId: chalId,
          deviceId: devId,
          providedResponse: resp,
          requireBlePairing: true,
          blePairingOverride: bleState
        },
        latestRegistry
      );

      setIsVerifying(false);
      setAuthResult(verification);

      // Refresh challenge state from store
      if (chalId) {
        const updatedChal = getChallenge(chalId);
        if (updatedChal) {
          setActiveChallenge(updatedChal);
        }
      }

      // Refresh logs
      setLogs(getAuthLogs());

      if (verification.result === AUTH_RESULTS.SUCCESS) {
        addToast("Authentication SUCCESSFUL: Identity verified cryptographically.", "success");
      } else if (verification.result === AUTH_RESULTS.ALREADY_USED) {
        addToast("REPLAY BLOCKED: Challenge was already consumed.", "warning");
      } else if (verification.result === AUTH_RESULTS.EXPIRED) {
        addToast("EXPIRED: Challenge validity timeout exceeded.", "warning");
      } else {
        addToast(`Authentication DENIED: ${verification.reasons[0]}`, "error");
      }
    }, 280);
  };

  // Pre-configured Demo Scenarios
  const handleRunScenario = async (scenarioKey) => {
    const latestRegistry = getWhitelistRegistry();
    setRegistry(latestRegistry);

    if (scenarioKey === "VALID") {
      // Scenario 1: Valid Fresh Response
      setSelectedDeviceId("TECH-TAB-01");
      setBlePairingActive(true);
      const chalRes = createChallenge("TECH-TAB-01", latestRegistry, 60000);
      if (chalRes.success) {
        setActiveChallenge(chalRes.challenge);
        const respRes = await computeHmacResponse(chalRes.challenge.nonce, "TECH-TAB-01");
        setResponseInput(respRes.responseHex);
        await handleVerify({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          response: respRes.responseHex,
          blePairingActive: true
        });
      }
    } else if (scenarioKey === "TAMPERED") {
      // Scenario 2: Tampered / Modified Signature
      setSelectedDeviceId("TECH-TAB-01");
      setBlePairingActive(true);
      const chalRes = createChallenge("TECH-TAB-01", latestRegistry, 60000);
      if (chalRes.success) {
        setActiveChallenge(chalRes.challenge);
        const respRes = await computeHmacResponse(chalRes.challenge.nonce, "TECH-TAB-01");
        // Corrupt first byte of signature
        const corrupted = respRes.responseHex[0] === "a" ? "b" + respRes.responseHex.slice(1) : "a" + respRes.responseHex.slice(1);
        setResponseInput(corrupted);
        await handleVerify({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          response: corrupted,
          blePairingActive: true
        });
      }
    } else if (scenarioKey === "REPLAY") {
      // Scenario 3: Replay Attack (resubmitting already consumed challenge)
      setSelectedDeviceId("TECH-TAB-01");
      setBlePairingActive(true);
      const chalRes = createChallenge("TECH-TAB-01", latestRegistry, 60000);
      if (chalRes.success) {
        setActiveChallenge(chalRes.challenge);
        const respRes = await computeHmacResponse(chalRes.challenge.nonce, "TECH-TAB-01");
        setResponseInput(respRes.responseHex);
        // First legitimate consumption
        await verifyChallengeResponse({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          providedResponse: respRes.responseHex,
          blePairingOverride: true
        }, latestRegistry);
        // Now simulate replay
        await handleVerify({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          response: respRes.responseHex,
          blePairingActive: true
        });
      }
    } else if (scenarioKey === "EXPIRED") {
      // Scenario 4: Expired Challenge (immediate expiry simulation)
      setSelectedDeviceId("TECH-TAB-01");
      setBlePairingActive(true);
      const chalRes = createChallenge("TECH-TAB-01", latestRegistry, -1000); // Created in past
      if (chalRes.success) {
        setActiveChallenge(chalRes.challenge);
        const respRes = await computeHmacResponse(chalRes.challenge.nonce, "TECH-TAB-01");
        setResponseInput(respRes.responseHex);
        await handleVerify({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          response: respRes.responseHex,
          blePairingActive: true
        });
      }
    } else if (scenarioKey === "REVOKED") {
      // Scenario 5: Revoked Device
      setSelectedDeviceId("TECH-PHN-OLD");
      setBlePairingActive(true);
      setActiveChallenge(null);
      setResponseInput("deadbeef0123456789abcdef");
      await handleVerify({
        challengeId: "CHAL-REVOKED-TEST",
        deviceId: "TECH-PHN-OLD",
        response: "deadbeef0123456789abcdef",
        blePairingActive: true
      });
    } else if (scenarioKey === "NO_PAIRING") {
      // Scenario 6: Missing BLE Pairing Prerequisite
      setSelectedDeviceId("TECH-TAB-01");
      setBlePairingActive(false);
      const chalRes = createChallenge("TECH-TAB-01", latestRegistry, 60000);
      if (chalRes.success) {
        setActiveChallenge(chalRes.challenge);
        const respRes = await computeHmacResponse(chalRes.challenge.nonce, "TECH-TAB-01");
        setResponseInput(respRes.responseHex);
        await handleVerify({
          challengeId: chalRes.challenge.challengeId,
          deviceId: "TECH-TAB-01",
          response: respRes.responseHex,
          blePairingActive: false
        });
      }
    }
  };

  // Clear audit log
  const handleClearLogs = () => {
    if (!window.confirm("Clear challenge-response audit log? (Whitelist and fleet data will not be affected).")) {
      return;
    }
    clearAuthLogs();
    setLogs([]);
    addToast("Authentication audit log cleared.", "info");
  };

  // Reset feature demo state
  const handleResetDemo = () => {
    if (!window.confirm("Reset challenge-response demo data and audit logs?")) {
      return;
    }
    const resetLogs = resetAuthDemoData();
    setLogs(resetLogs);
    setActiveChallenge(null);
    setResponseInput("");
    setAuthResult(null);
    setSelectedDeviceId("TECH-TAB-01");
    setBlePairingActive(true);
    addToast("Strong Challenge–Response demo data restored to initial baseline.", "info");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Prominent Mandatory Simulation Label */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                SIMULATED CHALLENGE–RESPONSE — NO PHYSICAL BMS CONNECTION
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed max-w-3xl">
              <strong>Why Challenge–Response Authentication matters:</strong> Proves a workshop diagnostic tool possesses its secret credential without ever transmitting the secret over the wireless link. Fresh random nonces and single-use verification prevent replay attacks, while active whitelist enforcement and BLE pairing prerequisites prevent unauthorized session takeover.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Reset authentication simulation demo state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Auth Demo</span>
        </button>
      </div>

      {!storageActive && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Storage Notice: Browser localStorage is restricted. Running challenge-response simulation in-memory for this session.
          </span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Strong Challenge–Response Authentication
              </h2>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                HMAC-SHA-256 Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate cryptographic handshake, fresh random nonces, single-use tokens, and replay prevention
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            to="/whitelist"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
            <span>Whitelist ({registry.length})</span>
          </Link>
          <Link
            to="/pairing"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Bluetooth className="w-3.5 h-3.5 text-indigo-600" />
            <span>BLE Pairing</span>
          </Link>
        </div>
      </div>

      {/* 4 Pillars of Strong Challenge-Response */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-blue-600 font-bold">
            <Fingerprint className="w-4 h-4" />
            <span>1. Whitelist Prerequisite</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Device must be currently <strong>Authorized</strong> in the registry. Revocation before challenge generation or before verification denies access immediately.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold">
            <RefreshCw className="w-4 h-4" />
            <span>2. Fresh Random Nonce</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Generated using <strong>crypto.getRandomValues</strong> (256-bit entropy). Never uses Math.random(). Bound to a 60-second expiration window.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-purple-600 font-bold">
            <Lock className="w-4 h-4" />
            <span>3. HMAC-SHA-256 Signature</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            The device signs the challenge using Web Crypto HMAC-SHA-256. Verified independently on the BMS side without exposing secrets over BLE.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>4. Single-Use Consumption</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Every challenge is consumed on the first verification attempt. Any subsequent submission triggers <strong>CHALLENGE ALREADY USED</strong> (anti-replay).
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Flow Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Authentication Handshake Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Execute the 3-step challenge-response exchange between diagnostic tool and BMS.
              </p>
            </div>

            {/* Quick Demo Scenarios Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                One-Click Demo Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRunScenario("VALID")}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 1: Fresh challenge + valid HMAC + secure pairing"
                >
                  <span className="truncate">1. Valid Fresh Response</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunScenario("TAMPERED")}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 2: Corrupted signature byte"
                >
                  <span className="truncate">2. Tampered Signature</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunScenario("REPLAY")}
                  className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 3: Resubmitting consumed challenge"
                >
                  <span className="truncate">3. Replay Attack</span>
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunScenario("EXPIRED")}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 4: Challenge past expiration window"
                >
                  <span className="truncate">4. Expired Challenge</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunScenario("REVOKED")}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 5: Revoked or unknown device"
                >
                  <span className="truncate">5. Revoked Device</span>
                  <ShieldX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunScenario("NO_PAIRING")}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-semibold text-left transition-colors flex items-center justify-between cursor-pointer"
                  title="Scenario 6: BLE Pairing link missing"
                >
                  <span className="truncate">6. Unpaired Link Prereq</span>
                  <Bluetooth className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              </div>
            </div>

            {/* Step 1: Device Selection & Prerequisites */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                  Step 1: Select Diagnostic Device
                </span>
                {currentDevice && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      currentDevice.status === "Authorized"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    Whitelist: {currentDevice.status}
                  </span>
                )}
                {!currentDevice && selectedDeviceId && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                    Not in Whitelist
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  placeholder="e.g. TECH-TAB-01"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                />

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-400">Quick select:</span>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 cursor-pointer text-xs"
                  >
                    <option value="">-- Choose from Whitelist --</option>
                    {registry.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.id} — {dev.name} ({dev.status})
                      </option>
                    ))}
                    <option value="ROGUE-SCANNER-99">ROGUE-SCANNER-99 (Unregistered)</option>
                  </select>
                </div>
              </div>

              {/* BLE Pairing Prerequisite Toggle */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Bluetooth className={`w-4 h-4 ${blePairingActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <div>
                    <span className="font-semibold text-slate-900 block">BLE Pairing Link State</span>
                    <span className="text-[10px] text-slate-500">
                      {blePairingActive ? "Simulated LE Secure Connections + AES-CCM Active" : "Unpaired / Legacy Unencrypted Link"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBlePairingActive(!blePairingActive)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-colors cursor-pointer ${
                    blePairingActive
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
                  }`}
                >
                  {blePairingActive ? "PAIRED" : "UNPAIRED"}
                </button>
              </div>
            </div>

            {/* Step 2: Challenge Generation */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                  Step 2: Issue Fresh Challenge Nonce
                </span>

                <button
                  type="button"
                  onClick={() => handleGenerateChallenge()}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Challenge</span>
                </button>
              </div>

              {activeChallenge ? (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono font-bold text-purple-950">
                      ID: {activeChallenge.challengeId}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          activeChallenge.status === CHALLENGE_STATUS.UNUSED
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : activeChallenge.status === CHALLENGE_STATUS.CONSUMED
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {activeChallenge.status}
                      </span>
                      {activeChallenge.status === CHALLENGE_STATUS.UNUSED && (
                        <span className="font-mono text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {secondsRemaining}s left
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">
                      Cryptographic Nonce (32 Bytes):
                    </span>
                    <p className="font-mono text-[11px] text-slate-700 break-all bg-white p-2 rounded-lg border border-purple-100 select-all">
                      {activeChallenge.nonce}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
                  No active challenge. Click "Generate Challenge" above to issue a nonce.
                </div>
              )}
            </div>

            {/* Step 3: Compute Response & Verify */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                  Step 3: Response & Verification
                </span>

                <button
                  type="button"
                  onClick={handleGenerateResponse}
                  disabled={!activeChallenge}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Compute HMAC-SHA-256 on device side"
                >
                  <Lock className="w-3 h-3 text-purple-600" />
                  <span>Generate Demo Response</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  HMAC-SHA-256 Response Signature (Hex):
                </label>
                <textarea
                  rows={2}
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="Paste or generate 256-bit HMAC signature (64 hex characters)..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs resize-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isVerifying || !activeChallenge}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Response...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Result Panel & Security Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verification Verdict</h3>
                <p className="text-xs text-slate-500">Cryptographic audit result and replay protection status</p>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                Simulated Auth
              </span>
            </div>

            {authResult ? (
              <div
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  authResult.result === AUTH_RESULTS.SUCCESS
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                    : authResult.result === AUTH_RESULTS.ALREADY_USED
                    ? "bg-purple-50/80 border-purple-300 text-purple-950"
                    : authResult.result === AUTH_RESULTS.EXPIRED
                    ? "bg-amber-50/80 border-amber-300 text-amber-950"
                    : "bg-rose-50/80 border-rose-300 text-rose-950"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                    {authResult.result === AUTH_RESULTS.SUCCESS ? (
                      <ShieldCheck className="w-7 h-7 text-emerald-600" />
                    ) : authResult.result === AUTH_RESULTS.ALREADY_USED ? (
                      <RotateCcw className="w-7 h-7 text-purple-600" />
                    ) : authResult.result === AUTH_RESULTS.EXPIRED ? (
                      <Clock className="w-7 h-7 text-amber-600" />
                    ) : (
                      <ShieldX className="w-7 h-7 text-rose-600" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500">
                      Authentication Status:
                    </span>
                    <h4 className="text-base sm:text-lg font-black tracking-tight font-mono">
                      {authResult.result}
                    </h4>

                    <p className="text-xs font-mono text-slate-700">
                      Challenge: <strong>{authResult.challengeId || "N/A"}</strong>
                      {authResult.device && (
                        <span> • Device: <strong>{authResult.device.id}</strong> ({authResult.device.name})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Audit reasons list */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2 text-xs">
                  <span className="font-semibold block text-slate-800">Verification Reasons & Checks:</span>
                  <ul className="space-y-1.5">
                    {authResult.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        {authResult.result === AUTH_RESULTS.SUCCESS ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : authResult.result === AUTH_RESULTS.ALREADY_USED ? (
                          <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        ) : authResult.result === AUTH_RESULTS.EXPIRED ? (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Replay Guard: Active</span>
                  <span className="font-bold">
                    Access Granted: {authResult.isAllowed ? "YES (SIMULATED)" : "NO"}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Awaiting Verification"
                description="Generate a challenge, calculate or supply a response, and click 'Verify Response'."
                icon={KeyRound}
              />
            )}

            {/* Prototype Security Architecture Note */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Info className="w-4 h-4 text-purple-600" />
                <span>Prototype Cryptographic Architecture</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-600">
                This demonstration generates 256-bit cryptographically secure nonces and verifies HMAC-SHA-256 signatures via native <strong>crypto.subtle</strong> Web Crypto APIs. In a production EV BMS, root keys are stored in a hardware secure element (SE) or TPM. Keys are never transmitted over the Bluetooth radio link.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge–Response Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Authentication Security Audit Log</h3>
            </div>
            <p className="text-xs text-slate-500">
              Cryptographic event trail of challenge issuance, verification attempts, and replay rejections
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
                title="Clear authentication audit log"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Auth Log</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            title="Authentication Audit Log is Empty"
            description="Generate challenges and test verification attempts to create audit records."
            icon={Clock}
            actionLabel="Run Valid Authentication Scenario"
            onAction={() => handleRunScenario("VALID")}
          />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[11px]">
                  <th className="py-2.5 px-3 font-bold">Timestamp</th>
                  <th className="py-2.5 px-3 font-bold">Device ID</th>
                  <th className="py-2.5 px-3 font-bold">Challenge ID</th>
                  <th className="py-2.5 px-3 font-bold">Event</th>
                  <th className="py-2.5 px-3 font-bold text-center">Outcome</th>
                  <th className="py-2.5 px-3 font-bold">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const isSuccess = log.outcome === AUTH_RESULTS.SUCCESS;
                  const isReplay = log.outcome === AUTH_RESULTS.ALREADY_USED;
                  const isExpired = log.outcome === AUTH_RESULTS.EXPIRED;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {log.deviceId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {log.challengeId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {log.event}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase whitespace-nowrap ${
                            isSuccess
                              ? "bg-emerald-100 text-emerald-800"
                              : isReplay
                              ? "bg-purple-100 text-purple-800"
                              : isExpired
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isReplay ? (
                            <RotateCcw className="w-3 h-3 text-purple-600" />
                          ) : isExpired ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>
                            {isSuccess
                              ? "SUCCESS"
                              : isReplay
                              ? "REPLAY"
                              : isExpired
                              ? "EXPIRED"
                              : log.outcome === "GENERATED"
                              ? "ISSUED"
                              : "DENIED"}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-sm truncate" title={log.reason}>
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

export default ChallengeAuth;
