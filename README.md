
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
