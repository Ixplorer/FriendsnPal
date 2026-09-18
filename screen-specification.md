# FriendnPal & OurPadi — Screen Specifications

**Project:** FriendnPal Mental Health Ecosystem (OurPadi Mobile App + Clinician RPM Dashboard)  
**Document:** `screen-specification.md`  
**Version:** 2.2.0  
**Baseline:** `user-flow.md` (v2.0.0), `requirements.md` (v2.1.0) & `data-structure.md` (v2.1.0)  
**Client Platforms:** OurPadi Mobile App (iOS / Android v2.1.0) & FriendnPal Clinician RPM Web Dashboard  
**Total Screens:** Exactly 8 Screens (Strict Maximum Cap implied by the Core User Flow)

---

## Screen 1: OurPadi Home & Preventive Dashboard (Patient Mobile)
* **Purpose:** Lets the user view their well-being summary, receive proactive preventive CBT nudges, and quickly launch assessments, triage companion chat, or workday rescue.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Header Bar:** Profile avatar with user initials ("A"), greeting text ("Good day, Amina"), biometric security button (`🔒`), notifications bell with unread badge (`🔔`), and emergency crisis shield button (`🛡️ Emergency`).
  2. **Predictive Preventive Nudge Card (Step 3):** Lightbulb icon, title (*"Padi Preventive Care"*), message (*"Padi noticed you've been feeling physically drained lately. Take 3 minutes to try this evening mental decompression exercise."*), and action button `[Try 3-Min Decompression]`.
  3. **Well-Being Index (WHO-5) Summary Card (Step 1):** Circular gauge displaying current score (e.g. "36/100 · Moderate Strain"), 14-day velocity delta ("↓ 32% this week"), and primary button `[Take Full WHO-5 Assessment]`.
  4. **Daily Mood Quick Check-in Strip (Step 11):** Prompt (*"How are you feeling right now?"*), 5 mood buttons (`[Relieved]`, `[Calm]`, `[Exhausted]`, `[Anxious]`, `[Heavy]`), and active streak badge (*"3 Day Streak"*).
  5. **Quick-Action Grid (2x2 Cards):**
     * Card 1: **"Talk to Padi"** (AI Companion de-escalation launcher).
     * Card 2: **"Workday Rescue"** (Focus sprints launcher).
     * Card 3: **"Somatic Reset"** (4-4-4 box breathing and ASMR audio).
     * Card 4: **"Emergency Support"** (24/7 crisis hotlines).
  6. **Bottom Navigation Bar:** `[Home]` (active), `[Assessments]`, `[Companion]`, `[Rescue]`, `[Crisis Support]`.
* **Element Interactions:**
  * **Tapping `[Try 3-Min Decompression]` or "Somatic Reset":** Navigates to **Screen 4 (Somatic De-escalation & Sensory Grounding)**.
  * **Tapping `[Take Full WHO-5 Assessment]` or [Assessments] in nav bar:** Navigates to **Screen 2 (Routine Well-Being Assessment)**.
  * **Tapping any Mood Button (`[Relieved]`, `[Calm]`, etc.):** Updates current mood state, logs entry to `MoodLog`, and increments the streak counter.
  * **Tapping "Talk to Padi" or [Companion] in nav bar:** Navigates to **Screen 3 (OurPadi Triage & AI Companion Chat)**.
  * **Tapping "Workday Rescue" or [Rescue] in nav bar:** Navigates to **Screen 6 (Workday Rescue & 15-Minute Focus Sprints)**.
  * **Tapping Emergency Shield (`🛡️ Emergency`) or [Crisis Support]:** Navigates to **Screen 5 (Emergency Crisis Card & Safety Protocol)**.
  * **Tapping Biometric Lock (`🔒`):** Triggers device biometric authentication modal to decrypt stored clinical data.

---

## Screen 2: Routine Well-Being Assessment (WHO-5 Clinical Intake) (Patient Mobile)
* **Purpose:** Lets the user complete the validated 5-question WHO-5 Well-Being Index to track their longitudinal mental health trajectory and sync telemetry with their clinician.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Header Bar:** Back button (`←`), screen title ("WHO-5 Well-Being Index"), subtitle ("Validated Screening · Past 14 Days Recall"), and item progress badge ("Item 1 of 5").
  2. **Linear Stepper Progress Bar:** Animated progress track that increments 20% per completed question.
  3. **Assessment Statement Card:** Question category chip (*"Question 1 / 5"*), instruction text (*"Indicate which option is closest to how you felt over the past 2 weeks"*), and statement box displaying active prompt (e.g. *"I have felt cheerful and in good spirits"*).
  4. **Likert Selection Card Grid (6 Radio Options):**
     * `[All of the time · 5 pts]`
     * `[Most of the time · 4 pts]`
     * `[More than half of the time · 3 pts]`
     * `[Less than half of the time · 2 pts]`
     * `[Some of the time · 1 pt]`
     * `[At no time · 0 pts]`
  5. **Navigation Controls Bar:** `[← Previous]` button, step indicator dots (1, 2, 3, 4, 5), and primary `[Next →]` button (transitions to `[Calculate Score]` on question 5).
  6. **Results & Diagnostic Feedback Card (Revealed upon completing question 5):**
     * Circular score dial showing computed score (0–100 scale, e.g. "36/100").
     * Diagnostic severity title (*"Moderate Clinical Strain"*).
     * Velocity delta badge (*"↓ 32% velocity drop over 14 days"*).
     * Risk tier badge (*"Risk Tier: MODERATE"*).
     * Targeted clinical recommendation body and quick action buttons (`[🫁 Somatic Reset]`, `[⏱️ Workday Rescue]`).
     * Primary action button: `[📡 Sync Telemetry to Clinician Chart & Return Home]`.
* **Element Interactions:**
  * **Tapping a Likert Radio Card:** Selects the point value (0–5) for the active question and enables `[Next →]`.
  * **Tapping `[Next →]`:** Advances to the next WHO-5 question and animates the progress bar by 20%.
  * **Tapping `[← Previous]`:** Returns to the preceding question to review or modify the response.
  * **Tapping `[Calculate Score]` on Question 5:** Calculates raw score (0–25), normalizes to 0–100, compares against baseline trajectory, and reveals the Results & Diagnostic Feedback Card.
  * **Tapping `[🫁 Somatic Reset]`:** Navigates to **Screen 4 (Somatic De-escalation & Sensory Grounding)**.
  * **Tapping `[⏱️ Workday Rescue]`:** Navigates to **Screen 6 (Workday Rescue & 15-Minute Focus Sprints)**.
  * **Tapping `[📡 Sync Telemetry to Clinician Chart & Return Home]`:** Transmits assessment telemetry to the FriendnPal API backend, moves patient in Clinician RPM from Green to Amber, and navigates to **Screen 1 (Home Dashboard)**.
  * **Tapping Back (`←`):** Prompts exit confirmation and returns to **Screen 1 (Home Dashboard)**.

---

## Screen 3: OurPadi Triage & AI Companion Chat (Patient Mobile)
* **Purpose:** Lets the user communicate their immediate midnight distress in English or Nigerian Pidgin and select between panic calming or deadline rescue via rapid one-tap triage buttons.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Header Bar:** Back button (`←`), Padi avatar with online pulse dot, companion name ("Padi AI"), status subtitle ("Online · Empathetic Triage"), and emergency crisis shield button (`🛡️ Crisis`).
  2. **Security & Privacy Banner:** Encrypted notice (*"🔒 Encrypted · Anonymous · Empathetic Nigerian English & Pidgin"*).
  3. **Interactive Message Thread (Scrollable Chat History):**
     * Bot empathy bubble (*"I dey with you, Amina. You are not alone. Take a slow, gentle breath—we will handle this together step by step. Wetin you need most right now?"*).
     * Interactive Triage Mode Cards (Stacked high-contrast action buttons):
       - Button A: **`[🫁 Calm My Panic]`** (Subtitle: *"4-4-4 box breathing, sensory grounding & ASMR soundscapes"*).
       - Button B: **`[⏱️ Rescue My Deadline]`** (Subtitle: *"Deconstruct urgent work into 15-min focus sprints"*).
     * User response bubbles and subsequent bot replies.
  4. **Bottom Message Input Bar:**
     * Text input field (*"Type how you feel (e.g. My heart dey beat fast)..."*).
     * Dialect toggle button (`[Pidgin 🇳🇬 / English 🇬🇧]`).
     * Send button (`➤`).
* **Element Interactions:**
  * **Tapping `[🫁 Calm My Panic]`:** Initiates somatic de-escalation pathway &rarr; Navigates to **Screen 4 (Somatic De-escalation & Sensory Grounding)**.
  * **Tapping `[⏱️ Rescue My Deadline]`:** Initiates deadline salvage intake &rarr; Navigates to **Screen 6 (Workday Rescue & 15-Minute Focus Sprints)**.
  * **Tapping Emergency Crisis Shield (`🛡️ Crisis`):** Instantly displays **Screen 5 (Emergency Crisis Card & Safety Protocol)**.
  * **Typing Self-Harm or Red-Flag Keywords (e.g. "want to die", "can't live"):** Triggers bot confirmation check (*"Amina, are you thinking about hurting yourself right now?"*). If user confirms &rarr; locks chat and immediately displays **Screen 5 (Emergency Crisis Card & Safety Protocol)** while dispatching a high-priority WebSocket alert to the Clinician RPM Dashboard.
  * **Tapping Dialect Toggle Button:** Switches Padi's conversational tone between Standard English and Nigerian Pidgin.
  * **Typing a message and tapping Send (`➤`):** Appends user message to thread and renders contextual AI de-escalation reply within 1.5 seconds.
  * **Tapping Back (`←`):** Navigates to **Screen 1 (Home Dashboard)**.

---

## Screen 4: Somatic De-escalation & Sensory Grounding (Patient Mobile)
* **Purpose:** Guides the user through a paced 4-4-4 box breathing sequence, 5-4-3-2-1 sensory grounding, and distress re-rating to physically halt acute panic attacks.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Header Bar:** Back button (`←`), screen title ("Somatic Reset"), category toggle pill (`[Somatic Exercises | ASMR Audio]`), and crisis shortcut button (`🚨`).
  2. **Interactive 4-4-4 Box Breathing Widget:**
     * Cycle tracker text (*"CYCLE 1 OF 3"*).
     * Pulsing luminous breathing circle viewport that visually expands on Inhale (4s), pauses on Hold (4s), contracts on Exhale (4s), and pauses on Empty Hold (4s), synchronized with device haptics.
     * Centered cadence action label (*"INHALE"*, *"HOLD"*, *"EXHALE"*) and large digital countdown number (*"4"*).
     * Breathing control buttons: `[▶ Start 4-4-4 Reset]` and `[↺ Reset]`.
  3. **Sensory Anchoring Drawer (5-4-3-2-1 Grounding):**
     * Section header (*"👁️ 5-4-3-2-1 Sensory Grounding · Anchoring"*).
     * Prompt text (*"Tell me 3 physical objects you can see around you right now using your phone light:"*).
     * 3 text input chip fields (`1. Water bottle`, `2. Laptop charger`, `3. Brother's blanket`).
  4. **Post-Exercise Distress Re-Rating Box:**
     * Slider label displaying selected rating (*"Distress Level After Exercise: 2 (Manageable)"*).
     * Interactive 1 to 5 distress range slider (1: Calm, 2: Manageable, 3: Shaky, 4: Panicking, 5: Crisis).
  5. **ASMR Ambient Soundscape Carousel (Visible when ASMR toggled):**
     * Soundscape cards for *"Abuja Midnight Rain"*, *"Deep Atlantic Waves"*, and *"Nocturnal Brown Noise"*.
     * Offline play/pause buttons and 15-minute sleep timer toggle.
  6. **Primary Transition Action Button:** `[⏱️ Feeling Slower / Ready for Workday Rescue]`.
* **Element Interactions:**
  * **Tapping `[▶ Start 4-4-4 Reset]`:** Activates animated breathing circle, begins 4-second paced breathing intervals, plays soothing phase-transition chimes, and triggers haptic pulses.
  * **Typing into Sensory Grounding Chips:** Enters physical anchoring items, actively diverting cognitive focus away from panic.
  * **Adjusting Distress Slider to 1 or 2:** Confirms physiological stabilization.
  * **Adjusting Distress Slider to 5 (Critical):** Triggers safety alert and prompts user to open **Screen 5 (Emergency Crisis Card & Safety Protocol)**.
  * **Tapping `[⏱️ Feeling Slower / Ready for Workday Rescue]`:** Persists de-escalation telemetry (duration, score drop 5 &rarr; 2) to local storage and backend &rarr; Navigates to **Screen 6 (Workday Rescue & 15-Minute Focus Sprints)**.
  * **Tapping `[ASMR Audio]` in toggle pill:** Switches view to offline synthesized soundscapes.
  * **Tapping Crisis Button (`🚨`):** Opens **Screen 5 (Emergency Crisis Card & Safety Protocol)**.
  * **Tapping Back (`←`):** Returns to **Screen 3 (OurPadi Triage & AI Companion Chat)**.

---

## Screen 5: Emergency Crisis Card & Safety Protocol (Patient Mobile / Modal)
* **Purpose:** Lets the user in severe distress instantly connect with on-call human counselors via WhatsApp or direct phone hotline and triggers an automated clinician alert.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Emergency Crisis Alert Banner (High-Visibility Red Accent):**
     * Flashing warning badge (*"🚨 IMMEDIATE 24/7 CRISIS SUPPORT PROTOCOL"*).
     * Empathetic heading (*"Amina, Your Life Matters"*).
     * Compassionate guidance text (*"You do not have to carry this alone. There is human help right this second. Please connect directly with our on-call counselor or call our toll-free hotline:"*).
  2. **Direct WhatsApp Counselor Action Button (FD-01):**
     * Large green button with WhatsApp icon: `[💬 Chat with On-Call Counselor on WhatsApp]` (Direct link: `https://wa.me/2348003743637?text=Hello%2C%20I%20need%20immediate%20crisis%20assistance.`).
  3. **Direct Toll-Free Phone Hotline Button:**
     * High-contrast phone button: `[📞 Call Toll-Free 24/7 Hotline: 0800-FRIENDNPAL]`.
  4. **Clinical Safety Protocol Notice:**
     * Explanation of confidentiality and priority response (*"Your on-call clinician has been notified of high-priority distress and is on standby."*).
  5. **Safety De-escalation / Return Link:**
     * Discreet dismiss link: `[Return to App (I am safe right now)]`.
* **Element Interactions:**
  * **Tapping `[💬 Chat with On-Call Counselor on WhatsApp]`:** Immediately launches WhatsApp pre-populated with crisis intake message (`wa.me/...`), and simultaneously fires an urgent WebSocket crisis alert banner to the Clinician RPM Dashboard.
  * **Tapping `[📞 Call Toll-Free 24/7 Hotline]`:** Opens native mobile dialer pre-populated with toll-free emergency number `0800-FRIENDNPAL`.
  * **Tapping `[Return to App (I am safe right now)]`:** Closes emergency view, logs safety confirmation to local state, and returns to **Screen 1 (Home Dashboard)** or **Screen 4 (Somatic Reset)**.

---

## Screen 6: Workday Rescue & 15-Minute Focus Sprints (Patient Mobile)
* **Purpose:** Lets the user deconstruct overwhelming work deliverables into structured 15-minute micro-sprints with a countdown timer to break task paralysis and beat deadlines.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Sprint Header Bar:** Back button (`←`), deliverable title (*"Upwork Deliverable"*), deadline countdown chip (*"Due at 06:00 AM · 2h 15m remaining"*), and active sprint badge (*"Sprint 1 of 4"*).
  2. **Sprint Stepper Indicator:** 4 connected progress dots showing active sprint milestone (Step 1: 3 Subject Lines, Step 2: Opening Hook, Step 3: Body Bullets, Step 4: CTA & Polish).
  3. **15-Minute Countdown Timer Widget:**
     * Large digital countdown clock display (*"14:22"*).
     * Subtitle label (*"Focused Micro-Sprint Countdown"*).
     * Timer controls: `[▶ Start Sprint / ⏸️ Pause]` and `[+5 Mins]` extension button.
  4. **Active Micro-Task Directive Card:**
     * Card title with target icon (*"🎯 Active Micro-Task · Singular Rule"*).
     * Strict scope constraint text (*"Write 3 headline options only. Do NOT touch body copy or revisions yet."*).
  5. **Quick Draft / Submission Box:**
     * Live word count counter (*"34 words"*).
     * Auto-saving multiline text area (*"Draft your 3 headline options here... (Auto-saved locally)"*).
  6. **Sprint Action Controls:**
     * Primary action button: `[✓ Complete Sprint & Advance to Next Task]`.
     * Secondary button: `[Need 5 More Minutes]`.
* **Element Interactions:**
  * **Tapping `[▶ Start Sprint]`:** Starts the 15-minute countdown clock and records active sprint start time.
  * **Tapping `[+5 Mins]` / `[Need 5 More Minutes]`:** Extends timer by 300 seconds without breaking momentum.
  * **Typing in Quick Draft Box:** Auto-saves text locally to device cache and increments the live word counter.
  * **Tapping `[✓ Complete Sprint & Advance to Next Task]` on Sprints 1–3:** Marks current sprint complete, advances stepper indicator to next milestone dot, loads the next micro-task directive (e.g. Opening Hook), and resets timer to 15:00 &rarr; Loops within **Screen 6**.
  * **Tapping `[✓ Complete Final Sprint & Submit]` on Sprint 4:** Logs all 4 completed sprints, records saved contract earnings ($350 USD), triggers celebration chime &rarr; Navigates to **Screen 7 (Post-Shift Decompression & Subscription)**.
  * **Tapping Back (`←`):** Prompts confirmation to pause sprint and returns to **Screen 1 (Home Dashboard)**.

---

## Screen 7: Post-Shift Decompression & Subscription (Patient Mobile)
* **Purpose:** Lets the user celebrate their completed work deadline, log their morning post-shift emotional state, and activate a discreet monthly membership to protect peace of mind.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Header Bar:** Brand mark ("OurPadi"), time badge ("06:00 AM WAT · Shift End"), and dismiss/close button (`✕`).
  2. **Work Completion & Contract Saved Celebration Banner:**
     * Confetti celebration icon (`🎉`).
     * Heading (*"You Did It, Amina!"*).
     * Summary text (*"You pushed through a blackout and acute panic, protected your client contract, and saved your income. We are proud of you."*).
     * Milestone metric badges (*"Deliverable Submitted on Time"* | *"4 Sprints Completed"* | *"$350 Contract Secured"*).
  3. **Shift-End Mood Check-in Card (Step 11):**
     * Prompt (*"Your shift is officially over. How do you feel entering your sleep window?"*).
     * 3 quick-tap emotional state buttons: `[😌 Relieved]`, `[🥱 Exhausted]`, `[😰 Anxious]`.
  4. **Post-Shift Somatic Wind-Down Checklist:**
     * Interactive self-care checkboxes:
       - ☑️ *"Shut laptop and mute client Slack"*
       - 🔲 *"Drink a full glass of fresh water"*
       - 🔲 *"Check on your brother"*
       - 🔲 *"Get into bed and start sleep audio"*
  5. **Discreet Monthly Subscription Card (FR-16 / Step 11):**
     * Shield icon, header: *"Protect Your Peace & Career · Ongoing Support"*.
     * Trial reminder (*"Your 7-day trial has 2 days remaining. Enjoy uninterrupted nocturnal de-escalation, priority clinician RPM, and unlimited sprints for 5,000 NGN/month."*).
     * Discreet billing guarantee: *"🔒 Billed discreetly on your bank statement as 'FNP Services' (Zero stigma)"*.
     * Primary subscription button: `[🔒 Activate Monthly Membership (5,000 NGN)]`.
     * Secondary button: `[Continue with Free Trial]`.
* **Element Interactions:**
  * **Tapping a Mood Button (`[Relieved]`, `[Exhausted]`, `[Anxious]`):** Records shift-end mood to `MoodLog`, transmits resolution telemetry to backend, and updates Clinician RPM status to *Green (Stabilized)*.
  * **Tapping Wind-Down Checklist Checkboxes:** Toggles checkbox completion and fires subtle haptic feedback.
  * **Tapping `[🔒 Activate Monthly Membership (5,000 NGN)]`:** Launches secure Paystack/Flutterwave payment modal with discreet 'FNP Services' billing descriptor.
  * **Tapping `[Continue with Free Trial]` or Close (`✕`):** Dismisses screen and returns to **Screen 1 (Home Dashboard)** with active sleep window reminder.

---

## Screen 8: FriendnPal Clinician RPM Dashboard (Clinician Web Portal)
* **Purpose:** Lets licensed therapists monitor their assigned patient caseload in real-time, inspect longitudinal score curves (WHO-5, GAD-7, PHQ-9), review triage transcripts, and conduct proactive clinical outreach.
* **Elements on the Screen (Top to Bottom, Left to Right):**
  1. **Top Portal Navigation Bar:** FriendnPal Clinician Portal logo (`🩺 FriendnPal`), version tag ("Clinician RPM Portal v2.1.0"), clinician profile badge ("Dr. Chidi Okafor, FWACP · On-Call Clinician"), and audio/visual alert bell with pulsing red indicator.
  2. **High-Priority Telemetry Alert Banner:** Audible/visual banner displaying real-time crisis alerts (*"🚨 HIGH PRIORITY TELEMETRY ALERT: Patient #8241 (Amina, 26F · Abuja) reported severe nocturnal anxiety & WHO-5 velocity drop >30%"*), with action button `[Open Counselor WhatsApp]`.
  3. **Caseload Metrics Strip (4 Metric Tiles):**
     * Tile 1: Total Assigned Patients (*"48 · Active RPM enrollment"*).
     * Tile 2: Critical Risk Alerts (*"3 · Requires same-day triage"* - Red border).
     * Tile 3: Moderate / Declining Cohort (*"11 · Negative score velocity"* - Amber border).
     * Tile 4: Cohort Avg WHO-5 (*"54.2 · Normalized 0–100 scale"* - Blue border).
  4. **Monitored Patient Cohort Table (Left 58% Width):**
     * Cohort filter tabs: `[All (48)]`, `[Critical (3)]`, `[Moderate (11)]`.
     * Search & sort inputs: Search patient by name or ID.
     * Table columns: Patient (ID, Name, Age, Location), Platform (Android v2.1.0 / iOS), WHO-5 Score (e.g. 36/100), 14-Day Trend (e.g. ↓ 32%), Risk Tier (`CRITICAL`, `MODERATE`, `NORMAL`), Action (`[Inspect]` button).
  5. **Patient Detail & Longitudinal Trajectory Panel (Right 42% Width):**
     * Patient profile header: Name, ID (#8241), age/gender (26F), location ("Garki, Abuja"), primary diagnosis ("Acute Nocturnal Anxiety & Somatic Stress"), and current risk badge (`CRITICAL ALERT`).
     * **30-Day Multi-Line Chart (SVG Canvas):** Displays WHO-5 well-being curve (blue line) vs GAD-7 anxiety curve (red line) against clinical diagnostic threshold line (50 pts).
     * **Recent Telemetry Event Timeline:**
       - *03:15 AM:* Completed 4-4-4 Box Breathing (Distress reduced 5 &rarr; 2).
       - *03:32 AM:* Workday Rescue Sprint 1 completed (3 headlines drafted).
       - *05:10 AM:* Workday Rescue completed & submitted on time (Stabilized).
       - *06:00 AM:* Shift-end mood logged: Relieved (Stabilized closed-loop).
     * **Clinical Action Controls Bar:**
       - Primary button: `[📝 Log Clinical Note]` (opens modal to record diagnosis and progress note).
       - Secondary button: `[⚙️ Adjust Care Plan]` (adjusts assessment frequency or CBT recommendations).
       - Emergency direct button: `[💬 Open WhatsApp Counselor Session]`.
* **Element Interactions:**
  * **Clicking a Patient Row in Cohort Table:** Selects that patient, loads their 30-day longitudinal curves, telemetry timeline, and clinical history into the right panel.
  * **Clicking Cohort Filter Tabs (`[Critical]`, `[Moderate]`):** Filters table view to patients requiring immediate attention.
  * **Clicking `[Open Counselor WhatsApp]` or `[Open WhatsApp Counselor Session]`:** Launches WhatsApp Web with pre-filled clinical outreach message to the patient.
  * **Clicking `[📝 Log Clinical Note]`:** Opens modal form to enter clinical assessment notes, which persist to `ClinicianNote` table and update the patient's audit log.
  * **Clicking `[⚙️ Adjust Care Plan]`:** Opens care plan drawer to reassign assessment intervals (e.g. weekly to bi-weekly) or assign specific somatic exercises.
  * **Receiving Incoming WebSocket Crisis Telemetry:** Plays audible chime, moves affected patient to top of list, flashes alert banner red, and increments the Critical Risk Alerts metric.
