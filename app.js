/**
 * MULBERRY BUSH (1976 -> 2026) — 50th Anniversary Interactive Web App
 * Main Application Controller
 */

const SCENES_1976 = [
  { start: 0.0, end: 5.75, title: "16mm Dark Leader & Dim Circle Fade-In", desc: "Projector sprocket purr & tuning fifths as the four dancers emerge from the dark" },
  { start: 5.75, end: 7.25, title: "Scene 1 • Colored Felt-Marker Rotoscope Ring", desc: "Lights snap on: Ken, Fannie, Dave & Cathy hold hands in marker & ink • Banjo & Accordion" },
  { start: 7.25, end: 8.0, title: "Blank Mulberry Paper Breath I", desc: "Dancers round the unseen side of the bush • Pattering footsteps" },
  { start: 8.0, end: 12.0, title: "Scene 2 • Cut-Out Silhouettes & 3x Onion-Skin Ghosts", desc: "Crisp black cutouts skip left-to-right; triple cel echoes & analog tape slapback at 0:10" },
  { start: 12.0, end: 13.5, title: "Blank Mulberry Paper Breath II", desc: "Empty dusty-rose paper under the 16mm gate • Walking bass pickup" },
  { start: 13.5, end: 19.75, title: "Scene 3 • Colored Marker Rotoscope + Shimmering Cel Trails", desc: "Full colored marker figures with translucent multi-frame echoes • Folk Ensemble + Tape Delay" },
  { start: 19.75, end: 24.0, title: "Scene 4 • Skipping Shadow Silhouettes", desc: "Solo & paired silhouettes leaping around the circle • Shadow-Puppet Marimba & Pizzicato" },
  { start: 24.0, end: 28.75, title: "Scene 5 • Giant Crimson Foreground Sweep & Spinning Ghosts", desc: "Near-side close-up red dancer lunges across lens + triple-ghosted charcoal spin • Bowed Cello Swell" },
  { start: 28.75, end: 37.75, title: "Scene 6 • Giant Red Close-Up -> Skipping Silhouettes", desc: "Foreground crimson giant gives way to playful skipping silhouettes • Low Brass -> Marimba Jig" },
  { start: 37.75, end: 42.5, title: "Scene 7 • Blank Paper & The 0:39 Right-Edge Peek-a-Boo!", desc: "A whimsical silhouette leans sideways out of the right border of the film gate • Right-Channel Solo" },
  { start: 42.5, end: 45.0, title: "Scene 8 • Silhouette Bridge", desc: "Dancers re-enter from the right preparing for the first abstraction shift" },
  { start: 45.0, end: 52.5, title: "Scene 9 • First Appearance of Parallel Contour Hatching", desc: "Figures dissolve into horizontal & vertical marker stripes + giant red sweep • Harpsichord & Pen Guiro" },
  { start: 52.5, end: 61.75, title: "Scene 10 • Floating Marker Stripes <-> Striped Silhouettes", desc: "Pure outline-free parallel marker dashes alternate with shaded silhouettes • Striated Clavinet Arpeggios" },
  { start: 61.75, end: 68.5, title: "Scene 11 • Colored Rotoscope <-> Contour Hatching Dialogue", desc: "Rapid cuts between full colored marker rotoscope and floating contour stripes • Banjo <-> Clavinet" },
  { start: 68.5, end: 82.0, title: "Scene 12 • The Great Contour-Hatching Ring Dance", desc: "Horizontal-striped men & pleated-skirt women hold hands in a joyous ring • Full Striated Ensemble" },
  { start: 82.0, end: 87.25, title: "Scene 13 • First Appearance of Hole-Punch Pointillist Dots", desc: "Small dark circular dots emerge over the hatching-line dancers • Sparkling Celesta & Kalimba Droplets" },
  { start: 87.25, end: 93.75, title: "Scene 14 • Explosion of Giant Avery Color-Coding Sticker Dots!", desc: "Large Red, Blue, Black, Yellow & Green adhesive paper labels dance • 1976 Buchla/Moog Filter Funk" },
  { start: 93.75, end: 105.75, title: "Scene 15 • Pointillist Dots, Giant Stickers & Hatching Counterpoint", desc: "Three levels of hand-made abstraction layer and trade phrases on the animation stand" },
  { start: 105.75, end: 112.85, title: "Scene 16 • Pure Pointillist Dot Dancers", desc: "Dancers formed purely of floating dark ink dots skip across to the right edge • Music-Box & Celesta" },
  { start: 112.85, end: 115.85, title: "Scene 17 • THE DOT PILE COLLAPSE! (01:53)", desc: "All the dots lose their human form and tumble into a heap in the bottom-right corner! • Marble Glissando" },
  { start: 115.85, end: 139.75, title: "Scenes 18 & 19 • Dots Reborn & The Grand Polyphonic Collage", desc: "Every visual technique—Dots, Silhouettes, Giant Stickers, Charcoal & Colored Marker—interleaves!" },
  { start: 139.75, end: 141.75, title: "Grand Caesura • 2-Second Blank Mulberry Paper Pause", desc: "All instruments hush on a suspended resonance before the final return" },
  { start: 141.75, end: 152.25, title: "Scene 20 • Reverse-Arch Finale: Dots -> Silhouettes -> Colored Marker", desc: "Stepping back from abstraction to reality holding hands in a ring • Grand Full-Ensemble Chorus" },
  { start: 152.25, end: 169.0, title: "Scene 21 • Hand-Lettered Credits on Cool Violet Paper", desc: "MULBERRY BUSH • by KEN KAHN © 1976 • MUSIC: NANCY KOCH, TOMMY MAGEE • THANKS: FANNIE, CATHY, DAVE" },
  { start: 169.0, end: 174.67, title: "Scene 22 • 16mm End Leader", desc: "Projector spin-down into darkness" },
];

document.addEventListener("DOMContentLoaded", () => {
  const mainCanvas = document.getElementById("stage-canvas");
  const refVideo = document.getElementById("ref-video");
  const ribbonCanvas = document.getElementById("score-ribbon-canvas");

  const sound = new window.MulberrySoundEngine();
  const renderer = new window.MulberryCelRenderer(mainCanvas, refVideo);

  // Application State
  let isPlaying = false;
  let currentTime = 5.8; // Start right at the vibrant opening colored rotoscope ring!
  const DURATION = 174.67;

  let viewMode = "canvas"; // 'canvas' | 'video_only' | 'hybrid' | 'side_by_side'
  let choreoMode = "auto"; // 'auto' (follows 1976 score) | 'manual' (sandbox pegbar)
  let stampTool = "avery"; // 'avery' | 'dots' | 'hatching'

  // Manual Sandbox Cel Layer states
  const manualStyles = {
    colored: 1.0,
    silhouette: 0.0,
    giant_red: 0.0,
    hatching: 0.0,
    small_dots: 0.0,
    giant_dots: 0.0,
    ghost_echo: 0.0,
    dot_collapse: 0.0,
    edge_peek: 0.0,
    credits: 0.0,
    blank: 0.0,
  };

  // Lookup timeline state at timestamp t
  function getTimelineEntry(t) {
    const tl = window.MULBERRY_TIMELINE || [];
    if (!tl.length) return { styles: { colored: 1 }, x: 0 };
    const idx = Math.min(tl.length - 1, Math.max(0, Math.floor(t * 4)));
    return tl[idx];
  }

  function getActiveStyles(t) {
    if (choreoMode === "manual") {
      return {
        ...manualStyles,
        dot_collapse: renderer.manualCollapseActive ? 1.0 : 0.0,
      };
    }
    const entry = getTimelineEntry(t);
    const st = {
      colored: 0,
      silhouette: 0,
      giant_red: 0,
      hatching: 0,
      small_dots: 0,
      giant_dots: 0,
      ghost_echo: 0,
      dot_collapse: 0,
      edge_peek: 0,
      credits: 0,
      blank: 0,
      ...(entry.styles || {}),
    };
    if (renderer.manualCollapseActive) {
      st.dot_collapse = 1.0;
    }
    if (manualStyles.ghost_echo > 0.5) {
      st.ghost_echo = Math.max(st.ghost_echo, 0.9);
    }
    return st;
  }

  function getSceneForTime(t) {
    for (const sc of SCENES_1976) {
      if (t >= sc.start && t < sc.end) return sc;
    }
    return SCENES_1976[SCENES_1976.length - 1];
  }

  // Format mm:ss.d
  function fmtTime(sec) {
    const s = Math.max(0, sec);
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const ds = Math.floor((s % 1) * 10);
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ds}`;
  }

  // Play / Pause Control
  const playBtn = document.getElementById("btn-play");
  const playIconSpan = document.getElementById("play-btn-label");

  function setPlaying(play) {
    isPlaying = play;
    if (isPlaying) {
      if (currentTime >= DURATION - 0.5) {
        currentTime = 0;
      }
      playIconSpan.textContent = "⏸ Pause Projector";
      playBtn.classList.add("playing");
      sound.playLinear(currentTime);
      refVideo.currentTime = currentTime;
      refVideo.muted = true; // Audio is handled by MulberrySoundEngine!
      refVideo.play().catch(() => {});
    } else {
      playIconSpan.textContent = "▶ Run 16mm Projector";
      playBtn.classList.remove("playing");
      sound.pauseLinear();
      refVideo.pause();
    }
  }

  playBtn.addEventListener("click", () => {
    setPlaying(!isPlaying);
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    seekTo(0);
    setPlaying(true);
  });

  function seekTo(newTime) {
    currentTime = Math.max(0, Math.min(DURATION, newTime));
    sound.seekLinear(currentTime);
    try {
      refVideo.currentTime = currentTime;
    } catch (e) {}
    updateUI(currentTime, getActiveStyles(currentTime));
    drawScoreRibbon();
  }

  // View Mode Switcher
  const stageWrapper = document.getElementById("stage-dual-wrapper");
  const hybridControls = document.getElementById("hybrid-controls-bar");

  document.querySelectorAll("[data-view-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-view-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      viewMode = btn.getAttribute("data-view-mode");

      if (viewMode === "side_by_side") {
        stageWrapper.classList.add("side-by-side");
      } else {
        stageWrapper.classList.remove("side-by-side");
      }

      if (viewMode === "hybrid") {
        hybridControls.classList.remove("hidden");
      } else {
        hybridControls.classList.add("hidden");
      }
    });
  });

  // Hybrid controls
  const hybridSlider = document.getElementById("hybrid-mix-slider");
  hybridSlider.addEventListener("input", (e) => {
    renderer.hybridMix = parseFloat(e.target.value);
  });
  const splitToggle = document.getElementById("btn-split-curtain");
  splitToggle.addEventListener("click", () => {
    renderer.splitScreen = !renderer.splitScreen;
    splitToggle.classList.toggle("active", renderer.splitScreen);
    splitToggle.textContent = renderer.splitScreen
      ? "Mode: Split-Screen Curtain"
      : "Mode: Lightbox Onion-Skin";
  });

  // Audio Track Mode Switcher
  document.querySelectorAll("[data-audio-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-audio-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-audio-mode");
      sound.setTrackMode(mode, currentTime, isPlaying);
    });
  });

  // Volume & Mute
  const muteBtn = document.getElementById("btn-mute");
  muteBtn.addEventListener("click", () => {
    const muted = sound.toggleMute();
    muteBtn.textContent = muted ? "🔇 Muted" : "🔊 Sound On";
    muteBtn.classList.toggle("muted", muted);
  });

  // Choreography Mode (Auto 1976 Score vs Manual Pegbar Sandbox)
  document.querySelectorAll("[data-choreo-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-choreo-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      choreoMode = btn.getAttribute("data-choreo-mode");
      if (choreoMode === "manual") {
        // Initialize manual layers from whatever was currently on screen if all 0
        const anyOn = ["colored", "silhouette", "giant_red", "hatching", "small_dots", "giant_dots"].some(
          (k) => manualStyles[k] > 0.2
        );
        if (!anyOn) manualStyles.colored = 1.0;
      }
      updateCelPegbarButtons(getActiveStyles(currentTime));
    });
  });

  // 6 Cel Layer Pegbar Buttons
  const celLayerButtons = document.querySelectorAll(".cel-layer-btn");
  celLayerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const styleKey = btn.getAttribute("data-cel-style");
      // Switch to Manual Sandbox mode automatically when user toggles individual cels on the pegbar!
      if (choreoMode !== "manual") {
        // Copy current active styles into manualStyles first
        const cur = getActiveStyles(currentTime);
        ["colored", "silhouette", "giant_red", "hatching", "small_dots", "giant_dots"].forEach((k) => {
          manualStyles[k] = cur[k] > 0.25 ? 1.0 : 0.0;
        });
        choreoMode = "manual";
        document.querySelectorAll("[data-choreo-mode]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-choreo-mode") === "manual");
        });
      }

      manualStyles[styleKey] = manualStyles[styleKey] > 0.2 ? 0.0 : 1.0;
      // Ensure at least one layer stays visible
      const anyActive = ["colored", "silhouette", "giant_red", "hatching", "small_dots", "giant_dots"].some(
        (k) => manualStyles[k] > 0.2
      );
      if (!anyActive) {
        manualStyles[styleKey] = 1.0;
      }

      if (manualStyles[styleKey] > 0.2) {
        sound.playStyleFlourish(styleKey);
      }
      updateCelPegbarButtons(getActiveStyles(currentTime));
    });
  });

  function updateCelPegbarButtons(styles) {
    celLayerButtons.forEach((btn) => {
      const key = btn.getAttribute("data-cel-style");
      const isOn = (styles[key] || 0) > 0.2;
      btn.classList.toggle("active", isOn);
    });
  }

  // Special 1976 Visual & Musical Effects Triggers
  const btnCollapse = document.getElementById("btn-trigger-collapse");
  btnCollapse.addEventListener("click", () => {
    renderer.manualCollapseActive = !renderer.manualCollapseActive;
    btnCollapse.classList.toggle("active", renderer.manualCollapseActive);
    if (renderer.manualCollapseActive) {
      btnCollapse.textContent = "✨ Re-Assemble Dots into Dancers!";
      sound.playDotCollapseCascade();
    } else {
      btnCollapse.textContent = "💥 Collapse Dots into Corner Pile! (1:53)";
      sound.playDotReassembleCascade();
    }
  });

  document.getElementById("btn-trigger-giant").addEventListener("click", () => {
    renderer.manualGiantSweepTime = currentTime;
    sound.triggerVoice(43, 1.4, "giant_red", 0.5, true, 1.1);
    setTimeout(() => sound.triggerVoice(50, 1.2, "giant_red", -0.5, true, 1.0), 400);
  });

  document.getElementById("btn-trigger-peek").addEventListener("click", () => {
    renderer.manualPeekTime = currentTime;
    [71, 74, 79, 78, 79].forEach((m, i) => {
      setTimeout(() => sound.triggerVoice(m, 0.22, "giant_dots", 0.78, false, 0.9), i * 140);
    });
  });

  const btnGhost = document.getElementById("btn-toggle-ghost");
  btnGhost.addEventListener("click", () => {
    manualStyles.ghost_echo = manualStyles.ghost_echo > 0.5 ? 0.0 : 1.0;
    btnGhost.classList.toggle("active", manualStyles.ghost_echo > 0.5);
    sound.playStyleFlourish("silhouette");
  });

  const btnBush = document.getElementById("btn-toggle-bush");
  btnBush.addEventListener("click", () => {
    renderer.showMulberryBush = !renderer.showMulberryBush;
    btnBush.classList.toggle("active", renderer.showMulberryBush);
    sound.playStyleFlourish("colored");
  });

  // Paper Tint selector
  document.querySelectorAll("[data-paper-tint]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-paper-tint]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderer.paperTint = btn.getAttribute("data-paper-tint");
    });
  });

  // Interactive Canvas Stamp Tool
  document.querySelectorAll("[data-stamp-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-stamp-tool]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      stampTool = btn.getAttribute("data-stamp-tool");
    });
  });

  document.getElementById("btn-clear-stamps").addEventListener("click", () => {
    renderer.clearUserStamps();
  });

  let isDrawingStamp = false;
  let lastStampTime = 0;

  function handleCanvasStamp(e) {
    const now = performance.now();
    if (now - lastStampTime < 85) return;
    lastStampTime = now;

    const rect = mainCanvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    const ringPhase = currentTime * 0.95 * renderer.ringSpeed;
    renderer.addUserStamp(normX, normY, stampTool, ringPhase);

    // Play a pitched note from the G Major Mulberry Bush scale mapped to vertical height!
    const scale = [79, 76, 74, 71, 69, 67, 64, 62, 59, 55];
    const pitchIdx = Math.min(scale.length - 1, Math.max(0, Math.floor(normY * scale.length)));
    const pan = (normX - 0.5) * 1.6;
    const styleMap = { avery: "giant_dots", dots: "small_dots", hatching: "hatching" };
    sound.triggerVoice(scale[pitchIdx], 0.28, styleMap[stampTool] || "giant_dots", pan, false, 0.85);
  }

  mainCanvas.addEventListener("pointerdown", (e) => {
    isDrawingStamp = true;
    handleCanvasStamp(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (isDrawingStamp && e.target === mainCanvas) {
      handleCanvasStamp(e);
    }
  });
  window.addEventListener("pointerup", () => {
    isDrawingStamp = false;
  });

  // Chapter Jump Buttons
  document.querySelectorAll("[data-jump-time]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = parseFloat(btn.getAttribute("data-jump-time"));
      choreoMode = "auto";
      renderer.manualCollapseActive = false;
      btnCollapse.classList.remove("active");
      btnCollapse.textContent = "💥 Collapse Dots into Corner Pile! (1:53)";
      document.querySelectorAll("[data-choreo-mode]").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-choreo-mode") === "auto");
      });
      seekTo(t);
      if (!isPlaying) {
        setPlaying(true);
      }
    });
  });

  // Multi-Track Visual & Musical Score Ribbon Scrubber
  const rCtx = ribbonCanvas.getContext("2d");
  let isScrubbingRibbon = false;

  function drawScoreRibbon() {
    const w = ribbonCanvas.width;
    const h = ribbonCanvas.height;
    rCtx.clearRect(0, 0, w, h);

    rCtx.fillStyle = "#141014";
    rCtx.fillRect(0, 0, w, h);

    const tracks = [
      { key: "colored", color: "#d6453d", label: "Marker" },
      { key: "silhouette", color: "#9c8aa5", label: "Cutout" },
      { key: "giant_red", color: "#9e1922", label: "Giant" },
      { key: "hatching", color: "#d99b38", label: "Hatch" },
      { key: "small_dots", color: "#5bc0be", label: "Dots" },
      { key: "giant_dots", color: "#76b041", label: "Avery" },
    ];

    const tl = window.MULBERRY_TIMELINE || [];
    const rowH = (h - 14) / tracks.length;

    for (let i = 0; i < tl.length; i++) {
      const item = tl[i];
      const x = (item.t / DURATION) * w;
      const barW = Math.max(1.5, w / tl.length + 0.5);
      const st = item.styles || {};

      if (st.credits > 0.5) {
        rCtx.fillStyle = "rgba(128, 98, 196, 0.38)";
        rCtx.fillRect(x, 0, barW, h);
      } else if (st.dot_collapse > 0.5) {
        rCtx.fillStyle = "rgba(255, 85, 85, 0.55)";
        rCtx.fillRect(x, 0, barW, h);
      }

      tracks.forEach((tr, rIdx) => {
        const val = st[tr.key] || 0;
        if (val > 0.1) {
          rCtx.fillStyle = tr.color;
          rCtx.globalAlpha = Math.min(1, val * 0.9);
          rCtx.fillRect(x, 7 + rIdx * rowH + 1, barW, rowH - 2);
        }
      });
    }
    rCtx.globalAlpha = 1.0;

    // Playhead cursor
    const px = (currentTime / DURATION) * w;
    rCtx.fillStyle = "#fff5d6";
    rCtx.fillRect(px - 1.5, 0, 3, h);
    rCtx.beginPath();
    rCtx.arc(px, 6, 5, 0, Math.PI * 2);
    rCtx.fill();
  }

  function scrubRibbonFromEvent(e) {
    const rect = ribbonCanvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(frac * DURATION);
  }

  ribbonCanvas.addEventListener("pointerdown", (e) => {
    isScrubbingRibbon = true;
    scrubRibbonFromEvent(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (isScrubbingRibbon) {
      scrubRibbonFromEvent(e);
    }
  });
  window.addEventListener("pointerup", () => {
    isScrubbingRibbon = false;
  });

  // Update DOM readouts & stem meters
  const timeReadout = document.getElementById("time-readout");
  const frameReadout = document.getElementById("frame-readout");
  const sceneTitleEl = document.getElementById("scene-title");
  const sceneDescEl = document.getElementById("scene-desc");

  function updateUI(t, styles) {
    timeReadout.textContent = `${fmtTime(t)} / 02:54.6`;
    const frameNum = Math.floor(t * 24);
    frameReadout.textContent = `16mm Frame #${String(frameNum).padStart(4, "0")}`;

    const sc = getSceneForTime(t);
    sceneTitleEl.textContent =
      choreoMode === "manual"
        ? "Manual Cel Pegbar (Interactive Sandbox Mode)"
        : sc.title;
    sceneDescEl.textContent =
      choreoMode === "manual"
        ? "Stack any combination of the 6 hand-made cel layers below or stamp directly on the mulberry paper!"
        : sc.desc;

    updateCelPegbarButtons(styles);

    // Update 6-Voice Musical Stem Meters
    Object.entries(sound.stemLevels).forEach(([k, val]) => {
      const bar = document.getElementById(`stem-bar-${k}`);
      if (bar) {
        bar.style.width = `${Math.round(Math.min(100, val * 100))}%`;
      }
    });
  }

  // Main Animation Loop
  let lastNow = performance.now();
  function animate(now) {
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;

    if (isPlaying) {
      const activeAudio = sound.tracks[sound.activeTrackMode];
      if (!activeAudio.paused && activeAudio.currentTime > 0) {
        currentTime = activeAudio.currentTime;
      } else {
        currentTime += dt;
      }

      if (currentTime >= DURATION) {
        setPlaying(false);
        currentTime = DURATION;
      }

      // Keep reference video locked within 0.15s
      if (Math.abs(refVideo.currentTime - currentTime) > 0.18) {
        try {
          refVideo.currentTime = currentTime;
        } catch (e) {}
      }
    } else if (choreoMode === "manual") {
      // In manual sandbox mode when linear timeline is paused, still advance ring time smoothly!
      currentTime = (currentTime + dt * 0.85) % 150.0;
      const st = getActiveStyles(currentTime);
      sound.stepSandboxMusic(dt, st, Math.sin(currentTime * 0.8) * 0.5);
    }

    const activeStyles = getActiveStyles(currentTime);
    if (isPlaying) {
      sound.updateStemsFromTimelineState(activeStyles, dt);
    }

    renderer.render(currentTime, dt, activeStyles, viewMode, isPlaying);
    updateUI(currentTime, activeStyles);
    drawScoreRibbon();

    requestAnimationFrame(animate);
  }

  // Initial render
  refVideo.currentTime = currentTime;
  drawScoreRibbon();
  requestAnimationFrame(animate);
});
