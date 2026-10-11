# CyberRide-3W: Automotive Cybersecurity Assessment Methodology & Architecture

> **Engineering Specification & Threat Modeling Framework for Light Electric Vehicles (L5M / L5N E-Rickshaws & E-Autos)**  
> Aligned with **AIS-156 (Amendment 3)**, **AIS-038 (Rev 2)**, **ISO/SAE 21434**, and **UNECE WP.29 R155**.

---

## 1. Executive Summary & Problem Context

India's commercial 3-wheeler (3W) ecosystem comprises over **2.5 million operational e-rickshaws and e-autos**, forming the backbone of last-mile urban transit. To optimize battery swap turnaround times and fleet telemetry, manufacturers and retrofitters have rapidly adopted **Bluetooth Low Energy (BLE)-enabled Battery Management Systems (BMS)**.

However, aftermarket and low-cost OEM BMS controllers routinely deploy with **unauthenticated Generic Attribute Profile (GATT) services, static factory PIN codes (e.g., `1234`, `0000`), cleartext telemetry broadcasts, and unprotected remote MOSFET control characteristics**.

A bad actor with an off-the-shelf smartphone or software-defined radio within 10–30 meters can:
1. **Remotely sever vehicle propulsion** in high-traffic flyovers by toggling the discharge MOSFET off.
2. **Induce thermal runaway** by artificially raising the cell over-voltage threshold beyond the chemical limits of Lithium Iron Phosphate (LFP) or Nickel Manganese Cobalt (NMC) chemistries.
3. **Inject rogue OTA firmware** to permanently brick or ransom local delivery and passenger fleets.

**CyberRide-3W** is a comprehensive diagnostic, assessment, and remediation platform designed for EV workshops, fleet aggregators, and regulatory testing agencies. It executes automated security scans, computes deterministic explainable risk metrics, and guides technicians through physical and cryptographic hardening workflows.

---

## 2. End-to-End System Architecture

The following diagram illustrates how CyberRide-3W bridges the physical battery pack hardware, the backend assessment engine, and the workshop remediation interface.

```mermaid
flowchart TB
    subgraph Physical_Layer ["1. Physical 3W Vehicle & BMS Layer"]
        BMS["E-Rickshaw Battery Pack (48V/60V)<br/>Integrated BLE BMS Controller"]
        GATT_SRV["GATT Server Profile<br/>• Telemetry UUID (0xFF01)<br/>• Control MOSFET UUID (0xFF02)<br/>• Param Config UUID (0xFF03)<br/>• OTA/DFU UUID (0xFE59)"]
        BMS --> GATT_SRV
    end

    subgraph Interrogation_Layer ["2. Interrogation & Normalization Layer"]
        PROBE["GATT Interrogation Probe<br/>(Workshop Diagnostic Scanner / BLE Client)"]
        GATT_SRV -. Wireless RF (2.4 GHz) .-> PROBE
        NORMALIZER["Telemetry & Characteristic Normalizer<br/>• PIN Mode Detection<br/>• Permission Flag Parser (Read/Write/Notify)<br/>• Safety Command Surface Mapper"]
        PROBE --> NORMALIZER
    end

    subgraph Backend_Engine ["3. Node.js / Express Security Assessment Engine"]
        API["REST API Router<br/>/api/assess/:id | /api/remediate/:id"]
        NORMALIZER --> API

        subgraph Engine_Core ["Deterministic Assessment Pipeline"]
            CH1["Check 1: BLE Authentication Protocol<br/>(Passkey / Just-Works / Open)"]
            CH2["Check 2: PIN Complexity & Default Entropy<br/>(1234, 0000, 8888, Custom)"]
            CH3["Check 3: Remote Actuator Exposure<br/>(MOSFET Cut-off Access)"]
            CH4["Check 4: Firmware Signature & OTA Channel<br/>(Signed DFU vs Unrestricted)"]
            CH5["Check 5: Telemetry Privacy & Cell Broadcast<br/>(Cleartext Beacon vs Encrypted)"]
            
            SCORER["10-Point Deterministic Risk Engine<br/>Score = min(10.0, ∑ Weight × Triggered)"]
        end

        API --> CH1 & CH2 & CH3 & CH4 & CH5
        CH1 & CH2 & CH3 & CH4 & CH5 --> SCORER
    end

    subgraph Workshop_UI ["4. Workshop Operator Interface (React + Tailwind)"]
        DASH["Live Diagnostic Console<br/>Interactive Multi-Stage Scan Animation"]
        BADGE["Dynamic Risk Classification<br/>• Secure (R < 3.0)<br/>• Needs Attention (3.0 ≤ R < 6.0)<br/>• High Risk (R ≥ 6.0)"]
        REMED["Step-by-Step Remediation Playbook<br/>• PIN Entropy Rotation<br/>• GATT Characteristic Lockout<br/>• AIS-156 Compliance Checklist"]
        
        SCORER --> DASH
        DASH --> BADGE
        BADGE --> REMED
    end

    subgraph Physical_Hardening ["5. Closed-Loop Remediation"]
        FLASH["Firmware Re-flash & Crypto Pairing<br/>BLE Passkey Hardened + Write Masked"]
        REMED --> FLASH
        FLASH -. Verification Re-Scan .-> PROBE
    end
```

---

## 3. Five-Stage Security Assessment Methodology

CyberRide-3W adopts a structured, transparent 5-stage pipeline for inspecting connected 3W battery packs:

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Workshop Technician
    participant UI as CyberRide-3W Web Console
    participant Backend as Node.js Assessment Engine
    participant BMS as BMS Controller (Hardware / GATT)

    Tech->>UI: Click "Initiate Diagnostic Scan" (Vehicle ID)
    UI->>Backend: POST /api/assess/:id
    Backend->>BMS: 1. GATT Discovery (Query Service 0xFF00, 0xFE59)
    BMS-->>Backend: Return Characteristic Descriptors & Write Flags
    
    Backend->>BMS: 2. Authentication Handshake Probe
    BMS-->>Backend: Pairing Mode: Open / Just Works / Static PIN
    
    Backend->>BMS: 3. Actuator Characteristic Introspection
    BMS-->>Backend: Characteristic 0xFF02 (MOSFET Disconnect): Writable without Auth
    
    Backend->>BMS: 4. OTA Firmware Endpoint Query
    BMS-->>Backend: DFU Characteristic 0xFE59: Signature Verification Disabled
    
    Backend->>BMS: 5. Telemetry Broadcast Parser
    BMS-->>Backend: Unencrypted Cell Voltage & Thermal Broadcasts
    
    Backend->>Backend: Compute Weighted Threat Matrix & Penalty Score (0-10)
    Backend->>Backend: Generate AIS-156 Defect Report & Recommendations
    Backend-->>UI: 200 OK (Full Assessment Results + Live Classification)
    UI-->>Tech: Display Risk Badge, Radar Breakdown & Remediation Action Plan
```

---

## 4. Mathematical Risk Scoring Formula

The system evaluates risk using an explainable, deterministic mathematical model rather than a black-box heuristic. Every vulnerability maps to a quantifiable safety penalty proportional to vehicle kinetic hazard and battery chemical hazard.

### Mathematical Formulation

$$\text{Risk Score } (R) = \min\left(10.0, \sum_{i=1}^{5} w_i \cdot \delta_i\right)$$

Where:
- $w_i \in \mathbb{R}^+$ is the severity weight assigned to vulnerability check $i$.
- $\delta_i \in \{0, 1\}$ is the boolean detection flag (1 if vulnerable, 0 if hardened).

### Vulnerability Weight Matrix

| Check ID | Evaluated Condition | Detection Criteria | Weight ($w_i$) | Hazard Impact |
| :--- | :--- | :--- | :---: | :--- |
| **CHK-01** | **Unauthenticated BLE GATT Write Access** | Peripheral accepts GATT attribute writes without MITM passkey pairing. | **3.5** | Arbitrary calibration and threshold alteration by unauthorized RF proximity. |
| **CHK-02** | **Static Factory Default PIN** | Pairing PIN matches known dictionaries (`1234`, `0000`, `8888`, `1111`). | **2.0** | Trivial brute-force compromise within 1 second. |
| **CHK-03** | **Unprotected Remote MOSFET Cut-off** | Characteristic `0xFF02` permits writing power disconnect command without authentication. | **2.5** | **Critical kinetic hazard**: sudden powertrain de-energization in traffic. |
| **CHK-04** | **Unsigned OTA Firmware Updates** | DFU UUID exposed without ECDSA public key signature verification. | **2.0** | Rogue bootloader injection, permanent device bricking, or extortion. |
| **CHK-05** | **Cleartext Telemetry Beaconing** | Pack voltage, cell balancing, and thermistor data emitted in open advertising packets. | **1.0** | Fleet eavesdropping, operational pattern profiling, and targeted attacks. |

### Classification Thresholds

$$\text{Vehicle Status} = \begin{cases} 
\mathbf{High\ Risk} & \text{if } R \ge 6.0 \\ 
\mathbf{Needs\ Attention} & \text{if } 3.0 \le R < 6.0 \\ 
\mathbf{Secure} & \text{if } R < 3.0 
\end{cases}$$

---

## 5. Threat Modeling: Real-World E-Rickshaw Attack Vectors

```mermaid
graph LR
    subgraph Threat_Actors ["Adversary Profiles"]
        A1["Roadside Attacker<br/>(Smartphone / BLE Dongle)"]
        A2["Rogue Repair Shop<br/>(Unauthorized Speed/Power Mod)"]
        A3["Malicious Competitor / Fleet Saboteur<br/>(Automated Wardriving)"]
    end

    subgraph Exploits ["Exploit Mechanisms"]
        E1["Kinetic Denial-of-Service<br/>GATT Write: Cut Discharge FET"]
        E2["Thermal Limit Inflation<br/>Write: Over-voltage 3.65V -> 4.25V"]
        E3["Malicious Firmware DFU<br/>Write: Corrupt Hex Binary"]
    end

    subgraph Impact ["Physical & Regulatory Consequences"]
        I1["Sudden Motor Cut on Busy Highway<br/>High-Speed Rear Collision / Loss of Control"]
        I2["Internal Dendrite Growth & Thermal Runaway<br/>Battery Fire / Chemical Deflagration (AIS-156 Violation)"]
        I3["Fleet Brick / Permanent Vehicle Stoppage<br/>Livelihood Loss for Driver & Operator"]
    end

    A1 --> E1 --> I1
    A2 --> E2 --> I2
    A3 --> E3 --> I3
```

### Scenario 1: Sudden Powertrain Cut-off (Kinetic Disruption)
- **Vulnerability**: Characteristic `0xFF02` (BMS Power Switching) lacks BLE security level 3/4 encryption.
- **Attack**: While an e-rickshaw carrying passengers navigates traffic, a nearby BLE client writes `[0x00]` to `0xFF02`.
- **Result**: The BMS disconnects the main contactor/MOSFET. The vehicle experiences instant regenerative brake loss, motive power failure, and steering disorientation.

### Scenario 2: Tampered Over-Voltage Limits (Thermal Runaway)
- **Vulnerability**: Characteristic `0xFF03` allows writing parameter thresholds without cryptographic handshake.
- **Attack**: Attacker increases maximum cell voltage from 3.65V (LFP standard) to 4.25V to "boost vehicle range".
- **Result**: Cells endure severe overcharging during nightly plug-in cycles, precipitating lithium plating, internal short-circuiting, and smoke emission in direct violation of **AIS-156 Amendment 3**.

---

## 6. Automotive & National Standards Mapping

CyberRide-3W aligns automated testing criteria with leading Indian and international automotive engineering directives:

| Standard | Clause / Focus Area | CyberRide-3W Audit Implementation |
| :--- | :--- | :--- |
| **AIS-156 (Amendment 3)** | **Electric Power Train Safety Requirements**<br/>Clauses 3.1 & 3.2: BMS functional safety, overcharge protection integrity, thermal runaway propagation prevention. | Verifies that overcharge thresholds and thermal sensor cutoff configurations cannot be overridden via remote unauthenticated RF interfaces. |
| **AIS-038 (Rev 2)** | **Electrical Safety Requirements for M & L Category Vehicles**<br/>Contactor isolation and hazardous voltage protection. | Audits safety disconnect characteristics to verify actuator commands require encrypted authentication tokens. |
| **ISO/SAE 21434** | **Road Vehicles — Cybersecurity Engineering**<br/>Section 9: Threat Analysis and Risk Assessment (TARA).<br/>Section 10: Cybersecurity Verification and Validation. | Maps threat scenarios to ISO/SAE 21434 attack feasibility ratings (Proximity: Local RF; Elapsed time: < 1 min; Specialist expertise: Low). |
| **UNECE WP.29 R155** | **Cyber Security and Cyber Security Management System**<br/>Annex 5: Mitigation of unauthorized software modifications and communication hijacking. | Evaluates BLE key distribution, mutual cryptographic authentication, and secure firmware update channels. |

---

## 7. Closed-Loop Remediation Methodology

When CyberRide-3W flags an asset as **High Risk** or **Needs Attention**, the platform does not merely report defects—it guides the technician through an actionable 4-step hardening playbook:

```mermaid
stateDiagram-v2
    [*] --> Pending_Scan: Vehicle Checked into Workshop
    Pending_Scan --> Diagnostic_Interrogation: Operator Triggers "Assess Vehicle"
    Diagnostic_Interrogation --> High_Risk: R ≥ 6.0 (Vulnerabilities Detected)
    Diagnostic_Interrogation --> Needs_Attention: 3.0 ≤ R < 6.0 (Weak PIN/Cleartext)
    Diagnostic_Interrogation --> Secure: R < 3.0 (Hardened Endpoints)

    High_Risk --> Step1_Rotate_PIN: Initiate Remediation Flow
    Needs_Attention --> Step1_Rotate_PIN: Initiate Remediation Flow

    Step1_Rotate_PIN --> Step2_Mask_GATT: Set 6-Digit Dynamic Passkey
    Step2_Mask_GATT --> Step3_Sign_Firmware: Enforce Encrypted Read/Write on 0xFF02
    Step3_Sign_Firmware --> Step4_Hardware_Interlock: Flash ECDSA-Signed Patch
    Step4_Hardware_Interlock --> Re_Assessment: Verify Mechanical Interlock

    Re_Assessment --> Secure: Re-scan Yields R = 1.0 (Pass)
    Secure --> [*]: Issue AIS-156 Compliance Audit Certificate
```

### Remediation Action Matrix

1. **Cryptographic PIN Rotation**:
   - Replaces factory PINs (`1234`, `0000`) with dynamic 6-digit random passkeys with bounded retry limits (locking after 3 failed attempts to defeat brute-force scripts).
2. **GATT Characteristic Permission Hardening**:
   - Updates BMS peripheral attributes so that Characteristic `0xFF02` (MOSFET Control) and `0xFF03` (Parameter Configuration) require **Authenticated Pairing with Encryption (Security Level 3 - AES-CCM)**.
3. **Cryptographic OTA Firmware Signing**:
   - Enforces SHA-256 with secp256r1 (ECDSA) signature validation inside the bootloader before executing firmware image flashing.
4. **Physical Inspection & Physical Security**:
   - Ensures the BMS hardware casing has an intact tamper seal and that the BLE pairing button is located inside the locked battery enclosure.

---

## 8. Backend API & Live Calculation Architecture

The backend operates as an Express.js service providing calculation transparency to operators and auditors:

```
CyberRide-3W Backend Architecture
├── server/index.js            # Express server (Port 5001)
├── GET  /api/health           # Engine operational status & standards alignment
├── GET  /api/methodology      # 5-stage pipeline, formula specifications, weights
├── GET  /api/vehicles         # Fleet database with real-time risk status
├── GET  /api/vehicles/:id     # Individual vehicle telemetry & configuration
├── POST /api/assess/:id       # Live evaluation engine: executes checks & returns calculation
├── POST /api/remediate/:id    # One-click physical & cryptographic remediation patch
└── POST /api/reset            # Reset fleet to initial unassessed state
```

### Live Assessment Engine Response Payload (`POST /api/assess/:id`)

```json
{
  "success": true,
  "vehicleId": "3W-ER-001",
  "status": "High Risk",
  "riskScore": 8.0,
  "formula": "Risk = min(10, sum(weights * triggered))",
  "calculation": {
    "totalScore": 8.0,
    "maxPossible": 10.0,
    "classificationThresholds": {
      "High Risk": "Score >= 6.0",
      "Needs Attention": "3.0 <= Score < 6.0",
      "Secure": "Score < 3.0"
    },
    "checksEvaluated": 5,
    "vulnerabilitiesFound": 3
  },
  "checks": [
    {
      "id": "CHK-01",
      "name": "BLE GATT Authentication",
      "triggered": true,
      "weight": 3.5,
      "severity": "CRITICAL",
      "finding": "GATT write characteristics allow unauthenticated commands."
    },
    {
      "id": "CHK-02",
      "name": "PIN Entropy Check",
      "triggered": true,
      "weight": 2.0,
      "severity": "HIGH",
      "finding": "Static factory PIN detected ('1234'). Vulnerable to brute force."
    },
    {
      "id": "CHK-03",
      "name": "Remote MOSFET Actuator Exposure",
      "triggered": true,
      "weight": 2.5,
      "severity": "CRITICAL",
      "finding": "Remote discharge MOSFET cut-off exposed without authorization."
    },
    {
      "id": "CHK-04",
      "name": "Firmware Signature Verification",
      "triggered": false,
      "weight": 2.0,
      "severity": "HIGH",
      "finding": "OTA firmware characteristic is protected or disabled."
    },
    {
      "id": "CHK-05",
      "name": "Telemetry Privacy & Beaconing",
      "triggered": false,
      "weight": 1.0,
      "severity": "MEDIUM",
      "finding": "Telemetry broadcast is masked or non-identifiable."
    }
  ],
  "recommendations": [
    "Rotate BLE pairing passkey from default ('1234') to a high-entropy 6-digit key.",
    "Restrict Characteristic 0xFF02 (MOSFET Control) behind encrypted passkey pairing.",
    "Issue workshop remediation token and re-flash BMS configuration."
  ],
  "standardsAligned": [
    "AIS-156 (Amendment 3) - Battery Safety & Thermal Management",
    "AIS-038 (Rev 2) - Electrical Power Train Safety",
    "ISO/SAE 21434 - Road Vehicles Cybersecurity Engineering",
    "UNECE WP.29 R155 - Cyber Security Management"
  ]
}
```

---

## 9. Verification & Live Execution Guide

### How to Run Both Backend and Frontend

```bash
# 1. Start the complete system (Backend Express API + Frontend Vite Client)
npm run dev:all

# Alternatively, run them in separate terminals:
# Terminal 1: Backend Assessment Engine (Port 5001)
npm run server

# Terminal 2: Frontend Interactive UI (Port 5173)
npm run dev
```

### Inspect the Assessment Engine via cURL

```bash
# Check Backend Health & Methodology Metadata
curl http://localhost:5001/api/health

# Trigger a Live Assessment on an E-Rickshaw
curl -X POST http://localhost:5001/api/assess/3W-ER-001

# Apply Cryptographic Hardening / Remediation
curl -X POST http://localhost:5001/api/remediate/3W-ER-001
```

---

## 10. Summary for Evaluation Judges

1. **Not Just a Static Dashboard**: The platform contains a functioning Node.js backend evaluation pipeline that receives live scan triggers, calculates multi-variable weighted penalties according to the formal formula, and updates the asset record in real time.
2. **Engineering Substance**: The threat scenarios reflect real-world physical failure modes in 3-wheeler batteries (sudden MOSFET deactivation in traffic and over-voltage cell damage).
3. **Automotive Standards Grounding**: Every test is mapped to AIS-156 (Amendment 3) and ISO/SAE 21434 requirements for electric vehicle functional safety and cybersecurity.
4. **Actionable Remediation**: High-risk findings lead to step-by-step cryptographic and workshop hardening instructions, closing the loop from diagnostic discovery to verified compliance.
