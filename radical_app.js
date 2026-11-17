/**
 * MULBERRY BUSH: RADICAL REINTERPRETATION (1976 -> 2026)
 * Three-Act Expanded-Cinema Application Controller
 */

const RADICAL_CHAPTERS = [
  {
    start: 0,
    end: 18,
    act: 1,
    world: "prism",
    title: "ACT I.a • Live in the Room: Four Friends Around the Backlit Screen",
    desc: "Ken, Fannie, Dave & Cathy orbit the translucent muslin screen in 3D space • Live Stage Footsteps, Claps & Acoustic Jig",
  },
  {
    start: 18,
    end: 45,
    act: 1,
    world: "prism",
    title: "ACT I.b • Inverse-Square Shadow Giants: Near the Rear Halogen Bulb",
    desc: "As dancers pass close to the rear spotlight, their backlit shadows tower 3x high in crimson & charcoal • Bowed Shadow Drone",
  },
  {
    start: 45,
    end: 60,
    act: 2,
    world: "prism",
    title: "ACT II • World 1: Tri-Color CMY Prism Shadow-Theater",
    desc: "Stage lights dim; 3 Cyan/Magenta/Yellow lamps split each dancer into a 3-voice Steve Reich marimba phase canon",
  },
  {
    start: 60,
    end: 75,
    act: 2,
    world: "scanlines",
    title: "ACT II • World 2: Rutt-Etra Oscilloscope Scanline Field",
    desc: "The 1976 contour hatching evolves into a living 44-line vector CRT wave field deformed by the dancers' bodies",
  },
  {
    start: 75,
    end: 90,
    act: 2,
    world: "botanical",
    title: "ACT II • World 3: Botanical Mulberry Mycelium & Fractal Canopy",
    desc: "A living fractal Mulberry Tree blooms at center stage as branching twigs & glowing berries sprout from the dancers",
  },
  {
    start: 90,
    end: 108,
    act: 2,
    world: "quantum",
    title: "ACT II • World 4: Quantum Point-Cloud & The 1:42 Singularity Supernova!",
    desc: "320 bioluminescent dots form the dancers, implode into a gravitational vortex at 1:42, and detonate in a chordal supernova!",
  },
  {
    start: 108,
    end: 122,
    act: 2,
    world: "bauhaus",
    title: "ACT II • World 5: Kinetic Pop-Art Bauhaus Sticker Agents",
    desc: "The 1976 Avery color labels become spring-coupled 3D spheres bouncing to Buchla low-pass gate polyrhythms",
  },
  {
    start: 122,
    end: 135,
    act: 2,
    world: "spacetime",
    title: "ACT II • World 6: Chronophotographic 50-Year Spacetime Ribbons",
    desc: "Iridescent Marey/McLaren motion-trail ribbons weave 50 years of circular revolutions around the bush",
  },
  {
    start: 135,
    end: 180,
    act: 3,
    world: "spacetime",
    title: "ACT III • The Return & Grand Synthesis: Live Dancers + Projected Spirits Unite!",
    desc: "The 4 live dancers return around the backlit screen, dancing hand-in-hand with their projected avatars in full-ensemble counterpoint",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("radical-stage-canvas");
  const video = document.getElementById("archival-1976-video");
  const ribbonCanvas = document.getElementById("radical-ribbon-canvas");

  const sound = new window.RadicalSoundEngine();
  const stage = new window.RadicalStageRenderer(canvas, video);

  let isPlaying = false;
  let currentTime = 0.0;
  const DURATION = 180.0; // 3:00 Three-Act Performance

  let lockMode = "auto"; // 'auto' (follows 3-Act score) | 'manual'
  let manualAct = 1;
  let manualWorld = "prism";
  let triggeredScheduledSingularity = false;

  function getChapter(t) {
    for (const ch of RADICAL_CHAPTERS) {
      if (t >= ch.start && t < ch.end) return ch;
    }
    return RADICAL_CHAPTERS[RADICAL_CHAPTERS.length - 1];
  }

  function getActiveActAndWorld(t) {
    if (lockMode === "manual") {
      return { act: manualAct, world: manualWorld };
    }
    const ch = getChapter(t);
    return { act: ch.act, world: ch.world };
  }

  function fmtTime(sec) {
    const s = Math.max(0, sec);
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const ds = Math.floor((s % 1) * 10);
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ds}`;
  }

  // Play / Pause
  const playBtn = document.getElementById("btn-play-radical");
  const playLabel = document.getElementById("play-radical-label");

  function setPlaying(play) {
    isPlaying = play;
    if (isPlaying) {
      sound.init();
      if (currentTime >= DURATION - 0.5) currentTime = 0;
      playLabel.textContent = "⏸ Pause 3-Act Performance";
      playBtn.classList.add("playing");
      if (stage.project1976Film) {
        video.currentTime = currentTime % 174.0;
        video.play().catch(() => {});
      }
    } else {
      playLabel.textContent = "▶ Start 3-Act Performance";
      playBtn.classList.remove("playing");
      video.pause();
    }
  }

  playBtn.addEventListener("click", () => setPlaying(!isPlaying));

  document.getElementById("btn-restart-radical").addEventListener("click", () => {
    currentTime = 0;
    triggeredScheduledSingularity = false;
    lockMode = "auto";
    setPlaying(true);
  });

  // Mute button
  const muteBtn = document.getElementById("btn-mute-radical");
  muteBtn.addEventListener("click", () => {
    const m = sound.toggleMute();
    muteBtn.textContent = m ? "🔇 Muted" : "🔊 Spatial Audio On";
  });

  // Camera Presets
  document.querySelectorAll("[data-cam-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-cam-preset]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      stage.setCameraPreset(btn.getAttribute("data-cam-preset"));
    });
  });

  // Act Selector Buttons
  document.querySelectorAll("[data-select-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const actNum = parseInt(btn.getAttribute("data-select-act"), 10);
      lockMode = "auto";
      if (actNum === 1) currentTime = 2.0;
      else if (actNum === 2) currentTime = 45.2;
      else if (actNum === 3) currentTime = 135.2;
      if (!isPlaying) setPlaying(true);
    });
  });

  // 6 Radical World Selector Buttons
  document.querySelectorAll("[data-select-world]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wKey = btn.getAttribute("data-select-world");
      lockMode = "manual";
      manualAct = 2;
      manualWorld = wKey;
      sound.init();
      [67, 71, 74, 79].forEach((m, i) => {
        setTimeout(() => sound.playWorldVoice(wKey, m, 0.35, (i - 1.5) * 0.4, 0.95), i * 65);
      });
      if (!isPlaying) setPlaying(true);
      updateActiveBadges(manualAct, manualWorld);
    });
  });

  // Follow 3-Act Score vs Lock Current World
  const btnAutoScore = document.getElementById("btn-auto-score");
  btnAutoScore.addEventListener("click", () => {
    lockMode = lockMode === "auto" ? "manual" : "auto";
    btnAutoScore.classList.toggle("active", lockMode === "auto");
    btnAutoScore.textContent =
      lockMode === "auto" ? "Mode: Auto 3-Act Score" : "Mode: Locked to Selected World";
  });

  // Special Interactive Stage Controls
  document.getElementById("btn-singularity").addEventListener("click", () => {
    sound.init();
    stage.triggerSingularity(currentTime);
    sound.playSingularityCollapseAndSupernova();
    if (!isPlaying) setPlaying(true);
  });

  const btnRays = document.getElementById("btn-toggle-rays");
  btnRays.addEventListener("click", () => {
    stage.showLightRays = !stage.showLightRays;
    btnRays.classList.toggle("active", stage.showLightRays);
  });

  const btnProj1976 = document.getElementById("btn-project-1976");
  btnProj1976.addEventListener("click", () => {
    stage.project1976Film = !stage.project1976Film;
    btnProj1976.classList.toggle("active", stage.project1976Film);
    if (stage.project1976Film) {
      video.currentTime = currentTime % 174.0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });

  // Rear Lamp Distance Slider (controls shadow magnification!)
  const lampSlider = document.getElementById("lamp-dist-slider");
  const lampReadout = document.getElementById("lamp-dist-val");
  lampSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    stage.lampZ = -val;
    const maxMag = (val / Math.max(25, val - 175)).toFixed(1);
    lampReadout.textContent = `Max Shadow: ${maxMag}x`;
  });

  // Screen Translucent Opacity Slider
  const scrimSlider = document.getElementById("scrim-opacity-slider");
  scrimSlider.addEventListener("input", (e) => {
    stage.screenOpacity = parseFloat(e.target.value);
  });

  // 3-Act Timeline Ribbon Scrubber
  const rCtx = ribbonCanvas.getContext("2d");
  let scrubbing = false;

  function drawRibbon() {
    const w = ribbonCanvas.width;
    const h = ribbonCanvas.height;
    rCtx.clearRect(0, 0, w, h);

    // Draw Act I, Act II (6 worlds), and Act III blocks
    const blocks = [
      { s: 0, e: 45, col: "#b85d78", label: "ACT I: LIVE BACKLIT SCREEN (4 Dancers)" },
      { s: 45, e: 60, col: "#00b8d4", label: "W1: Prism" },
      { s: 60, e: 75, col: "#ff4268", label: "W2: Scan" },
      { s: 75, e: 90, col: "#64c846", label: "W3: Tree" },
      { s: 90, e: 108, col: "#9c6ade", label: "W4: Quantum" },
      { s: 108, e: 122, col: "#f5a623", label: "W5: Bauhaus" },
      { s: 122, e: 135, col: "#4a90e2", label: "W6: Ribbon" },
      { s: 135, e: 180, col: "#d9822b", label: "ACT III: LIVE + PROJECTED SYNTHESIS" },
    ];

    blocks.forEach((b) => {
      const x0 = (b.s / DURATION) * w;
      const bw = ((b.e - b.s) / DURATION) * w;
      rCtx.fillStyle = b.col;
      rCtx.globalAlpha = 0.36;
      rCtx.fillRect(x0 + 1, 4, bw - 2, h - 8);
      rCtx.globalAlpha = 0.92;
      rCtx.fillStyle = "#fff5e6";
      rCtx.font = "bold 10px Courier New, monospace";
      if (bw > 48) {
        rCtx.fillText(b.label, x0 + 6, h * 0.56);
      }
    });
    rCtx.globalAlpha = 1.0;

    // Playhead
    const px = (currentTime / DURATION) * w;
    rCtx.fillStyle = "#ffffff";
    rCtx.fillRect(px - 1.5, 0, 3, h);
    rCtx.beginPath();
    rCtx.arc(px, 6, 5, 0, Math.PI * 2);
    rCtx.fill();
  }

  function scrubFromEvent(e) {
    const rect = ribbonCanvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    currentTime = frac * DURATION;
    triggeredScheduledSingularity = currentTime > 102.0;
    lockMode = "auto";
    btnAutoScore.classList.add("active");
    btnAutoScore.textContent = "Mode: Auto 3-Act Score";
    if (!isPlaying) setPlaying(true);
  }

  ribbonCanvas.addEventListener("pointerdown", (e) => {
    scrubbing = true;
    scrubFromEvent(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (scrubbing) scrubFromEvent(e);
  });
  window.addEventListener("pointerup", () => {
    scrubbing = false;
  });

  function updateActiveBadges(act, world) {
    document.querySelectorAll("[data-select-act]").forEach((b) => {
      b.classList.toggle("active", parseInt(b.getAttribute("data-select-act"), 10) === act);
    });
    document.querySelectorAll("[data-select-world]").forEach((b) => {
      b.classList.toggle(
        "active",
         (act === 2 || lockMode === "manual") && b.getAttribute("data-select-world") === world
      );
    });
  }

  const timeEl = document.getElementById("radical-time-readout");
  const titleEl = document.getElementById("radical-scene-title");
  const descEl = document.getElementById("radical-scene-desc");

  // Main Animation Loop
  let lastNow = performance.now();
  function animate(now) {
    const dt = Math.min(0.08, (now - lastNow) / 1000);
    lastNow = now;

    if (isPlaying) {
      currentTime += dt;
      if (currentTime >= DURATION) {
        currentTime = 0;
        triggeredScheduledSingularity = false;
      }

      // Trigger the scheduled 01:41.5 Singularity Collapse & Supernova audio/physics!
      if (currentTime >= 101.5 && currentTime < 102.5 && !triggeredScheduledSingularity) {
        triggeredScheduledSingularity = true;
        stage.triggerSingularity(currentTime);
        sound.playSingularityCollapseAndSupernova();
      }
    }

    const { act, world } = getActiveActAndWorld(currentTime);
    const { dancers3D, isSingularity } = stage.render(currentTime, dt, act, world);

    if (isPlaying) {
      sound.step(currentTime, dt, act, world, dancers3D, isSingularity);
    }

    // Update UI Readouts
    timeEl.textContent = `${fmtTime(currentTime)} / 03:00.0`;
    const ch = getChapter(currentTime);
    titleEl.textContent =
      lockMode === "manual"
        ? `Manual Exploration • Act ${act} (${world.toUpperCase()} World)`
        : ch.title;
    descEl.textContent = ch.desc;

    updateActiveBadges(act, world);
    drawRibbon();

    // Update 6-Channel Audio Telemetry Bars
    Object.entries(sound.meters).forEach(([k, val]) => {
      const el = document.getElementById(`rad-meter-${k}`);
      if (el) el.style.width = `${Math.round(Math.min(100, val * 100))}%`;
    });

    requestAnimationFrame(animate);
  }

  drawRibbon();
  requestAnimationFrame(animate);
});
