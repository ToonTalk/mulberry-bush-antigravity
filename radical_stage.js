/**
 * MULBERRY BUSH: RADICAL REINTERPRETATION (1976 -> 2026)
 * 3D Expanded-Cinema Stage, Raycast Backlit Shadow Optics & 6-World Metamorphosis Engine
 */

class RadicalStageRenderer {
  constructor(canvas, videoElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.video = videoElement;

    this.width = 960;
    this.height = 640;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Offscreen canvas for the Backlit / Projected Screen surface (4:3 aspect, 640x480)
    this.screenCanvas = document.createElement("canvas");
    this.screenCanvas.width = 640;
    this.screenCanvas.height = 480;
    this.sCtx = this.screenCanvas.getContext("2d");

    // 3D Stage & Optical Geometry (in stage units; screen is 440w x 330h at Z = 0)
    this.SCREEN_W = 440;
    this.SCREEN_H = 330;
    this.lampZ = -340; // Rear Halogen Shadow Lamp Z position (behind screen)
    this.projectorZ = 470; // Front 16mm Projector Z position (in front of screen)
    this.screenOpacity = 0.86;
    this.showLightRays = true;
    this.project1976Film = false;

    // 3D Camera Spherical Coordinates (yaw, pitch, zoom)
    this.camYaw = 0.0; // 0 = Audience Front Row looking at Z=0
    this.camPitch = 0.14;
    this.camDist = 660;
    this.targetYaw = 0.0;
    this.targetPitch = 0.14;
    this.targetDist = 660;
    this.cameraPreset = "auto"; // 'auto' | 'front' | 'iso' | 'overhead' | 'inside'

    // 4 Dancers orbiting around the backlit screen
    this.dancers = [
      {
        id: "ken",
        name: "Ken",
        gender: "m",
        baseAngle: 0,
        shirt: "#7d1c26",
        pants: "#d9b7a8",
        hair: "#1b1318",
        skin: "#d49585",
        neon: "#ff4252",
      },
      {
        id: "fannie",
        name: "Fannie",
        gender: "f",
        baseAngle: Math.PI * 0.5,
        shirt: "#521b29",
        sleeve: "#a589c4",
        skirt: "#201e30",
        hair: "#1a1520",
        skin: "#dc9e90",
        neon: "#b87aff",
      },
      {
        id: "dave",
        name: "Dave",
        gender: "m",
        baseAngle: Math.PI,
        shirt: "#2d1d26",
        pants: "#232536",
        hair: "#181216",
        skin: "#cc8c7c",
        neon: "#38e8ff",
      },
      {
        id: "cathy",
        name: "Cathy",
        gender: "f",
        baseAngle: Math.PI * 1.5,
        shirt: "#d93829",
        sleeve: "#d93829",
        skirt: "#1d1b28",
        hair: "#1c151d",
        skin: "#dc9e90",
        neon: "#ffbe2e",
      },
    ];

    // Quantum Point-Cloud & Singularity Supernova state (320 particles)
    this.particles = [];
    for (let i = 0; i < 320; i++) {
      this.particles.push({
        x: 320 + (Math.random() - 0.5) * 300,
        y: 240 + (Math.random() - 0.5) * 200,
        vx: 0,
        vy: 0,
        color: ["#ff4252", "#38e8ff", "#ffbe2e", "#b87aff", "#72f56c"][i % 5],
        r: 2.8 + (i % 4) * 1.1,
      });
    }
    this.singularityStart = -100;

    // Spacetime Chronophotography Ribbon History (stores recent screen poses)
    this.ribbonHistory = [];
    this.lastRibbonSave = 0;

    // Interactive Pointer Orbit State
    this.setupPointerOrbit();
  }

  setupPointerOrbit() {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.cameraPreset = "free";
      this.targetYaw += dx * 0.0075;
      this.targetPitch = Math.max(-0.15, Math.min(1.42, this.targetPitch + dy * 0.0065));
    });

    this.canvas.addEventListener("pointerup", () => {
      dragging = false;
    });
  }

  setCameraPreset(preset) {
    this.cameraPreset = preset;
    if (preset === "front") {
      this.targetYaw = 0.0;
      this.targetPitch = 0.06;
      this.targetDist = 560;
    } else if (preset === "iso") {
      this.targetYaw = -0.68;
      this.targetPitch = 0.36;
      this.targetDist = 790;
    } else if (preset === "overhead") {
      this.targetYaw = 0.0;
      this.targetPitch = 1.35;
      this.targetDist = 860;
    } else if (preset === "inside") {
      this.targetDist = 180;
      this.targetPitch = 0.05;
    }
  }

  triggerSingularity(t) {
    this.singularityStart = t;
    this.particles.forEach((p, idx) => {
      const ang = (idx / this.particles.length) * Math.PI * 2;
      p.vx = -Math.sin(ang) * 180;
      p.vy = Math.cos(ang) * 180;
    });
  }

  /**
   * Projects a 3D Stage Point (x, y, z) onto the 2D Viewport Canvas
   * Note: Y is up in 3D space (floor is at y = -165, top of screen is at y = +165)
   */
  project3D(x, y, z) {
    // Rotate around Y axis by camYaw
    const cosY = Math.cos(this.camYaw);
    const sinY = Math.sin(this.camYaw);
    const rx = x * cosY - z * sinY;
    const rz1 = x * sinY + z * cosY;

    // Rotate around X axis by camPitch
    const cosP = Math.cos(this.camPitch);
    const sinP = Math.sin(this.camPitch);
    const ry = y * cosP - rz1 * sinP;
    const rz2 = y * sinP + rz1 * cosP;

    const fov = 620;
    const depth = this.camDist - rz2;
    if (depth < 40) return { x: this.width * 0.5, y: this.height * 0.5, scale: 0.01, depth: 40, behindCam: true };

    const scale = fov / depth;
    return {
      x: this.width * 0.5 + rx * scale,
      y: this.height * 0.52 - ry * scale,
      scale,
      depth,
      behindCam: false,
    };
  }

  /**
   * Computes 3D Orbit Position and Optical Shadow Projection for each of the 4 Dancers
   */
  compute3DDancers(t) {
    const orbitRx = 165; // Horizontal radius of circle around the screen
    const orbitRz = 175; // Depth radius (passes behind screen Z < 0 and in front of screen Z > 0!)
    const angularSpeed = 0.72; // Rad/sec around the Mulberry Bush
    const stepPhase = t * Math.PI * 4.0; // Locked to 120 BPM (6/8 jig!)

    return this.dancers.map((d, idx) => {
      const theta = d.baseAngle + t * angularSpeed;
      const x = Math.sin(theta) * orbitRx;
      const z = Math.cos(theta) * orbitRz; // z < 0 is BEHIND screen; z > 0 is IN FRONT of screen!
      const velX = Math.cos(theta); // Horizontal velocity direction (+1 right, -1 left)
      const dir = velX >= 0 ? 1 : -1;

      const skipBob = Math.abs(Math.sin(stepPhase + idx * 1.5)) * 16;
      const footY = -this.SCREEN_H * 0.5 + skipBob; // Stage floor level

      // Optical Raycast from Rear Halogen Lamp (0, -30, this.lampZ) to Screen Plane (Z = 0)
      let castsShadow = false;
      let shadowX = x;
      let shadowScale = 1.0;
      if (z < -4 && z > this.lampZ + 35) {
        castsShadow = true;
        // Ray equation: u = (0 - lampZ) / (z - lampZ)
        const u = (0 - this.lampZ) / (z - this.lampZ);
        shadowX = u * x;
        shadowScale = Math.min(3.2, Math.max(0.85, u));
      }

      // Convert shadowX (-220..+220) to 2D Screen Portal Canvas coordinates (0..640)
      const screenCanvasX = 320 + (shadowX / (this.SCREEN_W * 0.5)) * 320;
      const directScreenX = 320 + (x / (this.SCREEN_W * 0.5)) * 260;

      return {
        dancer: d,
        idx,
        theta,
        x,
        footY,
        z,
        dir,
        stepPhase: stepPhase + idx * 1.5,
        castsShadow,
        shadowX,
        shadowScale,
        screenCanvasX,
        directScreenX,
        pan: Math.max(-0.9, Math.min(0.9, x / 190)),
        distGain: Math.max(0.35, Math.min(1.15, (z + 240) / 400)),
        shadowMag: castsShadow ? shadowScale : 0,
      };
    });
  }

  /**
   * Builds 2D joint coordinates on a canvas (given footX, footY, figureHeight, stepPhase, dir)
   */
  build2DSkeleton(cx, footY, h, stepPhase, dir) {
    const hipY = footY - h * 0.47;
    const waistY = footY - h * 0.55;
    const shoulderY = footY - h * 0.81;
    const headY = footY - h * 0.92;
    const headR = h * 0.072;

    const stride = Math.sin(stepPhase) * h * 0.13;
    const liftL = Math.max(0, Math.cos(stepPhase)) * h * 0.09;
    const liftR = Math.max(0, -Math.cos(stepPhase)) * h * 0.09;

    const kneeLX = cx - stride * 0.5 + dir * h * 0.03;
    const kneeLY = (hipY + footY) * 0.5 - liftL * 0.6;
    const footLX = cx - stride;
    const footLY = footY - liftL;

    const kneeRX = cx + stride * 0.5 + dir * h * 0.03;
    const kneeRY = (hipY + footY) * 0.5 - liftR * 0.6;
    const footRX = cx + stride;
    const footRY = footY - liftR;

    const armSpan = h * 0.30;
    const armWave = Math.cos(stepPhase) * h * 0.04;
    const elbowLX = cx - armSpan * 0.52;
    const elbowLY = shoulderY + h * 0.05 + armWave * 0.5;
    const handLX = cx - armSpan;
    const handLY = shoulderY + h * 0.03 + armWave;

    const elbowRX = cx + armSpan * 0.52;
    const elbowRY = shoulderY + h * 0.05 - armWave * 0.5;
    const handRX = cx + armSpan;
    const handRY = shoulderY + h * 0.03 - armWave;

    return {
      cx,
      footY,
      h,
      dir,
      headX: cx + dir * h * 0.02,
      headY,
      headR,
      shoulderY,
      waistY,
      hipY,
      shoulderW: h * 0.085,
      waistW: h * 0.062,
      skirtHemW: h * 0.175,
      skirtHemY: footY - h * 0.17,
      kneeLX,
      kneeLY,
      footLX,
      footLY,
      kneeRX,
      kneeRY,
      footRX,
      footRY,
      elbowLX,
      elbowLY,
      handLX,
      handLY,
      elbowRX,
      elbowRY,
      handRX,
      handRY,
    };
  }

  /**
   * Draws a full-bodied dancer silhouette or colored figure on any 2D context
   */
  drawDancerFigure2D(ctx, skel, dancer, styleMode = "lit", customColor = "#110d14", alpha = 1.0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isLit = styleMode === "lit";
    const fillMain = isLit ? dancer.shirt : customColor;
    const fillLower = isLit ? (dancer.gender === "f" ? dancer.skirt : dancer.pants) : customColor;
    const fillLimb = isLit ? dancer.skin : customColor;

    // Arms
    ctx.strokeStyle = isLit && dancer.sleeve ? dancer.sleeve : fillLimb;
    ctx.lineWidth = Math.max(2, skel.h * 0.045);
    ctx.beginPath();
    ctx.moveTo(skel.cx - skel.shoulderW * 0.8, skel.shoulderY + 3);
    ctx.lineTo(skel.elbowLX, skel.elbowLY);
    ctx.lineTo(skel.handLX, skel.handLY);
    ctx.moveTo(skel.cx + skel.shoulderW * 0.8, skel.shoulderY + 3);
    ctx.lineTo(skel.elbowRX, skel.elbowRY);
    ctx.lineTo(skel.handRX, skel.handRY);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = isLit && dancer.gender === "m" ? dancer.pants : fillLimb;
    ctx.lineWidth = Math.max(2.5, skel.h * (dancer.gender === "m" ? 0.075 : 0.052));
    ctx.beginPath();
    ctx.moveTo(skel.cx - skel.waistW * 0.5, skel.hipY);
    ctx.lineTo(skel.kneeLX, skel.kneeLY);
    ctx.lineTo(skel.footLX, skel.footLY);
    ctx.moveTo(skel.cx + skel.waistW * 0.5, skel.hipY);
    ctx.lineTo(skel.kneeRX, skel.kneeRY);
    ctx.lineTo(skel.footRX, skel.footRY);
    ctx.stroke();

    // Skirt or Pelvis
    ctx.fillStyle = fillLower;
    ctx.beginPath();
    if (dancer.gender === "f") {
      ctx.moveTo(skel.cx - skel.waistW, skel.waistY);
      ctx.lineTo(skel.cx + skel.waistW, skel.waistY);
      ctx.lineTo(skel.cx + skel.skirtHemW, skel.skirtHemY);
      ctx.lineTo(skel.cx - skel.skirtHemW, skel.skirtHemY);
    } else {
      ctx.moveTo(skel.cx - skel.waistW, skel.waistY);
      ctx.lineTo(skel.cx + skel.waistW, skel.waistY);
      ctx.lineTo(skel.cx + skel.shoulderW * 0.85, skel.hipY + skel.h * 0.05);
      ctx.lineTo(skel.cx - skel.shoulderW * 0.85, skel.hipY + skel.h * 0.05);
    }
    ctx.closePath();
    ctx.fill();

    // Torso
    ctx.fillStyle = fillMain;
    ctx.beginPath();
    ctx.moveTo(skel.cx - skel.shoulderW, skel.shoulderY);
    ctx.lineTo(skel.cx + skel.shoulderW, skel.shoulderY);
    ctx.lineTo(skel.cx + skel.waistW, skel.waistY + 3);
    ctx.lineTo(skel.cx - skel.waistW, skel.waistY + 3);
    ctx.closePath();
    ctx.fill();

    // Head & Hair
    ctx.fillStyle = isLit ? dancer.skin : customColor;
    ctx.beginPath();
    ctx.arc(skel.headX, skel.headY, skel.headR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isLit ? dancer.hair : customColor;
    ctx.beginPath();
    ctx.arc(skel.headX - skel.dir * skel.headR * 0.25, skel.headY - skel.headR * 0.2, skel.headR * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders the 640x480 Backlit & Projected Screen Portal Surface
   */
  renderScreenSurface(t, dt, act, activeWorld, dancers3D, isSingularity) {
    const sCtx = this.sCtx;
    const W = 640;
    const H = 480;
    sCtx.clearRect(0, 0, W, H);

    // 1. Background Muslin Screen Glow (Changes by Act & World)
    const grad = sCtx.createRadialGradient(W * 0.5, H * 0.52, 20, W * 0.5, H * 0.52, 380);
    if (act === 1) {
      // Warm 1976 Halogen Backlit Screen + Mulberry Rose Theater Gel
      grad.addColorStop(0, "#f5d0c5");
      grad.addColorStop(0.55, "#b86b82");
      grad.addColorStop(1, "#4d2336");
    } else if (act === 2) {
      if (activeWorld === "scanlines" || activeWorld === "quantum") {
        grad.addColorStop(0, "#1c142b");
        grad.addColorStop(1, "#090610");
      } else if (activeWorld === "prism") {
        grad.addColorStop(0, "#241b35");
        grad.addColorStop(1, "#0e0a18");
      } else {
        grad.addColorStop(0, "#8f4c68");
        grad.addColorStop(1, "#241122");
      }
    } else {
      // Act III: Radiant Golden-Mulberry Synthesis Glow
      grad.addColorStop(0, "#ffe4c4");
      grad.addColorStop(0.5, "#b85d7c");
      grad.addColorStop(1, "#331832");
    }
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, W, H);

    // Optional: Project the actual 1976 Film onto the 3D Screen!
    if (this.project1976Film && this.video && this.video.readyState >= 2) {
      sCtx.save();
      sCtx.globalAlpha = act === 2 ? 0.85 : 0.55;
      sCtx.drawImage(this.video, 80, 0, 480, 480);
      sCtx.restore();
    }

    // =========================================================================
    // ACT I & ACT III: REAL-TIME RAYCAST BACKLIT SHADOWS ON THE SCREEN
    // =========================================================================
    if (act === 1 || act === 3) {
      // Sort dancers behind the screen so closer-to-lamp (giant shadow) draws with dramatic halo
      const shadowCasters = dancers3D.filter((d) => d.castsShadow);
      shadowCasters.forEach((d) => {
        const figH = 225 * d.shadowScale;
        const footY = H * 0.88 + (d.shadowScale - 1.0) * 55;
        const skel = this.build2DSkeleton(d.screenCanvasX, footY, figH, d.stepPhase, d.dir);

        // When dancer is very close to the rear halogen bulb (shadowScale > 1.5), cast a crimson/amber penumbra!
        const shadowColor =
          d.shadowScale > 1.45
            ? `rgba(92, 14, 24, ${Math.min(0.9, 0.95 - (d.shadowScale - 1.4) * 0.2)})`
            : "rgba(18, 12, 18, 0.92)";
        this.drawDancerFigure2D(sCtx, skel, d.dancer, "shadow", shadowColor, 0.92);
      });
    }

    // =========================================================================
    // ACT II & ACT III: THE 6 RADICAL PROJECTED METAMORPHOSIS WORLDS
    // =========================================================================
    if (act === 2 || act === 3) {
      const worldAlpha = act === 3 ? 0.82 : 1.0;

      // WORLD 1: CMY Prism Shadow-Theater (3 Colored Rear Spotlights!)
      if (activeWorld === "prism" || act === 3) {
        sCtx.save();
        sCtx.globalCompositeOperation = act === 2 ? "screen" : "source-over";
        const prismLights = [
          { offset: -36, color: "rgba(0, 230, 255, 0.65)", phaseOff: -0.25 },
          { offset: 0, color: "rgba(255, 35, 135, 0.65)", phaseOff: 0 },
          { offset: 36, color: "rgba(255, 225, 0, 0.65)", phaseOff: 0.25 },
        ];
        dancers3D.forEach((d) => {
          const baseScale = 0.95 + 0.35 * ((d.z + 180) / 360);
          prismLights.forEach((pl) => {
            const skel = this.build2DSkeleton(
              d.directScreenX + pl.offset * baseScale,
              H * 0.86,
              220 * baseScale,
              d.stepPhase + pl.phaseOff,
              d.dir
            );
            this.drawDancerFigure2D(sCtx, skel, d.dancer, "shadow", pl.color, worldAlpha * 0.75);
          });
        });
        sCtx.restore();
      }

      // WORLD 2: Rutt-Etra Oscilloscope Scanline Field (Radical Evolution of 1976 Hatching!)
      if (activeWorld === "scanlines") {
        sCtx.save();
        const numLines = 44;
        for (let r = 0; r < numLines; r++) {
          const baseY = 36 + (r / (numLines - 1)) * (H - 72);
          sCtx.beginPath();
          sCtx.strokeStyle = r % 3 === 0 ? "#ff5277" : r % 3 === 1 ? "#38e8ff" : "#ffe066";
          sCtx.lineWidth = 2.0;

          for (let x = 20; x <= W - 20; x += 8) {
            let dispY = Math.sin(x * 0.03 + t * 4 + r * 0.4) * 2.5;
            // Displace scanline upward wherever it crosses a dancer's body!
            for (const d of dancers3D) {
              const dx = x - d.directScreenX;
              const bodyTop = H * 0.86 - 230 * (0.85 + 0.25 * Math.cos(d.theta));
              const bodyBot = H * 0.86;
              if (baseY >= bodyTop && baseY <= bodyBot && Math.abs(dx) < 52) {
                const env = Math.cos((dx / 52) * (Math.PI * 0.5));
                const stripeWave = Math.sin(baseY * 0.35 - t * 12) * 9;
                dispY -= env * 22 + env * stripeWave;
              }
            }
            if (x === 20) sCtx.moveTo(x, baseY + dispY);
            else sCtx.lineTo(x, baseY + dispY);
          }
          sCtx.stroke();
        }
        sCtx.restore();
      }

      // WORLD 3: Botanical Mulberry Mycelium & Living Tree Canopy
      if (activeWorld === "botanical" || act === 3) {
        this.renderFractalMulberryTree(sCtx, W * 0.5, H * 0.88, 88, -Math.PI * 0.5, 5, t);
        if (activeWorld === "botanical") {
          dancers3D.forEach((d) => {
            const skel = this.build2DSkeleton(d.directScreenX, H * 0.86, 225, d.stepPhase, d.dir);
            this.renderBotanicalDancer(sCtx, skel, d.dancer, t);
          });
        }
      }

      // WORLD 4: Quantum Point-Cloud & The Gravitational Singularity Supernova!
      if (activeWorld === "quantum" || isSingularity) {
        this.renderQuantumPointCloud(sCtx, dancers3D, t, dt, isSingularity);
      }

      // WORLD 5: Kinetic Pop-Art Bauhaus / Autonomous Sticker Agents
      if (activeWorld === "bauhaus") {
        this.renderBauhausStickerAgents(sCtx, dancers3D, t);
      }

      // WORLD 6: Chronophotographic 50-Year Spacetime Ribbons
      if (activeWorld === "spacetime" || act === 3) {
        this.renderSpacetimeRibbons(sCtx, dancers3D, t, act === 3 ? 0.55 : 1.0);
      }
    }

    // Subtle vintage screen border frame
    sCtx.strokeStyle = "rgba(255, 235, 210, 0.35)";
    sCtx.lineWidth = 4;
    sCtx.strokeRect(2, 2, W - 4, H - 4);
  }

  renderFractalMulberryTree(ctx, x, y, len, angle, depth, t) {
    if (depth === 0) return;
    const sway = Math.sin(t * 1.8 + depth * 0.9 + x * 0.01) * 0.08;
    const x2 = x + Math.cos(angle + sway) * len;
    const y2 = y + Math.sin(angle + sway) * len;

    ctx.save();
    ctx.strokeStyle = depth > 2 ? "#7a3b4e" : "#b84a6e";
    ctx.lineWidth = depth * 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (depth <= 2) {
      // Glowing Mulberries & Leaves!
      ctx.fillStyle = depth === 1 ? "#ff3b6b" : "#76d656";
      ctx.beginPath();
      ctx.arc(x2, y2, depth === 1 ? 5.5 : 4.0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.renderFractalMulberryTree(ctx, x2, y2, len * 0.72, angle - 0.42, depth - 1, t);
    this.renderFractalMulberryTree(ctx, x2, y2, len * 0.72, angle + 0.42, depth - 1, t);
  }

  renderBotanicalDancer(ctx, skel, dancer, t) {
    const bones = [
      [skel.cx, skel.shoulderY, skel.cx, skel.hipY],
      [skel.cx, skel.shoulderY, skel.elbowLX, skel.elbowLY],
      [skel.elbowLX, skel.elbowLY, skel.handLX, skel.handLY],
      [skel.cx, skel.shoulderY, skel.elbowRX, skel.elbowRY],
      [skel.elbowRX, skel.elbowRY, skel.handRX, skel.handRY],
      [skel.cx, skel.hipY, skel.kneeLX, skel.kneeLY],
      [skel.kneeLX, skel.kneeLY, skel.footLX, skel.footLY],
      [skel.cx, skel.hipY, skel.kneeRX, skel.kneeRY],
      [skel.kneeRX, skel.kneeRY, skel.footRX, skel.footRY],
    ];

    ctx.save();
    ctx.strokeStyle = "#8ae66e";
    ctx.lineWidth = 3.2;
    bones.forEach(([x1, y1, x2, y2], bIdx) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Sprout leaves & mulberries along each limb!
      const mx = (x1 + x2) * 0.5 + Math.sin(t * 4 + bIdx) * 6;
      const my = (y1 + y2) * 0.5;
      ctx.fillStyle = dancer.neon;
      ctx.beginPath();
      ctx.arc(mx, my, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Wreath crown head
    ctx.strokeStyle = dancer.neon;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(skel.headX, skel.headY, skel.headR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  renderQuantumPointCloud(ctx, dancers3D, t, dt, isSingularity) {
    // Build target points across the 4 dancers
    const targets = [];
    dancers3D.forEach((d) => {
      const skel = this.build2DSkeleton(d.directScreenX, 412, 225, d.stepPhase, d.dir);
      const joints = [
        [skel.headX, skel.headY],
        [skel.cx, skel.shoulderY],
        [skel.cx, skel.waistY],
        [skel.cx, skel.hipY],
        [skel.elbowLX, skel.elbowLY],
        [skel.handLX, skel.handLY],
        [skel.elbowRX, skel.elbowRY],
        [skel.handRX, skel.handRY],
        [skel.kneeLX, skel.kneeLY],
        [skel.footLX, skel.footLY],
        [skel.kneeRX, skel.kneeRY],
        [skel.footRX, skel.footRY],
      ];
      for (let i = 0; i < 80; i++) {
        const [jx, jy] = joints[i % joints.length];
        const ang = i * 2.399 + t * 2;
        const rad = (i % 5) * 4.5;
        targets.push({
          x: jx + Math.cos(ang) * rad,
          y: jy + Math.sin(ang) * rad,
          color: d.dancer.neon,
        });
      }
    });

    const singAge = t - this.singularityStart;
    const vortexCenterX = 320;
    const vortexCenterY = 360;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const tgt = targets[i % targets.length];

      if (isSingularity || (singAge >= 0 && singAge < 3.2)) {
        if (singAge < 1.95) {
          // Phase 1: Gravitational Spiral Collapse into Singularity Heap!
          const dx = vortexCenterX - p.x;
          const dy = vortexCenterY - p.y;
          const dist = Math.hypot(dx, dy) + 1;
          p.vx += (dx / dist) * 680 * dt - (dy / dist) * 320 * dt;
          p.vy += (dy / dist) * 680 * dt + (dx / dist) * 320 * dt;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        } else if (singAge < 2.25) {
          // Phase 2: Supernova Detonation Outward!
          const ang = (i / this.particles.length) * Math.PI * 2 + (i % 7);
          const speed = 260 + (i % 9) * 55;
          p.vx = Math.cos(ang) * speed;
          p.vy = Math.sin(ang) * speed;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        } else {
          // Phase 3: Re-assembly back into Dancers
          p.x += (tgt.x - p.x) * Math.min(1, dt * 8);
          p.y += (tgt.y - p.y) * Math.min(1, dt * 8);
        }
      } else {
        p.x += (tgt.x - p.x) * Math.min(1, dt * 12);
        p.y += (tgt.y - p.y) * Math.min(1, dt * 12);
      }

      ctx.fillStyle = tgt.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBauhausStickerAgents(ctx, dancers3D, t) {
    ctx.save();
    dancers3D.forEach((d, dIdx) => {
      const skel = this.build2DSkeleton(d.directScreenX, 415, 230, d.stepPhase, d.dir);
      const nodes = [
        { x: skel.headX, y: skel.headY, r: 20, c: "#e62e3a" },
        { x: skel.cx, y: (skel.shoulderY + skel.waistY) * 0.5, r: 24, c: "#e62e3a" },
        { x: skel.handLX, y: skel.handLY, r: 16, c: "#ffbe2e" },
        { x: skel.handRX, y: skel.handRY, r: 16, c: "#ffbe2e" },
        { x: skel.cx - 14, y: skel.hipY + 12, r: 21, c: "#2456d6" },
        { x: skel.cx + 14, y: skel.hipY + 12, r: 21, c: "#2456d6" },
        { x: skel.footLX, y: skel.footLY - 8, r: 17, c: "#58b842" },
        { x: skel.footRX, y: skel.footRY - 8, r: 17, c: "#58b842" },
      ];

      // Draw spring connectors between spheres
      ctx.strokeStyle = "rgba(255, 240, 200, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i < nodes.length; i++) {
        ctx.moveTo(nodes[1].x, nodes[1].y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
      }
      ctx.stroke();

      // Draw 3D shaded Bauhaus sticker spheres
      nodes.forEach((n, nIdx) => {
        const bounce = Math.sin(t * 8 + dIdx + nIdx) * 4;
        ctx.beginPath();
        ctx.arc(n.x, n.y + bounce, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#141018";
        ctx.stroke();

        // Specular highlight dot
        ctx.beginPath();
        ctx.arc(n.x - n.r * 0.3, n.y + bounce - n.r * 0.3, n.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fill();
      });
    });
    ctx.restore();
  }

  renderSpacetimeRibbons(ctx, dancers3D, t, alpha = 1.0) {
    if (t - this.lastRibbonSave > 0.05) {
      this.lastRibbonSave = t;
      const snap = dancers3D.map((d) => ({
        skel: this.build2DSkeleton(d.directScreenX, 412, 220, d.stepPhase, d.dir),
        dancer: d.dancer,
      }));
      this.ribbonHistory.push(snap);
      if (this.ribbonHistory.length > 14) {
        this.ribbonHistory.shift();
      }
    }

    ctx.save();
    for (let hIdx = 0; hIdx < this.ribbonHistory.length; hIdx++) {
      const frac = (hIdx + 1) / this.ribbonHistory.length;
      const snap = this.ribbonHistory[hIdx];
      snap.forEach(({ skel, dancer }) => {
        this.drawDancerFigure2D(
          ctx,
          skel,
          dancer,
          "shadow",
          dancer.neon,
          frac * 0.32 * alpha
        );
      });
    }
    ctx.restore();
  }

  /**
   * Projects & Draws a 3D Dancer in Physical Stage Space (for dancers in front of or behind the screen!)
   */
  render3DDancerOnStage(ctx, d3, act) {
    const pFoot = this.project3D(d3.x, d3.footY, d3.z);
    if (pFoot.behindCam) return;

    const figH = 225 * pFoot.scale;
    const skel = this.build2DSkeleton(pFoot.x, pFoot.y, figH, d3.stepPhase, d3.dir);

    // Draw stage floor shadow ring under dancer's feet
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(pFoot.x, pFoot.y + 4 * pFoot.scale, 28 * pFoot.scale, 9 * pFoot.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // In Act II when stage footlights are dimmed, dancers outside the screen glow as translucent wireframe/neon spirits!
    if (act === 2) {
      this.drawDancerFigure2D(ctx, skel, d3.dancer, "shadow", d3.dancer.neon, 0.42);
    } else {
      // Act I & Act III: Full-color lit live dancers!
      this.drawDancerFigure2D(ctx, skel, d3.dancer, "lit", null, 1.0);
    }

    // Floating name badge in Isometric / Overhead views
    if (Math.abs(this.camYaw) > 0.25 || this.camPitch > 0.35) {
      ctx.fillStyle = "rgba(255, 245, 230, 0.85)";
      ctx.font = "bold 11px Courier New, monospace";
      ctx.textAlign = "center";
      ctx.fillText(d3.dancer.name, pFoot.x, pFoot.y - figH - 8);
    }
    ctx.restore();
  }

  /**
   * Renders the 3D Stage Floor, Orbit Ring, Rear Halogen Lamp, Raycast Shadow Lines & Front 16mm Projector
   */
  renderStageEnvironment(ctx, dancers3D, act, t) {
    const floorY = -this.SCREEN_H * 0.5;

    // 1. Draw Circular Mulberry Dance Path on the Wooden Stage Floor
    ctx.save();
    ctx.strokeStyle = "rgba(244, 215, 190, 0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a <= 64; a++) {
      const ang = (a / 64) * Math.PI * 2;
      const p = this.project3D(Math.sin(ang) * 165, floorY, Math.cos(ang) * 175);
      if (a === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Draw Rear Halogen Shadow Lamp (at Z = this.lampZ) & Raycast Shadow Lines!
    const pLamp = this.project3D(0, floorY + 95, this.lampZ);
    const pLampBase = this.project3D(0, floorY, this.lampZ);

    if (!pLamp.behindCam && (act === 1 || act === 3 || this.showLightRays)) {
      ctx.save();
      // Lamp stand
      ctx.strokeStyle = "#8a7968";
      ctx.lineWidth = 3 * pLamp.scale;
      ctx.beginPath();
      ctx.moveTo(pLampBase.x, pLampBase.y);
      ctx.lineTo(pLamp.x, pLamp.y);
      ctx.stroke();

      // Glowing Halogen Bulb
      const bulbGrad = ctx.createRadialGradient(pLamp.x, pLamp.y, 2, pLamp.x, pLamp.y, 38 * pLamp.scale);
      bulbGrad.addColorStop(0, "#fffbe8");
      bulbGrad.addColorStop(0.35, "rgba(255, 190, 95, 0.75)");
      bulbGrad.addColorStop(1, "rgba(255, 120, 60, 0)");
      ctx.fillStyle = bulbGrad;
      ctx.beginPath();
      ctx.arc(pLamp.x, pLamp.y, 38 * pLamp.scale, 0, Math.PI * 2);
      ctx.fill();

      // Optical Raycast Lines from Rear Lamp -> Dancer -> Backlit Shadow on Screen!
      if (this.showLightRays && (act === 1 || act === 3)) {
        dancers3D.forEach((d) => {
          if (!d.castsShadow) return;
          const pDancer = this.project3D(d.x, floorY + 110, d.z);
          const pShadow = this.project3D(d.shadowX, floorY + 110 * d.shadowScale, 0);
          ctx.strokeStyle = "rgba(255, 210, 130, 0.32)";
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pLamp.x, pLamp.y);
          ctx.lineTo(pDancer.x, pDancer.y);
          ctx.lineTo(pShadow.x, pShadow.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      if (Math.abs(this.camYaw) > 0.2 || this.camPitch > 0.3) {
        ctx.fillStyle = "#ffdf9e";
        ctx.font = "11px Courier New, monospace";
        ctx.textAlign = "center";
        ctx.fillText("REAR HALOGEN SHADOW LAMP", pLamp.x, pLamp.y - 18 * pLamp.scale);
      }
      ctx.restore();
    }
  }

  /**
   * Draws the 3D Perspective-Mapped Translucent Backlit Screen at Z = 0
   */
  render3DScreenQuad(ctx) {
    const hw = this.SCREEN_W * 0.5;
    const hh = this.SCREEN_H * 0.5;

    // Project top-left, top-right, bottom-right, bottom-left corners of the Z=0 screen
    const tl = this.project3D(-hw, hh, 0);
    const tr = this.project3D(hw, hh, 0);
    const br = this.project3D(hw, -hh, 0);
    const bl = this.project3D(-hw, -hh, 0);

    // Subdivide horizontally into 24 vertical strips for smooth 3D perspective foreshortening!
    const strips = 24;
    ctx.save();
    ctx.globalAlpha = this.screenOpacity;

    for (let i = 0; i < strips; i++) {
      const u0 = i / strips;
      const u1 = (i + 1) / strips;
      const x3d0 = -hw + u0 * this.SCREEN_W;
      const x3d1 = -hw + u1 * this.SCREEN_W;

      const pTop0 = this.project3D(x3d0, hh, 0);
      const pBot0 = this.project3D(x3d0, -hh, 0);
      const pTop1 = this.project3D(x3d1, hh, 0);
      const pBot1 = this.project3D(x3d1, -hh, 0);

      const sx = u0 * this.screenCanvas.width;
      const sw = (1 / strips) * this.screenCanvas.width;

      const stripX = pTop0.x;
      const stripW = pTop1.x - pTop0.x;
      const stripY = (pTop0.y + pTop1.y) * 0.5;
      const stripH = (pBot0.y + pBot1.y) * 0.5 - stripY;

      if (Math.abs(stripW) > 0.2 && stripH > 1) {
        ctx.drawImage(
          this.screenCanvas,
          sx,
          0,
          sw,
          this.screenCanvas.height,
          stripX,
          stripY,
          stripW + (stripW > 0 ? 0.8 : -0.8),
          stripH
        );
      }
    }

    // Wooden / Aluminum 1976 Screen Frame Border
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#d9c3b0";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renders the Front 16mm Projector Volumetric Light Cone (Active in Act II & Act III)
   */
  renderFrontProjectorBeam(ctx, act, t) {
    if (act === 1) return;
    const pProj = this.project3D(0, 25, this.projectorZ);
    if (pProj.behindCam) return;

    const hw = this.SCREEN_W * 0.5;
    const hh = this.SCREEN_H * 0.5;
    const tl = this.project3D(-hw, hh, 0);
    const tr = this.project3D(hw, hh, 0);
    const br = this.project3D(hw, -hh, 0);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const beamGrad = ctx.createLinearGradient(pProj.x, pProj.y, (tl.x + tr.x) * 0.5, (tl.y + br.y) * 0.5);
    beamGrad.addColorStop(0, "rgba(190, 225, 255, 0.38)");
    beamGrad.addColorStop(1, "rgba(180, 140, 255, 0.05)");
    ctx.fillStyle = beamGrad;

    ctx.beginPath();
    ctx.moveTo(pProj.x, pProj.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#9ee6ff";
    ctx.font = "11px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.fillText("16MM FRONT PROJECTOR", pProj.x, pProj.y + 22);
    ctx.restore();
  }

  /**
   * Master Render Frame
   */
  render(t, dt, act, activeWorld) {
    // 1. Update Automated Cinematographer if cameraPreset === 'auto'
    if (this.cameraPreset === "auto") {
      if (act === 1) {
        // Slowly orbit from Audience Front Row to Isometric Stage View so viewer sees the Backlit Screen optics!
        this.targetYaw = Math.sin(t * 0.22) * 0.58;
        this.targetPitch = 0.16 + 0.14 * Math.sin(t * 0.15);
        this.targetDist = 710;
      } else if (act === 2) {
        // Zoom closer to the Projected Portal Screen for the 6 Radical Worlds
        this.targetYaw = Math.sin(t * 0.14) * 0.22;
        this.targetPitch = 0.08;
        this.targetDist = 565;
      } else {
        // Act III: Wide sweeping 3D celebration around both stage & screen
        this.targetYaw = Math.sin(t * 0.28) * 0.72;
        this.targetPitch = 0.24 + 0.15 * Math.cos(t * 0.2);
        this.targetDist = 740;
      }
    } else if (this.cameraPreset === "inside") {
      this.targetYaw = (t * 0.72) % (Math.PI * 2);
    }

    this.camYaw += (this.targetYaw - this.camYaw) * Math.min(1, dt * 5);
    this.camPitch += (this.targetPitch - this.camPitch) * Math.min(1, dt * 5);
    this.camDist += (this.targetDist - this.camDist) * Math.min(1, dt * 5);

    const ctx = this.ctx;
    ctx.fillStyle = "#0b080e";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Compute 3D Dancer Positions & Raycast Shadow Coordinates
    const dancers3D = this.compute3DDancers(t);
    const isSingularity = t >= 101.5 && t <= 105.0; // Scheduled Singularity at 01:41.5 in Act II

    // 3. Render the 2D Backlit & Projected Screen Canvas
    this.renderScreenSurface(t, dt, act, activeWorld, dancers3D, isSingularity);

    // 4. Depth-Sorted 3D Stage Rendering (Back-to-Front relative to Camera!)
    this.renderStageEnvironment(ctx, dancers3D, act, t);

    // Split dancers into those behind the screen vs in front of the screen relative to camera
    const screenCenterDepth = this.project3D(0, 0, 0).depth;
    const dancersWithProj = dancers3D.map((d) => ({
      ...d,
      projDepth: this.project3D(d.x, d.footY, d.z).depth,
    }));

    const behindScreenDancers = dancersWithProj
      .filter((d) => d.projDepth >= screenCenterDepth)
      .sort((a, b) => b.projDepth - a.projDepth);

    const inFrontOfScreenDancers = dancersWithProj
      .filter((d) => d.projDepth < screenCenterDepth)
      .sort((a, b) => b.projDepth - a.projDepth);

    // Draw far dancers -> Translucent Screen -> Near dancers -> Volumetric Projector Beam
    behindScreenDancers.forEach((d) => this.render3DDancerOnStage(ctx, d, act));
    this.render3DScreenQuad(ctx);
    inFrontOfScreenDancers.forEach((d) => this.render3DDancerOnStage(ctx, d, act));
    this.renderFrontProjectorBeam(ctx, act, t);

    return { dancers3D, isSingularity };
  }
}

window.RadicalStageRenderer = RadicalStageRenderer;
