/**
 * MULBERRY BUSH: RADICAL REINTERPRETATION (1976 -> 2026)
 * Three-Act Expanded-Cinema Spatial Web Audio API Soundtrack Engine
 *
 * Act I   (0:00 - 0:45): Live Dancers Around the Backlit Screen (Stage Footsteps, Claps, Acoustic Folk & Shadow Drone)
 * Act II  (0:45 - 2:15): The Projected Metamorphosis (6 Radical Worlds: Prism Canon, Scanline FM, Botanical Koto,
 *                        Quantum Swarm & Singularity Supernova, Bauhaus Buchla Agents, Spacetime CS-80 Ribbons)
 * Act III (2:15 - 3:00): The Grand Synthesis (Live Dancers + Projected Spirits Unite Around the Screen)
 */

class RadicalSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbConvolver = null;
    this.reverbWet = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayWet = null;

    this.isMuted = false;
    this.volume = 0.88;

    // 120 BPM 6/8 Jig Grid: 1 bar = 2.0s, 6 eighth-note slots per bar (slot = 0.3333s, 16th = 0.1667s)
    this.lastSlotIndex = -1;

    // Core Mulberry Bush 6/8 Motif in G Major / G Lydian (MIDI notes)
    this.THEME_SLOTS = [
      // Bar 1 (G): G4 G4 G4 G4 B4 D5
      67, 67, 67, 67, 71, 74,
      // Bar 2 (G/Em): B4 G4 G4 - D4 E4
      71, 67, 67, null, 62, 64,
      // Bar 3 (D/F#): A4 A4 A4 A4 F#4 D4
      69, 69, 69, 69, 66, 62,
      // Bar 4 (G): G4 G4 G4 - B4 C#5
      67, 67, 67, null, 71, 73,
      // Bar 5 (G/C): G4 B4 D5 G5 D5 B4
      67, 71, 74, 79, 74, 71,
      // Bar 6 (C#dim/Am): E5 D5 C5 B4 A4 G4
      76, 74, 72, 71, 69, 67,
      // Bar 7 (D7): B4 D5 B4 A4 F#4 D4
      71, 74, 71, 69, 66, 62,
      // Bar 8 (G): G4 D4 B4 G4 - -
      67, 62, 71, 67, null, null,
    ];

    this.BASS_PROGRESSION = [55, 52, 50, 55, 55, 48, 50, 55]; // G, Em, D, G, G, C, D, G
    this.CHORD_VOICINGS = [
      [67, 71, 74, 78], // Gmaj7
      [64, 67, 71, 74], // Em7
      [62, 66, 69, 74], // D
      [67, 71, 74, 79], // G
      [67, 71, 74, 78], // Gmaj7
      [60, 64, 67, 72], // Cmaj7(#11)
      [62, 66, 69, 72], // D7
      [67, 71, 74, 79], // G
    ];

    // Live UI telemetry for 6 sound channels
    this.meters = {
      stage_live: 0,
      shadow_drone: 0,
      prism_canon: 0,
      scanline_synth: 0,
      quantum_bells: 0,
      spacetime_pad: 0,
    };
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Stereo Ping-Pong / Tape Delay for Spaciousness
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.25;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.36;
    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.value = 0.32;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.masterGain);

    // Synthetic Hall Impulse Response for Expanded-Cinema Theater Acoustics
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createHallImpulse(2.1, 2.8);
    this.reverbWet = this.ctx.createGain();
    this.reverbWet.gain.value = 0.28;
    this.reverbConvolver.connect(this.reverbWet);
    this.reverbWet.connect(this.masterGain);
  }

  createHallImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  m2f(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
    return this.isMuted;
  }

  connectSpatial(node, pan = 0, sendDelay = false, sendReverb = true) {
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.92, Math.min(0.92, pan));
      node.connect(panner);
      panner.connect(this.masterGain);
      if (sendDelay && this.delayNode) panner.connect(this.delayNode);
      if (sendReverb && this.reverbConvolver) panner.connect(this.reverbConvolver);
    } else {
      node.connect(this.masterGain);
      if (sendDelay && this.delayNode) node.connect(this.delayNode);
      if (sendReverb && this.reverbConvolver) node.connect(this.reverbConvolver);
    }
  }

  /**
   * 1. ACT I & III: Physical Stage Footsteps, Handclaps & Acoustic Folk Voices
   */
  playStageFootstep(pan = 0, distanceGain = 1.0, isAccent = false) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Wooden stage board resonance (low thump + shoe tap click)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    const baseFreq = isAccent ? 118 : 142;
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.085);

    const amp = (isAccent ? 0.24 : 0.14) * distanceGain;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.095);

    osc.connect(g);
    this.connectSpatial(g, pan, false, true);
    osc.start(now);
    osc.stop(now + 0.11);
    this.meters.stage_live = Math.min(1, this.meters.stage_live + 0.35);
  }

  playStageHandclap(pan = 0) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufSize = Math.floor(this.ctx.sampleRate * 0.09);
    const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.018));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1350;
    filter.Q.value = 2.2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    src.connect(filter);
    filter.connect(g);
    this.connectSpatial(g, pan, false, true);
    src.start(now);
    this.meters.stage_live = Math.min(1, this.meters.stage_live + 0.45);
  }

  playAcousticFolkNote(midi, dur, pan = 0, gainScale = 1.0) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freq = this.m2f(midi);

    // Plucked acoustic string + warm concertina reed
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "triangle";
    osc2.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.003, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 5.2, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.4, now + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.14 * gainScale, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    this.connectSpatial(g, pan, false, true);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
    this.meters.stage_live = Math.min(1, this.meters.stage_live + 0.4);
  }

  /**
   * 2. Optical Backlit Shadow Swell (Triggered when a dancer passes close to the Rear Halogen Lamp!)
   */
  playBacklitShadowDrone(midi, dur, shadowMag = 1.0, pan = 0) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freq = this.m2f(midi);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq * 0.5, now);
    osc2.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 4.0;
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.linearRampToValueAtTime(220 + shadowMag * 480, now + dur * 0.45);
    filter.frequency.linearRampToValueAtTime(130, now + dur);

    const g = this.ctx.createGain();
    const peak = Math.min(0.24, 0.09 * shadowMag);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(peak, now + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    this.connectSpatial(g, pan, true, true);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.04);
    osc2.stop(now + dur + 0.04);
    this.meters.shadow_drone = Math.min(1, this.meters.shadow_drone + 0.65);
  }

  /**
   * 3. ACT II RADICAL WORLD VOICES
   */
  playWorldVoice(worldKey, midi, dur, pan = 0, gainScale = 1.0) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freq = this.m2f(midi);

    if (worldKey === "prism") {
      // World 1: Steve Reich-style Glass Marimba & Overtone Bell
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 3.0, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.25, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16 * gainScale, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.9);

      osc1.connect(g);
      osc2.connect(g2);
      g2.connect(g);
      this.connectSpatial(g, pan, true, true);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
      this.meters.prism_canon = Math.min(1, this.meters.prism_canon + 0.5);
    } else if (worldKey === "scanlines") {
      // World 2: Rutt-Etra Oscilloscope Wave-Table & Resonant Filter Sweep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 0.996, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 5.5;
      filter.frequency.setValueAtTime(freq * 1.2, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 4.8, now + dur * 0.5);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.15 * gainScale, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      this.connectSpatial(g, pan, true, true);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.02);
      osc2.stop(now + dur + 0.02);
      this.meters.scanline_synth = Math.min(1, this.meters.scanline_synth + 0.55);
    } else if (worldKey === "botanical") {
      // World 3: Plucked Botanical Koto/Harp + Harmonic Breath Flute
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2.0, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16 * gainScale, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur * 1.2);

      osc1.connect(g);
      osc2.connect(g);
      this.connectSpatial(g, pan, true, true);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur * 1.25);
      osc2.stop(now + dur * 1.25);
      this.meters.prism_canon = Math.min(1, this.meters.prism_canon + 0.45);
    } else if (worldKey === "quantum") {
      // World 4: Shimmering Granular Point-Cloud Bell Swarm
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq * 2.0, now);
      osc2.frequency.setValueAtTime(freq * 4.01, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11 * gainScale, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0006, now + dur * 1.1);

      osc1.connect(g);
      osc2.connect(g);
      this.connectSpatial(g, pan, true, true);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur * 1.15);
      osc2.stop(now + dur * 1.15);
      this.meters.quantum_bells = Math.min(1, this.meters.quantum_bells + 0.5);
    } else if (worldKey === "bauhaus") {
      // World 5: 1976 Buchla Low-Pass Gate Bongo & Elastic Sticker-Agent Pop
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 1.22, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 8.0;
      filter.frequency.setValueAtTime(freq * 6.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + dur * 0.85);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16 * gainScale, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.9);

      osc.connect(filter);
      filter.connect(g);
      this.connectSpatial(g, pan, true, false);
      osc.start(now);
      osc.stop(now + dur);
      this.meters.scanline_synth = Math.min(1, this.meters.scanline_synth + 0.5);
    } else if (worldKey === "spacetime") {
      // World 6: Lush Polyphonic CS-80 Spacetime String & Brass Ribbon
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.005, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 1.5, now);
      filter.frequency.linearRampToValueAtTime(freq * 3.8, now + dur * 0.5);
      filter.frequency.linearRampToValueAtTime(freq * 1.8, now + dur * 1.4);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11 * gainScale, now + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur * 1.45);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      this.connectSpatial(g, pan, true, true);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur * 1.5);
      osc2.stop(now + dur * 1.5);
      this.meters.spacetime_pad = Math.min(1, this.meters.spacetime_pad + 0.55);
    }
  }

  /**
   * Special Sound Event: Gravitational Singularity Collapse & Big-Bang Supernova!
   */
  playSingularityCollapseAndSupernova() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // 1. Inward swirling vortex glissando (0.0s - 1.6s)
    const vortexNotes = [86, 84, 83, 81, 79, 78, 76, 74, 72, 71, 69, 67, 64, 62, 59, 55, 50, 43];
    vortexNotes.forEach((midi, idx) => {
      setTimeout(() => {
        const pan = Math.sin(idx * 0.9) * (1 - idx / vortexNotes.length) * 0.85;
        this.playWorldVoice("quantum", midi, 0.24, pan, 0.9);
      }, idx * 75);
    });

    // 2. Sub-bass implosion thump at 1.35s
    setTimeout(() => {
      this.playBacklitShadowDrone(31, 1.2, 2.2, 0);
    }, 1300);

    // 3. Radiant Supernova Chord Burst at 2.1s when particles explode back into the ring!
    const supernovaChord = [43, 50, 55, 62, 67, 71, 74, 78, 83, 86];
    setTimeout(() => {
      supernovaChord.forEach((midi, i) => {
        const pan = ((i / (supernovaChord.length - 1)) * 2 - 1) * 0.85;
        this.playWorldVoice("spacetime", midi, 1.8, pan, 0.85);
        this.playWorldVoice("quantum", midi, 1.2, -pan, 0.75);
      });
    }, 2050);
  }

  /**
   * Master Frame-Synched Sequencer Step
   * Called every animation frame with current performance time t, dt, act, activeWorld, and dancer telemetry
   */
  step(t, dt, act, activeWorld, dancerTelemetry, isSingularity) {
    // Smoothly decay UI meters
    for (const k of Object.keys(this.meters)) {
      this.meters[k] = Math.max(0, this.meters[k] - dt * 2.2);
    }

    const slotDur = 1 / 3; // 6 eighth-note slots per 2.0s bar at 120 BPM
    const slotIndex = Math.floor(t / slotDur);
    if (slotIndex === this.lastSlotIndex) return;
    this.lastSlotIndex = slotIndex;

    if (isSingularity) return;

    const slotInPhrase = ((slotIndex % 48) + 48) % 48;
    const barIdx = Math.floor(slotInPhrase / 6);
    const beatInBar = slotInPhrase % 6;

    const melodyMidi = this.THEME_SLOTS[slotInPhrase];
    const bassMidi = this.BASS_PROGRESSION[barIdx];
    const chord = this.CHORD_VOICINGS[barIdx];

    // Pick spatial pan from lead dancer's X position on stage
    const leadDancer = dancerTelemetry && dancerTelemetry[slotIndex % 4];
    const leadPan = leadDancer ? leadDancer.pan : Math.sin(t * 1.1) * 0.6;

    // =========================================================================
    // ACT I (Live Backlit Screen) & ACT III (Grand Synthesis): Live Room Layer
    // =========================================================================
    if (act === 1 || act === 3) {
      // 6/8 Skipping footsteps from the 4 dancers orbiting the screen
      if (beatInBar === 0 || beatInBar === 2 || beatInBar === 3 || beatInBar === 5) {
        const d = dancerTelemetry ? dancerTelemetry[beatInBar % 4] : { pan: 0, distGain: 0.8 };
        this.playStageFootstep(d.pan, d.distGain, beatInBar === 0 || beatInBar === 3);
      }

      // Live Handclaps on dotted-quarter beats (slots 0 and 3)
      if (beatInBar === 0 || (beatInBar === 3 && barIdx % 2 === 1)) {
        this.playStageHandclap(-leadPan * 0.5);
      }

      // Live Acoustic Banjo & Concertina playing the Mulberry Bush melody
      if (melodyMidi !== null) {
        this.playAcousticFolkNote(melodyMidi, slotDur * 1.1, leadPan * 0.6, act === 3 ? 0.85 : 1.0);
      }
      if (beatInBar === 0 || beatInBar === 3) {
        this.playAcousticFolkNote(bassMidi, slotDur * 1.4, 0, 0.75);
      }

      // Rear Halogen Lamp Shadow Drone: swells whenever a dancer passes close to the rear bulb!
      if (beatInBar === 0 && dancerTelemetry) {
        let maxShadow = 0;
        let shadowPan = 0;
        for (const dtel of dancerTelemetry) {
          if (dtel.shadowMag > maxShadow) {
            maxShadow = dtel.shadowMag;
            shadowPan = dtel.pan;
          }
        }
        if (maxShadow > 1.15) {
          this.playBacklitShadowDrone(bassMidi - 12, 0.95, maxShadow, shadowPan);
        }
      }
    }

    // =========================================================================
    // ACT II (Projected Metamorphosis) & ACT III (Grand Synthesis): World Layers
    // =========================================================================
    if (act === 2 || act === 3) {
      const wGain = act === 3 ? 0.75 : 1.0;

      if (activeWorld === "prism" || act === 3) {
        // 3-Voice Cyan/Magenta/Yellow Phase Canon!
        if (melodyMidi !== null) {
          this.playWorldVoice("prism", melodyMidi, slotDur, -0.65, wGain);
        }
        const canon2 = this.THEME_SLOTS[(slotInPhrase + 46) % 48];
        if (canon2 !== null) {
          this.playWorldVoice("prism", canon2 + 12, slotDur * 0.85, 0.65, wGain * 0.75);
        }
      }

      if (activeWorld === "scanlines") {
        // Rapid 16th-note oscilloscope wave-table arpeggios
        const arpNote = chord[beatInBar % chord.length] + (beatInBar >= 3 ? 12 : 0);
        this.playWorldVoice("scanlines", arpNote, slotDur * 0.9, leadPan, wGain);
        if (melodyMidi !== null) {
          this.playWorldVoice("scanlines", melodyMidi, slotDur * 1.1, -leadPan * 0.5, wGain * 0.9);
        }
      }

      if (activeWorld === "botanical") {
        if (melodyMidi !== null) {
          this.playWorldVoice("botanical", melodyMidi, slotDur * 1.2, leadPan * 0.6, wGain);
        }
        // Blooming mulberry branch fifths
        if (beatInBar === 1 || beatInBar === 4) {
          this.playWorldVoice("botanical", chord[2] + 12, slotDur * 1.4, -leadPan * 0.7, wGain * 0.7);
        }
      }

      if (activeWorld === "quantum" || act === 3) {
        // Pointillist granular bell cloud
        const bellMidi = melodyMidi !== null ? melodyMidi : chord[beatInBar % chord.length];
        this.playWorldVoice("quantum", bellMidi, slotDur * 0.9, leadPan * 0.8, wGain * 0.85);
        setTimeout(() => {
          this.playWorldVoice("quantum", bellMidi + 7, slotDur * 0.7, -leadPan * 0.8, wGain * 0.6);
        }, 165);
      }

      if (activeWorld === "bauhaus") {
        // Bouncy Buchla low-pass gate agents
        if (melodyMidi !== null) {
          this.playWorldVoice("bauhaus", melodyMidi, slotDur * 0.9, leadPan, wGain);
        }
        if (beatInBar === 0 || beatInBar === 2 || beatInBar === 4) {
          this.playWorldVoice("bauhaus", bassMidi, slotDur * 0.75, -leadPan * 0.4, wGain * 0.85);
        }
      }

      if (activeWorld === "spacetime" || act === 3) {
        // Soaring CS-80 chords on bar downbeats + melody
        if (beatInBar === 0) {
          chord.forEach((cMidi, idx) => {
            this.playWorldVoice("spacetime", cMidi, 1.85, (idx - 1.5) * 0.45, wGain * 0.8);
          });
        }
        if (melodyMidi !== null && act === 2) {
          this.playWorldVoice("spacetime", melodyMidi + 12, slotDur * 1.3, leadPan * 0.5, wGain * 0.75);
        }
      }
    }
  }
}

window.RadicalSoundEngine = RadicalSoundEngine;
