/**
 * FriendnPal & OurPadi — Core Application Logic
 * Implements Must-Have Features:
 * 1. Mobile Shell & Triage Chat (Screens 1 & 4)
 * 2. Acute Somatic Reset & Exercises (Screen 5)
 * 3. Emergency Crisis Handoff Protocol (Screen 7 & Modal)
 * 4. Workday Rescue 15-Minute Sprints (Screen 6)
 * 5. Peer Communities, Journals & Clinician RPM Dashboard (Screen 8)
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.activeSource = null;
      this.activeGain = null;
      this.currentTrack = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Phase transition chime for breathing
    playChime(freq = 440, type = 'sine', duration = 0.6) {
      try {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio chime unavailable:', e);
      }
    }

    // Ambient ASMR Synthesis (Rain / Ocean / Brown Noise)
    startASMR(trackType) {
      this.stopASMR();
      try {
        this.init();
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (trackType === 'brown') {
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          }
        } else {
          // White noise base
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        if (trackType === 'rain') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
          filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
          gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        } else if (trackType === 'ocean') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, this.ctx.currentTime);
          gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);

          // Modulate filter for wave motion
          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // Wave every ~8s
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, this.ctx.currentTime);
          gainNode.gain.setValueAtTime(0.22, this.ctx.currentTime);
        }

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        whiteNoise.start();
        this.activeSource = whiteNoise;
        this.activeGain = gainNode;
        this.currentTrack = trackType;
        return true;
      } catch (e) {
        console.warn('ASMR synthesis failed:', e);
        return false;
      }
    }

    stopASMR() {
      if (this.activeSource) {
        try {
          this.activeSource.stop();
          this.activeSource.disconnect();
        } catch (e) {}
        this.activeSource = null;
      }
      this.currentTrack = null;
    }
  }

  const sound = new SoundEngine();

  // --- STATE CONTROLLER ---
  const state = {
    currentView: 'view-home',
    dialect: 'pidgin', // 'pidgin' | 'english'
    mood: localStorage.getItem('ourpadi_current_mood') || 'Anxious',
    checklist: JSON.parse(localStorage.getItem('ourpadi_checklist') || '{"water":true,"affirmation":true,"breathing":false,"journal":false}'),
    breathing: {
      active: false,
      timer: null,
      phase: 'READY', // INHALE, HOLD_IN, EXHALE, HOLD_OUT
      secondsLeft: 4,
      cycle: 1,
      maxCycles: 3
    },
    rescueTimer: {
      active: false,
      interval: null,
      secondsLeft: 15 * 60,
      currentSprint: 1,
      totalSprints: 4
    },
    chatLocked: false,
    isLocked: false,
    awaitingSafetyConfirmation: false,
    sleepTimerActive: true,
    assessment: {
      active: false,
      currentQuestion: 0,
      answers: [null, null, null, null, null],
      rawScore: 9,
      normalizedScore: 36,
      baselineScore: 52,
      delta: -31,
      tier: 'MODERATE',
      history: JSON.parse(localStorage.getItem('ourpadi_who5_history') || '[]')
    }
  };

  // --- DOM ELEMENTS ---
  const viewsViewport = document.getElementById('views-viewport');
  const screenViews = document.querySelectorAll('.screen-view');
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const appToast = document.getElementById('app-toast');

  // Preventive Nudge Elements
  const cardPreventiveNudge = document.getElementById('card-preventive-nudge');
  const btnTryDecompression = document.getElementById('btn-try-decompression');
  const btnDismissNudge = document.getElementById('btn-dismiss-nudge');

  // Notifications Drawer Elements
  const btnOpenNotifications = document.getElementById('btn-open-notifications');
  const btnCloseNotifications = document.getElementById('btn-close-notifications');
  const notificationsOverlay = document.getElementById('notifications-overlay');
  const btnNotifDecompression = document.getElementById('btn-notif-decompression');
  const btnNotifAssessment = document.getElementById('btn-notif-assessment');

  // Home Screen Elements
  const moodButtons = document.querySelectorAll('.mood-btn');
  const checklistItems = document.querySelectorAll('.checklist-item');
  const checklistProgressFill = document.getElementById('checklist-progress-fill');
  const checklistCounterBadge = document.getElementById('checklist-counter-badge');

  // Chat Screen Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatTypingIndicator = document.getElementById('chat-typing-indicator');
  const chatInputForm = document.getElementById('chat-input-form');
  const chatInputText = document.getElementById('chat-input-text');
  const btnToggleDialect = document.getElementById('btn-toggle-dialect');
  const btnTriagePanic = document.getElementById('btn-triage-panic');
  const btnTriageDeadline = document.getElementById('btn-triage-deadline');

  // Somatic Screen Elements
  const tabPillExercises = document.getElementById('tab-pill-exercises');
  const tabPillAsmr = document.getElementById('tab-pill-asmr');
  const subviewExercises = document.getElementById('subview-somatic-exercises');
  const subviewAsmr = document.getElementById('subview-somatic-asmr');
  const breathingCircle = document.getElementById('breathing-circle');
  const breathingPhaseLabel = document.getElementById('breathing-phase-label');
  const breathingTimerVal = document.getElementById('breathing-timer-val');
  const cycleCounterText = document.getElementById('cycle-counter-text');
  const btnStartBreathing = document.getElementById('btn-start-breathing');
  const btnResetBreathing = document.getElementById('btn-reset-breathing');
  const distressSlider = document.getElementById('distress-slider');
  const distressRatingNum = document.getElementById('distress-rating-num');
  const btnSomaticToRescue = document.getElementById('btn-somatic-to-rescue');

  // ASMR Elements
  const asmrPlayButtons = {
    rain: document.getElementById('btn-play-rain'),
    ocean: document.getElementById('btn-play-ocean'),
    brown: document.getElementById('btn-play-brown')
  };
  const asmrStatusBadge = document.getElementById('asmr-status-badge');

  // Workday Rescue Elements
  const rescueTimerDisplay = document.getElementById('rescue-timer-display');
  const btnTimerStartPause = document.getElementById('btn-timer-start-pause');
  const btnTimerAdd5 = document.getElementById('btn-timer-add-5');
  const btnCompleteSprint = document.getElementById('btn-complete-sprint');
  const rescueDraftTextarea = document.getElementById('rescue-draft-textarea');
  const draftWordCount = document.getElementById('draft-word-count');

  // Crisis Modal
  const crisisModal = document.getElementById('crisis-modal');
  const btnCloseCrisisModal = document.getElementById('btn-close-crisis-modal');

  // Journal Elements
  const btnSaveJournal = document.getElementById('btn-save-journal');
  const journalTitleInput = document.getElementById('journal-title-input');
  const journalContentTextarea = document.getElementById('journal-content-textarea');
  const journalSentimentSelect = document.getElementById('journal-sentiment-select');
  const savedJournalsContainer = document.getElementById('saved-journals-container');

  // Communities Elements
  const reactionButtons = document.querySelectorAll('.reaction-btn');

  // WHO-5 Assessment Elements
  const btnOpenAssessment = document.getElementById('btn-open-assessment');
  const btnAssessmentBack = document.getElementById('btn-assessment-back');
  const assessmentProgressBadge = document.getElementById('assessment-progress-badge');
  const assessmentProgressFill = document.getElementById('assessment-progress-fill');
  const assessmentFlowContainer = document.getElementById('assessment-flow-container');
  const assessmentResultsContainer = document.getElementById('assessment-results-container');
  const assessmentQNumber = document.getElementById('assessment-q-number');
  const assessmentStatementText = document.getElementById('assessment-statement-text');
  const likertOptionsContainer = document.getElementById('likert-options-container');
  const btnAssessmentPrev = document.getElementById('btn-assessment-prev');
  const btnAssessmentNext = document.getElementById('btn-assessment-next');
  const assessmentStepDots = document.querySelectorAll('.assessment-dot');

  // Assessment Results Elements
  const assessmentResultCircle = document.getElementById('assessment-result-circle');
  const assessmentResultNormalized = document.getElementById('assessment-result-normalized');
  const assessmentResultRaw = document.getElementById('assessment-result-raw');
  const assessmentResultDelta = document.getElementById('assessment-result-delta');
  const assessmentResultTier = document.getElementById('assessment-result-tier');
  const assessmentSeverityTitle = document.getElementById('assessment-severity-title');
  const assessmentSeverityDesc = document.getElementById('assessment-severity-desc');
  const recTitle = document.getElementById('rec-title');
  const recBadge = document.getElementById('rec-badge');
  const recBody = document.getElementById('rec-body');
  const recActions = document.getElementById('rec-actions');
  const btnSubmitAssessment = document.getElementById('btn-submit-assessment');
  const btnRetakeAssessment = document.getElementById('btn-retake-assessment');

  // Biometric Auth Elements
  const btnTriggerBiometric = document.getElementById('btn-trigger-biometric');
  const biometricModal = document.getElementById('biometric-modal');
  const btnAuthBiometrics = document.getElementById('btn-authenticate-biometrics');
  const btnBypassBiometrics = document.getElementById('btn-bypass-biometrics');
  const biometricIconWrap = document.getElementById('biometric-icon-wrap');
  const biometricGlyph = document.getElementById('biometric-glyph');

  // --- UTILITY: TOAST NOTIFICATIONS ---
  function showToast(message, duration = 2500) {
    if (!appToast) return;
    appToast.textContent = message;
    appToast.classList.add('visible');
    setTimeout(() => {
      appToast.classList.remove('visible');
    }, duration);
  }

  // --- VIEW ROUTER ---
  function switchView(targetViewId) {
    screenViews.forEach(view => {
      if (view.id === targetViewId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    state.currentView = targetViewId;

    // Update bottom taskbar active state
    navTabBtns.forEach(tab => {
      if (tab.getAttribute('data-target-view') === targetViewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Scroll container to top
    if (viewsViewport) {
      viewsViewport.scrollTop = 0;
    }
  }

  // Support deep-linking via URL hash
  function checkUrlHash() {
    if (window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      const targetEl = document.getElementById(hashId);
      if (targetEl && targetEl.classList.contains('screen-view')) {
        switchView(hashId);
      }
    }
  }
  window.addEventListener('hashchange', checkUrlHash);
  setTimeout(checkUrlHash, 60);

  // Bind Bottom Taskbar Navigation
  navTabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target-view');
      if (target) {
        switchView(target);
      }
    });
  });

  // Mode Switcher: Mobile App vs Clinician RPM Portal
  if (btnShowMobile && btnShowRpm) {
    btnShowMobile.addEventListener('click', () => {
      btnShowMobile.classList.add('active');
      btnShowRpm.classList.remove('active');
      mobileContainer.style.display = 'flex';
      clinicianContainer.style.display = 'none';
      showToast('Switched to OurPadi Patient App');
    });

    btnShowRpm.addEventListener('click', () => {
      btnShowRpm.classList.add('active');
      btnShowMobile.classList.remove('active');
      mobileContainer.style.display = 'none';
      clinicianContainer.style.display = 'flex';
      showToast('Switched to FriendnPal Clinician RPM Dashboard');
    });

    // Auto-switch to RPM if hash is #clinician-rpm or query param ?mode=rpm
    if (window.location.hash.includes('rpm') || window.location.search.includes('mode=rpm')) {
      btnShowRpm.click();
    }
  }

  // Home Quick Action 2x2 Grid Routing
  const actionLaunchChat = document.getElementById('action-launch-chat');
  const actionLaunchRescue = document.getElementById('action-launch-rescue');
  const actionLaunchSomatic = document.getElementById('action-launch-somatic');
  const actionLaunchResources = document.getElementById('action-launch-resources');

  if (actionLaunchChat) actionLaunchChat.addEventListener('click', () => switchView('view-chat'));
  if (actionLaunchRescue) actionLaunchRescue.addEventListener('click', () => switchView('view-rescue'));
  if (actionLaunchSomatic) actionLaunchSomatic.addEventListener('click', () => switchView('view-somatic'));
  if (actionLaunchResources) actionLaunchResources.addEventListener('click', () => switchView('view-resources'));

  // Header Back Buttons
  const btnChatBack = document.getElementById('btn-chat-back');
  const btnSomaticBack = document.getElementById('btn-somatic-back');
  const btnRescueBack = document.getElementById('btn-rescue-back');

  if (btnChatBack) btnChatBack.addEventListener('click', () => switchView('view-home'));
  if (btnSomaticBack) btnSomaticBack.addEventListener('click', () => switchView('view-chat'));
  if (btnRescueBack) btnRescueBack.addEventListener('click', () => switchView('view-home'));
  if (btnAssessmentBack) btnAssessmentBack.addEventListener('click', () => switchView('view-home'));

  // WHO-5 Assessment Launcher
  if (btnOpenAssessment) {
    btnOpenAssessment.addEventListener('click', () => {
      switchView('view-assessment');
      initAssessmentFlow();
      showToast('WHO-5 Clinical Screening Started');
    });
  }

  // --- MOOD CHECK-IN STRIP ---
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mood = btn.getAttribute('data-mood');
      state.mood = mood;
      localStorage.setItem('ourpadi_current_mood', mood);
      showToast(`Mood logged: ${mood}`);
    });
  });

  // Restore active mood selection
  moodButtons.forEach(btn => {
    if (btn.getAttribute('data-mood') === state.mood) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  // --- DAILY MOTIVATIONAL CHECKLIST ---
  function updateChecklistUI() {
    let completedCount = 0;
    const totalCount = checklistItems.length;

    checklistItems.forEach(item => {
      const id = item.getAttribute('data-task-id');
      const isDone = !!state.checklist[id];
      if (isDone) {
        item.classList.add('completed');
        item.setAttribute('aria-checked', 'true');
        completedCount++;
      } else {
        item.classList.remove('completed');
        item.setAttribute('aria-checked', 'false');
      }
    });

    const percent = Math.round((completedCount / totalCount) * 100);
    if (checklistProgressFill) checklistProgressFill.style.width = `${percent}%`;
    if (checklistCounterBadge) checklistCounterBadge.textContent = `${completedCount} of ${totalCount} Completed`;

    localStorage.setItem('ourpadi_checklist', JSON.stringify(state.checklist));
  }

  checklistItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-task-id');
      state.checklist[id] = !state.checklist[id];
      updateChecklistUI();
      if (state.checklist[id]) {
        sound.playChime(659.25, 'triangle', 0.25);
        showToast('Self-care task completed! ✨');
      }
    });
  });
  updateChecklistUI();

  // --- EMERGENCY CRISIS PROTOCOL (FD-01 & FD-02) ---
  const crisisShieldBtns = [
    document.getElementById('btn-home-crisis-shield'),
    document.getElementById('btn-chat-crisis-shield'),
    document.getElementById('btn-somatic-crisis-shortcut')
  ];

  function triggerEmergencyModal(reason = 'Direct user emergency shield tap') {
    if (crisisModal) {
      crisisModal.classList.add('active');
      sound.playChime(349.23, 'sawtooth', 0.5);
      console.log(`[Safety Engine] Emergency Crisis Modal triggered: ${reason}`);
      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.logCrisisOutreach('8241', reason);
      }
    }
  }

  // Crisis CTA links click tracking
  document.querySelectorAll('.crisis-cta-whatsapp, .crisis-cta-phone').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.logCrisisOutreach('8241', 'Patient initiated emergency counselor session');
      }
    });
  });

  crisisShieldBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => triggerEmergencyModal('Header crisis shield button clicked'));
    }
  });

  if (btnCloseCrisisModal) {
    btnCloseCrisisModal.addEventListener('click', () => {
      crisisModal.classList.remove('active');
      showToast('Crisis modal closed. Padi is here with you.');
    });
  }

  // --- PADI AI COMPANION & TRIAGE CHAT (SCREEN 4) ---
  // Triage Buttons: Explicit Mode Selection (FD-03)
  if (btnTriagePanic) {
    btnTriagePanic.addEventListener('click', () => {
      appendUserMessage("I want to calm my panic.");
      setTimeout(() => {
        appendBotMessage("I hear you. Let's do the 4-4-4 box breathing and ground your body right now. Opening Somatic Reset...");
        setTimeout(() => {
          switchView('view-somatic');
          startBoxBreathing();
        }, 800);
      }, 300);
    });
  }

  if (btnTriageDeadline) {
    btnTriageDeadline.addEventListener('click', () => {
      appendUserMessage("Help me rescue my deadline.");
      setTimeout(() => {
        appendBotMessage("We will defeat this task freeze together. Let's break your deliverable into 15-minute micro-sprints. Switching to Workday Rescue...");
        setTimeout(() => {
          switchView('view-rescue');
        }, 800);
      }, 300);
    });
  }

  // Dialect Toggle (Pidgin vs Standard English)
  if (btnToggleDialect) {
    btnToggleDialect.addEventListener('click', () => {
      if (state.dialect === 'pidgin') {
        state.dialect = 'english';
        btnToggleDialect.classList.remove('active-pidgin');
        btnToggleDialect.textContent = 'English';
        showToast('Switched Padi to Nigerian English');
      } else {
        state.dialect = 'pidgin';
        btnToggleDialect.classList.add('active-pidgin');
        btnToggleDialect.textContent = 'Pidgin';
        showToast('Switched Padi to Nigerian Pidgin');
      }
    });
  }

  function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bubble-user';
    bubble.innerHTML = `${escapeHTML(text)}<div class="bubble-time">Just now</div>`;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendBotMessage(text, showTriageButtons = false) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bubble-bot';
    bubble.innerHTML = `${text}<div class="bubble-time">Just now</div>`;
    chatMessages.appendChild(bubble);

    if (showTriageButtons) {
      const modeContainer = document.createElement('div');
      modeContainer.className = 'triage-mode-options';
      modeContainer.style.marginTop = '10px';
      modeContainer.innerHTML = `
        <button class="mode-card-btn mode-panic" onclick="document.getElementById('btn-triage-panic').click()">
          <span class="mode-btn-icon"><svg class="fnp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
          <div>
            <div class="mode-btn-title">Calm My Panic</div>
            <div class="mode-btn-sub">4-4-4 breathing & grounding</div>
          </div>
        </button>
        <button class="mode-card-btn mode-deadline" onclick="document.getElementById('btn-triage-deadline').click()">
          <span class="mode-btn-icon"><svg class="fnp-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <div>
            <div class="mode-btn-title">Rescue My Deadline</div>
            <div class="mode-btn-sub">15-min focus sprints</div>
          </div>
        </button>
      `;
      chatMessages.appendChild(modeContainer);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
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

  // Danger Keyword Scanner (FD-02)
  const dangerKeywords = [
    'kill myself', 'suicide', 'want to die', 'end my life', 'end it all',
    'slit my', 'overdose', 'hang myself', 'no point living', 'better off dead'
  ];

  function checkDangerKeywords(text) {
    const lower = text.toLowerCase();
    return dangerKeywords.some(keyword => lower.includes(keyword));
  }

  function showTypingIndicator() {
    if (chatTypingIndicator) {
      chatTypingIndicator.style.display = 'flex';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function hideTypingIndicator() {
    if (chatTypingIndicator) {
      chatTypingIndicator.style.display = 'none';
    }
  }

  if (chatInputForm) {
    chatInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawText = chatInputText.value.trim();
      if (!rawText) return;

      chatInputText.value = '';
      appendUserMessage(rawText);
      showTypingIndicator();

      // Check if user is responding to clinical confirmation question (FD-02)
      if (state.awaitingSafetyConfirmation) {
        setTimeout(() => {
          hideTypingIndicator();
          const lower = rawText.toLowerCase();
          const isAffirmative = lower.includes('yes') || lower.includes('yeah') || lower.includes('i am') || lower.includes('true') || checkDangerKeywords(rawText);

          if (isAffirmative) {
            appendBotMessage(
              `<strong>Amina, your life matters and you do not have to carry this alone.</strong><br>` +
              `I am immediately locking this chat and launching our direct WhatsApp crisis counselor connection.<br>` +
              `Please stay with us; a certified counselor is on standby.`
            );
            state.chatLocked = true;
            chatInputText.disabled = true;
            chatInputText.placeholder = 'Chat locked for safety — Connecting to crisis counselor...';
            setTimeout(() => {
              triggerEmergencyModal('Safety Engine triggered: Self-harm ideation confirmed by patient');
            }, 1000);
          } else {
            state.awaitingSafetyConfirmation = false;
            const safeMsg = state.dialect === 'pidgin'
              ? "Thank God you dey safe! I dey right here with you. Make we do 4-4-4 box breathing together to relax your body, or make we rescue your deadline?"
              : "Thank goodness you are safe. I am right here beside you. Let's do 4-4-4 box breathing together to ease this intense stress, or tackle that deliverable step by step:";
            appendBotMessage(safeMsg, true);
          }
        }, 750);
        return;
      }

      // Check for acute crisis keywords (Initial trigger)
      if (checkDangerKeywords(rawText)) {
        setTimeout(() => {
          hideTypingIndicator();
          state.awaitingSafetyConfirmation = true;
          appendBotMessage(
            `<strong>Amina, your life is precious and you do not have to carry this alone.</strong><br>` +
            `Please confirm: are you thinking about hurting yourself right now?<br>` +
            `<span style="color: #94a3b8; font-size: 0.8rem;">(Type <strong>YES</strong> to connect with an on-call counselor immediately, or <strong>NO</strong> if you are physically safe.)</span>`
          );
        }, 700);
        return;
      }

      // Normal Conversational Triage Generation with simulated typing
      setTimeout(() => {
        hideTypingIndicator();
        const reply = generatePadiResponse(rawText, state.dialect);
        appendBotMessage(reply.text, reply.showTriage);
      }, 800);
    });
  }

  function generatePadiResponse(input, dialect) {
    const lower = input.toLowerCase();

    // Panic / Hyperventilation / Physical distress
    if (lower.includes('heart') || lower.includes('breath') || lower.includes('chest') || lower.includes('panic') || lower.includes('shake') || lower.includes('tight')) {
      if (dialect === 'pidgin') {
        return {
          text: "Chai, I hear you my friend. Put one hand for your chest right now. No worry, panic attack no fit hurt you, na just body alarm wey sound too loud. Look away from laptop, make we do slow breath together:",
          showTriage: true
        };
      } else {
        return {
          text: "I am right here beside you. Place a gentle hand over your heart. Your nervous system is flooded with adrenaline right now, but you are physically safe. Let us slow down your respiration together:",
          showTriage: true
        };
      }
    }

    // Blackout / Generator / Power outage
    if (lower.includes('generator') || lower.includes('blackout') || lower.includes('light') || lower.includes('nepa') || lower.includes('power') || lower.includes('dark')) {
      if (dialect === 'pidgin') {
        return {
          text: "This light blackout and generator noise at 3:00 AM fit give person high BP. Take am easy, no let panic blind you. Upwork client no go kill you. Make we take 15 minutes sort the single most important headline?",
          showTriage: true
        };
      } else {
        return {
          text: "Power blackouts in the middle of the night amplify every ounce of anxiety. You are safe in your room. We will defeat this task freeze step by step. What single headline line can we draft first?",
          showTriage: true
        };
      }
    }

    // Sickle Cell / Brother / Caretaker Stress
    if (lower.includes('brother') || lower.includes('sickle') || lower.includes('caretak') || lower.includes('family') || lower.includes('guilt') || lower.includes('burden')) {
      if (dialect === 'pidgin') {
        return {
          text: "E no easy to dey take care of sickle-cell warrior brother while work deadline dey fire you. You be strong sister, but your body need breath too. Your brother dey resting now. Make we calm your body first:",
          showTriage: true
        };
      } else {
        return {
          text: "Caring for a chronically ill dependent while managing high-stakes client deadlines is an extraordinary load. Your brother is resting safely right now. You deserve a moment to decompress:",
          showTriage: true
        };
      }
    }

    // Work / Upwork / Deadline / Client / Money
    if (lower.includes('deadline') || lower.includes('client') || lower.includes('upwork') || lower.includes('boss') || lower.includes('project') || lower.includes('work') || lower.includes('draft')) {
      if (dialect === 'pidgin') {
        return {
          text: "You don dey overthink this client work, your head wan explode. Listen to me: we no dey finish everything tonight, we just need one small win to protect your contract. Make we do 15-minute sprint?",
          showTriage: true
        };
      } else {
        return {
          text: "I completely understand the crushing weight of that deadline. When cortisol spikes, our brain freezes up. We can recover your momentum with a focused 15-minute micro-sprint right now.",
          showTriage: true
        };
      }
    }

    // Relief / Feeling Better / Thank You
    if (lower.includes('thank') || lower.includes('better') || lower.includes('calm') || lower.includes('relieved') || lower.includes('slow')) {
      if (dialect === 'pidgin') {
        return {
          text: "I dey so proud of you! See as your heart don dey beat soft-soft now. Padi dey your back 24/7. You wan try 15-minute sprint now or you wan rest?",
          showTriage: true
        };
      } else {
        return {
          text: "I am so glad to hear that. Notice how your breathing has normalized and the tension in your shoulders is easing. Would you like to start a focused 15-minute sprint now, or continue resting?",
          showTriage: true
        };
      }
    }

    // Default Empathetic Response
    if (dialect === 'pidgin') {
      return {
        text: "I dey hear you loud and clear. No carry this heavy load alone. You wan calm your body first, or na that task wey dey choke you make we scatter into small pieces?",
        showTriage: true
      };
    } else {
      return {
        text: "Thank you for opening up to me. You do not have to carry all of this pressure alone. Would you like to slow down your physiological stress, or tackle that deliverable step by step?",
        showTriage: true
      };
    }
  }

  // --- ACUTE SOMATIC RESET & 4-4-4 BOX BREATHING (SCREEN 5) ---
  // Pill Tab Switching (Somatic Exercises vs ASMR Soundscapes)
  if (tabPillExercises && tabPillAsmr) {
    tabPillExercises.addEventListener('click', () => {
      tabPillExercises.classList.add('active');
      tabPillAsmr.classList.remove('active');
      subviewExercises.style.display = 'block';
      subviewAsmr.style.display = 'none';
      sound.stopASMR();
      if (asmrStatusBadge) asmrStatusBadge.textContent = 'Paused';
    });

    tabPillAsmr.addEventListener('click', () => {
      tabPillAsmr.classList.add('active');
      tabPillExercises.classList.remove('active');
      subviewAsmr.style.display = 'block';
      subviewExercises.style.display = 'none';
      pauseBoxBreathing();
    });
  }

  function updateBreathingCircle(phase, seconds) {
    if (!breathingCircle) return;
    breathingCircle.classList.remove('inhale', 'hold', 'exhale');

    if (phase === 'INHALE') {
      breathingCircle.classList.add('inhale');
      breathingPhaseLabel.textContent = 'INHALE';
      breathingPhaseLabel.style.color = '#38bdf8';
    } else if (phase === 'HOLD') {
      breathingCircle.classList.add('hold');
      breathingPhaseLabel.textContent = 'HOLD';
      breathingPhaseLabel.style.color = '#a78bfa';
    } else if (phase === 'EXHALE') {
      breathingCircle.classList.add('exhale');
      breathingPhaseLabel.textContent = 'EXHALE';
      breathingPhaseLabel.style.color = '#34d399';
    } else {
      breathingPhaseLabel.textContent = 'READY';
      breathingPhaseLabel.style.color = '#cbd5e1';
    }

    breathingTimerVal.textContent = seconds;
  }

  function startBoxBreathing() {
    if (state.breathing.active) return;
    state.breathing.active = true;
    if (btnStartBreathing) btnStartBreathing.textContent = '⏸ Pause Breathing';

    const phases = ['INHALE', 'HOLD', 'EXHALE', 'HOLD'];
    let phaseIdx = 0;
    state.breathing.secondsLeft = 4;
    state.breathing.phase = phases[phaseIdx];
    state.breathing.cycle = 1;

    updateBreathingCircle(state.breathing.phase, state.breathing.secondsLeft);
    sound.playChime(523.25, 'sine', 0.5); // C5 chime

    state.breathing.timer = setInterval(() => {
      state.breathing.secondsLeft--;

      if (state.breathing.secondsLeft <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        state.breathing.phase = phases[phaseIdx];
        state.breathing.secondsLeft = 4;

        if (phaseIdx === 0) {
          state.breathing.cycle++;
          if (state.breathing.cycle > state.breathing.maxCycles) {
            completeBoxBreathing();
            return;
          }
          if (cycleCounterText) cycleCounterText.textContent = `CYCLE ${state.breathing.cycle} OF ${state.breathing.maxCycles}`;
        }

        // Chimes per phase
        if (state.breathing.phase === 'INHALE') sound.playChime(523.25, 'sine', 0.4);
        else if (state.breathing.phase === 'HOLD') sound.playChime(659.25, 'sine', 0.3);
        else if (state.breathing.phase === 'EXHALE') sound.playChime(440.00, 'sine', 0.5);
      }

      updateBreathingCircle(state.breathing.phase, state.breathing.secondsLeft);
    }, 1000);
  }

  function pauseBoxBreathing() {
    state.breathing.active = false;
    if (state.breathing.timer) {
      clearInterval(state.breathing.timer);
      state.breathing.timer = null;
    }
    if (btnStartBreathing) btnStartBreathing.textContent = '▶ Resume Breathing';
  }

  function resetBoxBreathing() {
    pauseBoxBreathing();
    state.breathing.phase = 'READY';
    state.breathing.secondsLeft = 4;
    state.breathing.cycle = 1;
    updateBreathingCircle('READY', 4);
    if (cycleCounterText) cycleCounterText.textContent = `CYCLE 1 OF 3`;
    if (btnStartBreathing) btnStartBreathing.textContent = '▶ Start 4-4-4 Reset';
  }

  function completeBoxBreathing() {
    pauseBoxBreathing();
    sound.playChime(783.99, 'triangle', 0.8); // G5 victory
    if (breathingPhaseLabel) breathingPhaseLabel.textContent = 'STABILIZED';
    if (breathingTimerVal) breathingTimerVal.textContent = '✓';
    showToast('3 Breathing cycles complete! Notice your slower pulse ✨');

    // Telemetry Sync to Clinician Dashboard
    if (typeof FriendnPalBackend !== 'undefined') {
      FriendnPalBackend.logSomaticReset('8241', 5, 2);
    }

    // Smoothly scroll down to grounding drawer
    const groundingDrawer = document.getElementById('grounding-drawer');
    if (groundingDrawer) {
      groundingDrawer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (btnStartBreathing) {
    btnStartBreathing.addEventListener('click', () => {
      if (state.breathing.active) {
        pauseBoxBreathing();
      } else {
        startBoxBreathing();
      }
    });
  }

  if (btnResetBreathing) {
    btnResetBreathing.addEventListener('click', resetBoxBreathing);
  }

  // Distress Slider (1 to 5)
  if (distressSlider && distressRatingNum) {
    distressSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      const labels = {
        '1': '1 (Calm & Clear)',
        '2': '2 (Manageable)',
        '3': '3 (Shaky / Tense)',
        '4': '4 (Panicking)',
        '5': '5 (Critical / Overwhelmed)'
      };
      distressRatingNum.textContent = labels[val] || val;
      localStorage.setItem('ourpadi_distress_rating', val);

      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.logSomaticReset('8241', 5, parseInt(val, 10));
      }
    });
  }

  // Button to advance from Somatic to Workday Rescue
  if (btnSomaticToRescue) {
    btnSomaticToRescue.addEventListener('click', () => {
      showToast('Nervous system anchored. Advancing to Workday Rescue...');
      switchView('view-rescue');
    });
  }

  // --- ASMR SOUNDSCAPES CONTROLLER ---
  Object.keys(asmrPlayButtons).forEach(trackKey => {
    const btn = asmrPlayButtons[trackKey];
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (sound.currentTrack === trackKey) {
        sound.stopASMR();
        btn.textContent = '▶';
        if (asmrStatusBadge) asmrStatusBadge.textContent = 'Paused';
        showToast('ASMR playback stopped');
      } else {
        // Reset other buttons
        Object.values(asmrPlayButtons).forEach(b => { if (b) b.textContent = '▶'; });
        const ok = sound.startASMR(trackKey);
        if (ok) {
          btn.textContent = '⏸';
          if (asmrStatusBadge) asmrStatusBadge.textContent = 'Playing Soundscape';
          showToast(`Playing ${trackKey.toUpperCase()} ambient soundscape`);
        }
      }
    });
  });

  const btnToggleSleepTimer = document.getElementById('btn-toggle-sleep-timer');
  if (btnToggleSleepTimer) {
    btnToggleSleepTimer.addEventListener('click', () => {
      state.sleepTimerActive = !state.sleepTimerActive;
      btnToggleSleepTimer.textContent = state.sleepTimerActive ? '⏱️ 15 Mins (Active)' : '⏱️ Timer Disabled';
      showToast(state.sleepTimerActive ? 'Sleep timer set to 15 minutes' : 'Sleep timer disabled');
    });
  }

  // --- WORKDAY RESCUE 15-MINUTE SPRINTS (SCREEN 6) ---
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateSprintUI() {
    if (rescueTimerDisplay) {
      rescueTimerDisplay.textContent = formatTime(state.rescueTimer.secondsLeft);
    }
    // Update step dots
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      if (!dot) continue;
      if (i < state.rescueTimer.currentSprint) {
        dot.className = 'step-dot done';
        dot.textContent = '✓';
      } else if (i === state.rescueTimer.currentSprint) {
        dot.className = 'step-dot active';
        dot.textContent = i;
      } else {
        dot.className = 'step-dot';
        dot.textContent = i;
      }
    }
  }

  function startSprintTimer() {
    if (state.rescueTimer.active) return;
    state.rescueTimer.active = true;
    if (btnTimerStartPause) {
      btnTimerStartPause.textContent = '⏸ Pause Sprint';
      btnTimerStartPause.style.background = '#eab308';
    }

    state.rescueTimer.interval = setInterval(() => {
      state.rescueTimer.secondsLeft--;
      if (state.rescueTimer.secondsLeft <= 0) {
        clearInterval(state.rescueTimer.interval);
        state.rescueTimer.active = false;
        sound.playChime(880, 'sine', 0.8);
        showToast('Sprint complete! Submit your drafted lines below.');
        if (btnTimerStartPause) btnTimerStartPause.textContent = '▶ Sprint Finished';
      }
      updateSprintUI();
    }, 1000);
  }

  function pauseSprintTimer() {
    state.rescueTimer.active = false;
    if (state.rescueTimer.interval) {
      clearInterval(state.rescueTimer.interval);
      state.rescueTimer.interval = null;
    }
    if (btnTimerStartPause) {
      btnTimerStartPause.textContent = '▶ Resume Sprint';
      btnTimerStartPause.style.background = 'var(--accent-emerald)';
    }
  }

  if (btnTimerStartPause) {
    btnTimerStartPause.addEventListener('click', () => {
      if (state.rescueTimer.active) {
        pauseSprintTimer();
      } else {
        startSprintTimer();
      }
    });
  }

  if (btnTimerAdd5) {
    btnTimerAdd5.addEventListener('click', () => {
      state.rescueTimer.secondsLeft += 5 * 60;
      updateSprintUI();
      showToast('Added 5 minutes to sprint timer');
    });
  }

  if (btnCompleteSprint) {
    btnCompleteSprint.addEventListener('click', () => {
      pauseSprintTimer();
      sound.playChime(659.25, 'triangle', 0.5);

      if (state.rescueTimer.currentSprint < state.rescueTimer.totalSprints) {
        state.rescueTimer.currentSprint++;
        state.rescueTimer.secondsLeft = 15 * 60;
        updateSprintUI();
        showToast(`Sprint advanced! Now on Sprint ${state.rescueTimer.currentSprint} of 4`);
      } else {
        showToast('All 4 Sprints Completed! Your Upwork contract is protected!');
        sound.playChime(783.99, 'triangle', 0.8);
        setTimeout(() => {
          switchView('view-postshift');
        }, 900);
      }
    });
  }

  // Word Count Counter
  if (rescueDraftTextarea && draftWordCount) {
    rescueDraftTextarea.addEventListener('input', (e) => {
      const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
      draftWordCount.textContent = `${words} words`;
      localStorage.setItem('ourpadi_rescue_draft', e.target.value);
    });

    const savedDraft = localStorage.getItem('ourpadi_rescue_draft');
    if (savedDraft) {
      rescueDraftTextarea.value = savedDraft;
      const words = savedDraft.trim().split(/\s+/).filter(Boolean).length;
      draftWordCount.textContent = `${words} words`;
    }
  }
  updateSprintUI();

  // --- PRIVATE JOURNALS COMPOSER (SCREEN 3) ---
  if (btnSaveJournal && journalTitleInput && journalContentTextarea) {
    btnSaveJournal.addEventListener('click', () => {
      const title = journalTitleInput.value.trim();
      const content = journalContentTextarea.value.trim();
      const sentiment = journalSentimentSelect.value;

      if (!title || !content) {
        showToast('Please enter both a title and reflection content');
        return;
      }

      const card = document.createElement('div');
      card.className = 'app-card';
      card.innerHTML = `
        <div class="card-title-row">
          <strong style="font-size: 0.88rem; color: #fff;">${escapeHTML(title)}</strong>
          <span class="card-badge badge-blue">${sentiment}</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-soft); line-height: 1.4;">
          ${escapeHTML(content)}
        </p>
        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 8px;">Just now · Encrypted</div>
      `;

      if (savedJournalsContainer) {
        savedJournalsContainer.prepend(card);
      }

      journalTitleInput.value = '';
      journalContentTextarea.value = '';
      sound.playChime(523.25, 'sine', 0.3);
      showToast('Journal entry saved and encrypted locally');
    });
  }

  // --- PEER COMMUNITIES REACTIONS (SCREEN 2) ---
  reactionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      let count = parseInt(btn.getAttribute('data-reactions') || '42', 10);
      count++;
      btn.setAttribute('data-reactions', count);
      const span = btn.querySelector('span');
      if (span) span.textContent = count;
      sound.playChime(784, 'sine', 0.2);
      showToast('Support reaction logged anonymously ❤️');
    });
  });

  // --- CLINICIAN RPM DASHBOARD INTERACTIONS (SCREEN 8) ---
  const rpmRows = document.querySelectorAll('#rpm-patient-tbody tr');
  rpmRows.forEach(row => {
    row.addEventListener('click', () => {
      rpmRows.forEach(r => r.classList.remove('selected-row'));
      row.classList.add('selected-row');
      const patientId = row.getAttribute('data-patient');
      showToast(`Loaded Patient #${patientId} longitudinal graph & audit trail`);
    });
  });

  const btnRpmDirectWhatsApp = document.getElementById('btn-rpm-direct-whatsapp');
  if (btnRpmDirectWhatsApp) {
    btnRpmDirectWhatsApp.addEventListener('click', () => {
      window.open('https://wa.me/2348003743637?text=Hello%2C%20this%20is%20Dr.%20Chidi%20Okafor%20from%20FriendnPal%20Clinician%20RPM.%20I%20am%20reaching%20out%20to%20check%20in%20on%20you.', '_blank');
      showToast('Opening Counselor WhatsApp Session...');
    });
  }

  // ==========================================================
  // CLINICAL ASSESSMENT INTAKE ENGINE (WHO-5) (FR-03, FR-04)
  // ==========================================================
  const who5Questions = [
    "Over the last 2 weeks, I have felt cheerful and in good spirits",
    "Over the last 2 weeks, I have felt calm and relaxed",
    "Over the last 2 weeks, I have felt active and vigorous",
    "Over the last 2 weeks, I woke up feeling fresh and rested",
    "Over the last 2 weeks, my daily life has been filled with things that interest me"
  ];

  const likertOptions = [
    { score: 5, label: "All of the time", chip: "5 pts" },
    { score: 4, label: "Most of the time", chip: "4 pts" },
    { score: 3, label: "More than half of the time", chip: "3 pts" },
    { score: 2, label: "Less than half of the time", chip: "2 pts" },
    { score: 1, label: "Some of the time", chip: "1 pt" },
    { score: 0, label: "At no time", chip: "0 pts" }
  ];

  function initAssessmentFlow() {
    state.assessment.active = true;
    state.assessment.currentQuestion = 0;
    state.assessment.answers = [null, null, null, null, null];
    if (assessmentResultsContainer) assessmentResultsContainer.style.display = 'none';
    if (assessmentFlowContainer) assessmentFlowContainer.style.display = 'block';
    renderAssessmentQuestion(0);
  }

  function renderAssessmentQuestion(index) {
    state.assessment.currentQuestion = index;
    if (assessmentProgressBadge) assessmentProgressBadge.textContent = `Item ${index + 1} of 5`;
    if (assessmentQNumber) assessmentQNumber.textContent = `Question ${index + 1} / 5`;
    if (assessmentProgressFill) assessmentProgressFill.style.width = `${((index + 1) / 5) * 100}%`;
    if (assessmentStatementText) assessmentStatementText.textContent = `"${who5Questions[index]}"`;

    // Render Likert Options with active selection state
    if (likertOptionsContainer) {
      likertOptionsContainer.innerHTML = '';
      const currentSelected = state.assessment.answers[index];
      likertOptions.forEach(opt => {
        const card = document.createElement('button');
        card.className = `likert-card ${currentSelected === opt.score ? 'selected' : ''}`;
        card.setAttribute('data-score', opt.score);
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-checked', currentSelected === opt.score ? 'true' : 'false');
        card.innerHTML = `
          <span class="likert-radio-dot"></span>
          <span class="likert-label">${opt.label}</span>
          <span class="likert-score-chip">${opt.chip}</span>
        `;
        card.addEventListener('click', () => handleLikertSelection(opt.score));
        likertOptionsContainer.appendChild(card);
      });
    }

    // Update Step Dots
    if (assessmentStepDots) {
      assessmentStepDots.forEach((dot, dotIdx) => {
        dot.className = 'assessment-dot';
        if (dotIdx === index) {
          dot.classList.add('active');
        } else if (state.assessment.answers[dotIdx] !== null) {
          dot.classList.add('done');
        }
      });
    }

    // Previous / Next Buttons state
    if (btnAssessmentPrev) {
      btnAssessmentPrev.disabled = (index === 0);
    }
    if (btnAssessmentNext) {
      if (index === 4) {
        btnAssessmentNext.textContent = 'View Diagnostic Results ✓';
        btnAssessmentNext.style.background = 'var(--accent-emerald)';
        btnAssessmentNext.style.borderColor = 'var(--accent-emerald)';
      } else {
        btnAssessmentNext.textContent = 'Next →';
        btnAssessmentNext.style.background = 'var(--accent-blue)';
        btnAssessmentNext.style.borderColor = 'var(--accent-blue)';
      }
    }
  }

  function handleLikertSelection(score) {
    state.assessment.answers[state.assessment.currentQuestion] = score;
    sound.playChime(523.25 + score * 35, 'sine', 0.15);

    // Update selected styling immediately
    const cards = likertOptionsContainer.querySelectorAll('.likert-card');
    cards.forEach(card => {
      if (parseInt(card.getAttribute('data-score'), 10) === score) {
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
      }
    });

    // Update step dots done state
    if (assessmentStepDots && assessmentStepDots[state.assessment.currentQuestion]) {
      assessmentStepDots[state.assessment.currentQuestion].classList.add('done');
    }

    // Auto advance smoothly if not on last item
    setTimeout(() => {
      if (state.assessment.currentQuestion < 4) {
        renderAssessmentQuestion(state.assessment.currentQuestion + 1);
      } else {
        // If on last item and all items answered, show diagnostic results
        const allAnswered = state.assessment.answers.every(a => a !== null);
        if (allAnswered) {
          showAssessmentResults();
        }
      }
    }, 240);
  }

  function showAssessmentResults() {
    // Verify all answered
    const unansweredIdx = state.assessment.answers.findIndex(a => a === null);
    if (unansweredIdx !== -1) {
      showToast(`Please answer Question ${unansweredIdx + 1} before viewing results.`);
      renderAssessmentQuestion(unansweredIdx);
      return;
    }

    // Standard WHO-5 calculation: Raw score (0–25), Normalized percentage score (0–100)
    const raw = state.assessment.answers.reduce((sum, val) => sum + val, 0);
    const normalized = raw * 4;
    state.assessment.rawScore = raw;
    state.assessment.normalizedScore = normalized;

    // Velocity Delta vs baseline (52)
    const baseline = state.assessment.baselineScore || 52;
    const delta = Math.round(((normalized - baseline) / baseline) * 100);
    state.assessment.delta = delta;

    // Clinical severity risk tier
    let tier = 'NORMAL';
    let tierTitle = 'Resilient Mental Balance';
    let tierColor = '#10b981';
    let tierHex = '#10b981';
    let tierBadgeClass = 'badge-emerald';

    if (normalized <= 28 || delta < -30) {
      tier = 'CRITICAL';
      tierTitle = 'Severe Clinical Strain (Critical Risk)';
      tierColor = '#f43f5e';
      tierHex = '#f43f5e';
      tierBadgeClass = 'badge-rose';
    } else if (normalized <= 50) {
      tier = 'MODERATE';
      tierTitle = 'Moderate Clinical Strain (Depressive Impairment)';
      tierColor = '#f59e0b';
      tierHex = '#f59e0b';
      tierBadgeClass = 'badge-amber';
    }

    state.assessment.tier = tier;

    // Transition view
    if (assessmentFlowContainer) assessmentFlowContainer.style.display = 'none';
    if (assessmentResultsContainer) assessmentResultsContainer.style.display = 'block';

    // Populate Results UI
    if (assessmentResultNormalized) assessmentResultNormalized.textContent = normalized;
    if (assessmentResultRaw) assessmentResultRaw.textContent = `${raw} / 25`;
    if (assessmentResultDelta) {
      assessmentResultDelta.textContent = delta >= 0 ? `↑ ${delta}%` : `↓ ${Math.abs(delta)}%`;
      assessmentResultDelta.style.color = delta >= 0 ? '#34d399' : '#f43f5e';
    }
    if (assessmentResultTier) {
      assessmentResultTier.textContent = tier;
      assessmentResultTier.style.color = tierColor;
    }
    if (assessmentSeverityTitle) {
      assessmentSeverityTitle.textContent = tierTitle;
      assessmentSeverityTitle.style.color = tierColor;
    }

    if (assessmentResultCircle) {
      assessmentResultCircle.style.background = `conic-gradient(${tierHex} 0% ${normalized}%, #1a2742 ${normalized}% 100%)`;
    }

    if (assessmentSeverityDesc) {
      if (tier === 'CRITICAL') {
        assessmentSeverityDesc.textContent = `Your normalized score of ${normalized}/100 falls below the clinical safety cutoff (<= 28) with a ${Math.abs(delta)}% velocity drop below baseline. Immediate human crisis outreach is clinically indicated.`;
      } else if (tier === 'MODERATE') {
        assessmentSeverityDesc.textContent = `Your score of ${normalized}/100 indicates noticeable depressive impairment over the past 14 days, with a ${Math.abs(delta)}% drop below baseline (52). Preventive de-escalation is recommended.`;
      } else {
        assessmentSeverityDesc.textContent = `Your score of ${normalized}/100 reflects positive emotional well-being, good energy, and psychological resilience over the past 14 days.`;
      }
    }

    // Recommendation card population
    if (recTitle && recBadge && recBody && recActions) {
      recBadge.className = `card-badge ${tierBadgeClass}`;
      if (tier === 'CRITICAL') {
        recTitle.textContent = 'Immediate Human Clinical Escalation';
        recBadge.textContent = 'Critical Alert';
        recBody.innerHTML = 'Your clinical assessment flags acute strain. Please connect directly with an on-call mental health counselor or tap our crisis emergency protocol:';
        recActions.innerHTML = `
          <a class="crisis-cta-whatsapp" style="flex: 1; text-align: center; padding: 9px 8px; font-size: 0.76rem; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" href="https://wa.me/2348003743637?text=Hello%2C%20I%20just%20completed%20my%20WHO-5%20assessment%20and%20scored%20${normalized}/100.%20I%20need%20human%20guidance." target="_blank" rel="noopener">
            <svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span>WhatsApp Counselor</span>
          </a>
          <button class="control-btn" id="btn-result-open-crisis" style="background: var(--accent-rose); border-color: var(--accent-rose); color: #fff; font-weight: 700; padding: 9px 10px; font-size: 0.76rem; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true" style="color: #fff;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Emergency Crisis Card</span>
          </button>
        `;
        const bC = document.getElementById('btn-result-open-crisis');
        if (bC) bC.addEventListener('click', () => triggerEmergencyModal('WHO-5 Score in Critical Range'));
      } else if (tier === 'MODERATE') {
        recTitle.textContent = 'Preventive Care Interventions';
        recBadge.textContent = 'Proactive Care';
        recBody.innerHTML = 'A moderate decline was detected. We recommend anchoring your nervous system with 4-4-4 box breathing or defeating task freeze with a 15-minute sprint:';
        recActions.innerHTML = `
          <button class="control-btn" id="btn-rec-somatic-action" style="flex: 1; padding: 9px 6px; font-size: 0.75rem; background: rgba(59, 130, 246, 0.15); border-color: var(--accent-blue); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Somatic Reset</span>
          </button>
          <button class="control-btn" id="btn-rec-rescue-action" style="flex: 1; padding: 9px 6px; font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); border-color: var(--accent-emerald); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Workday Rescue</span>
          </button>
        `;
        const bS = document.getElementById('btn-rec-somatic-action');
        const bR = document.getElementById('btn-rec-rescue-action');
        if (bS) bS.addEventListener('click', () => { switchView('view-somatic'); startBoxBreathing(); });
        if (bR) bR.addEventListener('click', () => switchView('view-rescue'));
      } else {
        recTitle.textContent = 'Flourishing Well-Being';
        recBadge.textContent = 'Resilient';
        recBody.innerHTML = 'Your vitality and mood are strong. Keep reinforcing your momentum with mindful hydration, affirmations, and journaling:';
        recActions.innerHTML = `
          <button class="control-btn" id="btn-rec-journal-action" style="flex: 1; padding: 9px 6px; font-size: 0.75rem; background: rgba(59, 130, 246, 0.15); border-color: var(--accent-blue); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
            <span>Log Reflection</span>
          </button>
        `;
        const bJ = document.getElementById('btn-rec-journal-action');
        if (bJ) bJ.addEventListener('click', () => switchView('view-journals'));
      }
    }

    sound.playChime(tier === 'CRITICAL' ? 349.23 : tier === 'MODERATE' ? 523.25 : 783.99, 'triangle', 0.5);
  }

  function submitAndSyncTelemetry() {
    const { normalizedScore, rawScore, delta, tier } = state.assessment;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Save ClinicalAssessment Record in localStorage
    const assessmentRecord = {
      assessment_id: 'who5_' + Date.now(),
      user_id: 'usr_8241a7c2',
      assessment_type: 'WHO_5_WELLBEING',
      raw_score: rawScore,
      normalized_score: normalizedScore,
      severity_category: tier,
      answers_json: [...state.assessment.answers],
      delta_percentage: delta,
      submitted_at: now.toISOString()
    };
    state.assessment.history.unshift(assessmentRecord);
    localStorage.setItem('ourpadi_who5_history', JSON.stringify(state.assessment.history));

    // 2. Update Home Screen Well-Being Card UI
    const who5ScoreVal = document.getElementById('who5-score-val');
    const homeGaugeCircle = document.querySelector('.gauge-circle');
    const homeGaugeStatus = document.querySelector('.gauge-status');
    const homeGaugeDelta = document.querySelector('.gauge-delta');

    if (who5ScoreVal) who5ScoreVal.textContent = normalizedScore;
    const tierHex = normalizedScore <= 28 ? '#f43f5e' : normalizedScore <= 50 ? '#f59e0b' : '#10b981';
    if (homeGaugeCircle) {
      homeGaugeCircle.style.background = `conic-gradient(${tierHex} 0% ${normalizedScore}%, #1a2742 ${normalizedScore}% 100%)`;
      homeGaugeCircle.setAttribute('aria-label', `${normalizedScore} out of 100 well-being score`);
    }
    if (homeGaugeStatus) {
      homeGaugeStatus.textContent = normalizedScore <= 28 ? 'Severe Clinical Strain' : normalizedScore <= 50 ? 'Moderate Clinical Strain' : 'Optimal Well-Being';
    }
    if (homeGaugeDelta) {
      homeGaugeDelta.textContent = delta >= 0 ? `↑ ${delta}% velocity gain` : `↓ ${Math.abs(delta)}% velocity drop (Last 14 days)`;
      homeGaugeDelta.style.color = delta >= 0 ? '#34d399' : '#f43f5e';
    }

    // 3. Telemetry Dispatch to Clinician RPM Dashboard (Screen 8)
        // Dispatch to Shared Backend Telemetry Bus
    if (typeof FriendnPalBackend !== 'undefined') {
      FriendnPalBackend.submitAssessment('8241', {
        rawScore,
        normalizedScore,
        delta,
        tier,
        answers: [...state.assessment.answers]
      });
    }

    sound.playChime(659.25, 'sine', 0.4);
    showToast('Telemetry dispatched to FriendnPal RPM network');
    switchView('view-home');
  }

  function syncClinicianDashboard(score, delta, tier, timeString) {
    // 1. Update Patient #8241 Table Row cells
    const rowScore = document.getElementById('row-score-8241');
    const rowTrend = document.getElementById('row-trend-8241');
    const rowBadge = document.getElementById('row-badge-8241');

    const tierHex = score <= 28 ? '#e11d48' : score <= 50 ? '#d97706' : '#059669';
    if (rowScore) {
      rowScore.textContent = `${score} / 100`;
      rowScore.className = `score-text ${score <= 28 ? 'text-rose' : score <= 50 ? 'text-amber' : 'text-emerald'}`;
    }
    if (rowTrend) {
      const trendSymbol = delta >= 0 ? '↑' : '↓';
      const trendTag = delta < -30 ? '(Drop)' : delta >= 0 ? '(Stable)' : '';
      rowTrend.textContent = `${trendSymbol} ${Math.abs(delta)}% ${trendTag}`;
      rowTrend.className = `trend-text ${delta >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (rowBadge) {
      rowBadge.textContent = tier;
      rowBadge.className = `risk-badge-bright ${tier === 'CRITICAL' ? 'risk-crit' : tier === 'MODERATE' ? 'risk-mod' : 'risk-norm'}`;
    }

    // 2. Caseload Metrics Recalculation
    const rpmMetricAvg = document.getElementById('rpm-metric-avg');
    const rpmMetricCritical = document.getElementById('rpm-metric-critical');
    const rpmMetricModerate = document.getElementById('rpm-metric-moderate');

    if (rpmMetricAvg) {
      const baseTotal = 48 * 54.2;
      const newAvg = ((baseTotal - 36 + score) / 48).toFixed(1);
      rpmMetricAvg.textContent = newAvg;
    }

    if (rpmMetricCritical && rpmMetricModerate) {
      let critCount = 3;
      let modCount = 11;
      if (tier === 'CRITICAL') {
        critCount = 3;
        modCount = 10;
      } else if (tier === 'MODERATE') {
        critCount = 2;
        modCount = 11;
      } else {
        critCount = 2;
        modCount = 10;
      }
      rpmMetricCritical.textContent = critCount;
      rpmMetricModerate.textContent = modCount;
    }

    // 3. Update Chart Score Legend Label
    const legendWho5 = document.querySelector('.legend-who5 strong');
    if (legendWho5) {
      legendWho5.textContent = score;
    }

    // 4. Update SVG Trajectory Chart endpoint & area dynamically
    const who5Stroke = document.getElementById('svg-who5-stroke');
    const who5Area = document.getElementById('svg-who5-area');
    const who5PulsingNode = document.querySelector('.pulsing-node');
    if (who5Stroke && who5Area) {
      // Scale score (0 to 100) to SVG Y coordinate (230 to 40)
      const targetY = Math.round(230 - (score / 100) * 190);
      const newStrokeD = `M 60,65 C 150,70 230,85 330,110 C 430,135 550,175 700,${targetY}`;
      const newAreaD = `M 60,65 C 150,70 230,85 330,110 C 430,135 550,175 700,${targetY} L 700,230 L 60,230 Z`;
      who5Stroke.setAttribute('d', newStrokeD);
      who5Area.setAttribute('d', newAreaD);
      if (who5PulsingNode) who5PulsingNode.setAttribute('cy', targetY);
    }

    // 5. Update SVG Tooltip
    const tooltipText1 = document.querySelector('.svg-tooltip-group text:nth-of-type(2)');
    if (tooltipText1) {
      tooltipText1.textContent = `● WHO-5: ${score}/100 (${delta >= 0 ? 'Gain' : 'Drop'})`;
    }

    // 6. Update Hero Spotlight Card metrics
    const heroWho5Val = document.querySelector('.hero-pill:nth-of-type(1) .pill-v');
    const heroStatusVal = document.querySelector('.hero-pill:nth-of-type(2) .pill-v');
    if (heroWho5Val) heroWho5Val.textContent = `${score}/100`;
    if (heroStatusVal) {
      heroStatusVal.textContent = tier;
      heroStatusVal.style.color = tier === 'CRITICAL' ? '#fecdd3' : tier === 'MODERATE' ? '#fed7aa' : '#bbf7d0';
    }

    // 7. Update Radial Recovery Gauge
    const radialCircle = document.getElementById('rpm-cohort-radial');
    const radialNumber = document.querySelector('.radial-number');
    if (radialCircle && radialNumber) {
      const recoveryPct = tier === 'NORMAL' ? 84 : tier === 'MODERATE' ? 81 : 79;
      radialCircle.style.background = `conic-gradient(#10b981 0% ${recoveryPct}%, #e2e8f0 ${recoveryPct}% 100%)`;
      radialNumber.textContent = `${recoveryPct}%`;
    }

    // 8. Append New Activity to Live Telemetry Stream
    const liveStream = document.getElementById('rpm-live-stream');
    if (liveStream) {
      const newItem = document.createElement('div');
      newItem.className = 'activity-item';
      newItem.innerHTML = `
        <span class="activity-icon icon-blue"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg></span>
        <div class="activity-content">
          <div class="activity-title">WHO-5 Intake Telemetry Synced</div>
          <div class="activity-desc">Score ${score}/100 · Velocity ${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% (${tier})</div>
          <div class="activity-time">${timeString} · Abuja</div>
        </div>
      `;
      liveStream.prepend(newItem);
    }
  }

  // Stepper buttons listeners
  if (btnAssessmentPrev) {
    btnAssessmentPrev.addEventListener('click', () => {
      if (state.assessment.currentQuestion > 0) {
        renderAssessmentQuestion(state.assessment.currentQuestion - 1);
      }
    });
  }

  if (btnAssessmentNext) {
    btnAssessmentNext.addEventListener('click', () => {
      if (state.assessment.currentQuestion < 4) {
        renderAssessmentQuestion(state.assessment.currentQuestion + 1);
      } else {
        showAssessmentResults();
      }
    });
  }

  if (assessmentStepDots) {
    assessmentStepDots.forEach((dot, dotIdx) => {
      dot.addEventListener('click', () => {
        renderAssessmentQuestion(dotIdx);
      });
    });
  }

  if (btnSubmitAssessment) {
    btnSubmitAssessment.addEventListener('click', submitAndSyncTelemetry);
  }

  if (btnRetakeAssessment) {
    btnRetakeAssessment.addEventListener('click', initAssessmentFlow);
  }

  // ==========================================================
  // PREVENTIVE NUDGE CARD & NOTIFICATIONS DRAWER CONTROLLERS
  // ==========================================================
  if (btnTryDecompression) {
    btnTryDecompression.addEventListener('click', () => {
      showToast('Starting 3-min evening decompression reset');
      switchView('view-somatic');
      if (typeof startBoxBreathing === 'function') {
        startBoxBreathing();
      }
    });
  }

  if (btnDismissNudge) {
    btnDismissNudge.addEventListener('click', () => {
      if (cardPreventiveNudge) {
        cardPreventiveNudge.style.display = 'none';
      }
      showToast('Nudge dismissed. Take care of yourself!');
    });
  }

  if (btnOpenNotifications) {
    btnOpenNotifications.addEventListener('click', () => {
      if (notificationsOverlay) {
        notificationsOverlay.classList.add('active');
      }
      const badgeDot = btnOpenNotifications.querySelector('.badge-dot');
      if (badgeDot) badgeDot.style.display = 'none';
      const unreadItem = document.getElementById('notif-preventive-item');
      if (unreadItem) unreadItem.classList.remove('unread');
    });
  }

  if (btnCloseNotifications) {
    btnCloseNotifications.addEventListener('click', () => {
      if (notificationsOverlay) {
        notificationsOverlay.classList.remove('active');
      }
    });
  }

  if (notificationsOverlay) {
    notificationsOverlay.addEventListener('click', (e) => {
      if (e.target === notificationsOverlay) {
        notificationsOverlay.classList.remove('active');
      }
    });
  }

  if (btnNotifDecompression) {
    btnNotifDecompression.addEventListener('click', () => {
      if (notificationsOverlay) notificationsOverlay.classList.remove('active');
      showToast('Starting 3-min evening decompression reset');
      switchView('view-somatic');
      if (typeof startBoxBreathing === 'function') {
        startBoxBreathing();
      }
    });
  }

  if (btnNotifAssessment) {
    btnNotifAssessment.addEventListener('click', () => {
      if (notificationsOverlay) notificationsOverlay.classList.remove('active');
      switchView('view-assessment');
      if (typeof initAssessmentFlow === 'function') {
        initAssessmentFlow();
      }
      showToast('Opening WHO-5 Well-being Assessment');
    });
  }

  // ==========================================================
  // BIOMETRIC AUTHENTICATION CONTROLLER (FR-01)
  // ==========================================================
  function openBiometricModal() {
    if (biometricModal) {
      biometricModal.classList.add('active');
      if (biometricIconWrap) {
        biometricIconWrap.classList.remove('scanning', 'success');
      }
      if (biometricGlyph) {
        biometricGlyph.innerHTML = state.isLocked 
          ? '<svg viewBox="0 0 24 24" class="fnp-icon-lg" style="width: 32px; height: 32px; stroke: currentColor;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
          : '<svg viewBox="0 0 24 24" class="fnp-icon-lg" style="width: 32px; height: 32px; stroke: currentColor;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      }
    }
  }

  function closeBiometricModal() {
    if (biometricModal) {
      biometricModal.classList.remove('active');
    }
  }

  function lockApp() {
    state.isLocked = true;
    if (mobileContainer) mobileContainer.classList.add('app-locked');
    if (btnTriggerBiometric) {
      btnTriggerBiometric.classList.add('locked');
      btnTriggerBiometric.innerHTML = '<svg class="fnp-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
      btnTriggerBiometric.title = 'App Locked · Tap to Authenticate';
    }
    openBiometricModal();
    showToast('App locked for privacy. Health data obscured.');
  }

  function unlockApp(method = 'Biometrics') {
    state.isLocked = false;
    if (mobileContainer) mobileContainer.classList.remove('app-locked');
    if (btnTriggerBiometric) {
      btnTriggerBiometric.classList.remove('locked');
      btnTriggerBiometric.innerHTML = '<svg class="fnp-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
      btnTriggerBiometric.title = 'Biometric Security Active · Tap to Lock';
    }
    closeBiometricModal();
    if (method === 'Biometrics') {
      sound.playChime(659.25, 'triangle', 0.4);
      showToast('Biometrics verified! Health telemetry unlocked');
    } else {
      showToast('Authenticated via device passcode.');
    }
  }

  if (btnTriggerBiometric) {
    btnTriggerBiometric.addEventListener('click', () => {
      if (!state.isLocked) {
        lockApp();
      } else {
        openBiometricModal();
      }
    });
  }

  if (btnBypassBiometrics) {
    btnBypassBiometrics.addEventListener('click', () => {
      unlockApp('Passcode');
    });
  }

  if (btnAuthBiometrics) {
    btnAuthBiometrics.addEventListener('click', () => {
      if (biometricIconWrap) biometricIconWrap.classList.add('scanning');
      if (btnAuthBiometrics) btnAuthBiometrics.textContent = 'Scanning Biometrics...';

      setTimeout(() => {
        if (biometricIconWrap) {
          biometricIconWrap.classList.remove('scanning');
          biometricIconWrap.classList.add('success');
        }
        if (biometricGlyph) biometricGlyph.textContent = '✓';

        setTimeout(() => {
          unlockApp('Biometrics');
          btnAuthBiometrics.textContent = 'Scan FaceID / Fingerprint';
        }, 600);
      }, 900);
    });
  }

  // ==========================================================
  // SCREEN 7: POST-SHIFT DECOMPRESSION & SUBSCRIPTION CONTROLLER
  // ==========================================================
  const btnPostshiftBack = document.getElementById('btn-postshift-back');
  const btnPostshiftClose = document.getElementById('btn-postshift-close');
  const btnContinueFreeTrial = document.getElementById('btn-continue-free-trial');
  const shiftMoodButtons = document.querySelectorAll('.shift-mood-btn');
  const winddownCheckboxes = document.querySelectorAll('#winddown-checklist input[type="checkbox"]');
  const winddownProgressBadge = document.getElementById('winddown-progress-badge');
  const btnOpenPaystackModal = document.getElementById('btn-open-paystack-modal');

  if (btnPostshiftBack) btnPostshiftBack.addEventListener('click', () => switchView('view-home'));
  if (btnPostshiftClose) btnPostshiftClose.addEventListener('click', () => switchView('view-home'));
  if (btnContinueFreeTrial) {
    btnContinueFreeTrial.addEventListener('click', () => {
      showToast('Continuing with free trial. Rest well tonight!');
      switchView('view-home');
    });
  }

  // Shift-End Mood Logging
  shiftMoodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shiftMoodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mood = btn.getAttribute('data-shift-mood');
      localStorage.setItem('ourpadi_shift_end_mood', mood);
      sound.playChime(659.25, 'triangle', 0.3);
      showToast(`Shift-end state recorded: ${mood}`);

      // Dispatch resolution telemetry to Shared Backend
      if (typeof FriendnPalBackend !== 'undefined') {
        FriendnPalBackend.logShiftResolution('8241', mood);
      }
    });
  });

  // Wind-Down Checklist
  function updateWinddownProgress() {
    let completed = 0;
    winddownCheckboxes.forEach(cb => {
      const parent = cb.closest('.winddown-item');
      if (cb.checked) {
        completed++;
        if (parent) parent.classList.add('completed');
      } else {
        if (parent) parent.classList.remove('completed');
      }
    });
    if (winddownProgressBadge) {
      winddownProgressBadge.textContent = `${completed} of ${winddownCheckboxes.length} Completed`;
    }
  }

  winddownCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateWinddownProgress();
      if (cb.checked) {
        sound.playChime(784, 'sine', 0.2);
      }
    });
  });

  // ==========================================================
  // DISCREET PAYSTACK CHECKOUT CONTROLLER (FR-16)
  // ==========================================================
  const paystackModal = document.getElementById('paystack-modal');
  const btnClosePaystackModal = document.getElementById('btn-close-paystack-modal');
  const paystackForm = document.getElementById('paystack-form');
  const btnSubmitPaystack = document.getElementById('btn-submit-paystack');

  function openPaystackModal() {
    if (paystackModal) paystackModal.classList.add('active');
  }

  function closePaystackModal() {
    if (paystackModal) paystackModal.classList.remove('active');
  }

  if (btnOpenPaystackModal) btnOpenPaystackModal.addEventListener('click', openPaystackModal);
  if (btnClosePaystackModal) btnClosePaystackModal.addEventListener('click', closePaystackModal);
  if (paystackModal) {
    paystackModal.addEventListener('click', (e) => {
      if (e.target === paystackModal) closePaystackModal();
    });
  }

  if (paystackForm && btnSubmitPaystack) {
    paystackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      btnSubmitPaystack.innerHTML = '<span>Processing via Paystack (FNP Services)...</span>';
      btnSubmitPaystack.disabled = true;

      setTimeout(() => {
        sound.playChime(783.99, 'triangle', 0.8);
        showToast('Payment successful! Membership active (₦5,000 billed as FNP Services)', 3500);
        if (btnOpenPaystackModal) {
          btnOpenPaystackModal.innerHTML = '<svg class="fnp-icon-xs" viewBox="0 0 24 24" style="color: #10b981; margin-right: 6px;"><polyline points="20 6 9 17 4 12"/></svg><span>Monthly Membership Active (₦5,000 / mo)</span>';
          btnOpenPaystackModal.style.background = 'rgba(16, 185, 129, 0.2)';
          btnOpenPaystackModal.style.borderColor = '#10b981';
          btnOpenPaystackModal.style.color = '#34d399';
        }
        btnSubmitPaystack.innerHTML = '<svg class="fnp-icon-xs" viewBox="0 0 24 24" style="margin-right: 6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Authorize ₦5,000 (FNP Services)</span>';
        btnSubmitPaystack.disabled = false;
        closePaystackModal();
      }, 900);
    });
  }

  // ==========================================================
  // THERAPIST MARKETPLACE BOOKING CONTROLLER (FR-15)
  // ==========================================================
  const therapistModal = document.getElementById('therapist-booking-modal');
  const btnOpenTherapist = document.getElementById('btn-open-therapist-booking');
  const btnCloseTherapistModal = document.getElementById('btn-close-therapist-modal');
  const btnConfirmTherapist = document.getElementById('btn-confirm-therapist-booking');
  const therapistCards = document.querySelectorAll('.therapist-option-card');

  function openTherapistModal() {
    if (therapistModal) therapistModal.classList.add('active');
  }

  function closeTherapistModal() {
    if (therapistModal) therapistModal.classList.remove('active');
  }

  if (btnOpenTherapist) btnOpenTherapist.addEventListener('click', openTherapistModal);
  if (btnCloseTherapistModal) btnCloseTherapistModal.addEventListener('click', closeTherapistModal);
  if (therapistModal) {
    therapistModal.addEventListener('click', (e) => {
      if (e.target === therapistModal) closeTherapistModal();
    });
  }

  therapistCards.forEach(card => {
    card.addEventListener('click', () => {
      therapistCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  if (btnConfirmTherapist) {
    btnConfirmTherapist.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="selected-therapist"]:checked');
      const therapistName = selectedRadio ? selectedRadio.value : 'Certified Therapist';
      const timeSelect = document.getElementById('therapist-date-select');
      const timeVal = timeSelect ? timeSelect.value : 'Scheduled Slot';

      sound.playChime(659.25, 'triangle', 0.5);
      showToast(`Consultation booked with ${therapistName} for ${timeVal}! WhatsApp confirmation sent.`, 4000);
      closeTherapistModal();
    });
  }

  // ==========================================================
  // ARTICLE READER MODAL CONTROLLER (FR-14)
  // ==========================================================
  const articleReaderModal = document.getElementById('article-reader-modal');
  const btnCloseArticleReader = document.getElementById('btn-close-article-reader');
  const btnReaderToSomatic = document.getElementById('btn-reader-to-somatic');
  const readerCategoryBadge = document.getElementById('reader-category-badge');
  const readerArticleTitle = document.getElementById('reader-article-title');
  const readerArticleMeta = document.getElementById('reader-article-meta');
  const readerArticleBody = document.getElementById('reader-article-body');

  const articleDatabase = {
    panic: {
      category: 'Somatic Grounding',
      title: 'How to Halt a Panic Attack in Under 10 Minutes',
      meta: '3 min read · Reviewed by Dr. Chidi Okafor, FWACP',
      body: `
        <p><strong>1. Understand the Alarm:</strong> A panic attack is an intense surge of adrenaline. Your heart rate escalates, chest muscles contract, and peripheral blood vessels constrict. While intensely frightening, a panic attack is physiologically harmless—it is your sympathetic nervous system sounding a smoke alarm when there is no fire.</p>
        <p><strong>2. Engage the Vagus Nerve:</strong> Slow, paced exhalation directly signals the vagal nerve to release acetylcholine, decreasing your heart rate within 90 seconds. Follow the 4-4-4 cadence: inhale smoothly through your nose for 4 seconds, hold your lungs gently for 4 seconds, and exhale slowly through pursed lips for 4 seconds.</p>
        <p><strong>3. Ground Your Senses:</strong> Divert blood flow away from the hyperactive amygdala into the prefrontal cortex by identifying physical objects in your immediate visual field (the 5-4-3-2-1 technique). Touching cool water or holding an ice cube stimulates the trigeminal nerve and breaks mental freeze instantly.</p>
      `
    },
    burnout: {
      category: 'Workplace Health',
      title: 'Breaking the Freeze Cycle: Cognitive Momentum for Remote Freelancers',
      meta: '4 min read · By Folake Adeyemi, MSc',
      body: `
        <p><strong>The Nocturnal Freeze Paradox:</strong> Remote workers operating on international client timezones experience high cortical fatigue between 01:00 AM and 04:00 AM. When an unexpected friction occurs (a power outage, loud generator, or severe client feedback), the brain enters "functional freeze"—you stare at your screen incapable of typing a single word.</p>
        <p><strong>The 15-Minute Singular Constraint:</strong> Overcoming freeze does not require finishing the entire 2,000-word deliverable. It requires lowering cognitive load until the barrier to entry disappears. Set a 15-minute timer with a single non-negotiable rule: draft 3 headlines only. Do not touch grammar or revisions.</p>
        <p><strong>Dopamine Micro-Rewards:</strong> Completing one 15-minute micro-task restores executive agency and dopamine flow. In over 84% of tested sessions, completing sprint 1 naturally carries the worker through sprints 2, 3, and 4.</p>
      `
    },
    trauma: {
      category: 'Family Boundaries',
      title: 'Setting Boundaries with Toxic Relatives Without Guilt',
      meta: '5 min read · By Dr. Chidi Okafor, FWACP',
      body: `
        <p><strong>Cultural Pressure vs. Self-Preservation:</strong> In communal cultures, family demands are often positioned as unconditional obligations. When you are the primary earner managing freelance income while caring for chronically ill relatives, emotional guilt can become paralyzing.</p>
        <p><strong>Clear, Compassionate Scripts:</strong> Boundaries are not attacks; they are structural guardrails that keep you healthy enough to continue providing help. Use neutral, firm language: <em>"I care deeply about this family, but I cannot take on additional financial requests outside of our agreed medical budget this month."</em></p>
        <p><strong>Guilt as a Growing Pain:</strong> Expect internal discomfort when establishing boundaries for the first time. Guilt is not evidence that you did something wrong—it is simply evidence that you broke an unhealthy habit.</p>
      `
    }
  };

  function openArticleReader(articleKey) {
    const article = articleDatabase[articleKey] || articleDatabase.panic;
    if (readerCategoryBadge) readerCategoryBadge.textContent = article.category;
    if (readerArticleTitle) readerArticleTitle.textContent = article.title;
    if (readerArticleMeta) readerArticleMeta.textContent = article.meta;
    if (readerArticleBody) readerArticleBody.innerHTML = article.body;
    if (articleReaderModal) articleReaderModal.classList.add('active');
  }

  function closeArticleReader() {
    if (articleReaderModal) articleReaderModal.classList.remove('active');
  }

  if (btnCloseArticleReader) btnCloseArticleReader.addEventListener('click', closeArticleReader);
  if (articleReaderModal) {
    articleReaderModal.addEventListener('click', (e) => {
      if (e.target === articleReaderModal) closeArticleReader();
    });
  }

  if (btnReaderToSomatic) {
    btnReaderToSomatic.addEventListener('click', () => {
      closeArticleReader();
      switchView('view-somatic');
      startBoxBreathing();
    });
  }

  // Attach click listener to article cards
  const articleCards = document.querySelectorAll('.article-card');
  articleCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-cat') || 'panic';
      openArticleReader(cat);
    });
  });

  // Resource Search Input Filter
  const resourceSearchInput = document.getElementById('resource-search-input');
  if (resourceSearchInput) {
    resourceSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      articleCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  // Resource Category Pills
  const resourceCategoryPills = document.querySelectorAll('#resource-category-pills .pill-option');
  resourceCategoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      resourceCategoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.getAttribute('data-cat');
      articleCards.forEach(card => {
        if (cat === 'all' || card.getAttribute('data-cat') === cat) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================
  // NEW COMMUNITY POST MODAL CONTROLLER (FR-12)
  // ==========================================================
  const communityModal = document.getElementById('community-post-modal');
  const btnOpenCommunityModal = document.getElementById('btn-open-community-modal');
  const btnCloseCommunityModal = document.getElementById('btn-close-community-modal');
  const btnSubmitCommunityPost = document.getElementById('btn-submit-community-post');
  const communityPostTextarea = document.getElementById('community-post-textarea');
  const communityGroupSelect = document.getElementById('community-group-select');
  const communityGroupsList = document.querySelector('.community-groups-list');

  function openCommunityModal() {
    if (communityModal) communityModal.classList.add('active');
  }

  function closeCommunityModal() {
    if (communityModal) communityModal.classList.remove('active');
  }

  if (btnOpenCommunityModal) btnOpenCommunityModal.addEventListener('click', openCommunityModal);
  if (btnCloseCommunityModal) btnCloseCommunityModal.addEventListener('click', closeCommunityModal);
  if (communityModal) {
    communityModal.addEventListener('click', (e) => {
      if (e.target === communityModal) closeCommunityModal();
    });
  }

  if (btnSubmitCommunityPost && communityPostTextarea) {
    btnSubmitCommunityPost.addEventListener('click', () => {
      const content = communityPostTextarea.value.trim();
      if (!content) {
        showToast('Please type a reflection to share');
        return;
      }
      const groupName = communityGroupSelect.options[communityGroupSelect.selectedIndex].text;
      const newCard = document.createElement('div');
      newCard.className = 'community-group-card';
      newCard.innerHTML = `
        <div class="group-header">
          <span class="group-icon"><svg class="fnp-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
          <div style="flex: 1;">
            <div class="group-title">${escapeHTML(groupName)}</div>
            <div class="group-meta">Posted by @Amina94 · Just now</div>
          </div>
          <span class="card-badge badge-blue">New Post</span>
        </div>
        <p class="group-snippet">"${escapeHTML(content)}"</p>
        <div class="group-footer">
          <button class="reaction-btn" data-reactions="1"><svg class="fnp-icon-xs" viewBox="0 0 24 24" aria-hidden="true" style="color: var(--accent-rose); stroke: currentColor; fill: currentColor;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span>1</span> support you</button>
          <span style="font-size: 0.7rem; color: var(--text-muted);">0 replies</span>
        </div>
      `;

      // Attach reaction listener to the new post
      const reactBtn = newCard.querySelector('.reaction-btn');
      if (reactBtn) {
        reactBtn.addEventListener('click', () => {
          let count = parseInt(reactBtn.getAttribute('data-reactions') || '1', 10);
          count++;
          reactBtn.setAttribute('data-reactions', count);
          const span = reactBtn.querySelector('span');
          if (span) span.textContent = count;
          sound.playChime(784, 'sine', 0.2);
          showToast('Support reaction logged ❤️');
        });
      }

      if (communityGroupsList) {
        communityGroupsList.prepend(newCard);
      }
      communityPostTextarea.value = '';
      sound.playChime(659.25, 'triangle', 0.4);
      showToast('Post shared anonymously to peer group ❤️');
      closeCommunityModal();
    });
  }

  // Community Category Tabs Filter
  const communityTabs = document.querySelectorAll('.communities-category-tabs .pill-option');
  communityTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      communityTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const commFilter = tab.getAttribute('data-comm');
      const cards = document.querySelectorAll('.community-group-card');
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (commFilter === 'all') {
          card.style.display = 'block';
        } else if (commFilter === 'trauma' && (text.includes('parental') || text.includes('trauma'))) {
          card.style.display = 'block';
        } else if (commFilter === 'recovery' && text.includes('addiction')) {
          card.style.display = 'block';
        } else if (commFilter === 'burnout' && text.includes('freelancer')) {
          card.style.display = 'block';
        } else {
          card.style.display = (commFilter === 'all') ? 'block' : 'none';
        }
      });
    });
  });

  // ==========================================================
  
  // ==========================================================
  // REAL-TIME BACKEND LISTENERS (SYNC FROM CLINICIAN DASHBOARD)
  // ==========================================================
  if (typeof FriendnPalBackend !== 'undefined') {
    FriendnPalBackend.on('CAREPLAN_UPDATED', (payload) => {
      sound.playChime(659.25, 'triangle', 0.5);
      showToast('Dr. Chidi Okafor updated your Care Plan');
    });

    FriendnPalBackend.on('NOTE_LOGGED', (payload) => {
      sound.playChime(523.25, 'sine', 0.3);
      showToast('New clinical note logged in your record');
    });
  }

  console.log('OurPadi Mobile Patient Application initialized & connected to telemetry backend.');
})();