/**
 * CyberRide 3W - Deterministic Rule-Based Assessment Engine
 * 
 * Assesses wireless BMS security readiness for connected e-rickshaws.
 * Explainable, rule-based logic (no opaque ML).
 * 
 * Check Scores:
 * - PASS = 0 points penalty
 * - WARNING = 1 point penalty
 * - FAIL = 2 points penalty
 * 
 * Overall Risk Thresholds:
 * - 0 - 2 penalty points: LOW RISK (Secure)
 * - 3 - 5 penalty points: MEDIUM RISK (Needs Attention)
 * - 6+ penalty points: HIGH RISK (Critical Attention Required)
 */

export const CHECK_DEFINITIONS = [
  {
    id: "wireless_interface",
    name: "Wireless Interface & Service Exposure",
    category: "Interface Exposure",
    iconName: "Radio",
    evaluate: (profile) => {
      const val = profile.wirelessInterface.toLowerCase();
      if (val.includes("whitelisted") || val.includes("bonded")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.wirelessInterface,
          explanation: "The BMS only advertises or accepts connections from bonded workshop devices. Public open broadcast is disabled.",
          remediation: "Maintain whitelisted MAC policy and periodic key rotation.",
          matchedRule: "whitelisted_pairing_detected"
        };
      } else if (val.includes("public open broadcast") || val.includes("standard service")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.wirelessInterface,
          explanation: "The BMS continuously advertises generic Bluetooth services in public space, making it discoverable to any nearby phone scanner.",
          remediation: "Configure stealth broadcast or implement physical pairing activation button.",
          matchedRule: "public_broadcast_detected"
        };
      } else {
        return {
          status: "FAIL",
          severity: "HIGH",
          score: 2,
          detected: profile.wirelessInterface,
          explanation: "Open unauthenticated GATT UART services are actively exposed over Bluetooth without service filtering.",
          remediation: "Disable open UART GATT services and restrict broadcast visibility to authorized maintenance sessions.",
          matchedRule: "open_uart_gatt_detected"
        };
      }
    }
  },
  {
    id: "authentication",
    name: "BMS Authentication & Pairing Credentials",
    category: "Authentication",
    iconName: "KeyRound",
    evaluate: (profile) => {
      const val = profile.authentication.toLowerCase();
      if (val.includes("passkey") || val.includes("challenge") || val.includes("token")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.authentication,
          explanation: "Cryptographic challenge-response or dynamic authenticated passkey is active, preventing brute-force PIN guessing.",
          remediation: "Keep master technician authentication keys securely backed up.",
          matchedRule: "cryptographic_passkey_detected"
        };
      } else if (val.includes("static") || val.includes("single-factor")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.authentication,
          explanation: "The BMS uses a weak static PIN (e.g. 000000 or 1234) which can be easily guessed by unauthorized users in proximity.",
          remediation: "Replace factory-default PIN with an individualized strong alphanumeric technician passkey.",
          matchedRule: "static_pin_detected"
        };
      } else {
        return {
          status: "FAIL",
          severity: "CRITICAL",
          score: 2,
          detected: profile.authentication,
          explanation: "No authentication or default factory password detected. Any nearby phone can establish a direct control session.",
          remediation: "Enable authenticated access, enforce non-default master credentials, and require physical authorization.",
          matchedRule: "missing_auth_detected"
        };
      }
    }
  },
  {
    id: "unauthorized_access",
    name: "Unauthorized Device Access Controls",
    category: "Access Control",
    iconName: "ShieldAlert",
    evaluate: (profile) => {
      const val = profile.unauthorizedAccess.toLowerCase();
      if (val.includes("blocked") || val.includes("mutual")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.unauthorizedAccess,
          explanation: "Access controls reject arbitrary client devices. Connection requests from unregistered phones are dropped immediately.",
          remediation: "Ensure workshop diagnostic tablets are enrolled in the trusted device list.",
          matchedRule: "access_blocked_mutual_auth"
        };
      } else if (val.includes("possible without") || val.includes("possible via")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.unauthorizedAccess,
          explanation: "Generic Bluetooth scanning applications can attach to the peripheral and read telemetry characteristics.",
          remediation: "Bind BMS connection permissions to registered workshop technician IDs.",
          matchedRule: "generic_ble_scan_attachable"
        };
      } else {
        return {
          status: "FAIL",
          severity: "HIGH",
          score: 2,
          detected: profile.unauthorizedAccess,
          explanation: "Any third-party smartphone app can initiate a session without physical proximity or owner authorization.",
          remediation: "Implement device binding and restrict connection establishment to authenticated technician apps.",
          matchedRule: "unrestricted_third_party_access"
        };
      }
    }
  },
  {
    id: "safety_commands",
    name: "Safety-Critical Command Protection (MOSFET & Discharge)",
    category: "Vehicle Safety",
    iconName: "ZapOff",
    evaluate: (profile) => {
      const val = profile.safetyCommands.toLowerCase();
      if (val.includes("interlock") || val.includes("hardware protected")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.safetyCommands,
          explanation: "Critical operations (discharge shut-off, emergency cut-off, MOSFET override) require physical hardware interlock confirmation.",
          remediation: "Keep physical interlock switches inspected during regular EV servicing.",
          matchedRule: "hardware_interlock_enforced"
        };
      } else if (val.includes("rate-limited") || val.includes("protected by 4-digit")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.safetyCommands,
          explanation: "Power cut-off commands require basic software PIN, but lack hardware failsafe during vehicle motion.",
          remediation: "Enforce safety-critical interlocks to prevent sudden power disconnection while the vehicle is in drive state.",
          matchedRule: "soft_pin_without_hardware_interlock"
        };
      } else {
        return {
          status: "FAIL",
          severity: "CRITICAL",
          score: 2,
          detected: profile.safetyCommands,
          explanation: "Safety-critical commands (remote battery disconnect & MOSFET override) are exposed over wireless interface without protection. An unauthorized command could cut power abruptly in traffic.",
          remediation: "Isolate remote power disconnect from wireless interface or enforce cryptographic safety interlocks.",
          matchedRule: "unprotected_remote_cutoff_exposed"
        };
      }
    }
  },
  {
    id: "config_protection",
    name: "BMS Configuration & Threshold Protection",
    category: "Configuration Integrity",
    iconName: "Sliders",
    evaluate: (profile) => {
      const val = profile.configProtection.toLowerCase();
      if (val.includes("signed") || val.includes("encrypted write")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.configProtection,
          explanation: "BMS cell voltage thresholds (OVP/UVP/OTP) and capacity calibration are write-locked and cryptographically signed.",
          remediation: "Store master configuration templates in the secure workshop repository.",
          matchedRule: "signed_or_encrypted_write_lock"
        };
      } else if (val.includes("basic password") || val.includes("weak pin")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.configProtection,
          explanation: "Threshold parameter editing is protected only by a simple PIN, leaving thermal and overvoltage limits vulnerable to accidental or unauthorized modification.",
          remediation: "Upgrade parameter write permissions to require dual-technician key verification.",
          matchedRule: "basic_password_protection"
        };
      } else {
        return {
          status: "FAIL",
          severity: "HIGH",
          score: 2,
          detected: profile.configProtection,
          explanation: "Battery protection thresholds (Overvoltage, Undervoltage, Max Charge Current) are in plain unencrypted read/write registers. Tampering could cause thermal runaway or cell damage.",
          remediation: "Lock parameter write registers and apply factory calibration seal.",
          matchedRule: "unencrypted_read_write_parameters"
        };
      }
    }
  },
  {
    id: "wireless_access_control",
    name: "Wireless Session Management & Broadcast Control",
    category: "Session Management",
    iconName: "WifiOff",
    evaluate: (profile) => {
      const val = profile.wirelessAccessControl.toLowerCase();
      if (val.includes("timeout") || val.includes("physical button")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.wirelessAccessControl,
          explanation: "Bluetooth beacon shuts down automatically when vehicle is in motion or after 60 seconds of inactivity.",
          remediation: "Verify timeout behavior during routine battery inspection.",
          matchedRule: "pairing_timeout_or_physical_button"
        };
      } else if (val.includes("continuous advertisement")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.wirelessAccessControl,
          explanation: "BMS continuously broadcasts wireless pairing beacons even when parked unattended in public charging spots.",
          remediation: "Enable pairing timeout so Bluetooth radio powers down after key ignition.",
          matchedRule: "continuous_idle_advertisement"
        };
      } else {
        return {
          status: "FAIL",
          severity: "HIGH",
          score: 2,
          detected: profile.wirelessAccessControl,
          explanation: "Unrestricted, always-on beacon allows tracking vehicle location and continuous connection attempts by unauthorized nearby parties.",
          remediation: "Configure wireless sleep mode and restrict pairing to maintenance window.",
          matchedRule: "unrestricted_always_on_beacon"
        };
      }
    }
  },
  {
    id: "firmware_access",
    name: "Firmware & Over-The-Air (OTA) Protection",
    category: "Firmware Security",
    iconName: "Cpu",
    evaluate: (profile) => {
      const val = profile.firmwareAccess.toLowerCase();
      if (val.includes("signed") || val.includes("cryptographically")) {
        return {
          status: "PASS",
          severity: "LOW",
          score: 0,
          detected: profile.firmwareAccess,
          explanation: "Firmware updates require verified digital cryptographic signatures with hardware rollback protection.",
          remediation: "Only flash firmware binaries sourced directly from approved OEM portals.",
          matchedRule: "cryptographically_signed_ota"
        };
      } else if (val.includes("checksum") || val.includes("crc32") || val.includes("partially")) {
        return {
          status: "WARNING",
          severity: "MEDIUM",
          score: 1,
          detected: profile.firmwareAccess,
          explanation: "Firmware upload checks simple CRC checksums only, which does not prevent modified or rogue firmware flash.",
          remediation: "Require signature verification before accepting OTA firmware packets.",
          matchedRule: "checksum_crc32_only"
        };
      } else {
        return {
          status: "FAIL",
          severity: "HIGH",
          score: 2,
          detected: profile.firmwareAccess,
          explanation: "Unsigned arbitrary binary upload is allowed over wireless interface, allowing malicious replacement of BMS control logic.",
          remediation: "Disable unauthenticated OTA upload and lock firmware bootloader.",
          matchedRule: "unsigned_binary_upload_allowed"
        };
      }
    }
  }
];

export function runSecurityAssessment(vehicle) {
  const profile = vehicle.rawProfile || {};
  const checks = CHECK_DEFINITIONS.map(def => {
    const result = def.evaluate(profile);
    return {
      id: def.id,
      name: def.name,
      category: def.category,
      iconName: def.iconName,
      status: result.status,
      severity: result.severity,
      score: result.score,
      detected: result.detected,
      explanation: result.explanation,
      remediation: result.remediation,
      matchedRule: result.matchedRule
    };
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const maxPossibleScore = checks.length * 2; // 14
  
  // Normalized 10-point scale
  const normalizedRiskScore = Math.min(10, Math.round((totalScore / maxPossibleScore) * 10));

  let overallRisk = "LOW";
  let status = "Secure";
  let readinessPercentage = 95;

  if (totalScore >= 6) {
    overallRisk = "HIGH";
    status = "High Risk";
    readinessPercentage = Math.max(20, Math.round(100 - (totalScore / maxPossibleScore) * 80));
  } else if (totalScore >= 3) {
    overallRisk = "MEDIUM";
    status = "Needs Attention";
    readinessPercentage = Math.round(100 - (totalScore / maxPossibleScore) * 60);
  } else {
    overallRisk = "LOW";
    status = "Secure";
    readinessPercentage = Math.min(100, Math.round(100 - (totalScore / maxPossibleScore) * 30));
  }

  // Generate key findings (fails first, then warnings)
  const failedChecks = checks.filter(c => c.status === "FAIL");
  const warningChecks = checks.filter(c => c.status === "WARNING");
  const passingChecks = checks.filter(c => c.status === "PASS");

  const keyFindings = [
    ...failedChecks.map(c => ({
      title: `${c.name} exposes high risk`,
      severity: c.severity,
      description: c.explanation,
      checkId: c.id
    })),
    ...warningChecks.map(c => ({
      title: `${c.name} requires hardening`,
      severity: c.severity,
      description: c.explanation,
      checkId: c.id
    }))
  ].slice(0, 5);

  if (keyFindings.length === 0) {
    keyFindings.push({
      title: "Strong security controls active",
      severity: "LOW",
      description: "All evaluated wireless BMS interfaces meet baseline security readiness standards.",
      checkId: "all_pass"
    });
  }

  // Recommended actions prioritized
  const recommendedActions = [
    ...failedChecks.map((c, idx) => ({
      priority: `Priority ${idx + 1}`,
      priorityLevel: "HIGH",
      action: c.remediation,
      checkId: c.id,
      title: `Remediate ${c.name}`
    })),
    ...warningChecks.map((c, idx) => ({
      priority: `Priority ${failedChecks.length + idx + 1}`,
      priorityLevel: "MEDIUM",
      action: c.remediation,
      checkId: c.id,
      title: `Harden ${c.name}`
    }))
  ];

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now.toLocaleDateString();

  return {
    vehicleId: vehicle.id,
    assessedAt: timestamp,
    totalPenaltyPoints: totalScore,
    normalizedRiskScore, // 0 to 10 scale
    readinessPercentage,
    overallRisk, // "LOW" | "MEDIUM" | "HIGH"
    status,
    checks,
    failedCount: failedChecks.length,
    warningCount: warningChecks.length,
    passedCount: passingChecks.length,
    keyFindings,
    recommendedActions,
    isSimulated: true
  };
}

/**
 * Generates the remediated profile for a vehicle when simulated fixes are applied.
 */
export function getRemediatedProfile(originalProfile, completedActionIds = []) {
  const newProfile = { ...originalProfile };

  completedActionIds.forEach(actionId => {
    switch (actionId) {
      case "wireless_interface":
      case "rem_auth_pairing":
        newProfile.wirelessInterface = "BLE 5.2 (Whitelisted pairing only)";
        newProfile.authentication = "Authenticated Passkey (AES-128 Challenge)";
        break;
      case "unauthorized_access":
      case "rem_access_control":
        newProfile.unauthorizedAccess = "Blocked (Mutual authentication enforced)";
        break;
      case "safety_commands":
      case "rem_safety_interlock":
        newProfile.safetyCommands = "Hardware Interlock & Protected Key";
        break;
      case "config_protection":
      case "rem_config_lock":
        newProfile.configProtection = "Cryptographically Signed Config";
        break;
      case "wireless_access_control":
      case "rem_beacon_timeout":
        newProfile.wirelessAccessControl = "Timeout after 60s inactivity";
        break;
      case "firmware_access":
      case "rem_firmware_signed":
        newProfile.firmwareAccess = "Signed Firmware verification with Rollback Guard";
        break;
      default:
        break;
    }
  });

  return newProfile;
}
