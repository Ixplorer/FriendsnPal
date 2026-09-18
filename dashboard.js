/**
 * ============================================================================
 * FRIENDNPAL CLINICIAN RPM DASHBOARD ENGINE
 * ============================================================================
 * Handles remote patient monitoring, longitudinal trajectory charting,
 * caseload risk triage, provider progress notes, and real-time bi-directional
 * telemetry synchronization with the OurPadi mobile patient companion app.
 * ============================================================================
 */

(function() {
  'use strict';

  // --- AUDIO FEEDBACK ENGINE ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playChime(freq = 659.25, type = 'sine', duration = 0.3) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio policy ignore
      }
    }
  }
  const sound = new SoundEngine();

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, duration = 3000) {
    let toast = document.getElementById('dashboard-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dashboard-toast';
      toast.className = 'dashboard-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- LOCAL STATE ---
  let activeRpmPatientId = '8241';

  // Helper to load patient from backend or defaults
  function getPatient(id) {
    if (typeof FriendnPalBackend !== 'undefined') {
      return FriendnPalBackend.getPatient(id);
    }
    return null;
  }

  // ==========================================================
  // PATIENT INSPECTION & DETAIL UPDATES
  // ==========================================================
  function inspectRpmPatient(patientId) {
    const patient = getPatient(patientId);
    if (!patient) return;
    activeRpmPatientId = patientId;

    // 1. Update Hero Spotlight Card
    const heroAvatar = document.querySelector('.hero-avatar');
    const heroName = document.querySelector('.hero-name');
    const heroMeta = document.querySelector('.hero-meta');
    const heroSummary = document.querySelector('.hero-summary');
    const heroChip = document.querySelector('.hero-chip');
    const heroWho5 = document.querySelector('.hero-metrics-pill-row .hero-pill:nth-of-type(1) .pill-v');
    const heroStatus = document.querySelector('.hero-metrics-pill-row .hero-pill:nth-of-type(2) .pill-v');
    const heroDistress = document.querySelector('.hero-metrics-pill-row .hero-pill:nth-of-type(3) .pill-v');
    const heroWhatsApp = document.getElementById('btn-hero-whatsapp');

    if (heroAvatar) {
      heroAvatar.textContent = patient.avatar || 'P';
      heroAvatar.style.background = patient.avatarBg || '#2563eb';
    }
    if (heroName) heroName.textContent = `${patient.name} (#${patient.id})`;
    if (heroMeta) heroMeta.textContent = `${patient.ageGender} · ${patient.tagline || ''}`;
    if (heroSummary) heroSummary.textContent = patient.summary;
    if (heroChip) {
      heroChip.textContent = `${patient.tier} ALERT · ${patient.tier === 'CRITICAL' ? 'IMMEDIATE OUTREACH' : patient.tier === 'MODERATE' ? 'MONITORING' : 'STABILIZED'}`;
    }
    if (heroWho5) heroWho5.textContent = `${patient.who5}/100`;
    if (heroStatus) {
      heroStatus.textContent = patient.tier;
      heroStatus.style.color = patient.tier === 'CRITICAL' ? '#fecdd3' : patient.tier === 'MODERATE' ? '#fed7aa' : '#bbf7d0';
    }
    if (heroDistress) heroDistress.textContent = patient.distress || '2/5';
    if (heroWhatsApp) {
      heroWhatsApp.href = `https://wa.me/2348003743637?text=${encodeURIComponent(patient.whatsappMsg || 'Hello, this is Dr. Chidi Okafor from FriendnPal Clinician RPM.')}`;
    }

    // 2. Update Chart Legend Pills
    const legendWho5 = document.querySelector('.legend-who5');
    const legendGad7 = document.querySelector('.legend-gad7');
    const legendDistress = document.querySelector('.legend-distress');

    if (legendWho5) {
      legendWho5.innerHTML = `<span class="legend-dot" style="background: #0284c7;"></span>WHO-5 Index (Patient #${patient.id}: <strong>${patient.who5}</strong>)`;
    }
    if (legendGad7) {
      legendGad7.innerHTML = `<span class="legend-dot" style="background: #f43f5e;"></span>GAD-7 Anxiety (Score: <strong>${patient.gad7Severity || patient.gad7}</strong>)`;
    }
    if (legendDistress) {
      legendDistress.innerHTML = `<span class="legend-dot" style="background: #8b5cf6;"></span>Somatic Distress (Rating: <strong>${patient.distress || '2/5'}</strong>)`;
    }

    // 3. Update Dynamic SVG Chart Curves & Tooltip
    const who5Stroke = document.getElementById('svg-who5-stroke');
    const who5Area = document.getElementById('svg-who5-area');
    const who5PulsingNode = document.querySelector('.pulsing-node');
    const gad7Stroke = document.getElementById('svg-gad7-stroke');
    const gad7Area = document.getElementById('svg-gad7-area');
    const distressStroke = document.getElementById('svg-distress-stroke');

    const who5Y = Math.round(230 - (patient.who5 / 100) * 190);
    const gad7Y = Math.round(230 - (patient.gad7 / 21) * 190);
    const distY = patient.distress && patient.distress.startsWith('5') ? 60 : (patient.distress && patient.distress.startsWith('3') ? 140 : 195);

    if (who5Stroke && who5Area) {
      who5Stroke.setAttribute('d', `M 60,65 C 150,70 230,85 330,110 C 430,135 550,175 700,${who5Y}`);
      who5Area.setAttribute('d', `M 60,65 C 150,70 230,85 330,110 C 430,135 550,175 700,${who5Y} L 700,230 L 60,230 Z`);
      if (who5PulsingNode) who5PulsingNode.setAttribute('cy', who5Y);
    }
    if (gad7Stroke && gad7Area) {
      gad7Stroke.setAttribute('d', `M 60,195 C 160,185 240,165 350,140 C 460,115 580,75 700,${gad7Y}`);
      gad7Area.setAttribute('d', `M 60,195 C 160,185 240,165 350,140 C 460,115 580,75 700,${gad7Y} L 700,230 L 60,230 Z`);
    }
    if (distressStroke) {
      distressStroke.setAttribute('d', `M 60,140 Q 200,130 350,160 T 700,${distY}`);
    }

    // Tooltip update
    const tooltipH = document.querySelector('.svg-tooltip-group text:nth-of-type(1)');
    const tooltipT1 = document.querySelector('.svg-tooltip-group text:nth-of-type(2)');
    const tooltipT2 = document.querySelector('.svg-tooltip-group text:nth-of-type(3)');
    if (tooltipH) tooltipH.textContent = `Patient #${patient.id} (Now)`;
    if (tooltipT1) tooltipT1.textContent = `● WHO-5: ${patient.who5}/100`;
    if (tooltipT2) tooltipT2.textContent = `● GAD-7: ${patient.gad7} (${patient.tier})`;

    // 4. Update Modal labels
    const notePatientName = document.getElementById('note-patient-name');
    const carePatientName = document.getElementById('care-patient-name');
    if (notePatientName) notePatientName.textContent = `#${patient.id} (${patient.name}, ${patient.ageGender})`;
    if (carePatientName) carePatientName.textContent = `#${patient.id} (${patient.name}, ${patient.ageGender})`;

    // 5. Update Table Row Selection
    const rpmTableRows = document.querySelectorAll('#rpm-patient-tbody tr');
    rpmTableRows.forEach(r => {
      r.classList.remove('selected-row');
      if (r.getAttribute('data-patient') === patientId) {
        r.classList.add('selected-row');
      }
    });

    sound.playChime(659.25, 'sine', 0.15);
    showToast(`Loaded Patient #${patient.id} (${patient.name}) clinical chart`);
  }

  // Row selection in table
  const rpmTableRows = document.querySelectorAll('#rpm-patient-tbody tr');
  rpmTableRows.forEach(row => {
    row.addEventListener('click', () => {
      const pid = row.getAttribute('data-patient');
      inspectRpmPatient(pid);
    });
  });

  // Table action buttons (Inspect & Note)
  document.querySelectorAll('.btn-inspect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-pid');
      inspectRpmPatient(pid);
    });
  });

  document.querySelectorAll('.btn-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-pid');
      inspectRpmPatient(pid);
      openClinicianNoteModal();
    });
  });

  // Timeframe selector tabs (Today, Weekly, Monthly, Yearly)
  const timeframeBtns = document.querySelectorAll('.rpm-timeframe-tabs .rpm-time-btn');
  timeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const timeMode = btn.getAttribute('data-time') || 'monthly';

      const columns = document.querySelectorAll('.rpm-vibrant-svg rect[fill*="barGradient"]');
      const heights = {
        today: [120, 140, 180, 110, 90],
        weekly: [90, 160, 140, 120, 100],
        monthly: [150, 170, 135, 105, 85],
        yearly: [110, 130, 155, 175, 140]
      }[timeMode] || [150, 170, 135, 105, 85];

      columns.forEach((col, idx) => {
        if (heights[idx]) {
          const h = heights[idx];
          col.setAttribute('height', h);
          col.setAttribute('y', 230 - h);
        }
      });

      sound.playChime(659.25, 'sine', 0.2);
      showToast(`Trajectory timeframe switched to ${btn.textContent}`);
    });
  });

  // Cohort Filter Tabs (All, Critical, Moderate, Normal)
  const cohortFilterBtns = document.querySelectorAll('.rpm-cohort-tabs .rpm-filter-btn');
  cohortFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cohortFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter') || 'all';

      rpmTableRows.forEach(row => {
        const badge = row.querySelector('.risk-badge-bright');
        const badgeText = badge ? badge.textContent.toLowerCase() : '';
        if (filter === 'all') {
          row.style.display = '';
        } else if (filter === 'critical' && badgeText.includes('critical')) {
          row.style.display = '';
        } else if (filter === 'moderate' && badgeText.includes('moderate')) {
          row.style.display = '';
        } else if (filter === 'normal' && badgeText.includes('normal')) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Global Search Filter in Topbar
  const rpmGlobalSearch = document.getElementById('rpm-global-search');
  if (rpmGlobalSearch) {
    rpmGlobalSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      rpmTableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });

    // Keyboard shortcut Ctrl + K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        rpmGlobalSearch.focus();
      }
    });
  }

  // Clinician Note Modal Controller
  const clinicianNoteModal = document.getElementById('clinician-note-modal');
  const btnCloseClinicianNoteModal = document.getElementById('btn-close-clinician-note-modal');
  const btnSaveClinicalNote = document.getElementById('btn-save-clinical-note');
  const clinicianNoteTextarea = document.getElementById('clinician-note-textarea');
  const clinicianRiskSelect = document.getElementById('clinician-risk-select');
  const btnTopbarLogNote = document.getElementById('btn-topbar-log-note');
  const btnStreamLogNote = document.getElementById('btn-stream-log-note');

  function openClinicianNoteModal() {
    if (clinicianNoteModal) clinicianNoteModal.classList.add('active');
  }
  function closeClinicianNoteModal() {
    if (clinicianNoteModal) clinicianNoteModal.classList.remove('active');
  }

  if (btnTopbarLogNote) btnTopbarLogNote.addEventListener('click', openClinicianNoteModal);
  if (btnStreamLogNote) btnStreamLogNote.addEventListener('click', openClinicianNoteModal);
  if (btnCloseClinicianNoteModal) btnCloseClinicianNoteModal.addEventListener('click', closeClinicianNoteModal);
  if (clinicianNoteModal) {
    clinicianNoteModal.addEventListener('click', (e) => {
      if (e.target === clinicianNoteModal) closeClinicianNoteModal();
    });
  }

  if (btnSaveClinicalNote && clinicianNoteTextarea) {
    btnSaveClinicalNote.addEventListener('click', () => {
      const text = clinicianNoteTextarea.value.trim();
      if (!text) {
        showToast('Please enter a clinical progress note');
        return;
      }
      const risk = clinicianRiskSelect ? clinicianRiskSelect.value : 'CRITICAL';

      // Save to Shared Backend
      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.logClinicalNote(activeRpmPatientId, text, risk);
      }

      sound.playChime(659.25, 'triangle', 0.4);
      showToast('Clinical progress note saved to patient record');
      clinicianNoteTextarea.value = '';
      closeClinicianNoteModal();
    });
  }

  // Care Plan Adjustment Modal Controller
  const carePlanModal = document.getElementById('care-plan-modal');
  const btnCloseCarePlanModal = document.getElementById('btn-close-care-plan-modal');
  const btnSaveCarePlan = document.getElementById('btn-save-care-plan');
  const careCadenceSelect = document.getElementById('care-cadence-select');
  const chkCareBox = document.getElementById('chk-care-box');
  const chkCareAsmr = document.getElementById('chk-care-asmr');
  const chkCareRescue = document.getElementById('chk-care-rescue');

  function openCarePlanModal() {
    if (carePlanModal) carePlanModal.classList.add('active');
  }
  function closeCarePlanModal() {
    if (carePlanModal) carePlanModal.classList.remove('active');
  }

  if (btnCloseCarePlanModal) btnCloseCarePlanModal.addEventListener('click', closeCarePlanModal);
  if (carePlanModal) {
    carePlanModal.addEventListener('click', (e) => {
      if (e.target === carePlanModal) closeCarePlanModal();
    });
  }

  if (btnSaveCarePlan) {
    btnSaveCarePlan.addEventListener('click', () => {
      const planData = {
        cadence: careCadenceSelect ? careCadenceSelect.value : 'biweekly',
        protocols: {
          boxBreathing: chkCareBox ? chkCareBox.checked : true,
          asmr: chkCareAsmr ? chkCareAsmr.checked : true,
          rescueSprints: chkCareRescue ? chkCareRescue.checked : true
        },
        updatedAt: new Date().toISOString()
      };

      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.updateCarePlan(activeRpmPatientId, planData);
      }

      sound.playChime(659.25, 'triangle', 0.4);
      showToast('Care plan synchronized to patient OurPadi app ✨');
      closeCarePlanModal();
    });
  }

  // Topbar and Subbar Quick Actions
  const btnSubbarShare = document.getElementById('btn-subbar-share');
  if (btnSubbarShare) {
    btnSubbarShare.addEventListener('click', () => {
      sound.playChime(783.99, 'triangle', 0.4);
      const auditPayload = {
        system: 'FriendnPal Remote Patient Monitoring (RPM)',
        clinician: 'Dr. Chidi Okafor, FWACP (License #48291)',
        exported_at: new Date().toISOString(),
        cohort_metrics: {
          total_enrolled: 48,
          critical_alerts: 3,
          moderate_strain: 11,
          avg_who5: document.getElementById('rpm-metric-avg')?.textContent || '54.2'
        },
        active_patient_record: getPatient(activeRpmPatientId)
      };

      const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FriendnPal_Clinical_Audit_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Clinical audit exported to FriendnPal_Clinical_Audit.json');
    });
  }

  const btnSubbarFilter = document.getElementById('btn-subbar-filter');
  if (btnSubbarFilter) {
    btnSubbarFilter.addEventListener('click', () => {
      const tableCard = document.querySelector('.rpm-cohort-table-card');
      if (tableCard) tableCard.scrollIntoView({ behavior: 'smooth' });
      showToast('Viewing patient cohort filter controls');
    });
  }

  const btnRpmRefresh = document.getElementById('btn-rpm-refresh');
  if (btnRpmRefresh) {
    btnRpmRefresh.addEventListener('click', () => {
      btnRpmRefresh.style.transition = 'transform 0.6s ease';
      btnRpmRefresh.style.transform = 'rotate(360deg)';
      setTimeout(() => { btnRpmRefresh.style.transform = 'none'; }, 600);
      sound.playChime(659.25, 'sine', 0.3);
      showToast('Telemetry synchronized with OurPadi network');
    });
  }

  const btnRpmAlerts = document.getElementById('btn-rpm-alerts');
  if (btnRpmAlerts) {
    btnRpmAlerts.addEventListener('click', () => {
      sound.playChime(523.25, 'triangle', 0.4);
      showToast('3 Active Critical Alerts: #8241 Amina (Drop >30%), #8241 Crisis WhatsApp, #5192 Moderate strain');
    });
  }

  // ==========================================================
  // REAL-TIME BACKEND EVENT LISTENERS (SYNC FROM PATIENT APP)
  // ==========================================================
  if (typeof FriendnPalBackend !== 'undefined') {
    // 1. Assessment submitted in OurPadi
    FriendnPalBackend.on('ASSESSMENT_SUBMITTED', (payload) => {
      const { patientId, score, delta, tier, patient, streamEvent } = payload;

      // Update row in table if it matches
      const rowScore = document.getElementById(`row-score-${patientId}`);
      const rowTrend = document.getElementById(`row-trend-${patientId}`);
      const rowBadge = document.getElementById(`row-badge-${patientId}`);

      if (rowScore) {
        rowScore.textContent = `${score} / 100`;
        rowScore.className = `score-text ${score <= 28 ? 'text-rose' : score <= 50 ? 'text-amber' : 'text-emerald'}`;
      }
      if (rowTrend) {
        rowTrend.textContent = `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% ${delta < -30 ? '(Drop)' : ''}`;
        rowTrend.className = `trend-text ${delta >= 0 ? 'text-emerald' : 'text-rose'}`;
      }
      if (rowBadge) {
        rowBadge.textContent = tier;
        rowBadge.className = `risk-badge-bright ${tier === 'CRITICAL' ? 'risk-crit' : tier === 'MODERATE' ? 'risk-mod' : 'risk-norm'}`;
      }

      // Update KPI tiles
      const rpmMetricAvg = document.getElementById('rpm-metric-avg');
      const rpmMetricCritical = document.getElementById('rpm-metric-critical');
      const rpmMetricModerate = document.getElementById('rpm-metric-moderate');

      if (rpmMetricAvg) {
        const baseTotal = 48 * 54.2;
        const newAvg = ((baseTotal - 36 + score) / 48).toFixed(1);
        rpmMetricAvg.textContent = newAvg;
      }
      if (rpmMetricCritical && rpmMetricModerate) {
        let critCount = tier === 'CRITICAL' ? 3 : 2;
        let modCount = tier === 'MODERATE' ? 11 : 10;
        rpmMetricCritical.textContent = critCount;
        rpmMetricModerate.textContent = modCount;
      }

      // Update Chart and Hero if this is the active patient
      if (activeRpmPatientId === patientId) {
        inspectRpmPatient(patientId);
      }

      // Prepend to Live Telemetry Stream
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>',
        iconClass: tier === 'CRITICAL' ? 'icon-rose' : tier === 'MODERATE' ? 'icon-amber' : 'icon-emerald',
        title: `WHO-5 Assessment (#${patientId})`,
        desc: `Score ${score}/100 · Severity: ${tier} (${delta >= 0 ? '+' : ''}${delta}%)`,
        time: payload.timeString || 'Just now'
      });

      sound.playChime(tier === 'CRITICAL' ? 349.23 : 659.25, 'triangle', 0.5);
      showToast(`⚡ Real-time Telemetry: Patient #${patientId} (${patient.name}) submitted WHO-5 assessment (${score}/100)`);
    });

    // 2. Emergency Crisis Outreach Triggered
    FriendnPalBackend.on('CRISIS_TRIGGERED', (payload) => {
      const { patientId, reason } = payload;
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        iconClass: 'icon-rose',
        title: `CRITICAL CRISIS ALERT (#${patientId})`,
        desc: reason || 'Patient triggered emergency counselor outreach',
        time: 'Just now'
      });

      sound.playChime(349.23, 'sawtooth', 0.6);
      showToast(`URGENT: Patient #${patientId} opened Emergency Crisis Hotline connection!`, 6000);
    });

    // 3. Somatic Box Breathing & Distress Reset
    FriendnPalBackend.on('SOMATIC_RESET', (payload) => {
      const { patientId, oldLevel, newLevel } = payload;
      if (activeRpmPatientId === patientId) {
        const heroDistress = document.querySelector('.hero-metrics-pill-row .hero-pill:nth-of-type(3) .pill-v');
        if (heroDistress) heroDistress.textContent = `${newLevel}/5`;
      }
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        iconClass: 'icon-purple',
        title: `Somatic Reset (#${patientId})`,
        desc: `Distress reduced from ${oldLevel} → ${newLevel} (Box Breathing)`,
        time: 'Just now'
      });
      showToast(`Somatic Telemetry: Patient #${patientId} stabilized distress (${oldLevel} → ${newLevel})`);
    });

    // 4. Sprint Completed
    FriendnPalBackend.on('SPRINT_COMPLETED', (payload) => {
      const { patientId, sprintNumber, details } = payload;
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        iconClass: 'icon-emerald',
        title: `Workday Rescue Sprint ${sprintNumber} (#${patientId})`,
        desc: details || 'Focus micro-task sprint finished',
        time: 'Just now'
      });
    });

    // 5. Shift Resolution
    FriendnPalBackend.on('SHIFT_RESOLVED', (payload) => {
      const { patientId, mood } = payload;
      const rowBadge = document.getElementById(`row-badge-${patientId}`);
      if (rowBadge) {
        rowBadge.textContent = 'STABILIZED';
        rowBadge.className = 'risk-badge-bright risk-norm';
      }
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        iconClass: 'icon-blue',
        title: `Shift Decompression (#${patientId})`,
        desc: `Shift ended: ${mood} · Closed-loop stabilized`,
        time: 'Just now'
      });
      showToast(`Telemetry: Patient #${patientId} resolved workday in state: ${mood}`);
    });

    // 6. Clinical Note Logged
    FriendnPalBackend.on('NOTE_LOGGED', (payload) => {
      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>',
        iconClass: 'icon-blue',
        title: `Clinical Progress Note (#${payload.patientId})`,
        desc: `Dr. Chidi Okafor · ${escapeHTML(payload.noteText)}`,
        time: payload.timeString || 'Just now'
      });
    });

    // 7. Padi AI Interaction & Symptom Tracking Logged
    FriendnPalBackend.on('AI_INTERACTION_LOGGED', (payload) => {
      const { patientId, patient, interactionData, timeString } = payload;
      const { userMessage, framework, riskScore, tier } = interactionData || {};

      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        iconClass: tier === 'CRITICAL' ? 'icon-rose' : tier === 'MODERATE' ? 'icon-amber' : 'icon-emerald',
        title: `Padi AI Symptom Track (#${patientId})`,
        desc: `Risk Score: ${riskScore}/100 [${framework || 'WHO-5/PHQ-9/GAD-7'}] · User: "${userMessage ? userMessage.slice(0, 35) + '...' : 'Interaction logged'}"`,
        time: timeString || 'Just now'
      });

      if (activeRpmPatientId === patientId && typeof inspectRpmPatient === 'function') {
        inspectRpmPatient(patientId);
      }
    });

    // 8. HIGH RISK REAL-TIME AI TRIAGE ALERT
    FriendnPalBackend.on('HIGH_RISK_ALERT', (payload) => {
      const { patientId, patient, interactionData } = payload;
      const { riskScore, framework } = interactionData || {};

      const rowScore = document.getElementById(`row-score-${patientId}`);
      const rowBadge = document.getElementById(`row-badge-${patientId}`);
      if (rowScore) {
        rowScore.textContent = `${riskScore} / 100`;
        rowScore.className = 'score-text text-rose';
      }
      if (rowBadge) {
        rowBadge.textContent = 'CRITICAL';
        rowBadge.className = 'risk-badge-bright risk-crit';
      }

      prependStreamItem({
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        iconClass: 'icon-rose',
        title: `🚨 HIGH RISK AI TRIAGE DISPATCH (#${patientId})`,
        desc: `Risk Score ${riskScore}/100 [${framework || 'WHO-5/PHQ-9/GAD-7'}] · Auto-triaged to Dr. Chidi Okafor for 1-tap therapist handoff.`,
        time: 'Just now'
      });

      sound.playChime(349.23, 'sawtooth', 0.8);
      showToast(`🚨 REAL-TIME AI TRIAGE: Patient #${patientId} (${patient ? patient.name : 'Amina'}) score ${riskScore}/100 triggered automatic therapist escalation!`, 7000);
    });
  }

  function prependStreamItem(item) {
    const liveStream = document.getElementById('rpm-live-stream');
    if (!liveStream) return;
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
      <span class="activity-icon ${item.iconClass || 'icon-blue'}">${item.icon || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>'}</span>
      <div class="activity-content">
        <div class="activity-title">${escapeHTML(item.title)}</div>
        <div class="activity-desc">${escapeHTML(item.desc)}</div>
        <div class="activity-time">${item.time}</div>
      </div>
    `;
    liveStream.prepend(div);
  }

  // ==========================================================
  // MOBILE / TABLET RESPONSIVE SIDEBAR DRAWER CONTROLLER
  // ==========================================================
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  const rpmSidebar = document.getElementById('rpm-sidebar');
  const rpmSidebarBackdrop = document.getElementById('rpm-sidebar-backdrop');

  function toggleSidebar(open) {
    if (!rpmSidebar) return;
    const shouldOpen = typeof open === 'boolean' ? open : !rpmSidebar.classList.contains('open');
    if (shouldOpen) {
      rpmSidebar.classList.add('open');
      if (rpmSidebarBackdrop) rpmSidebarBackdrop.classList.add('active');
      if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      rpmSidebar.classList.remove('open');
      if (rpmSidebarBackdrop) rpmSidebarBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (btnSidebarToggle) {
    btnSidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (rpmSidebarBackdrop) {
    rpmSidebarBackdrop.addEventListener('click', () => {
      toggleSidebar(false);
    });
  }

  // Close sidebar on navigation item click when on mobile/tablet
  if (rpmSidebar) {
    rpmSidebar.querySelectorAll('.rpm-nav-item, .rpm-portal-return-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          toggleSidebar(false);
        }
      });
    });
  }

  console.log('FriendnPal Clinician RPM Dashboard engine initialized & connected to shared backend.');
})();
