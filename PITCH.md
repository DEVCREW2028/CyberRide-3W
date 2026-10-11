# CyberRide 3W — 3-minute pitch (Sunday 16:00)

**Rule:** live demo inside three minutes. One vehicle. No architecture tour.

Target timing: **180 seconds**. If the laptop stutters, skip intake and go straight to `CR3W-003`.

---

## 0:00–0:30 — Who has the problem

“A connected e-rickshaw is not only a motor and a pack. Many cheap 3-wheelers now have a **Bluetooth BMS** so a workshop can read the battery from a phone.

If that link is open — factory PIN `000000`, public Bluetooth name, even a remote **power cut-off** — the people who get hurt are the **mechanic who never got a security checklist**, the **driver whose daily income is that vehicle**, and the **passenger** if discharge can be cut in traffic.

That is also a **sustainability** problem: an unsafe pack leaves the road, and a damaged cell never makes it to second life.”

---

## 0:30–0:50 — How we know it is real

“We are not guessing a sci-fi hack. Generic BLE packs used on Indian 3-wheelers are serviced with phone apps. Depot checks are voltage and charger — not ‘who can connect’.

We did **not** attack a live traction battery in this hall. That would be unsafe. We encoded the common configurations as profiles a workshop can recognise.”

*(If you have a named mechanic quote, say it here in one sentence. If not, do not invent one.)*

---

## 0:50–2:20 — Live demo (90 seconds)

**Path A (fastest, rehearsed):**

1. Dashboard → **Start Security Assessment** (`CR3W-003`, high risk).
2. Click **Run Assessment**. While it ticks, say: “Seven rules. Pass 0, warning 1, fail 2. No AI.”
3. Results: point at **open UART**, **missing auth**, **remote MOSFET / discharge**. One sentence: “This is how a nearby phone becomes a vehicle-safety incident.”
4. Remediation → tick 2–3 actions (auth + safety interlock at least) → re-assess.
5. Show **score dropped**. Report is print-ready for the depot file.

**Path B (shows Sunday progress):** Dashboard → **Workshop intake** → answer 7 questions as a worst-case bay (open UART, no PIN, any phone, remote cutoff, writable limits, always-on, unsigned OTA) → Save → same engine scores a new `CR3W-WK-001`. Then one sentence: “The JSON fleet is the demo. Intake is how a real mechanic uses it.”

Do **not** open Settings, CSS, or the code during the pitch.

---

## 2:20–2:40 — Practicality

“It runs in the browser. **Zero rupees** after the device. **No backend**, so it works on bad campus Wi-Fi. Hindi cues on the intake questions. A mechanic does not need to be a pentester.”

---

## 2:40–3:00 — Honest limit + ask

“What we did **not** finish: no live BLE capture, no signed workshop partner, not an AIS-156 certificate.

What we want next: **one depot**, intake-from-the-bay, keep the rules readable.

CyberRide 3W: **assess, explain, improve, re-test** — so a connected e-rickshaw stays safe enough to stay on the road.”

Stop talking. Wait for questions.

---

## Likely jury questions (10-second answers)

| Question | Answer |
|---|---|
| Is the data fake? | Demo profiles are typical BLE-BMS setups. Intake lets a mechanic enter what they see. We do not pretend we sniffed a pack in the hall. |
| Why no backend? | Workshops have patchy network. Local storage is the product, not a missing feature. |
| Why not scan real Bluetooth? | Unsafe on a traction battery without owner consent and a lab. We built a readiness workflow, not an exploit. |
| AIS-156? | Informed by battery safety concerns. Not a certification tool. |
| Who pays? | Workshop or small fleet — software is free to run. Partner round is process + training, not a SaaS bill. |
| What failed? | Hardware loop, named interview if we did not get one, full Hindi UI. |

---

## Reset if a previous demo dirtied the data

Sidebar → **Reset Demo Baseline**, then start from Dashboard.
