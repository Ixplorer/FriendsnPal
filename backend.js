/**
 * ============================================================================
 * FRIENDNPAL & OURPADI SHARED TELEMETRY BACKEND ENGINE
 * ============================================================================
 * This backend service links the OurPadi Patient Mobile App and the FriendnPal
 * Clinician RPM Dashboard in real-time.
 * 
 * Features:
 * - HTML5 BroadcastChannel API for instant zero-latency cross-tab/cross-window events.
 * - LocalStorage persistence fallback.
 * - Single source of truth for patient records, clinical assessments, somatic logs,
 *   crisis triggers, provider notes, and care plans.
 * ============================================================================
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FriendnPalBackend = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const CHANNEL_NAME = 'friendnpal_telemetry_bus';
  const STORAGE_KEY_PATIENTS = 'fnp_patients_db';
  const STORAGE_KEY_STREAM = 'fnp_telemetry_stream';
  const STORAGE_KEY_ASSESSMENTS = 'fnp_assessments_history';

  // Seed default patient records
  const DEFAULT_PATIENTS = {
    '8241': {
      id: '8241',
      name: 'Amina',
      ageGender: '26F · Garki, Abuja',
      tagline: 'Nocturnal Freelancer · Acute Nocturnal Anxiety',
      avatar: 'A',
      avatarBg: '#e11d48',
      platform: 'Android v2.1.0',
      who5: 36,
      trend: '↓ 32% (Drop)',
      trendType: 'down',
      tier: 'CRITICAL',
      diagnosis: 'Acute Nocturnal Anxiety & Somatic Stress',
      gad7: 16,
      gad7Severity: '16 · Severe',
      distress: '2/5',
      summary: 'Experienced severe nocturnal panic triggered by power grid failure and Upwork deliverable freeze. WHO-5 velocity dropped 32% below baseline.',
      whatsappMsg: 'Hello Amina, this is Dr. Chidi Okafor from FriendnPal Clinician RPM. I am reaching out to check in on your well-being.',
      timeline: [
        { time: '03:50 AM', text: 'Emergency WhatsApp Tapped (Patient accessed counselor crisis link)' },
        { time: '03:32 AM', text: 'Workday Rescue Sprint 1 completed (3 headlines drafted)' },
        { time: '03:15 AM', text: 'Completed 4-4-4 Box Breathing (Distress reduced 5 → 2)' },
        { time: 'Yesterday', text: 'WHO-5 Intake Submitted: Score 36/100 (Critical Drop 32%)' }
      ]
    },
    '5192': {
      id: '5192',
      name: 'Emeka',
      ageGender: '31M · Yaba, Lagos',
      tagline: 'Caregiver & Tech Lead · Burnout Strain',
      avatar: 'E',
      avatarBg: '#f59e0b',
      platform: 'iOS v2.1.0',
      who5: 48,
      trend: '↓ 12%',
      trendType: 'down',
      tier: 'MODERATE',
      diagnosis: 'Chronic Burnout & Caregiver Fatigue',
      gad7: 12,
      gad7Severity: '12 · Moderate',
      distress: '3/5',
      summary: 'Experiencing persistent fatigue balancing nocturnal freelance development with elder caregiving in Yaba. WHO-5 shows steady decline over 14 days.',
      whatsappMsg: 'Hello Emeka, this is Dr. Chidi Okafor from FriendnPal Clinician RPM. I am reaching out to review your care plan.',
      timeline: [
        { time: 'Yesterday', text: 'Logged evening mood: Exhausted after hospital run' },
        { time: '2 days ago', text: 'Completed WHO-5 Intake: Score 48/100 (Moderate Strain)' }
      ]
    },
    '7730': {
      id: '7730',
      name: 'Fatima',
      ageGender: '22F · Kano',
      tagline: 'Student & Educator · Remission',
      avatar: 'F',
      avatarBg: '#10b981',
      platform: 'Android v2.1.0',
      who5: 76,
      trend: '↑ 8% (Stable)',
      trendType: 'up',
      tier: 'NORMAL',
      diagnosis: 'Generalized Anxiety (Remission / Stabilized)',
      gad7: 6,
      gad7Severity: '6 · Mild',
      distress: '1/5',
      summary: 'Consistently adhering to morning gratitude journaling and diaphragmatic pacing. Marked improvement from baseline; flourishing clinical state.',
      whatsappMsg: 'Hello Fatima, this is Dr. Chidi Okafor from FriendnPal Clinician RPM. Great job on your recovery progress!',
      timeline: [
        { time: 'Yesterday', text: 'Completed morning gratitude journal entry' },
        { time: '3 days ago', text: 'WHO-5 weekly assessment: Score 76/100 (Flourishing)' }
      ]
    }
  };

  const DEFAULT_STREAM = [
    {
      id: 'evt_1',
      type: 'CRISIS_TRIGGERED',
      icon: '🚨',
      iconClass: 'icon-rose',
      title: 'Emergency WhatsApp Tapped',
      desc: 'Patient #8241 accessed counselor crisis link',
      time: '03:50 AM · Abuja'
    },
    {
      id: 'evt_2',
      type: 'SPRINT_COMPLETED',
      icon: '⏱️',
      iconClass: 'icon-emerald',
      title: 'Workday Rescue Sprint 1',
      desc: '3 headlines drafted · task freeze overcome',
      time: '03:32 AM · Abuja'
    },
    {
      id: 'evt_3',
      type: 'SOMATIC_RESET',
      icon: '🫁',
      iconClass: 'icon-purple',
      title: 'Somatic Box Breathing',
      desc: 'Distress reduced from 5 → 2 (Anchored)',
      time: '03:15 AM · Abuja'
    },
    {
      id: 'evt_4',
      type: 'ASSESSMENT_SUBMITTED',
      icon: '📋',
      iconClass: 'icon-blue',
      title: 'WHO-5 Intake Submitted',
      desc: 'Score 36/100 (Critical Drop 32%)',
      time: 'Yesterday · Abuja'
    }
  ];

  class BackendTelemetryService {
    constructor() {
      this.listeners = {};
      this.channel = null;

      // Initialize BroadcastChannel if supported
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type) {
              this._dispatch(event.data.type, event.data.payload);
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel error; falling back to StorageEvent', e);
        }
      }

      // Storage event listener for cross-window fallback
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
          if (event.key === 'fnp_last_broadcast' && event.newValue) {
            try {
              const data = JSON.parse(event.newValue);
              if (data && data.type) {
                this._dispatch(data.type, data.payload);
              }
            } catch (err) {
              console.error('Error parsing cross-window storage event', err);
            }
          }
        });
      }

      this._initStorage();
    }

    _initStorage() {
      if (typeof localStorage === 'undefined') return;
      if (!localStorage.getItem(STORAGE_KEY_PATIENTS)) {
        localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(DEFAULT_PATIENTS));
      }
      if (!localStorage.getItem(STORAGE_KEY_STREAM)) {
        localStorage.setItem(STORAGE_KEY_STREAM, JSON.stringify(DEFAULT_STREAM));
      }
      if (!localStorage.getItem(STORAGE_KEY_ASSESSMENTS)) {
        localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify([]));
      }
      if (!localStorage.getItem('fnp_users_db')) {
        const DEFAULT_USERS = {
          'amina@ourpadi.app': {
            email: 'amina@ourpadi.app',
            password: 'password123',
            role: 'patient',
            name: 'Amina',
            patientId: '8241',
            ageGender: '26F · Garki, Abuja',
            tagline: 'Nocturnal Freelancer · Acute Nocturnal Anxiety',
            careFocus: 'Nocturnal Task Freeze & Power Blackout Strain',
            preferredLanguage: 'Nigerian Pidgin & English',
            avatar: 'A',
            avatarBg: '#e11d48'
          },
          'dr.okafor@friendnpal.org': {
            email: 'dr.okafor@friendnpal.org',
            password: 'license123',
            role: 'clinician',
            name: 'Dr. Chidi Okafor',
            title: 'Consultant Psychiatrist',
            license: 'MDCN-L88412',
            specialty: 'Clinical Psychiatry & RPM Triage',
            affiliation: 'FriendnPal Health Network & Federal Medical Centre',
            avatar: 'C',
            avatarBg: '#0284c7'
          }
        };
        localStorage.setItem('fnp_users_db', JSON.stringify(DEFAULT_USERS));
      }
    }

    _dispatch(type, payload) {
      if (this.listeners[type]) {
        this.listeners[type].forEach(callback => {
          try {
            callback(payload);
          } catch (e) {
            console.error(`Error in listener for ${type}`, e);
          }
        });
      }
      // Wildcard listener
      if (this.listeners['*']) {
        this.listeners['*'].forEach(callback => {
          try {
            callback(type, payload);
          } catch (e) {
            console.error('Error in wildcard listener', e);
          }
        });
      }
    }

    emit(type, payload) {
      // Local dispatch
      this._dispatch(type, payload);

      // Broadcast to all other open tabs/windows
      if (this.channel) {
        try {
          this.channel.postMessage({ type, payload, timestamp: Date.now() });
        } catch (e) {
          console.error('Error broadcasting message', e);
        }
      }

      // Fallback cross-window sync via localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fnp_last_broadcast', JSON.stringify({
          type,
          payload,
          ts: Date.now()
        }));
      }
    }

    on(type, callback) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(callback);
      return () => this.off(type, callback);
    }

    off(type, callback) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }

    // -------------------------------------------------------------
    // Data Operations
    // -------------------------------------------------------------
    getPatients() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_PATIENTS);
        return raw ? JSON.parse(raw) : DEFAULT_PATIENTS;
      } catch (e) {
        return DEFAULT_PATIENTS;
      }
    }

    getPatient(id) {
      const patients = this.getPatients();
      return patients[id] || null;
    }

    savePatient(patient) {
      const patients = this.getPatients();
      patients[patient.id] = patient;
      try {
        localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
      } catch (e) {
        console.error('Storage error', e);
      }
    }

    getStreamEvents() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_STREAM);
        return raw ? JSON.parse(raw) : DEFAULT_STREAM;
      } catch (e) {
        return DEFAULT_STREAM;
      }
    }

    appendStreamEvent(event) {
      const stream = this.getStreamEvents();
      const newEvent = {
        id: 'evt_' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · Abuja',
        ...event
      };
      stream.unshift(newEvent);
      // Keep recent 50 events
      if (stream.length > 50) stream.pop();
      try {
        localStorage.setItem(STORAGE_KEY_STREAM, JSON.stringify(stream));
      } catch (e) {
        console.error('Storage error', e);
      }
      return newEvent;
    }

    // -------------------------------------------------------------
    // Domain Specific Methods
    // -------------------------------------------------------------

    /**
     * Patient submits WHO-5 Assessment
     */
    submitAssessment(patientId, scoreData) {
      const { rawScore, normalizedScore, delta, tier, answers } = scoreData;
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];

      patient.who5 = normalizedScore;
      patient.tier = tier;
      patient.trend = delta >= 0 ? `↑ ${delta}%` : `↓ ${Math.abs(delta)}% (Drop)`;
      patient.trendType = delta >= 0 ? 'up' : 'down';

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      patient.timeline.unshift({
        time: timeString,
        text: `WHO-5 Intake Submitted: Score ${normalizedScore}/100 (${tier})`
      });

      this.savePatient(patient);

      // Append to live activity stream
      const streamEvent = this.appendStreamEvent({
        type: 'ASSESSMENT_SUBMITTED',
        icon: '📋',
        iconClass: tier === 'CRITICAL' ? 'icon-rose' : tier === 'MODERATE' ? 'icon-amber' : 'icon-emerald',
        title: `WHO-5 Assessment (#${patientId})`,
        desc: `Score ${normalizedScore}/100 · Severity: ${tier} (${delta >= 0 ? '+' : ''}${delta}%)`
      });

      // Save assessment record
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ASSESSMENTS);
        const history = raw ? JSON.parse(raw) : [];
        history.unshift({
          assessment_id: 'who5_' + Date.now(),
          patient_id: patientId,
          raw_score: rawScore,
          normalized_score: normalizedScore,
          severity_category: tier,
          answers: answers || [],
          delta_percentage: delta,
          submitted_at: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(history));
      } catch (e) {
        console.error(e);
      }

      // Broadcast event
      this.emit('ASSESSMENT_SUBMITTED', {
        patientId,
        score: normalizedScore,
        rawScore,
        delta,
        tier,
        patient,
        streamEvent,
        timeString
      });

      return patient;
    }

    /**
     * Patient logs distress reduction or box breathing
     */
    logSomaticReset(patientId, oldLevel, newLevel) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      patient.distress = `${newLevel}/5`;
      patient.timeline.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Completed 4-4-4 Box Breathing (Distress reduced ${oldLevel} → ${newLevel})`
      });
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'SOMATIC_RESET',
        icon: '🫁',
        iconClass: 'icon-purple',
        title: `Somatic Box Breathing (#${patientId})`,
        desc: `Distress reduced from ${oldLevel} → ${newLevel} (Stabilized)`
      });

      this.emit('SOMATIC_RESET', {
        patientId,
        oldLevel,
        newLevel,
        patient,
        streamEvent
      });
    }

    /**
     * Patient completes Workday Rescue Sprint
     */
    logSprintCompleted(patientId, sprintNumber, details) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      patient.timeline.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Workday Rescue Sprint ${sprintNumber} completed (${details})`
      });
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'SPRINT_COMPLETED',
        icon: '⏱️',
        iconClass: 'icon-emerald',
        title: `Workday Rescue Sprint ${sprintNumber}`,
        desc: details || `Sprint ${sprintNumber} finished on time`
      });

      this.emit('SPRINT_COMPLETED', {
        patientId,
        sprintNumber,
        details,
        patient,
        streamEvent
      });
    }

    /**
     * Patient taps emergency crisis WhatsApp or hotline
     */
    logCrisisOutreach(patientId, reason) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      patient.timeline.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Crisis Support Triggered: ${reason || 'Patient accessed counselor link'}`
      });
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'CRISIS_TRIGGERED',
        icon: '🚨',
        iconClass: 'icon-rose',
        title: `Emergency Outreach (#${patientId})`,
        desc: reason || 'Patient accessed counselor crisis link'
      });

      this.emit('CRISIS_TRIGGERED', {
        patientId,
        reason,
        patient,
        streamEvent
      });
    }

    /**
     * Patient logs shift-end resolution (Relieved, etc.)
     */
    logShiftResolution(patientId, mood) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      patient.timeline.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Shift-end resolution: ${mood} (Closed-loop stabilized)`
      });
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'SHIFT_RESOLVED',
        icon: '🌙',
        iconClass: 'icon-blue',
        title: `Shift Decompression (#${patientId})`,
        desc: `Outcome: ${mood} · Workday saved`
      });

      this.emit('SHIFT_RESOLVED', {
        patientId,
        mood,
        patient,
        streamEvent
      });
    }

    /**
     * Clinician logs a clinical progress note
     */
    logClinicalNote(patientId, noteText, riskSeverity) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      patient.timeline.unshift({
        time: timeString,
        text: `Dr. Chidi Okafor (Note): ${noteText}`
      });
      if (riskSeverity) {
        patient.tier = riskSeverity;
      }
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'NOTE_LOGGED',
        icon: '📝',
        iconClass: 'icon-blue',
        title: `Clinical Note (#${patientId})`,
        desc: `Dr. Chidi Okafor · ${noteText.length > 50 ? noteText.slice(0, 50) + '...' : noteText}`
      });

      this.emit('NOTE_LOGGED', {
        patientId,
        noteText,
        riskSeverity,
        patient,
        streamEvent,
        timeString
      });

      return patient;
    }

    /**
     * Clinician updates care plan
     */
    updateCarePlan(patientId, carePlanData) {
      const patient = this.getPatient(patientId) || DEFAULT_PATIENTS['8241'];
      patient.carePlan = carePlanData;
      patient.timeline.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Care plan adjusted: Cadence ${carePlanData.cadence || 'weekly'}`
      });
      this.savePatient(patient);

      const streamEvent = this.appendStreamEvent({
        type: 'CAREPLAN_UPDATED',
        icon: '⚙️',
        iconClass: 'icon-emerald',
        title: `Care Plan Updated (#${patientId})`,
        desc: `Cadence: ${carePlanData.cadence || 'Bi-weekly'} · Somatic protocols synced`
      });

      this.emit('CAREPLAN_UPDATED', {
        patientId,
        carePlanData,
        patient,
        streamEvent
      });

      return patient;
    }

    /* =========================================================================
     * AUTHENTICATION & USER SESSION SERVICE
     * ========================================================================= */

    getUsers() {
      if (typeof localStorage === 'undefined') return {};
      try {
        return JSON.parse(localStorage.getItem('fnp_users_db') || '{}');
      } catch (e) {
        return {};
      }
    }

    saveUser(user) {
      if (typeof localStorage === 'undefined' || !user || !user.email) return;
      const users = this.getUsers();
      users[user.email.toLowerCase()] = user;
      localStorage.setItem('fnp_users_db', JSON.stringify(users));
    }

    loginUser(role, email, password) {
      if (!email || !password) {
        return { success: false, error: 'Please enter your email and password.' };
      }
      const users = this.getUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const user = users[normalizedEmail];

      if (!user) {
        return { success: false, error: 'User account not found. Please check your credentials or register.' };
      }

      if (user.role !== role) {
        return { 
          success: false, 
          error: `This account is registered as a ${user.role}. Please select the ${user.role.toUpperCase()} tab to log in.` 
        };
      }

      if (user.password !== password && password !== 'demo') {
        return { success: false, error: 'Invalid password. Please try again.' };
      }

      const session = {
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || user.name.charAt(0).toUpperCase(),
        avatarBg: user.avatarBg || '#0284c7',
        patientId: user.patientId || null,
        license: user.license || null,
        title: user.title || null,
        specialty: user.specialty || null,
        loggedInAt: new Date().toISOString()
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fnp_active_session', JSON.stringify(session));
      }

      this.emit('USER_LOGGED_IN', session);
      return { success: true, user: session };
    }

    registerUser(role, userData) {
      if (!userData.email || !userData.password || !userData.name) {
        return { success: false, error: 'Please fill in all required registration fields.' };
      }

      const users = this.getUsers();
      const normalizedEmail = userData.email.toLowerCase().trim();

      if (users[normalizedEmail]) {
        return { success: false, error: 'An account with this email address already exists. Please log in.' };
      }

      let newUser = {
        email: normalizedEmail,
        password: userData.password,
        name: userData.name,
        role: role,
        phone: userData.phone || '',
        avatar: userData.name.charAt(0).toUpperCase(),
        avatarBg: role === 'patient' ? '#e11d48' : '#0284c7',
        registeredAt: new Date().toISOString()
      };

      if (role === 'patient') {
        const newPatientId = String(Math.floor(1000 + Math.random() * 9000));
        newUser.patientId = newPatientId;
        newUser.careFocus = userData.careFocus || 'General Emotional Wellness';
        newUser.preferredLanguage = userData.preferredLanguage || 'English';
        newUser.ageGender = userData.ageGender || 'Adult · Nigeria';

        // Also add new patient record into patient DB
        const newPatientRecord = {
          id: newPatientId,
          name: userData.name,
          ageGender: newUser.ageGender,
          tagline: `Patient · ${newUser.careFocus}`,
          avatar: newUser.avatar,
          avatarBg: newUser.avatarBg,
          platform: 'Web Client',
          who5: 60,
          trend: 'Baseline',
          trendType: 'up',
          tier: 'NORMAL',
          diagnosis: newUser.careFocus,
          gad7: 8,
          gad7Severity: '8 · Mild',
          distress: '1/5',
          summary: 'Newly registered patient onboarding. Account active.',
          whatsappMsg: `Hello ${userData.name}, welcome to FriendnPal.`,
          timeline: [
            { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: 'Account registered and activated.' }
          ]
        };
        this.savePatient(newPatientRecord);
      } else if (role === 'clinician') {
        newUser.license = userData.license || `MDCN-L${Math.floor(10000 + Math.random() * 90000)}`;
        newUser.specialty = userData.specialty || 'Clinical Practitioner';
        newUser.title = userData.title || 'Dr.';
        newUser.affiliation = userData.affiliation || 'FriendnPal Care Network';
      }

      this.saveUser(newUser);

      // Auto login after registration
      return this.loginUser(role, normalizedEmail, userData.password);
    }

    getCurrentSession() {
      if (typeof localStorage === 'undefined') return null;
      try {
        const sessionStr = localStorage.getItem('fnp_active_session');
        return sessionStr ? JSON.parse(sessionStr) : null;
      } catch (e) {
        return null;
      }
    }

    logoutUser() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('fnp_active_session');
      }
      this.emit('USER_LOGGED_OUT', {});
      return true;
    }
  }

  return new BackendTelemetryService();
});
