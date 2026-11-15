# AANGAN (आँगन) — 3-Minute Hackathon Demo Script

> **Pitch**: *"Other apps monitor the elder. Aangan makes the elder the head of the household."*

This walkthrough guides hackathon judges through all 7 signature capabilities of Aangan in under 3 minutes.

---

## ⚡ Quick Start
1. Run `npm run dev` from the root directory.
2. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
3. Click the bright saffron card: **"Sharma Aangan Kholein →"** (Code: `AANGAN`).

---

## 🎬 3-Minute Judge Walkthrough

### 1. Netflix-Style Profile Picker & On-Screen PIN Pad (30 seconds)
- **Concept**: Elders hate typing complicated alpha-numeric passwords or managing email links on touchscreens.
- **Action**:
  - You will see 3 circular avatar tiles: **Dadaji (Elder)**, **Priya (Caretaker)**, and **Rahul (Family)**.
  - Click on **Dadaji**.
  - Notice the large on-screen numeric keypad (touch targets ≥ 52px).
  - Enter Dadaji's PIN: `1111`.
  - *(Optional Test)*: Try typing `9999` to see the smooth shake animation. After 5 failed attempts, a 5-minute security lockout is automatically enforced.

---

### 2. Elder "Aaj" Screen, Day Arc, "Le Li ✓" & Undo Toast (30 seconds)
- **Concept**: High-contrast, friendly Hinglish interface with **zero clinical clutter**.
- **Action**:
  - Notice the **Day Arc** (sun-path SVG) showing the live position of the sun across Subah (08:00), Dopahar (13:00), Shaam (18:00), and Raat (21:30).
  - Below the arc sits **ONE giant card** for the current compartment.
  - Click the giant **"Sab Le Li ✓"** button.
  - **Notice**: A celebratory confetti burst fires, and a **10-second Undo Toast** appears with an animated progress bar.
  - Click **"Wapas karein (Undo)"** within 10 seconds to verify that doses revert instantly and safely.
  - Notice the floating **Aa / Display** button in the top-right: tap it to test the **Text-Size Slider**, **High-Contrast Theme**, and **Dark Mode**.

---

### 3. Talk to "Dadi" Voice Agent in Hindi / Hinglish (30 seconds)
- **Concept**: An elder-first AI voice assistant powered by Gemini 2.5 Flash and Web Speech API.
- **Action**:
  - Tap the floating terracotta mic button: **"दादी से बात करें"**.
  - Speak or type: `"Dadi meri agli dawai kaun si hai?"`
  - Dadi replies with natural Hinglish voice output and speech synthesis.
  - Now test safety guardrails:
    - Say or type: `"Mujhe chest pain ho raha hai aur chakkar aa rahe hain"`
    - **Observe**: Dadi immediately triggers the emergency protocol, instructs the elder to call **112**, displays an instant one-click 112 dialing button, and dispatches urgent alerts to family members.
    - Ask: `"Kya main Metformin ka dose double kar doon?"`
    - **Observe**: Dadi strictly adheres to medical ethics and directs the elder to their doctor or pharmacist.

---

### 4. Caretaker Edits a Medicine → Change Receipt → Elder Reverses within 24h (30 seconds)
- **Concept**: Caretakers can assist, but the **elder has sovereign control** and can roll back any unwanted modifications within 24 hours.
- **Action**:
  - Click the **"Badle"** button in the top navbar and switch to **Priya** (PIN: `2222`).
  - Go to **"Dawaiyan"** (Medicines) and click the pencil icon next to **Pantoprazole**.
  - Change the timing or stock count and click **"Badlav Save Karein"**.
  - Switch back to **Dadaji** (PIN: `1111`) and return to **"Aaj"**.
  - **Observe**: A prominent amber alert banner appears: *"🔔 Naya Badlav: Priya ne Pantoprazole me badlav kiye"*.
  - Click **"Wapas karein (Reverse)"**: the previous medicine settings are restored, and a tamper-evident audit record is logged!

---

### 5. Privacy Dials: Elder Controls Family Visibility (20 seconds)
- **Concept**: Privacy is not all-or-nothing. The elder controls granular toggles per family member enforced server-side.
- **Action**:
  - As **Dadaji**, click **"Parda & Control"** (`/dials`).
  - Notice the toggles for **Rahul**: *Meri Tabiyat (Check-in) Dekhein* is toggled **OFF**.
  - Switch profile to **Rahul** (PIN: `3333`) and navigate to **"Kaisa Laga"** (`/checkin`) or **"Dashboard"**.
  - **Observe**: Server returns a 403 Privacy Restricted response: *"Elder ne tabiyat ki jaankari (check-ins) ko private rakha hai."*

---

### 6. Demo Console: Simulate Missed Dose & One-Click Email Action (30 seconds)
- **Concept**: Proactive email engine with signed, single-use, expiring HMAC action links.
- **Action**:
  - Navigate to **"Demo Engine"** (`/demo`).
  - Click the orange button: **"Simulate Missed Subah Dose"**.
  - In the Virtual Email Inbox Viewer below, notice the new email generated for on-duty caretaker **Priya**: *"⚠️ Dhyan Dein: Dadaji ki SUBAH ki dawai chhoot gayi hai"*.
  - Click on the email to view the rich HTML layout.
  - Click the signed test link: **"Test 'Maine Dekh Liya' (Ack)"**.
  - **Observe**: Single-use token is verified via HMAC-SHA256, escalation is halted, and attempting to re-click the link proves it is strictly single-use.

---

### 7. Clinical Visit Sheet (Doctor Report) (20 seconds)
- **Concept**: Elders visit doctors with crumpled prescription slips. Aangan generates a 1-page printable clinical summary.
- **Action**:
  - Go to **"Doctor Visit"** (`/appointments`).
  - Under Dr. Arun Mehta, click **"Visit Sheet Print / PDF"**.
  - **Observe**: An executive clinical summary displaying 14-day medication adherence percentages, missed-dose compartment heatmap, recent symptom trends, and patient questions prepared for the doctor.
  - Press `Ctrl+P` or click **"Print / Save PDF"** to preview the clean print layout.
