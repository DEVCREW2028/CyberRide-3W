
# CyberRide 3W
### Security Readiness for Connected E-Rickshaws

**Assess. Explain. Improve. Re-test.**

> Making wireless BMS security easier to understand for India's small EV workshops and fleet operators.

CyberRide 3W is a lightweight security-readiness assessment prototype that helps users identify and understand potential wireless security weaknesses in connected e-rickshaw Battery Management System (BMS) configurations.

It translates technical security findings into understandable risk levels, prioritized corrective guidance, simulated re-assessment, and a shareable Security Readiness Report.

**Built by Team DevCrew for the SHIFT Sustainable e-Micromobility Hackathon at IIT (BHU), Varanasi.**

---

## The Problem

Electric three-wheelers support everyday passenger transport and livelihoods across India. Some connected e-rickshaws use wireless-enabled Battery Management Systems for battery monitoring and configuration.

However, weak authentication and inadequate wireless access controls can expose certain BMS functions to unauthorized access. Depending on the implementation, this may create risks to vehicle operation, including unexpected shutdowns.

For small EV workshops and fleet operators, understanding these technical weaknesses and deciding which vehicles need attention can be challenging without specialized cybersecurity expertise.

### Why It Matters

- **Vehicle operation:** Unauthorized access to exposed battery-related functions may affect vehicle availability.
- **Driver livelihoods:** Unexpected downtime can interrupt daily trips and earnings.
- **Workshop readiness:** Technicians need understandable findings and actionable recommendations.
- **Fleet visibility:** Operators need a simple way to identify simulated vehicle profiles that require priority review.

The underlying security concern is not hypothetical: government-reported findings in 2026 highlighted unauthorized-access risks involving certain low-cost e-rickshaw BMS implementations.

---

## Our Solution

CyberRide 3W turns wireless-BMS security concerns into a simple, explainable assessment workflow.

Instead of presenting only technical warnings, the prototype connects each assessment finding to a risk explanation and recommended corrective action. Users can then simulate remediation, re-run the assessment, compare results, and generate a report.

### The CyberRide Workflow

**Assess → Explain → Improve → Re-test → Report**

1. **Assess:** Run predefined security checks against a simulated BMS profile.
2. **Explain:** Understand the findings, risk level, and potential implications.
3. **Improve:** Review prioritized recommendations using a guided checklist.
4. **Re-test:** Simulate remediation and compare the before-and-after assessment.
5. **Report:** Generate a print-friendly Security Readiness Report.

The objective is to make security-readiness information more accessible to small workshops and fleet operators—not to replace professional security testing.

---

## Key Features

### 1. Explainable Security Assessment
Evaluate predefined checks covering authentication, unauthorized-device access, safety-critical function exposure, configuration protection, and wireless access controls.

### 2. Transparent Risk Scoring
Present findings through understandable risk levels and an explainable, rule-based assessment engine.

### 3. Prioritized Remediation Guidance
Connect identified weaknesses to recommended corrective actions so users can understand what needs attention first.

### 4. Simulated Re-assessment
Compare assessment results before and after simulated remediation to demonstrate how addressing findings may improve a profile's security-readiness score.

### 5. Fleet Security Overview
Review multiple simulated vehicles and identify profiles that require attention.

### 6. Security Readiness Report
Generate a print-friendly report containing assessment findings, risk information, and recommended actions.

### 7. Local-First Prototype
Use simulated data and browser-based persistence without requiring a cloud backend or external API.

### 8. Device Whitelisting & Access Control Simulator
Simulate Bluetooth/wireless MAC and identity whitelisting for workshop diagnostic tablets and service tools. Test authorized, revoked, and unknown device access attempts in real-time, backed by a persistent registry and security event audit log.

### 9. Strong BLE Pairing Security Simulator
Simulate Bluetooth Low Energy (BLE) pairing security profiles for connected e-rickshaws. Models **LE Secure Connections** (ECDH P-256 key exchange), **Authenticated Pairing** (Numeric Comparison / MITM protection), and **AES-CCM Link Encryption**, strictly integrated with the Device Whitelisting registry as the source of truth.

### 10. Strong Challenge–Response Authentication Simulator
Simulate cryptographic mutual authentication between authorized diagnostic tools and connected BMS units. Utilizes fresh 256-bit cryptographically secure nonces (`crypto.getRandomValues`), HMAC-SHA-256 signature verification via the Web Crypto API (`crypto.subtle`), strict single-use replay protection, time-based expiration, and enforcement of whitelisting and BLE pairing prerequisites. Demo secrets remain strictly ephemeral and are never persisted or exposed.

---

## How the Prototype Works

CyberRide uses a deterministic, rule-based assessment engine.

Each simulated BMS profile contains predefined security characteristics. The assessment engine evaluates these characteristics against the checks implemented in the prototype and produces findings, risk information, and remediation guidance.

The workflow is designed to be transparent: users should be able to understand why a finding was raised and what action is recommended.

**No machine-learning model is required for the current prototype.** Risk results come from the implemented rules and simulated input data, not from live vehicle telemetry or autonomous threat detection.

---

## Demo Profiles

The prototype includes three simulated BMS profiles representing different security configurations.

| Profile | Scenario | Intended Demonstration |
|---|---|---|
| `CR3W-001` | Secure configuration | Review a profile with stronger predefined controls |
| `CR3W-002` | Misconfigured security controls | Identify weaknesses and review corrective guidance |
| `CR3W-003` | High-risk configuration | Demonstrate assessment, prioritized remediation, and re-assessment |

These are demonstration profiles, not verified real-world vehicles.

### Recommended Judge Demo

1. Open the dashboard and review the fleet overview.
2. Select `CR3W-003`, the high-risk simulated profile.
3. Run the security assessment.
4. Review the risk level, findings, and explanations.
5. Open the remediation workflow and inspect the recommended actions.
6. Apply the simulated remediation.
7. Re-run the assessment and compare the results.
8. Generate the Security Readiness Report.
9. Return to the fleet overview to review the profile's updated status.

**Demo objective:** Show one complete journey from identifying a potential weakness to understanding it, reviewing corrective guidance, and verifying the change in the simulated assessment.

Actual scores, findings, and status changes depend on the assessment rules implemented in the application.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router DOM |
| State & Persistence | Browser Local Storage |
| Assessment Engine | Deterministic, rule-based scoring |
| Assessment Data | Simulated BMS profiles |
| Report Output | Browser print functionality |

### Design Principles

- **Explainability:** Findings should have understandable reasons.
- **Practicality:** Focus on the needs of small workshops and fleet operators.
- **Transparency:** Distinguish simulated results from real-world evidence.
- **Accessibility:** Present technical findings in a clear, approachable interface.
- **Low dependency:** Keep the prototype usable without external APIs or cloud services.

---

## Getting Started

### Prerequisites

- Node.js and npm
- Git (optional, for cloning the repository)

### 1. Clone the Repository

Replace the placeholder with the actual public repository URL.

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CyberRide-3W
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal. With the default Vite configuration, this is usually:

```text
http://localhost:5173
```

### 4. Run Automated Tests

To run the automated test suite for Device Whitelisting, access control evaluation, validation rules, and persistence:

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

If the project is already present on your computer, open its directory and run the installation and development commands there.

---

## Target Users and Potential Impact

### Primary Users

- Small EV workshops and e-rickshaw service technicians
- Small e-rickshaw fleet operators

### Intended Benefits

- Make potential wireless-BMS security weaknesses easier to understand.
- Help users prioritize profiles that require further review.
- Provide structured recommendations instead of unexplained risk labels.
- Maintain an understandable record of simulated assessment findings.
- Demonstrate a workflow that could be validated and extended for authorized real-world use.

CyberRide is intended to support security awareness and assessment workflows. Its current prototype does not establish the actual security status of a physical vehicle.

---

## Prototype Scope and Limitations

CyberRide 3W is a hackathon prototype demonstrating a simulated security-readiness assessment workflow.

**Included in the prototype**
- Predefined simulated BMS profiles
- Rule-based assessment and risk explanation
- Recommended remediation workflow
- Simulated re-assessment
- Fleet overview and report generation, where implemented

**Outside the current scope**
- Live Bluetooth or BMS hardware scanning
- Real-world penetration testing
- Direct modification of physical BMS configurations
- Verified security certification or regulatory compliance
- Guaranteed attack prevention or proof that a vehicle is secure

Simulated remediation changes the prototype's assessment state; it does not change a physical BMS.

Real-world deployment would require authorized access to compatible hardware, validation against actual BMS implementations, and further security testing.

---

## Strong BLE Pairing Simulation Guide

CyberRide 3W provides an interactive simulator to demonstrate the difference between secure pairing configurations and vulnerable, legacy Bluetooth pairing implementations.

### Why Secure BLE Pairing Matters
In connected electric three-wheelers, weak or unauthenticated Bluetooth pairing enables attackers within radio range to sniff battery telemetry or send spoofed shut-off commands to the BMS contactor/MOSFET.

### Pairing Demo Scenarios
1. **Scenario A — Secure LE Pairing:** Select an Authorized device (e.g. `TECH-TAB-01`) + LE Secure Connections (ECDH P-256) + Authenticated Numeric Comparison + AES-CCM Encryption Enabled.  
   *Result:* `SECURE CONFIGURATION (SIMULATED)` (Allowed).
2. **Scenario B — Unknown Device:** Enter an unregistered device ID (e.g. `ROGUE-BLE-SCANNER-99`).  
   *Result:* `PAIRING DENIED` (*"Device not registered in active whitelist registry"*).
3. **Scenario C — Revoked Device:** Select a revoked device ID (e.g. `TECH-PHN-OLD`).  
   *Result:* `PAIRING DENIED` (*"Device authorization revoked in whitelist registry"*).
4. **Scenario D — Weak Just Works Method:** Authorized device with *Legacy Just Works* pairing.  
   *Result:* `WEAK CONFIGURATION (SIMULATED)` (Flagged as WEAK; lacks MITM protection).
5. **Scenario E — Plaintext (Encryption Disabled):** Authorized device with link encryption disabled.  
   *Result:* `WEAK CONFIGURATION (SIMULATED)` (Flagged as WEAK; plaintext risk).
6. **Scenario F — Rogue Device with Secure Options:** Unknown device attempting LE Secure Connections with encryption.  
   *Result:* `PAIRING DENIED` (*Strong pairing options cannot bypass device authorization*).

### Real-World Hardware & Stack Requirements
Enforcing real BLE LE Secure Connections requires:
- Bluetooth 4.2+ compliant controller and link layer.
- An operating system/firmware BLE stack with ECDH P-256 key generation and verification.
- Out-of-band or display/input capabilities for numeric comparison or authenticated passkey entry.
- A web UI alone cannot force secure pairing onto physical BMS hardware.

---

## Strong Challenge–Response Authentication Simulation Guide

CyberRide 3W provides an interactive cryptographic authentication simulator to demonstrate how a BMS can verify that a connected service tool actually possesses the authorized cryptographic credential before allowing sensitive actions (such as cell balancing calibration, over-current threshold adjustments, or contactor override).

### Why Challenge–Response Authentication Matters
Even when a diagnostic tool is whitelisted and linked over encrypted BLE, static credentials or unauthenticated session tokens can be intercepted, captured, or spoofed. Challenge–response authentication ensures:
1. **Freshness:** Every interaction requires answering a freshly minted 256-bit cryptographic nonce.
2. **Replay Protection:** A captured response cannot be re-sent because each challenge nonce is permanently consumed on the first verification attempt.
3. **Proof of Possession:** The prover demonstrates knowledge of a shared secret via HMAC-SHA-256 without ever transmitting the secret across the wireless interface.

### Cryptographic Implementation Details
- **Random Nonce Generation:** Uses `crypto.getRandomValues(new Uint8Array(32))` to generate 32 unpredictable bytes (64 hex characters). `Math.random()` is **never** used for security tokens.
- **HMAC-SHA-256 Verification:** Computed independently on the client and verifier using standard Web Crypto API (`crypto.subtle.importKey` and `crypto.subtle.sign`).
- **Fail-Closed Design:** If Web Crypto API is unavailable in an insecure environment, the system fails closed with `CRYPTOGRAPHIC API UNAVAILABLE`.
- **Zero Key Disclosure:** Demonstration keys are derived deterministically in volatile memory for the demo session. Keys are never logged in audit trails, never stored in `localStorage`, and never exposed in the UI.

### Interactive Demonstration Scenarios
1. **Scenario 1 — Valid Authentication:**  
   Authorized device (`TECH-TAB-01`) + fresh unused challenge + correct HMAC-SHA-256 response + BLE pairing active.  
   *Result:* `AUTHENTICATION SUCCESSFUL (SIMULATED)` (Proof accepted, challenge consumed).
2. **Scenario 2 — Tampered Response:**  
   Valid challenge with a modified or incorrect cryptographic response string.  
   *Result:* `INVALID RESPONSE` (*"HMAC-SHA-256 signature verification failed"*).
3. **Scenario 3 — Replay Attack:**  
   Re-submitting an identical response using a challenge that was already verified and marked `CONSUMED`.  
   *Result:* `CHALLENGE ALREADY USED` (*"Challenge has already been consumed / single-use violation"*).
4. **Scenario 4 — Expired Challenge:**  
   Attempting to verify a challenge whose 60-second validity window has lapsed.  
   *Result:* `CHALLENGE EXPIRED` (*"Challenge expired past 60s validity timeout"*).
5. **Scenario 5 — Revoked / Unknown Device:**  
   Attempting authentication with a revoked (`TECH-PHN-OLD`) or unregistered device ID.  
   *Result:* `DEVICE NOT AUTHORIZED` (*"Device is not authorized in whitelist registry"*).
6. **Scenario 6 — Unpaired Device (Prerequisite Check):**  
   Authorized device with a valid HMAC, but BLE pairing prerequisite disabled or not established.  
   *Result:* `AUTHENTICATION DENIED` (*"BLE pairing not established or device unpaired"*).

### Simulation Limitations vs. Real Hardware
- In production EV BMS architectures, secrets must reside in a Hardware Security Module (HSM), secure element (e.g., ATECC608), or secure microcontroller enclave (e.g., STM32 / ESP32 secure boot and encrypted flash).
- This browser-based module illustrates the protocol state machine, nonce consumption, and replay rejection principles; it does **not** communicate with physical vehicle microcontrollers or real Bluetooth transceivers.

---

## AI Assistant Disclosure
In accordance with hackathon guidelines, artificial intelligence coding assistance (Antigravity by Google DeepMind) was utilized during development for code structuring, component implementation, deterministic test case authoring, and documentation refinement. All logic, test suites, and simulated security evaluations have been verified by Team DevCrew.

---

## Future Scope

Potential future extensions, subject to validation and authorization, include:

- Authorized integration with compatible BMS diagnostic interfaces
- Validation of assessment rules against real hardware
- More detailed workshop assessment records
- Improved fleet-level reporting and prioritization
- Standardized reporting for technicians and fleet operators

These are future possibilities, not claims about current functionality.

---

## Team

### Team DevCrew

- **Tanu Gupta**
- **Alok Tiwari**
- **Isha Kumari**

**Event:** SHIFT Sustainable e-Micromobility Hackathon  
**Venue:** IIT (BHU), Varanasi  
**Project:** CyberRide 3W — Security Readiness for Connected E-Rickshaws

---

## Disclaimer

CyberRide 3W is a hackathon prototype developed for demonstration and educational purposes. It uses simulated BMS profiles and predefined assessment logic.

It does not perform real-world hardware penetration testing, modify physical BMS systems, issue regulatory certification, or guarantee cybersecurity protection. Assessment results should not be interpreted as proof that a physical vehicle is safe or free from vulnerabilities.
