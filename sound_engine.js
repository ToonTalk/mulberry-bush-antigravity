/**
 * MULBERRY BUSH (1976 -> 2026)
 * Synchronized Audio & Live Web Audio API Synthesis Engine
 */

class MulberrySoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.echoDelay = null;
    this.echoFeedback = null;
    this.echoWet = null;

    // Pre-rendered studio tracks for frame-exact 2:54 linear timeline
    this.tracks = {
      synched: new Audio("assets/synched_soundtrack.mp3"),
      hybrid: new Audio("assets/hybrid_soundtrack.mp3"),
      original: new Audio("assets/original_1976_audio.mp3"),
    };
    Object.values(this.tracks).forEach((a) => {
      a.preload = "auto";
    });

    this.activeTrackMode = "synched"; // 'synched' | 'hybrid' | 'original'
    this.isMuted = false;
    this.volume = 0.9;

    // Live interactive 6/8 jig sequencer state (used in Manual Sandbox mode or interactive triggers)
    this.MELODY_A = [
      [67, 1], [67, 1], [67, 1], [67, 1], [71, 1], [74, 1],
      [71, 1], [67, 1], [67, 2], null, [62, 1], [64, 1],
      [69, 1], [69, 1], [69, 1], [69, 1], [66, 1], [62, 1],
      [67, 1], [67, 1], [67, 2], null, [71, 1], [72, 1],
      [67, 1], [67, 1], [67, 1], [67, 1], [71, 1], [74, 1],
      [76, 2], null, [74, 1], [72, 1], [71, 1], [69, 1],
      [71, 1], [74, 1], [71, 1], [69, 1], [66, 1], [62, 1],
      [67, 2], null, [71, 1], [67, 2], null, null,
    ];
    this.BASS_NOTES = [55, 55, 50, 55, 55, 48, 50, 55];
    this.liveSlotIdx = 0;
    this.liveAccumTime = 0;

    // Real-time stem levels for UI visualizer (0..1)
    this.stemLevels = {
      colored: 0,
      silhouette: 0,
      giant_red: 0,
      hatching: 0,
      small_dots: 0,
      giant_dots: 0,
    };
  }

  initContext() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);

    // 1976 Analog Tape Slapback Delay network
    this.echoDelay = this.ctx.createDelay(1.0);
    this.echoDelay.delayTime.value = 0.19; // 190ms slapback
    this.echoFeedback = this.ctx.createGain();
    this.echoFeedback.gain.value = 0.38;
    this.echoWet = this.ctx.createGain();
    this.echoWet.gain.value = 0.45;

    this.echoDelay.connect(this.echoFeedback);
    this.echoFeedback.connect(this.echoDelay);
    this.echoDelay.connect(this.echoWet);
    this.echoWet.connect(this.masterGain);
  }

  m2f(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setTrackMode(mode, currentTime, isPlaying) {
    if (!this.tracks[mode]) return;
    const prev = this.tracks[this.activeTrackMode];
    prev.pause();
    this.activeTrackMode = mode;
    const next = this.tracks[mode];
    next.currentTime = Math.min(next.duration || 174.6, Math.max(0, currentTime));
    next.volume = this.isMuted ? 0 : this.volume;
    if (isPlaying) {
      next.play().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
    Object.values(this.tracks).forEach((a) => {
      a.volume = this.isMuted ? 0 : this.volume;
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  playLinear(currentTime) {
    this.initContext();
    const track = this.tracks[this.activeTrackMode];
    if (Math.abs(track.currentTime - currentTime) > 0.25) {
      track.currentTime = currentTime;
    }
    track.volume = this.isMuted ? 0 : this.volume;
    track.play().catch(() => {});
  }

  pauseLinear() {
    Object.values(this.tracks).forEach((a) => a.pause());
  }

  seekLinear(currentTime) {
    const track = this.tracks[this.activeTrackMode];
    try {
      track.currentTime = Math.max(0, Math.min(174.6, currentTime));
    } catch (e) {}
  }

  /**
   * Live Web Audio API Synthesis for interactive triggers, Sandbox mode, and Cel Stamping
   */
  triggerVoice(midi, dur, style, pan = 0, useEcho = false, gainScale = 1.0) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freq = this.m2f(midi);

    const panner = this.ctx.createStereoPanner
      ? this.ctx.createStereoPanner()
      : null;
    const vGain = this.ctx.createGain();

    if (panner) {
      panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
      vGain.connect(panner);
      panner.connect(this.masterGain);
      if (useEcho && this.echoDelay) {
        panner.connect(this.echoDelay);
      }
    } else {
      vGain.connect(this.masterGain);
      if (useEcho && this.echoDelay) {
        vGain.connect(this.echoDelay);
      }
    }

    const peak = 0.16 * gainScale;

    if (style === "colored") {
      // Plucked Clawhammer Banjo + Warm Reed Accordion harmonic
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "triangle";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2.002, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 6, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.012);
      vGain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(vGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.02);
      osc2.stop(now + dur + 0.02);
      this.stemLevels.colored = Math.min(1, this.stemLevels.colored + 0.45);
    } else if (style === "silhouette") {
      // Hollow Wooden Marimba + Woodblock overtone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 3.98, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.35, now);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak * 1.2, now + 0.006);
      vGain.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.85);

      osc1.connect(vGain);
      osc2.connect(g2);
      g2.connect(vGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
      this.stemLevels.silhouette = Math.min(1, this.stemLevels.silhouette + 0.45);
    } else if (style === "giant_red") {
      // Deep Bowed Cello / Low Brass Foreground Swell
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(freq * 0.5, now);
      osc2.frequency.setValueAtTime(freq * 0.502, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.linearRampToValueAtTime(620, now + dur * 0.5);
      filter.frequency.linearRampToValueAtTime(160, now + dur);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak * 1.35, now + dur * 0.35);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(vGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.05);
      osc2.stop(now + dur + 0.05);
      this.stemLevels.giant_red = Math.min(1, this.stemLevels.giant_red + 0.7);
    } else if (style === "hatching") {
      // Striated 1976 Harpsichord / Clavinet + Pen-Scrape Pulse
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 3.2;
      filter.frequency.setValueAtTime(freq * 2.5, now);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak * 1.1, now + 0.008);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);

      osc.connect(filter);
      filter.connect(vGain);
      osc.start(now);
      osc.stop(now + dur);
      this.stemLevels.hatching = Math.min(1, this.stemLevels.hatching + 0.45);
    } else if (style === "small_dots") {
      // Pointillist Celesta / Kalimba Bell Droplet
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(freq * 2, now);
      osc2.frequency.setValueAtTime(freq * 5.4, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.2, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak * 1.0, now + 0.005);
      vGain.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.9);

      osc1.connect(vGain);
      osc2.connect(g2);
      g2.connect(vGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
      this.stemLevels.small_dots = Math.min(1, this.stemLevels.small_dots + 0.45);
    } else if (style === "giant_dots") {
      // 1976 Buchla/Moog Resonant Filter Pop for Giant Avery Stickers
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 1.12, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 7.5;
      filter.frequency.setValueAtTime(freq * 5.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.4, now + dur * 0.9);

      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak * 1.15, now + 0.01);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(vGain);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      this.stemLevels.giant_dots = Math.min(1, this.stemLevels.giant_dots + 0.5);
    }
  }

  playStyleFlourish(style) {
    const chord = [67, 71, 74, 79]; // G Major arpeggio
    chord.forEach((midi, idx) => {
      setTimeout(() => {
        this.triggerVoice(
          midi,
          0.32,
          style,
          (idx - 1.5) * 0.35,
          style === "silhouette" || style === "colored",
          0.85
        );
      }, idx * 70);
    });
  }

  playDotCollapseCascade() {
    this.initContext();
    const scale = [86, 84, 83, 81, 79, 76, 74, 72, 71, 69, 67, 64, 62, 60, 57, 55];
    scale.forEach((midi, idx) => {
      setTimeout(() => {
        const pan = 0.25 + (idx / scale.length) * 0.55;
        this.triggerVoice(midi, 0.22, "small_dots", pan, false, 0.9);
        if (idx % 2 === 0) {
          this.triggerVoice(midi - 12, 0.18, "silhouette", pan, false, 0.65);
        }
      }, idx * 62);
    });
  }

  playDotReassembleCascade() {
    this.initContext();
    const scale = [55, 62, 67, 71, 74, 79, 83];
    scale.forEach((midi, idx) => {
      setTimeout(() => {
        this.triggerVoice(midi, 0.25, "small_dots", 0.5 - idx * 0.08, true, 0.85);
      }, idx * 48);
    });
  }

  /**
   * Advances the live interactive 6/8 jig synthesizer when running in Free/Sandbox mode
   * (or when linear audio is not playing)
   */
  stepSandboxMusic(dt, activeStyles, pan = 0) {
    // Decay stem visualizer bars smoothly
    for (const k of Object.keys(this.stemLevels)) {
      this.stemLevels[k] = Math.max(0, this.stemLevels[k] - dt * 2.4);
    }

    this.liveAccumTime += dt;
    const slotDur = 1 / 3; // 120 BPM 6/8 eighth-note slot (0.333s)
    if (this.liveAccumTime < slotDur) return;
    this.liveAccumTime -= slotDur;

    const slot = this.liveSlotIdx % this.MELODY_A.length;
    const barIdx = Math.floor(slot / 6);
    const beatInBar = slot % 6;
    const noteInfo = this.MELODY_A[slot];
    const bassMidi = this.BASS_NOTES[barIdx % this.BASS_NOTES.length];
    this.liveSlotIdx++;

    const useEcho = !!activeStyles.ghost_echo;

    if (activeStyles.dot_collapse > 0.5) {
      return;
    }

    if (beatInBar === 0 || beatInBar === 3) {
      if (activeStyles.giant_red > 0.2) {
        this.triggerVoice(bassMidi, 0.95, "giant_red", pan * 0.8, useEcho, 0.85);
      }
      if (activeStyles.colored > 0.2) {
        this.triggerVoice(bassMidi, 0.4, "colored", pan * 0.3, false, 0.6);
      }
      if (activeStyles.giant_dots > 0.2) {
        this.triggerVoice(bassMidi, 0.4, "giant_dots", pan * 0.4, false, 0.65);
      }
    }

    if (activeStyles.hatching > 0.2) {
      const arpNotes = [bassMidi + 12, bassMidi + 16, bassMidi + 19];
      const arpMidi = arpNotes[beatInBar % 3] + (beatInBar >= 3 ? 12 : 0);
      this.triggerVoice(arpMidi, 0.28, "hatching", -pan * 0.5, useEcho, 0.55);
    }

    if (noteInfo) {
      const [midi, lenSlots] = noteInfo;
      const dur = lenSlots * slotDur;
      if (activeStyles.colored > 0.2) {
        this.triggerVoice(midi, dur, "colored", pan * 0.5, useEcho, 0.85);
      }
      if (activeStyles.silhouette > 0.2) {
        this.triggerVoice(midi, dur, "silhouette", pan * 0.5, useEcho, 0.85);
      }
      if (activeStyles.small_dots > 0.2) {
        this.triggerVoice(midi, dur * 0.85, "small_dots", pan * 0.6, useEcho, 0.85);
      }
      if (activeStyles.giant_dots > 0.2) {
        this.triggerVoice(midi, dur * 0.9, "giant_dots", pan * 0.5, useEcho, 0.8);
      }
      if (
        !activeStyles.colored &&
        !activeStyles.silhouette &&
        !activeStyles.small_dots &&
        !activeStyles.giant_dots &&
        activeStyles.hatching > 0.2
      ) {
        this.triggerVoice(midi, dur, "hatching", pan * 0.5, useEcho, 0.85);
      }
    }
  }

  /**
   * Updates stem meter levels from timeline state when playing linear studio score
   */
  updateStemsFromTimelineState(styles, dt) {
    const keys = [
      "colored",
      "silhouette",
      "giant_red",
      "hatching",
      "small_dots",
      "giant_dots",
    ];
    const pulse = 0.72 + 0.28 * Math.sin(performance.now() * 0.018);
    for (const k of keys) {
      const target = (styles[k] || 0) * pulse;
      this.stemLevels[k] += (target - this.stemLevels[k]) * Math.min(1, dt * 10);
    }
  }
}

window.MulberrySoundEngine = MulberrySoundEngine;
