# SIR 2026 Assistance Camp — Registry Form

A lightweight, single-file web tool for generating, filling, printing, and exporting high-quality PNG slips for the **SIR (Special Intensive Revision) 2026 Assistance Camp** held at Masjid Muhammadia Uppal, Hyderabad.

---

## 📋 Overview

During the SIR camp, volunteers collect voter information and map it against the 2002 electoral rolls. This tool provides a clean, structured digital slip that mirrors the physical form — allowing operators to fill details on-screen, then instantly **print** or **export a high-resolution image** for records.

---

## ✨ Features

- **Live editable form** — All fields are editable directly on the slip; no separate data-entry panel needed
- **Smart auto-formatting**
  - Aadhar No. → `XXXX XXXX XXXX` (auto-spaced every 4 digits)
  - Mobile No. → `XXXXX XXXXX` (auto-spaced after 5th digit)
  - DOB → `DD-MM-YYYY` (auto-dashes inserted while typing)
  - EPIC No. → Uppercase alphanumeric only
  - AC / PS / SL No. (2002) → Digits only
- **Auto Category Detection** — Automatically fills Section 3 based on the year of birth:
  - `Category A` — Born before 1985
  - `Category B` — Born between 1985–2004
  - `Category C` — Born after 2004
- **High-Quality PNG Export** — Exports the slip at 3× resolution (≈2550px wide) via html2canvas
- **Print Support** — Clean print layout; all web controls are hidden on print
- **Clear All** — Resets form fields with one click
- **No backend / No database** — Fully offline, runs in any modern browser

---

## 🗂️ Form Structure

### Section 1 — Elector Identification (2026 Details)
| Field | Description |
|---|---|
| Elector Name | Full name of the voter |
| Father / Husband Name | Relation name |
| EPIC No. | Voter ID card number |
| Aadhar No. | 12-digit Aadhar (auto-formatted) |
| Mobile No. | 10-digit mobile (auto-formatted) |
| Date of Birth | DD-MM-YYYY (auto-formatted) |
| AC No. & Name (Current) | Current Assembly Constituency |
| PS No. & Name (Current) | Current Polling Station |

### Section 2 — Progeny Mapping (2002 Details)
| Field | Description |
|---|---|
| Mapping Done With | e.g. Self, Father, Spouse |
| Relation Name | Name of the relation mapped |
| In 2002 Voter List? | Yes / No |
| State (2002) | e.g. Andhra Pradesh |
| AC No. & Name (2002) | 2002 Assembly Constituency |
| PS No. & Name (2002) | 2002 Polling Station |
| SL No. (2002) | Serial number in 2002 roll |
| Door / House No. & Locality (2002) | Address as in 2002 records |

### Section 3 — Category
Auto-filled based on DOB entered in Section 1.

---

## 🚀 Usage

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox)
2. Fill in the fields directly on the slip
3. Use the top action bar to:
   - **Clear All** — Wipe all form fields
   - **Save High-Quality Image** — Export a 3× PNG of the slip
   - **Print Document** — Open the system print dialog

> No installation, no server, no internet required after the page loads.

---

## 🗃️ File Structure

```
2002-SIR-Help-Form/
├── index.html      # Complete single-file application (HTML + CSS + JS)
├── style.css       # (Reserved for future extraction)
├── script.js       # (Reserved for future extraction)
└── README.md       # This file
```

> All logic — markup, styling, and JavaScript — is currently self-contained in `index.html` for maximum portability and ease of deployment.

---

## 🖨️ Print / Export Notes

- **PNG Export**: Renders the slip off-screen at 3× scale using [html2canvas](https://html2canvas.hertzen.com/). The exported file is named `SIR_2026_CAMP_<ELECTOR_NAME>.png`
- **Print**: All UI controls (buttons, hints) are hidden via `@media print`. Only the white slip card is printed.
- Empty fields show their placeholder text in the export as muted grey — clearly distinguishable from actual data.

---

## 🛠️ Dependencies (CDN — no npm/install needed)

| Library | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com/) | v3 (CDN) | Responsive wrapper & control panel styling |
| [html2canvas](https://html2canvas.hertzen.com/) | 1.4.1 | PNG image export of the slip |
| [Inter (Google Fonts)](https://fonts.google.com/specimen/Inter) | — | Typography |

---

## 📌 Notes

- The form is intentionally **not** connected to any database or storage. Each slip is a standalone export.
- The operator's name and camp date shown in the header are editable inline.
- The footer auto-updates based on the camp location and date fields.
