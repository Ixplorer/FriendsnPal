# FriendnPal & OurPadi — Core User Flow Specification

**Project:** FriendnPal Mental Health Ecosystem (OurPadi Mobile App + Clinician RPM Dashboard)  
**Document:** `user-flow.md`  
**Version:** 2.0.0  
**Baseline:** `requirements.md` (v2.0.0)  
**Core Methodology:** **Prediction $\rightarrow$ Prevention $\rightarrow$ Proactive Intervention**  
**Platforms:** OurPadi Mobile App (iOS / Android v2.1.0) & FriendnPal Clinician RPM Web Dashboard  
**Primary Audience:** Anyone experiencing mental health challenges, emotional distress, or burnout.  
**Validation Beachhead:** Amina (24-year-old nocturnal freelance copywriter in Garki, Abuja under blackouts, US client deadlines, and caretaking stress).

---

## 1. User Flow Overview

This document specifies the end-to-end user journey through the FriendnPal ecosystem. It connects the **patient experience** in the **OurPadi mobile application** with the **clinical oversight loop** in the **FriendnPal Remote Patient Monitoring (RPM) Dashboard**.

The flow models both **longitudinal predictive prevention** (monitoring baseline well-being before crisis) and **acute stress-test de-escalation** (a 3:15 AM nocturnal panic attack and workday rescue under blackouts), concluding with closed-loop clinical telemetry.

```mermaid
graph TD
    subgraph "Phase 1: Longitudinal Prediction (Daily/Weekly)"
        A1["Step 1: Routine Check-in & WHO-5 Assessment<br>(User completes in OurPadi app)"] --> A2["Step 2: Predictive Risk Analysis<br>(Backend evaluates 14-day trajectory)"]
        A2 -->|Score Drops >30%| A3["Step 3: Preventive Micro-Intervention<br>(OurPadi serves CBT nudge; Clinician RPM flags Moderate Risk)"]
        A2 -->|Score Stable| A1
    end

    subgraph "Phase 2: Acute Crisis & Triage (The 3:15 AM Beachhead)"
        B1["Step 4: Acute Midnight Trigger<br>(Nocturnal panic, generator blackout, looming deadline)"] --> B2["Step 5: OurPadi Triage Menu<br>(Explicit Buttons: [Calm My Panic] vs [Rescue My Deadline])"]
        B2 -->|Taps 'Calm My Panic'| B3["Step 6A: Somatic De-escalation<br>(4-4-4 Box Breathing & 5-4-3-2-1 Sensory Grounding)"]
        B2 -->|Taps 'Rescue My Deadline'| B5["Step 7: Workday Rescue Engine<br>(Deconstructs work into 15-min focus sprints)"]
        B3 --> B4{"Step 6B: Continuous Safety Check<br>(Red-flag keywords or self-harm confirmation?)"}
        B4 -->|Confirmed Critical Risk| E1["Step 6C: Emergency Crisis Card (FD-01/02)<br>(Direct WhatsApp wa.me/ link + Phone Hotline)"]
        E1 --> E2["Clinician RPM High-Priority Alert<br>(Websocket alert to On-Call Therapist)"]
        B4 -->|Stabilized (Score 1-2)| B5
    end

    subgraph "Phase 3: Execution, Resolution & Clinical Closed-Loop"
        B5 --> C1["Step 8: Timeboxed Sprint Execution<br>(15-minute micro-deliverable milestones)"]
        C1 --> C2["Step 9: Milestone Submission & Contract Saved<br>(Work submitted on time; acute relief)"]
        C2 --> C3["Step 10: Clinician RPM Sync & Closed-Loop<br>(RPM Dashboard updates patient curve: Stabilized)"]
        C3 --> C4["Step 11: Shift-End Mood Log & Discreet Subscription<br>(06:00 AM check-in; 'FNP Services' 5,000 NGN/mo)"]
    end
```

---

## 2. Step-by-Step User Flow

### Step 1: Routine Assessment & Longitudinal Intake (Prediction Phase)
* **Actor:** User (General Platform User / Amina).
* **Platform:** OurPadi Mobile App (iOS / Android).
* **Action:** Upon opening OurPadi for a routine evening check-in, the app prompts the user to complete their weekly 5-question **WHO-5 Well-Being Index** (assessing cheerfulness, calmness, vigor, restfulness, and daily engagement over the last 14 days).
* **System Action:** OurPadi computes the score (0–100 scale) and securely transmits the telemetry to the FriendnPal API Backend.
* **Clinician Visibility:** The patient's longitudinal curve updates in the FriendnPal RPM Dashboard.

---

### Step 2: Predictive Trajectory Analysis & Risk Stratification
* **System Action (Background Risk Engine - FR-04):** The backend evaluates the user's longitudinal trend against clinical thresholds:
  * *Normal / Resilient:* WHO-5 score $> 50$, stable variance $\rightarrow$ standard wellness content.
  * *Declining / At-Risk:* WHO-5 score drops $> 30\%$ week-over-week, or falls below 28 $\rightarrow$ flagged for **Proactive Prevention**.
* **Clinician RPM Action:** The patient's avatar in the Clinician RPM Dashboard moves from the *Green (Normal)* tier to the *Amber (Moderate Risk)* cohort with an automated note: *"Downward well-being velocity detected (-32% over 7 days)"*.

---

### Step 3: Preventive Micro-Intervention Nudge
* **Platform:** OurPadi Mobile App.
* **System Action:** Rather than waiting for a mental breakdown, OurPadi proactively delivers a gentle in-app micro-intervention card during an optimal non-stress window:
  > *"Padi noticed you've been feeling physically drained lately. Take 3 minutes to try this evening mental decompression exercise."*
* **User Action:** The user reviews the insight, building familiarity and trust with Padi's therapeutic tools before acute crises occur.

---

### Step 4: The Acute Midnight Breaking Point (Beachhead Stress Test)
* **Context:** It is 3:15 AM in Garki, Abuja. The neighborhood generator dies, plunging the apartment into darkness and silence broken only by the groans of Amina's sickle-cell brother. Her Upwork client sends a harsh revision note rejecting her headline draft, due at 6:00 AM WAT. 
* **User Physical State:** Severe panic attack—hyperventilating, racing heartbeat, tunnel vision, cognitive freeze. 
* **User Action:** Amina reaches for her phone and taps the **OurPadi** app icon on her home screen (or opens WhatsApp fallback).
* **System Action:** OurPadi opens instantaneously to the active Padi companion interface with offline-cached resilience.

---

### Step 5: Empathetic Greeting & Triage Mode Routing
* **Platform:** OurPadi Mobile App (AI Companion Interface).
* **System Action (`FD-03` / `FR-02` / `FR-06`):** Within 1.5 seconds, Padi delivers an empathetic, culturally fluent acknowledgment and immediately presents two explicit interactive routing buttons:
  > *"I am right here with you, Amina. You are not alone. Take a slow, gentle breath—we will handle this together step by step.*  
  > *What do you need most right this second?"*  
  > 🔘 **`[Calm My Panic]`**  
  > 🔘 **`[Rescue My Deadline]`**
* **User Action:** Paralyzed by physiological distress, Amina taps **`[Calm My Panic]`**.

---

### Step 6A: Somatic De-escalation (Box Breathing & Grounding)
* **Platform:** OurPadi Mobile App (Somatic Reset Screen).
* **System Action (`FR-02`):** Padi transitions into a guided, visual 4-4-4 box breathing sequence with haptic pulses:
  > *"Look away from your laptop screen. Put both feet flat on the floor.*  
  > *Follow the circle as it expands and contracts:*  
  > *Inhale slowly... 1... 2... 3... 4.*  
  > *Hold gently... 1... 2... 3... 4.*  
  > *Exhale smoothly... 1... 2... 3... 4."*
* **User Action:** Amina breathes along with the visual animation for 3 cycles and taps **`[Heart Rate Slower]`**.
* **System Action (Sensory Anchoring & Reframing):** Padi prompts:
  > *"Tell me 3 physical objects you can see around you right now using your phone light."*
* **User Action:** She types: *"My water bottle, my laptop charger, my brother's blanket."*
* **System Action:**
  > *"You are safe in this room. Your brother is resting. The work can be solved. On a scale of 1 to 5, how overwhelmed do you feel right now?"*
* **User Action:** Taps `[2 - Manageable]` (reduced from initial 5/5 panic).

---

### Step 6B: Continuous Safety Gate & Crisis Exception Path
* **System Logic (`FR-04` / `FD-02`):** Every message and interaction passes through the clinical rule engine.
  * **Normal Stabilization Path:** Distress score reduces to 2; flow transitions automatically to Step 7.
  * **Critical Emergency Exception Path (`FD-01` / `FD-02` / `FR-05`):**
    * If at any point the user types explicit self-harm keywords (*"I want to kill myself"*, *"I can't live anymore"*), the bot immediately asks the direct confirmation question:
      > *"Amina, are you thinking about hurting yourself right now?"*
    * Upon confirmation ("Yes"), the automated flow locks immediately.
    * OurPadi serves the high-visibility **Emergency Crisis Card**:
      > 🚨 *"Amina, your life matters and you do not have to carry this alone. Tap below to connect directly with our on-call crisis counselor right now:"*  
      > 📲 **`[Chat with On-Call Counselor (WhatsApp)]`** (Link: `https://wa.me/234XXXXXXXXXX`)  
      > 📞 *Direct Crisis Hotline: +234-800-FRIENDNPAL*
    * **Simultaneous Clinician RPM Trigger:** The FriendnPal RPM Dashboard immediately sounds a critical audio-visual alert banner, moving the patient to the top of the **Critical Emergency Caseload** for urgent outreach.

---

### Step 7: Transition to "Workday Rescue" Triage Mode
* **Context:** Physical symptoms have normalized, but the impending 6:00 AM Upwork deadline threatens Amina's income and family stability.
* **Platform:** OurPadi Mobile App.
* **System Action (`FR-06`):**
  > *"Your heart rate is steady and your mind is clear. Let's make sure you protect your client contract. What exact deliverable is due, and what time must it be submitted?"*
* **User Action:** Amina inputs: *"5 email newsletter subject lines and 1 body copy draft by 6:00 AM."*
* **System Action (Operational Chunking):** Padi calculates the remaining time (2 hours, 15 minutes) and deconstructs the terrifying project into 15-minute micro-commitments:
  > *"2 hours and 15 minutes is plenty of time when we work in sprints.  
  > Strict rule: Do not touch the body copy right now. Only write 3 subject line options.  
  > Timer set for 15 minutes. Starting Sprint 1 now!"*

---

### Step 8: Timeboxed Execution & Micro-Sprint Accountability
* **Platform:** OurPadi Focus Sprint Interface.
* **User Action:** With her panic extinguished and a focused micro-goal, Amina drafts 3 subject lines.
* **System Action:** At the 15-minute mark, OurPadi chimes gently and prompts:
  > *"Sprint 1 complete! Paste your 3 options or tap [Next: Opening Hook]."*
* **User Action:** Taps `[Next: Opening Hook]`.
* **Subsequent Sprints:** Padi guides Amina through Sprint 2 (Opening Hook - 15 mins), Sprint 3 (Body Bullets - 20 mins), and Sprint 4 (Call to Action & Polish - 15 mins).

---

### Step 9: Goal Completion & Income Protection
* **Time:** 5:10 AM WAT (50 minutes before the 6:00 AM deadline).
* **User Action:** Amina reviews the completed draft, uploads it to the Upwork contract submission portal, and texts Padi:
  > *"Done! Submitted on Upwork! Thank God."*
* **System Action (Celebration & Somatic Wind-down):**
  > *"You did it! 🎉 You pushed through a blackout and a severe panic attack, protected your client contract, and saved your income. I am so proud of you.*  
  > *Now please shut your laptop, drink a full glass of water, check on your brother, and get into bed."*

---

### Step 10: Clinician RPM Sync & Closed-Loop Oversight
* **System Action:** OurPadi writes session resolution telemetry to the FriendnPal backend:
  * De-escalation duration: 12 minutes.
  * Workday rescue duration: 75 minutes.
  * Final distress score: 1/5 (Stabilized).
  * Work status: Deliverable completed on time.
* **FriendnPal Clinician RPM Dashboard:**
  * Patient record updates from *Amber (Moderate Risk)* back to *Green (Stabilized)*.
  * Clinician timeline logs: *"Patient completed acute somatic de-escalation at 03:27 AM and successfully completed Workday Rescue sprint. No clinical escalation needed."*

---

### Step 11: Post-Shift Decompression & Discreet Subscription Loop
* **Time:** 6:00 AM WAT (Scheduled daily shift check-in - `FR-08`).
* **System Action:** OurPadi delivers a discreet wake-up / wind-down notification:
  > *"Good morning Amina. Your shift is officially over. How do you feel entering your sleep window?"*  
  > 🔘 **`[Relieved]`** | 🔘 **`[Exhausted]`** | 🔘 **`[Anxious]`**
* **User Action:** Amina taps **`[Relieved]`**.
* **System Action (Discreet Retention Offer - FR-10):**
  > *"Rest well today. FriendnPal and Padi are with you every night.*  
  > *Your 7-day trial has 2 days remaining. Protect your peace of mind and career for 5,000 NGN/month:*  
  > 🔒 **`[Activate Monthly Membership (5,000 NGN)]`**  
  > *(Billed discreetly on your bank statement as 'FNP Services')*"*

---

## 3. Summary of Edge Cases & Resilience Behaviors

| Scenario | System Behavior & Technical Failsafe |
| :--- | :--- |
| **Complete Network Drop / 2G Throttling** | OurPadi caches somatic box breathing, sensory grounding, and countdown sprint timers locally on device; syncs telemetry to RPM Dashboard when connection restores. |
| **User Sends Incoherent Distress ("...", crying emojis)** | Padi responds with low-friction reassurance: *"I'm here. No need to explain anything right now. Just tap [Calm My Panic] to breathe with me."* |
| **Direct Self-Harm Confirmation (`FD-01` / `FD-02`)** | Bot halts automated conversation; immediately renders red Emergency Crisis Card (`wa.me/...` link + phone hotline); pushes urgent websocket alert to Clinician RPM Dashboard. |
| **User Refuses Breathing Exercises** | Padi smoothly pivots: *"Totally fine. Let's do an unstructured brain dump instead. What is the single biggest thing worrying you right now?"* |
| **Generator Shuts Down During Active Sprint** | App state is saved in local SQLite/AsyncStorage; sprint timer continues accurately via device clock. |
