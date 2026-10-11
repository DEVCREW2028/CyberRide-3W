/**
 * Workshop intake questions. A mechanic answers what they see on the vehicle.
 * Each option maps to a BMS profile string the rule engine already understands.
 */

export const INTAKE_QUESTIONS = [
  {
    field: "wirelessInterface",
    title: "How does the BMS show up on Bluetooth?",
    titleHi: "BMS Bluetooth par kaise dikhta hai?",
    hint: "Ask the technician to open a generic BLE scanner near the parked vehicle.",
    options: [
      {
        id: "pass",
        label: "Only workshop / bonded phones can see or connect",
        profileValue: "BLE 5.2 (Whitelisted pairing only)",
        connectionType: "BLE 5.2 Secure Channel"
      },
      {
        id: "warn",
        label: "Anyone nearby can see a public Bluetooth name",
        profileValue: "BLE 4.2 (Public Open Broadcast)",
        connectionType: "BLE 4.2 Standard Broadcast"
      },
      {
        id: "fail",
        label: "Open serial / UART service — phone apps connect with no pairing",
        profileValue: "BLE 4.0 (Open UART GATT Service Exposed)",
        connectionType: "BLE 4.0 Open UART GATT"
      }
    ]
  },
  {
    field: "authentication",
    title: "What password or PIN does pairing use?",
    titleHi: "Pairing ke liye kaunsa PIN / password hai?",
    hint: "Default 000000 or 123456 is common on cheap packs.",
    options: [
      {
        id: "pass",
        label: "Unique technician passkey or challenge (not a factory PIN)",
        profileValue: "Authenticated Passkey (AES-128 Challenge)"
      },
      {
        id: "warn",
        label: "Factory PIN such as 000000 or 1234 — never changed",
        profileValue: "Weak Static PIN (000000)"
      },
      {
        id: "fail",
        label: "No PIN / default password / connects with nothing",
        profileValue: "Missing / Default Credentials"
      }
    ]
  },
  {
    field: "unauthorizedAccess",
    title: "Can an unknown phone connect?",
    titleHi: "Kya unknown phone connect ho sakta hai?",
    hint: "Try from a personal phone that was never used in this workshop.",
    options: [
      {
        id: "pass",
        label: "Unknown phones are rejected immediately",
        profileValue: "Blocked (Mutual authentication enforced)"
      },
      {
        id: "warn",
        label: "Generic BLE scanner apps can attach and read data",
        profileValue: "Possible via generic BLE scanner"
      },
      {
        id: "fail",
        label: "Any nearby smartphone app can open a full session",
        profileValue: "Open to any nearby smartphone scanner"
      }
    ]
  },
  {
    field: "safetyCommands",
    title: "Can someone cut battery power from the phone?",
    titleHi: "Kya phone se battery power cut ho sakti hai?",
    hint: "Discharge MOSFET / emergency cutoff is the dangerous control.",
    options: [
      {
        id: "pass",
        label: "Cutoff needs a physical key / hardware interlock",
        profileValue: "Hardware Interlock & Protected Key"
      },
      {
        id: "warn",
        label: "Cutoff needs a short software PIN only",
        profileValue: "Rate-limited / Soft PIN Protected"
      },
      {
        id: "fail",
        label: "Remote discharge / MOSFET switch is open on Bluetooth",
        profileValue: "Exposed (Remote discharge cut-off & MOSFET trigger accessible)"
      }
    ]
  },
  {
    field: "configProtection",
    title: "Can voltage / current limits be edited over Bluetooth?",
    titleHi: "Kya voltage / current limits Bluetooth se badal sakte hain?",
    hint: "Overvoltage and undervoltage cutoffs protect the pack from thermal damage.",
    options: [
      {
        id: "pass",
        label: "Thresholds are locked / signed — cannot casually edit",
        profileValue: "Cryptographically Signed Config"
      },
      {
        id: "warn",
        label: "Editable after a simple password or weak PIN",
        profileValue: "Basic Password Protection"
      },
      {
        id: "fail",
        label: "Plain read/write — anyone connected can change cutoffs",
        profileValue: "Unencrypted R/W parameters (Voltage/Current cutoffs writable)"
      }
    ]
  },
  {
    field: "wirelessAccessControl",
    title: "Is Bluetooth always on, even when parked?",
    titleHi: "Kya Bluetooth hamesha on rehta hai?",
    hint: "Always-on beacons let strangers find and track the vehicle.",
    options: [
      {
        id: "pass",
        label: "Sleeps after timeout, or needs a physical button to pair",
        profileValue: "Timeout after 60s inactivity"
      },
      {
        id: "warn",
        label: "Keeps advertising while idle / parked",
        profileValue: "Continuous advertisement when idle"
      },
      {
        id: "fail",
        label: "Always-on beacon, no pairing timeout",
        profileValue: "Unrestricted beacon broadcast without pairing timeout"
      }
    ]
  },
  {
    field: "firmwareAccess",
    title: "Can firmware be updated from a phone app?",
    titleHi: "Kya phone app se firmware update ho sakti hai?",
    hint: "Unsigned OTA lets a rogue file replace battery control logic.",
    options: [
      {
        id: "pass",
        label: "Only signed OEM firmware is accepted",
        profileValue: "Signed Firmware verification with Rollback Guard"
      },
      {
        id: "warn",
        label: "Update allowed if a simple checksum / CRC matches",
        profileValue: "Checksum Verified OTA (Partially Protected)"
      },
      {
        id: "fail",
        label: "Any unsigned file can be flashed over Bluetooth",
        profileValue: "Unprotected Unsigned OTA update over BLE"
      }
    ]
  }
];
