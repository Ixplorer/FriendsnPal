# FriendnPal & OurPadi — Product Requirements Document (PRD)

**Project:** FriendnPal Mental Health Ecosystem (OurPadi Mobile App + Clinician RPM Dashboard)  
**Document Version:** 2.1.0  
**Status:** Approved for Dual-Platform Implementation  
**Client Applications:**  
* **OurPadi Mobile App:** Live on Apple App Store (iOS) and Android (v2.1.0)  
* **FriendnPal Clinician Portal:** Remote Patient Monitoring (RPM) Web Dashboard  
* **Auxiliary Access:** WhatsApp Business Low-Bandwidth Emergency Gateway  
**Core Methodology:** **Prediction $\rightarrow$ Prevention $\rightarrow$ Proactive Intervention**  

---

## 1. Problem Statement

Traditional mental health systems operate on a broken, reactive model (*"Symptoms $\rightarrow$ Acute Crisis $\rightarrow$ Emergency Diagnosis $\rightarrow$ Belated Treatment"*). For millions of individuals experiencing mental health conditions, severe emotional stress, depression, addiction, parental trauma, academic strain, and burnout, intervention comes too late—leading to lost productivity, chronic physical illnesses, relationship collapse, and preventable suicides. This crisis is exacerbated in developing regions like Nigeria by structural therapist shortages, cultural stigma, high private clinic costs, and erratic infrastructure. 

FriendnPal solves this by inverting the paradigm into a **proactive digital health platform**: utilizing the **OurPadi** mobile app (iOS & Android) for continuous mood tracking, AI companionship, daily motivational checklists, peer support communities, guided mindfulness/ASMR, journaling, mental health resource libraries, and clinical assessments (WHO-5, GAD-7, PHQ-9), paired with the **FriendnPal Remote Patient Monitoring (RPM) Dashboard** for clinicians. By identifying downward behavioral and psychological trends early, the platform delivers preventive micro-interventions and proactive clinical triage *before* a manageable struggle escalates into a catastrophic emergency.

---

## 2. Target User Segments (Platform Scope vs. Validation Beachhead)

### A. General Platform Population (The Broad Audience)
* **Who it is for:** Any individual experiencing mental health challenges, emotional distress, chronic anxiety, burnout, addiction recovery, parental trauma, academic pressure, or depression.
* **Demographics:** Young adults, university students, corporate employees, healthcare personnel, and working professionals (ages 18–45).
* **Job-To-Be-Done:** Continuous, judgment-free mental health support, longitudinal tracking of well-being, peer community connection, guided calming tools, and timely connection to certified clinicians when risks emerge.

### B. High-Intensity Validation Persona (The "Beachhead" Scenario)
* **Primary Persona:** The **"Solitary High-Stakes Remote Worker"** (exemplified by Amina, a 24-year-old Upwork copywriter in Garki, Abuja).
* **Role in Product Strategy:** Serves as the ultimate stress-test benchmark for the platform. She faces the highest environmental friction: nocturnal US shifts (10:00 PM – 6:00 AM WAT), frequent power blackouts, generator noise, solitary caretaking of a chronically ill dependent (sickle-cell warrior brother), and acute deadline anxiety where emotional freeze directly threatens dollar earnings.
* **Validation Principle:** If the prediction and proactive intervention engine can successfully de-escalate and safeguard an isolated gig worker at 3:00 AM under blackouts, it effortlessly serves corporate employees, students, addiction recovery seekers, and general wellness patients.

---

## 3. Core Functional Requirements (FR) Table

| ID | Feature | System & Technical Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | **OurPadi Mobile Client (iOS & Android)** | Cross-platform patient application (iOS App Store & Android v2.1.0). Provides secure biometric onboarding, 24/7 AI companion chat, taskbar community navigation, mood tracking, and offline-resilient local storage. | **Must Have** |
| **FR-02** | **Culturally Fluent AI Companion Engine** | Conversational de-escalation agent supporting standard English and Nigerian Pidgin. Trained on empathetic, non-judgmental dialogue and clinical micro-interventions. | **Must Have** |
| **FR-03** | **Clinical Assessment Engine (RPM Intake)** | Automated longitudinal tracking utilizing validated clinical frameworks: **WHO-5** (Well-Being Index), **GAD-7** (Anxiety), and **PHQ-9** (Depression markers). Calculates real-time severity scores. | **Must Have** |
| **FR-04** | **Predictive Risk & Prevention Algorithm** | Background analytics engine that detects downward score trajectories (e.g. WHO-5 score dropping >30% over 7 days, or severe journal sentiment shifts) and automatically triggers preventive CBT nudges. | **Must Have** |
| **FR-05** | **Emergency Crisis Handoff Protocol** | Hybrid safety net: instant crisis escalation on explicit danger keywords (suicide/self-harm); direct safety confirmation question for ambiguous distress; serves immediate emergency response card with direct WhatsApp link (`wa.me/...`) and phone hotline to on-call counselors. [Founder decision] | **Must Have** |
| **FR-06** | **"Workday Rescue" Triage Mode** | Operational panic recovery tool: prompts the user to state their impending deadline and breaks overwhelming deliverables into structured, timed 15-minute micro-sprints via quick-tap routing (`[Calm My Panic]` vs. `[Rescue My Deadline]`). [Founder decision] | **Must Have** |
| **FR-07** | **FriendnPal Clinician RPM Dashboard** | Secure web portal for licensed therapists and clinical care teams: real-time patient risk tiering (Normal, Moderate, High, Critical), longitudinal score curves, alert queue, and clinical notes. | **Must Have** |
| **FR-08** | **Continuous Mood Check-ins & Shift Log** | Frictionless mood logging with emotion wheel, sleep intention, energy rating, and stress trigger tags (e.g. power outage, work deadline, caretaking). | **Should Have** |
| **FR-09** | **Daily Motivational Checklist & Wellness Habits** | Interactive daily habit checklist featuring positive affirmations, hydration tracking, mindfulness prompts, and daily self-care milestone badges. | **Should Have** |
| **FR-10** | **Mindfulness & Breathing Exercises Library** | Structured repository of somatic de-escalation exercises: 4-4-4 box breathing with visual animated guide, 5-4-3-2-1 sensory grounding, progressive muscle relaxation, and mindful breathing. | **Should Have** |
| **FR-11** | **ASMR & Calming Soundscapes** | Curated nocturnal and daytime audio player featuring high-quality relaxing soundscapes (rain, gentle streams, brown noise, whispered encouragement) designed for sleep aid and panic reduction. | **Should Have** |
| **FR-12** | **Peer Support Communities (Taskbar Navigation)** | Dedicated community tab on bottom taskbar offering safe, moderated anonymous peer support groups: Parental Abuse Support Group, Addiction & Recovery Group, Student Support Group, Freelancers/Workplace Stress Group. | **Should Have** |
| **FR-13** | **Thought & Gratitude Journals (Journals)** | Private, encrypted in-app journal supporting freeform writing, sentiment tagging, guided cognitive reframing prompts, and gratitude reflection. | **Should Have** |
| **FR-14** | **Mental Health Resource Library (Quick Access)** | Searchable repository of psychoeducational articles, clinical self-help guides, crisis hotlines, trauma management articles, and practical mental health tips. | **Should Have** |
| **FR-15** | **Human Therapy Marketplace Booking** | Integrated scheduling module allowing subscribed users to book 45-minute virtual video/voice consultations with certified Nigerian therapists at fixed session rates (7,500 – 15,000 NGN). | **Should Have** |
| **FR-16** | **Discreet Recurring Subscription** | Automated 5,000 NGN/month recurring membership via Paystack/Flutterwave with discreet bank billing descriptors (e.g. "FNP Services") to ensure absolute stigma privacy. | **Should Have** |
| **FR-17** | **WhatsApp Low-Bandwidth Gateway** | Auxiliary lightweight conversational interface connected to the central backend for users during network throttling or data exhaustion. | **Could Have** |
| **FR-18** | **Weekly Longitudinal Mental Health Digest** | Automated weekly report delivered to users highlighting mood stability, clinical score progress, and environmental stress correlations. | **Could Have** |
| **FR-19** | **32 Language Expansion** | NLP dialect expansion beyond English and Nigerian Pidgin. Deferred to post-scale. | **Won't Have** |
| **FR-20** | **Synthetic AI Voice Calling Bot** | Real-time speech-to-speech voice generation or outbound voice calling. Excluded to maintain privacy and data efficiency. | **Won't Have** |
| **FR-21** | **Invasive Background Device Surveillance** | Continuous tracking of background keystrokes, GPS, or ambient microphone audio. Strictly barred for user trust and privacy. | **Won't Have** |

---

## 4. User Stories

### US-01: Proactive Early Detection (The Student / Professional)
* **As a** university student or working professional whose well-being has been steadily declining over two weeks,  
* **I want** OurPadi to recognize the downward trend in my weekly WHO-5 score and suggest preventive CBT exercises,  
* **So that** I correct my mental fatigue before it spirals into severe burnout or clinical depression.

### US-02: Acute 3:00 AM Panic Reset & Somatic Exercises (The Remote Freelancer)
* **As a** nocturnal gig copywriter paralyzed by panic during an urgent client delivery,  
* **I want to** tap `[Calm My Panic]` and follow paced somatic breathing, sensory grounding, or listen to calming ASMR soundscapes,  
* **So that** my heart rate normalizes and I can complete my work milestone without losing client income.

### US-03: Workday Rescue & Deadline Salvage
* **As an** overwhelmed user facing an impending work deadline,  
* **I want** the app to break my chaotic assignment into structured 15-minute focus intervals,  
* **So that** I overcome task paralysis, submit the deliverable on time, and protect my livelihood.

### US-04: Peer Community Support & Shared Lived Experience
* **As an** individual recovering from addiction, parental abuse, or severe student stress,  
* **I want to** tap the Communities tab on my navigation bar and connect anonymously with others in my specific support group,  
* **So that** I overcome isolation, gain practical coping advice, and know I am not alone.

### US-05: Daily Motivational Habits & Journaling
* **As an** individual working on daily emotional stability,  
* **I want to** check off my daily motivational checklist, log my mood, and write in my private journal,  
* **So that** I maintain positive daily momentum, express hidden thoughts safely, and cultivate gratitude.

### US-06: Mental Health Resource Exploration
* **As a** user seeking to understand my trauma, anxiety, or panic triggers,  
* **I want** quick access to an educational mental health resource library within the app,  
* **So that** I learn evidence-based coping strategies and psychoeducational insights at my own pace.

### US-07: Clinician Oversight & Remote Monitoring (The Therapist)
* **As a** licensed clinical counselor monitoring a caseload on the FriendnPal RPM Dashboard,  
* **I want to** see real-time alerts when a patient's PHQ-9 or distress score spikes into the critical threshold,  
* **So that** I can review their longitudinal history and proactively intervene before emergency hospitalization is required.

### US-08: Emergency Crisis Gateway
* **As a** user in acute suicidal distress or profound emotional crisis,  
* **I want** the app to recognize my emergency and immediately present direct tap-to-connect links to an on-call human specialist,  
* **So that** I receive compassionate, professional human help rather than a generic automated rejection.

### US-09: Discreet Stigma-Free Billing
* **As a** Nigerian user living with family or sharing a bank account,  
* **I want** subscription charges to appear under a neutral business name ("FNP Services"),  
* **So that** my privacy is preserved and no one snooping on my bank alerts knows I use a mental health service.

---

## 5. Explicit Out-of-Scope List (This Build)

1. **No 32 Languages:** The platform NLP engine will support **only standard Nigerian English and Nigerian Pidgin English**.
2. **No AI Voice Synthesis or Outbound Calling:** All interaction is text-, card-, and audio-stream-driven (pre-recorded ASMR) to ensure privacy in shared spaces and minimal data consumption.
3. **No Invasive Device Surveillance:** Zero background keystroke tracking, ambient listening, or GPS telemetry. All health data is voluntarily provided by users in-app.
4. **No Bundled Human Therapy in the 5,000 NGN Tier:** The 5,000 NGN monthly subscription covers **unlimited AI companion triage, predictive assessments, communities, checklists, ASMR, resource library, and self-guided CBT only**. Human therapist sessions are billed pay-per-session (7,500 – 15,000 NGN).
5. **No Medical Prescriptions or Clinical Pharmacy:** FriendnPal is an RPM and digital triage platform; it will not prescribe pharmaceutical drugs or provide formal psychiatric medication management.
6. **No Live Mid-Chat Counselor Hijacking:** The bot will not execute multi-agent live chat switching inside an active bot thread. Crisis handoffs are delivered via direct emergency WhatsApp links and hotline cards. [Founder decision]
7. **No Autonomous Mode-Guessing:** Initial triage routing between emotional grounding and deadline rescue is strictly driven by explicit user button taps (`[Calm My Panic]` vs `[Rescue My Deadline]`). [Founder decision]

---

## 6. Founder Decisions Log

| # | Question | Decision | Applies to | Date |
| :--- | :--- | :--- | :--- | :--- |
| **FD-01** | How should the emergency counselor handoff function during a 3:00 AM crisis? | **Option B (Direct Emergency Link & Hotline):** The system immediately serves a crisis response card with a verified tap-to-chat WhatsApp link (`wa.me/...`) and phone hotline for an on-call counselor. | **FR-05** | 15 Sep 2026 |
| **FD-02** | How should the system distinguish between everyday venting and a life-threatening crisis? | **Option C (Hybrid Rule Engine + Direct Confirmation):** Immediate crisis escalation on explicit danger keywords; for ambiguous high distress, the system asks a direct confirmation question (*"Are you thinking about hurting yourself right now?"*) before routing. | **FR-04, FR-05** | 15 Sep 2026 |
| **FD-03** | How should the system determine whether to run emotional grounding vs. workday rescue? | **Option A (One-Tap Menu Buttons):** The interface presents two explicit quick-tap buttons: `[Calm My Panic]` vs. `[Rescue My Deadline]`, eliminating ambiguous NLP guessing. | **FR-02, FR-06** | 15 Sep 2026 |
| **FD-04** | What is the production architecture and client platform? | **Dual-Platform RPM:** The patient client is the **OurPadi mobile app** (live on iOS App Store & Android v2.1.0) featuring communities, checklists, mindfulness/ASMR, and journals; the clinical oversight portal is the **FriendnPal RPM Dashboard**; WhatsApp serves as an auxiliary low-bandwidth triage gateway. | **FR-01, FR-07** | 15 Sep 2026 |
| **FD-05** | What is the target user scope? | **Broad Platform with Beachhead Testing:** OurPadi serves anyone with mental health challenges under a proactive RPM framework (Prediction $\rightarrow$ Prevention $\rightarrow$ Proactive Intervention), using high-stress remote gig workers as the primary validation beachhead. | **PRD Section 2** | 15 Sep 2026 |

---

## 7. Unclear or Missing Information

*None.* All core functional specifications, architecture boundaries, and platform scopes have been formally resolved and aligned with the live OurPadi mobile app and FriendnPal RPM Dashboard.
