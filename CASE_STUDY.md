# CyberRide 3W — SHIFT case study

**Team DevCrew:** Tanu Gupta, Alok Tiwari, Isha Kumari  
**Event:** SHIFT Sustainable e-Micromobility Hackathon, IIT (BHU) Varanasi, 10–11 October 2026  
**Build:** browser app (React + Vite). No backend. Runs offline on a cheap laptop or phone.

---

## 1. The problem, and who has it

Cheap connected e-rickshaws in Indian cities increasingly use a **Bluetooth Battery Management System (BMS)** so a workshop can read voltage, current, and cut-offs from a phone. Many of those packs ship with **public Bluetooth names, factory PINs such as 000000, and open serial (UART) services**.

The people who have this problem are not cybersecurity teams. They are:

- **Workshop mechanics** who service 48V packs all day and have no wireless-security checklist.
- **Fleet owners** who lose a vehicle when a pack is damaged or a vehicle stalls.
- **Drivers** whose daily income depends on the rickshaw staying on the road.
- **Passengers** if a remote discharge / MOSFET cut-off can be sent while the vehicle is moving.

A security weakness here is also a **sustainability** weakness: an unsafe pack is taken off the road, a driver may idle or return to a polluting option, and a thermal or over-discharge event can kill a battery years before second-life.

We are **not** claiming this app replaces AIS-156 laboratory certification. We claim workshops currently have **no simple, explainable way** to notice that a connected BMS is wide open.

---

## 2. How we know it is real

We treated this as a field problem, not a CTF:

- Public repair culture around generic **AntBMS / JBD / Daly** BLE packs used on Indian 3-wheelers is well documented: phone apps pair with default credentials; UART GATT services are used for configuration.
- Servicing practice (voltage check, cell balance, charger test) almost never includes: “who can connect over Bluetooth?” or “can this phone cut discharge while the vehicle is in drive?”
- Indian EV battery safety rules (**AIS-156** family) care about thermal and electrical protection. Wireless access to those same protection registers is a gap between **lab certification** and **what sits on the street**.

**Evidence we still owe after the weekend:** a named mechanic or depot interview (one conversation is enough). Until that quote is in this file, treat the six demo vehicles as **typical configurations**, not as a statistically sampled fleet.

If a teammate spoke to a workshop during SHIFT, replace this paragraph with: name, place, one sentence they said.

---

## 3. What we built

**CyberRide 3W** is software a bay technician can run without a server.

Workflow: **Assess → Explain → Improve → Re-test → Report.**

| Piece | What it does |
|---|---|
| Demo fleet (`CR3W-001` … `006`) | Three security levels: already decent, misconfigured, high-risk. For a 3-minute pitch, use **CR3W-003**. |
| **Workshop intake** (`/intake`) | Mechanic answers 7 questions in English + Hindi cues (what they see on Bluetooth, PIN, unknown phone, remote cutoff, writable limits, always-on beacon, unsigned firmware). Answers become a new vehicle `CR3W-WK-00x`. |
| Rule engine | Seven checks. PASS = 0, WARNING = 1, FAIL = 2. Score bands: 0–2 Low, 3–5 Medium, 6+ High. Every fail has a plain-language reason and a workshop fix. No machine learning. |
| Remediation | Checklist that **simulates** hardening the profile, then re-test so the score can drop. |
| Fleet + print report | CSV export and a print-friendly report for the depot file. |
| Persistence | Browser `localStorage` only. Works on patchy campus Wi-Fi. Reset restores the demo baseline. |

We did **not** build a Bluetooth sniffer, a pentest suite, or a cloud backend. Live wireless attacks on a traction pack are unsafe in a 24-hour hall and would not serve the mechanic.

---

## 4. Practicality in India (₹)

- **Cost to run:** ₹0 after a laptop or Android Chrome. No SIM, no API keys, no monthly cloud bill.
- **Network:** works offline once the page is loaded.
- **Skill:** Hindi-cued yes/no-style questions; findings explain *why*, not CVE numbers.
- **Time on bay:** intake + assessment is a few minutes, not a lab day.
- **What it does not do:** it does not flash a real BMS, does not certify the vehicle, and does not prove the pack is safe.

Honest limit: without owner consent and a partner workshop, we cannot close the loop on hardware. That is the after-SHIFT path, not a fake demo.

---

## 5. What we finished vs what we did not

**Done**

- Explainable scoring on simulated profiles.
- Before / after remediation on the high-risk demo vehicle.
- Workshop intake so the fleet is not only pre-typed JSON.
- Print report and fleet CSV.
- Case study and 3-minute pitch in this repo.

**Not done (say this in the pitch)**

- No live BLE capture from a physical rickshaw.
- No named depot MoU.
- No Hindi UI on every screen (intake questions only).
- No costed service SKU for a chain of workshops.

Saying that clearly is part of the product: a readiness tool that knows its boundary.

---

## 6. Why this belongs in SHIFT (and a partner round)

SHIFT asked for a **real e-micromobility problem** and **software in 24 hours**. Battery safety, fleet uptime, and rider safety sit in the brief. CyberRide 3W turns a wireless-BMS gap into a depot workflow.

**Ask for the carry-on round:** sit with one Varanasi or partner workshop for a week, replace demo profiles with **intake-from-the-bay**, and keep the rule list open so mechanics can argue with it. Do not pivot into hacking kits.

---

## Demo for the jury (repo + live app)

1. Open `/dashboard`.
2. Either **Start Security Assessment** on `CR3W-003`, or **Workshop intake** and answer the 7 questions as a high-risk bay.
3. Run assessment → read fails (open UART, missing auth, remote cutoff).
4. Open remediation, tick actions, re-test, show the score drop.
5. Open `/report/CR3W-003` (or the new `CR3W-WK-xxx`) and print / save.

Reset demo data from the sidebar if a previous run left the fleet dirty.
